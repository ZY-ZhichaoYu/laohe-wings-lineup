const cloudbase = require('@cloudbase/node-sdk');
const http = require('http');
const https = require('https');

const COLLECTION = 'lineups';
const DEFAULT_DOC_ID = 'current';
const MAX_PROXY_IMAGE_BYTES = 8 * 1024 * 1024;

function initCloudBaseApp(context) {
  try {
    return cloudbase.init({ context });
  } catch (error) {
    return cloudbase.init({});
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateSnapshot(snapshot) {
  if (!isPlainObject(snapshot)) return 'snapshot must be an object';
  if (!isPlainObject(snapshot.squadData)) return 'snapshot.squadData is required';
  if (!Array.isArray(snapshot.squadData.starters)) return 'snapshot.squadData.starters is required';
  if (!Array.isArray(snapshot.squadData.bench)) return 'snapshot.squadData.bench is required';
  if (typeof snapshot.formation !== 'string') return 'snapshot.formation is required';
  return '';
}

function parseBody(body) {
  if (!body) return {};
  if (isPlainObject(body)) return body;
  if (Buffer.isBuffer(body)) return parseBody(body.toString('utf8'));
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (error) {
      return {};
    }
  }
  return {};
}

function normalizeEvent(event = {}) {
  if (isPlainObject(event.body)) return event.body;
  if (typeof event.body === 'string' || Buffer.isBuffer(event.body)) return parseBody(event.body);
  return event;
}

function fetchImageBuffer(url, redirects = 3) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch (error) {
      reject(new Error('invalid image url'));
      return;
    }

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      reject(new Error('unsupported image url protocol'));
      return;
    }

    const client = parsed.protocol === 'https:' ? https : http;
    const request = client.get(parsed, {
      timeout: 10000,
      headers: {
        'User-Agent': 'laohe-wings-lineup-export/1.0',
        'Accept': 'image/*,*/*;q=0.8'
      }
    }, response => {
      const status = response.statusCode || 0;
      if ([301, 302, 303, 307, 308].includes(status) && response.headers.location && redirects > 0) {
        response.resume();
        const nextUrl = new URL(response.headers.location, parsed).href;
        fetchImageBuffer(nextUrl, redirects - 1).then(resolve, reject);
        return;
      }
      if (status < 200 || status >= 300) {
        response.resume();
        reject(new Error(`image request failed: HTTP ${status}`));
        return;
      }
      const chunks = [];
      let size = 0;
      response.on('data', chunk => {
        size += chunk.length;
        if (size > MAX_PROXY_IMAGE_BYTES) {
          request.destroy(new Error('image is too large'));
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => {
        resolve({
          buffer: Buffer.concat(chunks),
          contentType: String(response.headers['content-type'] || 'image/jpeg').split(';')[0]
        });
      });
    });
    request.on('timeout', () => request.destroy(new Error('image request timeout')));
    request.on('error', reject);
  });
}

async function proxyImage(input) {
  const url = String(input.url || '').trim();
  if (!url) {
    return {
      ok: false,
      code: 'INVALID_IMAGE_URL',
      message: 'url is required'
    };
  }
  try {
    const { buffer, contentType } = await fetchImageBuffer(url);
    const safeType = /^image\//i.test(contentType) ? contentType : 'image/jpeg';
    return {
      ok: true,
      contentType: safeType,
      dataUrl: `data:${safeType};base64,${buffer.toString('base64')}`
    };
  } catch (error) {
    console.error('proxyImage failed', {
      url,
      message: error && error.message
    });
    return {
      ok: false,
      code: 'IMAGE_PROXY_FAILED',
      message: error && error.message ? error.message : String(error)
    };
  }
}

exports.main = async (event = {}, context = {}) => {
  const input = normalizeEvent(event);
  if (input.action === 'proxyImage') {
    return proxyImage(input);
  }
  const app = initCloudBaseApp(context);
  const db = app.database();
  const docId = typeof input.docId === 'string' && input.docId.trim()
    ? input.docId.trim()
    : DEFAULT_DOC_ID;
  const snapshot = input.snapshot;
  const invalidReason = validateSnapshot(snapshot);

  if (invalidReason) {
    return {
      ok: false,
      code: 'INVALID_SNAPSHOT',
      message: invalidReason
    };
  }

  const now = new Date();
  const auth = context.auth || context.userInfo || {};
  const updatedBy = auth.uid || auth.openId || auth.openid || 'anonymous-web';

  try {
    const result = await db.collection(COLLECTION).doc(docId).set({
      snapshot,
      schemaVersion: 1,
      updatedAt: now,
      updatedAtText: now.toISOString(),
      updatedBy,
      clientUpdatedAt: input.clientUpdatedAt || ''
    });

    console.log('publishLineup saved', {
      docId,
      updatedBy,
      result
    });

    return {
      ok: true,
      docId,
      updatedAt: now.toISOString()
    };
  } catch (error) {
    console.error('publishLineup failed', {
      code: error && error.code,
      message: error && error.message,
      requestId: error && error.requestId
    });

    return {
      ok: false,
      code: error && error.code ? error.code : 'DATABASE_WRITE_FAILED',
      message: error && error.message ? error.message : String(error),
      requestId: error && error.requestId ? error.requestId : ''
    };
  }
};

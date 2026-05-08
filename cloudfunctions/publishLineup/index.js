const cloudbase = require('@cloudbase/node-sdk');

const COLLECTION = 'lineups';
const DEFAULT_DOC_ID = 'current';

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

exports.main = async (event = {}, context = {}) => {
  const input = normalizeEvent(event);
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

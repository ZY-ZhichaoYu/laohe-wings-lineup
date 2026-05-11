const cloudbase = require('@cloudbase/node-sdk');
const http = require('http');
const https = require('https');

const COLLECTION = 'lineups';
const DEFAULT_DOC_ID = 'current';
const MAX_PROXY_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_REVIEWS = 800;
const MAX_REVIEW_COMMENT_LENGTH = 180;
const MAX_REVIEWER_NAME_LENGTH = 18;
const REVIEW_DELETE_WINDOW_MS = 10 * 60 * 1000;
const MAX_DEVICE_ID_LENGTH = 96;

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

function normalizeText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function normalizePerson(person = {}) {
  return {
    num: String(person.num ?? '').trim(),
    name: normalizeText(person.name, 32),
    role: normalizeText(person.role, 32)
  };
}

function extractDatabaseRecord(result) {
  if (!result) return null;
  if (Array.isArray(result.data)) return result.data[0] || null;
  if (isPlainObject(result.data)) return result.data;
  if (isPlainObject(result) && result.snapshot) return result;
  return null;
}

function getSquadPeople(snapshot = {}) {
  const squad = isPlainObject(snapshot.squadData) ? snapshot.squadData : {};
  return [
    ...(Array.isArray(squad.starters) ? squad.starters : []),
    ...(Array.isArray(squad.bench) ? squad.bench : [])
  ]
    .map(normalizePerson)
    .filter(person => person.num && person.name);
}

function getLegendPeople(snapshot = {}) {
  return (Array.isArray(snapshot.legendsData) ? snapshot.legendsData : [])
    .map(normalizePerson)
    .filter(person => person.num && person.name);
}

function findFamiliarPerson(snapshot, num) {
  const key = String(num ?? '').trim();
  return [...getSquadPeople(snapshot), ...getLegendPeople(snapshot)].find(person => person.num === key) || null;
}

function getReviewTargets(snapshot = {}) {
  const byKey = new Map();
  getSquadPeople(snapshot).forEach(person => {
    const key = `player:${person.num}`;
    if (!byKey.has(key)) {
      byKey.set(key, {
        ...person,
        reviewKey: key,
        reviewType: 'player'
      });
    }
  });
  getLegendPeople(snapshot).forEach(person => {
    const key = `legend:${person.num || person.name}`;
    byKey.set(key, {
      ...person,
      role: person.role || '绝版人物',
      reviewKey: key,
      reviewType: 'legend'
    });
  });
  const coach = isPlainObject(snapshot.coachData) ? normalizePerson(snapshot.coachData) : null;
  if (coach && snapshot.coachData.show !== false) {
    byKey.set('coach', {
      num: coach.num || '3',
      name: coach.name || '教练',
      role: coach.role || '教练',
      reviewKey: 'coach',
      reviewType: 'coach'
    });
  }
  const manager = isPlainObject(snapshot.managerData) ? normalizePerson(snapshot.managerData) : null;
  if (manager && snapshot.managerData.show !== false) {
    byKey.set('manager', {
      num: manager.num || '·',
      name: manager.name || '领队',
      role: manager.role || '领队',
      reviewKey: 'manager',
      reviewType: 'manager'
    });
  }
  return Array.from(byKey.values());
}

function createError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeSubmittedReview(review, snapshot) {
  if (!isPlainObject(review)) {
    throw createError('INVALID_REVIEW', 'review must be an object');
  }
  const targetKey = String(review.targetKey || '').trim();
  const targetNum = String(review.targetNum ?? '').trim();
  const target = getReviewTargets(snapshot).find(item =>
    item.reviewKey === targetKey || (targetNum && String(item.num) === targetNum)
  );
  if (!target) {
    throw createError('INVALID_REVIEW_TARGET', 'review target is not in the current lineup');
  }

  const reviewerAuth = review.reviewerAuth === 'team_edit' ? 'team_edit' : 'friend_number';
  const reviewerNum = String(review.reviewerNum ?? review.familiarPlayerNum ?? '').trim();
  if (!/^\d{1,3}$/.test(reviewerNum)) {
    throw createError('INVALID_REVIEWER_NUM', 'reviewer player number is required');
  }
  const reviewerPerson = findFamiliarPerson(snapshot, reviewerNum);
  if (!reviewerPerson) {
    throw createError('UNKNOWN_REVIEWER_NUM', 'reviewer player number is not in the current roster');
  }
  const reviewerName = reviewerAuth === 'team_edit' ? '' : normalizeText(review.reviewerName, MAX_REVIEWER_NAME_LENGTH);
  if (reviewerAuth === 'friend_number' && !reviewerName) {
    throw createError('INVALID_REVIEWER_NAME', 'reviewer nickname is required');
  }
  const deviceId = normalizeText(review.deviceId, MAX_DEVICE_ID_LENGTH);
  if (!deviceId) {
    throw createError('INVALID_DEVICE_ID', 'deviceId is required');
  }
  const rating = Math.min(5, Math.max(1, Number.parseInt(review.rating, 10) || 0));
  if (!rating) {
    throw createError('INVALID_REVIEW_RATING', 'rating must be 1-5');
  }
  const nowTime = Date.now();
  const now = new Date(nowTime).toISOString();
  return {
    id: `review:${now}:${Math.random().toString(36).slice(2, 10)}`,
    targetKey: target.reviewKey,
    targetNum: String(target.num),
    targetName: target.name,
    targetType: target.reviewType,
    reviewerNum,
    reviewerName,
    familiarPlayerNum: reviewerAuth === 'friend_number' ? reviewerNum : '',
    familiarPlayerName: reviewerAuth === 'friend_number' ? reviewerPerson.name : '',
    reviewerAuth,
    deviceId,
    deleteUntil: new Date(nowTime + REVIEW_DELETE_WINDOW_MS).toISOString(),
    rating,
    comment: normalizeText(review.comment, MAX_REVIEW_COMMENT_LENGTH),
    createdAt: now
  };
}

async function submitReview(db, input, context) {
  const docId = typeof input.docId === 'string' && input.docId.trim()
    ? input.docId.trim()
    : DEFAULT_DOC_ID;
  const docRef = db.collection(COLLECTION).doc(docId);
  const record = extractDatabaseRecord(await docRef.get());
  const snapshot = record && isPlainObject(record.snapshot) ? record.snapshot : null;
  if (!snapshot) {
    return {
      ok: false,
      code: 'SNAPSHOT_NOT_FOUND',
      message: 'current lineup snapshot was not found'
    };
  }

  let review;
  try {
    review = normalizeSubmittedReview(input.review, snapshot);
  } catch (error) {
    return {
      ok: false,
      code: error.code || 'INVALID_REVIEW',
      message: error.message || String(error)
    };
  }

  const existingReviews = Array.isArray(snapshot.reviewsData) ? snapshot.reviewsData : [];
  snapshot.reviewsData = [
    review,
    ...existingReviews.filter(item => !item || item.id !== review.id)
  ].slice(0, MAX_REVIEWS);

  const now = new Date();
  const auth = context.auth || context.userInfo || {};
  const updatedBy = auth.uid || auth.openId || auth.openid || 'review-web';

  try {
    await docRef.set({
      snapshot,
      schemaVersion: record.schemaVersion || 1,
      updatedAt: now,
      updatedAtText: now.toISOString(),
      updatedBy,
      clientUpdatedAt: input.clientUpdatedAt || ''
    });
    console.log('submitReview saved', {
      docId,
      targetKey: review.targetKey,
      reviewerNum: review.reviewerNum
    });
    return {
      ok: true,
      docId,
      review,
      updatedAt: now.toISOString()
    };
  } catch (error) {
    console.error('submitReview failed', {
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
}

async function deleteReview(db, input, context) {
  const docId = typeof input.docId === 'string' && input.docId.trim()
    ? input.docId.trim()
    : DEFAULT_DOC_ID;
  const reviewId = String(input.reviewId || '').trim();
  const deviceId = normalizeText(input.deviceId, MAX_DEVICE_ID_LENGTH);
  if (!reviewId || !deviceId) {
    return {
      ok: false,
      code: 'INVALID_DELETE_REQUEST',
      message: 'reviewId and deviceId are required'
    };
  }

  const docRef = db.collection(COLLECTION).doc(docId);
  const record = extractDatabaseRecord(await docRef.get());
  const snapshot = record && isPlainObject(record.snapshot) ? record.snapshot : null;
  if (!snapshot) {
    return {
      ok: false,
      code: 'SNAPSHOT_NOT_FOUND',
      message: 'current lineup snapshot was not found'
    };
  }
  const reviews = Array.isArray(snapshot.reviewsData) ? snapshot.reviewsData : [];
  const review = reviews.find(item => item && item.id === reviewId);
  if (!review) {
    return {
      ok: false,
      code: 'REVIEW_NOT_FOUND',
      message: 'review was not found'
    };
  }
  if (String(review.deviceId || '') !== deviceId) {
    return {
      ok: false,
      code: 'DELETE_FORBIDDEN',
      message: 'only the original device can delete this review'
    };
  }
  const createdAt = new Date(review.createdAt || 0).getTime();
  const deleteUntil = new Date(review.deleteUntil || (Number.isFinite(createdAt) ? createdAt + REVIEW_DELETE_WINDOW_MS : 0)).getTime();
  if (!Number.isFinite(deleteUntil) || Date.now() > deleteUntil) {
    return {
      ok: false,
      code: 'DELETE_EXPIRED',
      message: 'review delete window has expired'
    };
  }

  snapshot.reviewsData = reviews.filter(item => !item || item.id !== reviewId).slice(0, MAX_REVIEWS);
  const now = new Date();
  const auth = context.auth || context.userInfo || {};
  const updatedBy = auth.uid || auth.openId || auth.openid || 'review-delete-web';

  try {
    await docRef.set({
      snapshot,
      schemaVersion: record.schemaVersion || 1,
      updatedAt: now,
      updatedAtText: now.toISOString(),
      updatedBy,
      clientUpdatedAt: input.clientUpdatedAt || ''
    });
    console.log('deleteReview saved', {
      docId,
      reviewId
    });
    return {
      ok: true,
      docId,
      reviewId,
      updatedAt: now.toISOString()
    };
  } catch (error) {
    console.error('deleteReview failed', {
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
  if (input.action === 'submitReview') {
    return submitReview(db, input, context);
  }
  if (input.action === 'deleteReview') {
    return deleteReview(db, input, context);
  }
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

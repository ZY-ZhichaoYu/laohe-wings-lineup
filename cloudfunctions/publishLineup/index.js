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

exports.main = async (event = {}, context = {}) => {
  const app = initCloudBaseApp(context);
  const db = app.database();
  const docId = typeof event.docId === 'string' && event.docId.trim()
    ? event.docId.trim()
    : DEFAULT_DOC_ID;
  const snapshot = event.snapshot;
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
      clientUpdatedAt: event.clientUpdatedAt || ''
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

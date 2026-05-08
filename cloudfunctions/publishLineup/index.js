const cloudbase = require('@cloudbase/node-sdk');

const app = cloudbase.init({
  env: cloudbase.SYMBOL_CURRENT_ENV
});
const db = app.database();

const COLLECTION = 'lineups';
const DEFAULT_DOC_ID = 'current';

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

  await db.collection(COLLECTION).doc(docId).set({
    snapshot,
    schemaVersion: 1,
    updatedAt: now,
    updatedAtText: now.toISOString(),
    updatedBy,
    clientUpdatedAt: event.clientUpdatedAt || ''
  });

  return {
    ok: true,
    docId,
    updatedAt: now.toISOString()
  };
};

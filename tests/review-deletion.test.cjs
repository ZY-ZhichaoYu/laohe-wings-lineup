'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/lineup.js'), 'utf8');
const code = source.slice(source.indexOf('async function deleteReview('), source.indexOf('function renderAll()', source.indexOf('async function deleteReview(')));
function fixture({ online = true, connected = true, response = {} } = {}) {
  const records = [{ id: 'parent', replies: [{ id: 'reply' }] }];
  const status = [];
  const writes = { local: 0, offline: 0 };
  const context = vm.createContext({
    isCloudBaseSyncHost: () => online, cloudSyncState: { initialized: connected },
    CLOUDBASE_CONFIG: { publishFunction: 'publishLineup', currentDocId: 'current-wings-8' },
    REVIEWS_DATA: records, normalizeReview: value => value, normalizeReviewReply: value => value,
    canDeleteReview: () => true, canDeleteReviewReply: () => true,
    callPublishFunction: async () => ({ response }), normalizePublishResult: value => value,
    editToken: 'test-secret', getReviewDeviceId: () => 'device',
    createSnapshotWithReviewsData: value => value, buildReviewsWithoutReview: () => [],
    buildReviewsWithoutReply: () => [], createSnapshot: () => records,
    removeReviewById: () => records.splice(0, records.length),
    removeReplyById: () => records[0].replies.splice(0, records[0].replies.length),
    localStorageAdapter: { writeLastState: () => { writes.local++; } },
    saveLastState: () => { writes.offline++; },
    renderReviewTool() {}, setReviewStatus: (message, error) => status.push({ message, error }),
    getCloudErrorMessage: error => error.message, console: { warn() {} }
  });
  const api = vm.runInContext(code + '\n({deleteReview,deleteReviewReply})', context);
  return { api, records, writes, status };
}
const run = (fixture, kind) => kind === 'review' ? fixture.api.deleteReview('parent') : fixture.api.deleteReviewReply('parent', 'reply');
const remains = (fixture, kind) => kind === 'review' ? fixture.records.length : fixture.records[0].replies.length;
test('unknown or rejected delete responses preserve both reviews and replies', async () => {
  for (const kind of ['review', 'reply']) {
    for (const response of [null, {}, { ok: false }, { ok: 'true' }]) {
      const f = fixture({ response });
      await run(f, kind);
      assert.equal(remains(f, kind), 1);
      assert.equal(f.writes.local, 0);
      assert.equal(f.status.at(-1).error, true);
    }
  }
});
test('a disconnected cloud host never silently deletes local content', async () => {
  for (const kind of ['review', 'reply']) {
    const f = fixture({ connected: false, response: { ok: true } });
    await run(f, kind);
    assert.equal(remains(f, kind), 1);
    assert.equal(f.writes.offline, 0);
    assert.match(f.status.at(-1).message, /仍保留/);
  }
});
test('explicit successful cloud confirmation permits local removal', async () => {
  for (const kind of ['review', 'reply']) {
    const f = fixture({ response: { ok: true } });
    await run(f, kind);
    assert.equal(remains(f, kind), 0);
    assert.equal(f.writes.local, 1);
    assert.equal(f.writes.offline, 0);
  }
});
test('true offline mode preserves local deletion and persistence', async () => {
  for (const kind of ['review', 'reply']) {
    const f = fixture({ online: false, connected: false });
    await run(f, kind);
    assert.equal(remains(f, kind), 0);
    assert.equal(f.writes.offline, 1);
  }
});

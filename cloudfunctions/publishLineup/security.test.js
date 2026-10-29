'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const security = require('./security');
const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');

function snapshot(workspaceId = 'wings-8') {
  const matchFormat = workspaceId === 'legacy-11' ? 11 : 8;
  return {
    workspaceId, matchFormat, formation: matchFormat === 8 ? '8-232' : '4231',
    squadData: { starters: Array.from({ length: matchFormat }, (_, i) => ({ num: String(i + 1), name: 'Player ' + (i + 1) })), bench: [] },
    reviewsData: [], attendanceData: [], mvpVotesData: []
  };
}
function fakeDatabase(initial = {}) {
  const records = structuredClone(initial);
  const generations = {};
  let directWrites = 0;
  let failCommit = false;
  const clone = value => value === undefined ? undefined : structuredClone(value);
  const db = {
    collection: () => ({
      doc: id => ({
        get: async () => ({ data: records[id] ? [clone(records[id])] : [] }),
        set: async value => { directWrites++; records[id] = clone(value); },
        update: async value => { directWrites++; records[id] = { ...records[id], ...clone(value) }; }
      })
    }),
    startTransaction: async () => {
      const reads = new Map();
      const writes = new Map();
      return {
        collection: () => ({
          doc: id => ({
            get: async () => {
              reads.set(id, generations[id] || 0);
              return { data: records[id] ? [clone(records[id])] : [] };
            },
            set: async value => { writes.set(id, clone(value)); },
            update: async value => { writes.set(id, { ...clone(records[id]), ...clone(value) }); }
          })
        }),
        commit: async () => {
          if (failCommit) throw new Error('simulated commit failure');
          for (const [id, generation] of reads) {
            if ((generations[id] || 0) !== generation) throw new Error('transaction conflict');
          }
          for (const [id, value] of writes) { records[id] = value; generations[id] = (generations[id] || 0) + 1; }
        },
        rollback: async () => {}
      };
    }
  };
  return { db, records, directWrites: () => directWrites, setFailCommit: value => { failCommit = value; } };
}
function backend(database, editSecret = 'server-test-secret') {
  const exports = {};
  const sandbox = {
    require: name => name === '@cloudbase/node-sdk'
      ? { init: () => ({ database: () => database }) }
      : name === './security' ? security : require(name),
    exports, process: { env: { EDIT_SECRET: editSecret } }, Buffer, URL,
    setTimeout, clearTimeout, console: { log() {}, warn() {}, error() {} }
  };
  vm.runInNewContext(source, sandbox, { filename: 'publishLineup/index.js' });
  return exports.main;
}
const request = (patch = {}) => ({
  action: 'publishLineup', workspaceId: 'wings-8', docId: 'current-wings-8',
  editToken: 'server-test-secret', baseUpdatedAt: '', snapshot: snapshot(), ...patch
});

test('workspace routing preserves legacy and rejects cross-team documents', () => {
  assert.equal(security.resolveWorkspace({}).docId, 'current');
  assert.equal(security.resolveWorkspace({ workspaceId: 'wings-8' }).docId, 'current-wings-8');
  assert.equal(security.resolveWorkspace({ docId: 'current-zhiyin-8' }).workspaceId, 'zhiyin-8');
  assert.equal(security.resolveWorkspace({ workspaceId: 'wings-8', docId: 'current-zhiyin-8' }).ok, false);
  assert.equal(security.resolveWorkspace({ docId: 'arbitrary' }).ok, false);
});
test('eight-player validation rejects bad formations, count, duplicate and wrong team', () => {
  const workspace = security.resolveWorkspace({ workspaceId: 'wings-8' });
  assert.equal(security.validateSnapshot(snapshot(), workspace), '');
  for (const key of ['8-232', '8-322', '8-331']) assert.equal(security.validateSnapshot({ ...snapshot(), formation: key }, workspace), '');
  assert.match(security.validateSnapshot({ ...snapshot(), formation: '4231' }, workspace), /formation/);
  assert.match(security.validateSnapshot(snapshot('zhiyin-8'), workspace), /workspace/);
  const count = snapshot(); count.squadData.starters.pop();
  assert.match(security.validateSnapshot(count, workspace), /starter count/);
  const duplicate = snapshot(); duplicate.squadData.bench.push({ num: '01', name: 'Duplicate' });
  assert.match(security.validateSnapshot(duplicate, workspace), /duplicate/);
});
test('proxy restricts hosts, protocol, port, credentials and every redirect URL', () => {
  const hosts = security.imageHostAllowlist('images.example.com');
  assert.equal(security.validateImageUrl('https://images.example.com/a.png', hosts).hostname, 'images.example.com');
  for (const url of [
    'http://images.example.com/a.png', 'https://images.example.com:8443/a.png',
    'https://user:pass@images.example.com/a.png', 'https://images.example.com.evil.test/a.png',
    'https://127.0.0.1/a', 'https://2130706433/a', 'https://0x7f000001/a',
    'https://169.254.169.254/a', 'https://[::1]/a', 'https://[::ffff:127.0.0.1]/a',
    'https://unlisted.example/a'
  ]) assert.throws(() => security.validateImageUrl(url, hosts), undefined, url);
});
test('proxy DNS blocks private and reserved IPv4', () => {
  for (const address of ['0.0.0.0','10.0.0.1','100.64.0.1','127.0.0.1','169.254.169.254','172.31.1.2','192.168.1.1','192.0.2.4','198.18.0.1','198.51.100.1','203.0.113.4','224.0.0.1','255.255.255.255']) {
    assert.equal(security.isPrivateIpv4(address), true, address);
  }
  assert.equal(security.isPrivateIpv4('8.8.8.8'), false);
  assert.equal(security.isPrivateIpv4('1.1.1.1'), false);
});
test('cloud file IDs must belong to this environment', () => {
  assert.equal(security.isOwnCloudFileId('cloud://laohe-wings-lineup-d3cz65831519b.bucket/photos/p.png'), true);
  assert.equal(security.isOwnCloudFileId('cloud://another-environment.bucket/photos/p.png'), false);
  assert.equal(security.isOwnCloudFileId('https://example.com/p.png'), false);
});
test('publishing requires server secret and a known base version', async () => {
  const fake = fakeDatabase();
  const main = backend(fake.db);
  assert.equal((await main(request({ editToken: '' }))).code, 'EDIT_SECRET_REQUIRED');
  assert.equal((await backend(fake.db, '')(request())).code, 'EDIT_SECRET_REQUIRED');
  const missingVersion = request(); delete missingVersion.baseUpdatedAt;
  assert.equal((await main(missingVersion)).code, 'BASE_VERSION_REQUIRED');
  assert.equal(fake.directWrites(), 0);
  assert.equal(Object.keys(fake.records).length, 0);
});
test('publishing preserves current interactions and rejects a stale version', async () => {
  const record = {
    snapshot: { ...snapshot(), reviewsData: [{ id: 'new-review' }], attendanceData: [{ id: 'new-attendance' }], mvpVotesData: [{ id: 'new-vote' }] },
    updatedAtText: '2026-10-29T12:00:00.000Z'
  };
  const fake = fakeDatabase({ 'current-wings-8': record });
  const main = backend(fake.db);
  const success = await main(request({ baseUpdatedAt: record.updatedAtText }));
  assert.equal(success.ok, true);
  assert.equal(fake.records['current-wings-8'].snapshot.reviewsData[0].id, 'new-review');
  assert.equal(fake.records['current-wings-8'].snapshot.attendanceData[0].id, 'new-attendance');
  assert.equal(fake.records['current-wings-8'].snapshot.mvpVotesData[0].id, 'new-vote');
  assert.equal((await main(request({ baseUpdatedAt: record.updatedAtText }))).code, 'VERSION_CONFLICT');
  assert.equal(fake.directWrites(), 0);
});
test('separate teams publish to isolated documents', async () => {
  const fake = fakeDatabase();
  const main = backend(fake.db);
  assert.equal((await main(request())).ok, true);
  assert.equal((await main(request({ workspaceId: 'zhiyin-8', docId: 'current-zhiyin-8', snapshot: snapshot('zhiyin-8') }))).ok, true);
  assert.equal(fake.records['current-wings-8'].snapshot.workspaceId, 'wings-8');
  assert.equal(fake.records['current-zhiyin-8'].snapshot.workspaceId, 'zhiyin-8');
  assert.equal((await main(request({ docId: 'current-zhiyin-8' }))).code, 'INVALID_WORKSPACE');
});
test('failed or unavailable transactions never fall back to direct writes', async () => {
  const fake = fakeDatabase();
  fake.setFailCommit(true);
  assert.equal((await backend(fake.db)(request())).code, 'TRANSACTION_FAILED');
  assert.equal(fake.directWrites(), 0);
  assert.equal(Object.keys(fake.records).length, 0);
  delete fake.db.startTransaction;
  assert.equal((await backend(fake.db)(request())).code, 'TRANSACTIONS_REQUIRED');
  assert.equal(fake.directWrites(), 0);
});
test('concurrent attendance submissions both survive transaction retry', async () => {
  const fake = fakeDatabase({ 'current-wings-8': { snapshot: snapshot(), updatedAtText: '2026-10-29T12:00:00.000Z' } });
  const main = backend(fake.db);
  const submit = number => main({
    action: 'submitAttendance', workspaceId: 'wings-8', docId: 'current-wings-8',
    attendance: { playerNum: String(number), status: 'in', deviceId: 'private-device-' + number }
  });
  const results = await Promise.all([submit(1), submit(2)]);
  assert.equal(results.every(result => result.ok), true);
  assert.equal(fake.records['current-wings-8'].snapshot.attendanceData.length, 2);
  assert.equal(fake.directWrites(), 0);
});
test('interaction transaction failure is fail-closed', async () => {
  const fake = fakeDatabase({ 'current-wings-8': { snapshot: snapshot(), updatedAtText: '2026-10-29T12:00:00.000Z' } });
  fake.setFailCommit(true);
  const result = await backend(fake.db)({
    action: 'submitAttendance', workspaceId: 'wings-8',
    attendance: { playerNum: '1', status: 'in', deviceId: 'private-device' }
  });
  assert.equal(result.code, 'TRANSACTION_FAILED');
  assert.equal(fake.records['current-wings-8'].snapshot.attendanceData.length, 0);
  assert.equal(fake.directWrites(), 0);
});

test('copying a public deviceId cannot delete a review or reply', async () => {
  const review = { id: 'review-1', deviceId: 'public-id', createdAt: '2020-01-01T00:00:00Z', replies: [{ id: 'reply-1', deviceId: 'public-id' }] };
  const fake = fakeDatabase({ 'current-wings-8': { snapshot: { ...snapshot(), reviewsData: [review] } } });
  const main = backend(fake.db);
  for (const action of ['deleteReview', 'deleteReply']) {
    const result = await main({ action, workspaceId: 'wings-8', reviewId: 'review-1', replyId: 'reply-1', deviceId: 'public-id' });
    assert.equal(result.code, 'EDIT_SECRET_REQUIRED');
  }
  assert.equal(fake.records['current-wings-8'].snapshot.reviewsData.length, 1);
  assert.equal(fake.records['current-wings-8'].snapshot.reviewsData[0].replies.length, 1);
  assert.equal(fake.directWrites(), 0);
});

test('authorized administrator can remove old replies and reviews', async () => {
  const review = { id: 'review-1', deviceId: 'public-id', createdAt: '2020-01-01T00:00:00Z', replies: [{ id: 'reply-1', deviceId: 'public-id' }] };
  const fake = fakeDatabase({ 'current-wings-8': { snapshot: { ...snapshot(), reviewsData: [review] } } });
  const main = backend(fake.db);
  const moderation = { workspaceId: 'wings-8', reviewId: 'review-1', editToken: 'server-test-secret' };
  assert.equal((await main({ ...moderation, action: 'deleteReply', replyId: 'reply-1' })).ok, true);
  assert.equal(fake.records['current-wings-8'].snapshot.reviewsData[0].replies.length, 0);
  assert.equal((await main({ ...moderation, action: 'deleteReview' })).ok, true);
  assert.equal(fake.records['current-wings-8'].snapshot.reviewsData.length, 0);
  assert.equal(fake.directWrites(), 0);
});

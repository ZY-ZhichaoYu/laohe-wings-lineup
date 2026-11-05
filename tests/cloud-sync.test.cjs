'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/lineup.js'), 'utf8');
function section(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a);
  assert.ok(a >= 0 && b > a, 'source section exists: ' + start);
  return source.slice(a, b);
}
const syncSource = [
  section('function cloudDraftKey()', 'function getFileExtension('),
  section('async function publishCloudSnapshot(', 'async function initCloudBaseSync('),
  section('function saveLastState()', 'function applySnapshot('),
  section('async function readInitialState()', 'function renderPresetSelect(')
].join('\n');
const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
function snapshot(formation = '8-232', workspaceId = 'wings-8') {
  return {
    workspaceId, matchFormat: 8, formation,
    squadData: { starters: Array.from({ length: 8 }, (_, i) => ({ num: i + 1, name: 'Player ' + i })), bench: [] },
    reviewsData: [], attendanceData: [], mvpVotesData: []
  };
}
const version = n => '2026-10-29T12:00:00.' + String(n).padStart(3, '0') + 'Z';
function fixture() {
  let current = snapshot();
  let remote = { snapshot: snapshot(), updatedAtText: version(1) };
  let editing = true;
  let listener;
  let publishImpl = async () => ({ response: { ok: true, updatedAt: version(2) }, mode: 'http' });
  const values = new Map();
  const status = [];
  const state = {
    initialized: true, applyingRemote: false, remoteSnapshot: clone(current),
    latestRemoteRecord: null, baseUpdatedAt: version(1), localDirty: false,
    publishing: false, lastError: '', app: { callFunction() {} },
    documentRef: {
      get: async () => clone(remote),
      watch(callbacks) { listener = callbacks.onChange; return { close() {} }; }
    }
  };
  const storage = {
    name: 'test',
    readJson: (key, fallback) => values.has(key) ? clone(values.get(key)) : fallback,
    writeJson: (key, value) => { values.set(key, clone(value)); return true; },
    readLastState: () => clone(values.get('lastState') || null),
    writeLastState: value => { values.set('lastState', clone(value)); return true; }
  };
  const context = vm.createContext({
    cloudSyncState: state, ACTIVE_PROFILE: { id: 'wings-8', docId: 'current-wings-8' }, PLAYER_COUNT: 8,
    CLOUDBASE_CONFIG: { currentDocId: 'current-wings-8', publishFunction: 'publishLineup' },
    localStorageAdapter: storage, activeStorageAdapter: storage,
    localStorage: { removeItem: key => values.delete(key) },
    createSnapshot: () => clone(current),
    canEdit: () => editing,
    clone, extractCloudRecord: value => value,
    extractCloudSnapshot: record => record && record.snapshot,
    shouldApplyRemoteSnapshot: value => JSON.stringify(value) !== JSON.stringify(state.remoteSnapshot),
    applySnapshot: value => { current = clone(value); return true; },
    mergeMissingBenchPlayers() {}, renderPresetSelect() {},
    updateSyncStatus: (kind, message) => status.push({ kind, message }),
    callPublishFunction: payload => publishImpl(payload),
    normalizePublishResult: result => result,
    getCloudErrorMessage: error => error.message,
    compactStatusMessage: (message, detail) => message + ': ' + detail,
    editToken: 'test-secret', saveTimer: null,
    window: { clearTimeout() {}, setTimeout: () => 1 },
    console: { warn() {}, log() {}, error() {} }
  });
  const api = vm.runInContext(syncSource + '\n({readInitialState, readCloudSnapshot, startCloudWatch, publishCloudSnapshot, queueSaveLastState, saveLastState, queueCloudPublish})', context);
  return {
    state, values, status, api,
    get current() { return current; },
    set current(value) { current = clone(value); },
    set remote(value) { remote = clone(value); },
    set editing(value) { editing = value; },
    set publish(value) { publishImpl = value; },
    watch(record) { listener(clone(record)); }
  };
}

test('saved draft restores its original base before reading a newer cloud version', async () => {
  const f = fixture();
  const draft = snapshot('8-322');
  f.values.set('laohe-wings-8-draft', { snapshot: draft, baseUpdatedAt: version(1) });
  f.values.set('lastState', clone(draft));
  f.remote = { snapshot: snapshot('8-331'), updatedAtText: version(2) };
  f.editing = false;
  const restored = await f.api.readInitialState();
  assert.equal(restored.formation, '8-322');
  assert.equal(f.state.baseUpdatedAt, version(1));
  assert.equal(f.state.localDirty, true);
  assert.equal(f.state.latestRemoteRecord.updatedAtText, version(2));
  assert.equal(f.values.get('lastState').formation, '8-322');
});

test('dirty is set and persisted before debounce, and locking never permits overwriting it', () => {
  const f = fixture();
  f.current = snapshot('8-322');
  f.api.queueSaveLastState();
  assert.equal(f.state.localDirty, true);
  assert.equal(f.values.get('laohe-wings-8-draft').snapshot.formation, '8-322');
  f.editing = false;
  f.api.startCloudWatch();
  f.watch({ snapshot: snapshot('8-331'), updatedAtText: version(2) });
  assert.equal(f.current.formation, '8-322');
  assert.equal(f.state.baseUpdatedAt, version(1));
  assert.equal(f.state.latestRemoteRecord.updatedAtText, version(2));
});

test('update arriving during publish is reconciled after the response', async () => {
  const f = fixture();
  f.current = snapshot('8-322');
  f.api.queueSaveLastState();
  f.api.startCloudWatch();
  let complete;
  f.publish = () => new Promise(resolve => { complete = resolve; });
  const pending = f.api.publishCloudSnapshot(f.current);
  const newest = snapshot('8-322');
  newest.reviewsData = [{ id: 'arrived-during-post' }];
  f.remote = { snapshot: newest, updatedAtText: version(3) };
  f.watch({ snapshot: newest, updatedAtText: version(3) });
  assert.equal(f.current.reviewsData.length, 0);
  complete({ response: { ok: true, updatedAt: version(2) }, mode: 'http' });
  await pending;
  assert.equal(f.current.reviewsData[0].id, 'arrived-during-post');
  assert.equal(f.state.baseUpdatedAt, version(3));
  assert.equal(f.state.localDirty, false);
  assert.equal(f.values.has('laohe-wings-8-draft'), false);
});

test('edits made while publishing stay as a draft with the committed base', async () => {
  const f = fixture();
  f.current = snapshot('8-322');
  f.api.queueSaveLastState();
  f.api.startCloudWatch();
  let complete;
  f.publish = () => new Promise(resolve => { complete = resolve; });
  const pending = f.api.publishCloudSnapshot(f.current);
  f.current = snapshot('8-331');
  f.api.queueSaveLastState();
  const server = { snapshot: snapshot('8-322'), updatedAtText: version(3) };
  f.remote = server;
  f.watch(server);
  complete({ response: { ok: true, updatedAt: version(2) }, mode: 'http' });
  await pending;
  assert.equal(f.current.formation, '8-331');
  assert.equal(f.state.localDirty, true);
  assert.equal(f.state.baseUpdatedAt, version(2));
  assert.equal(f.state.latestRemoteRecord.updatedAtText, version(3));
  const draft = f.values.get('laohe-wings-8-draft');
  assert.equal(draft.baseUpdatedAt, version(2));
  assert.equal(draft.snapshot.formation, '8-331');
  assert.equal(f.status.at(-1).kind, 'error');
});

test('failed publish retains draft and never advances the base version', async () => {
  const f = fixture();
  f.current = snapshot('8-322');
  f.publish = async () => ({ response: { ok: false, code: 'VERSION_CONFLICT', message: 'newer server version' }, mode: 'http' });
  await f.api.publishCloudSnapshot(f.current);
  assert.equal(f.state.localDirty, true);
  assert.equal(f.state.baseUpdatedAt, version(1));
  assert.equal(f.values.get('laohe-wings-8-draft').snapshot.formation, '8-322');
});

test('out-of-order read and watch callbacks cannot regress the accepted version', async () => {
  const f = fixture();
  f.api.startCloudWatch();
  f.watch({ snapshot: snapshot('8-331'), updatedAtText: version(3) });
  f.watch({ snapshot: snapshot('8-322'), updatedAtText: version(2) });
  f.remote = { snapshot: snapshot('8-232'), updatedAtText: version(1) };
  const result = await f.api.readCloudSnapshot();
  assert.equal(result.formation, '8-331');
  assert.equal(f.current.formation, '8-331');
  assert.equal(f.state.baseUpdatedAt, version(3));
});

test('reading a cloud snapshot only discards drafts with explicit discardDraft', async () => {
  const f = fixture();
  f.current = snapshot('8-322');
  f.api.queueSaveLastState();
  f.remote = { snapshot: snapshot('8-331'), updatedAtText: version(2) };
  await f.api.readCloudSnapshot();
  assert.equal(f.state.baseUpdatedAt, version(1));
  assert.equal(f.state.localDirty, true);
  assert.equal(f.values.has('laohe-wings-8-draft'), true);
  await f.api.readCloudSnapshot({ discardDraft: true });
  assert.equal(f.state.baseUpdatedAt, version(2));
  assert.equal(f.state.localDirty, false);
  assert.equal(f.values.has('laohe-wings-8-draft'), false);
});

test('watch events from another workspace do not change state or version', () => {
  const f = fixture();
  f.api.startCloudWatch();
  f.watch({ snapshot: snapshot('8-331', 'zhiyin-8'), updatedAtText: version(2) });
  assert.equal(f.current.workspaceId, 'wings-8');
  assert.equal(f.state.baseUpdatedAt, version(1));
  assert.equal(f.state.latestRemoteRecord, null);
});

test('interaction changes alone do not create a tactical draft', () => {
  const f = fixture();
  const current = f.current;
  current.reviewsData.push({ id: 'own-new-review' });
  f.current = current;
  f.api.queueCloudPublish(f.current);
  assert.equal(f.state.localDirty, false);
  assert.equal(f.values.has('laohe-wings-8-draft'), false);
});

test('missing or invalid publish confirmation does not report success', async () => {
  const f = fixture();
  f.current = snapshot('8-322');
  f.publish = async () => ({ response: {}, mode: 'http' });
  await f.api.publishCloudSnapshot(f.current);
  assert.equal(f.state.baseUpdatedAt, version(1));
  assert.equal(f.state.localDirty, true);
  assert.equal(f.status.at(-1).kind, 'error');
});

test('clean initial load accepts the current server snapshot', async () => {
  const f = fixture();
  f.remote = { snapshot: snapshot('8-331'), updatedAtText: version(2) };
  const initial = await f.api.readInitialState();
  assert.equal(initial.formation, '8-331');
  assert.equal(f.state.baseUpdatedAt, version(2));
  assert.equal(f.state.localDirty, false);
});

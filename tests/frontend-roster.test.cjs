'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const LaoheCompetition = require('../assets/competition.js');
const defaults = require('../assets/defaults.js');
const master = require('../data/players.json');
const source = fs.readFileSync(path.join(__dirname, '../assets/lineup.js'), 'utf8');
const copy = value => JSON.parse(JSON.stringify(value));
const all = squad => [...squad.starters, ...squad.bench];

// Execute the production functions verbatim. Only rendering, authorization and
// persistence boundaries are stubbed; no roster mutation is reimplemented here.
function productionFunction(name) {
  const match = source.match(new RegExp('^function ' + name + '\\([^]*?^\\}', 'm'));
  assert.ok(match, `Missing production function: ${name}`);
  return match[0];
}

function productionObject(name) {
  const match = source.match(new RegExp('^const ' + name + ' = \\{[^]*?^\\};', 'm'));
  assert.ok(match, `Missing production declaration: ${name}`);
  return match[0];
}

const functions = [
  'toNonNegativeInt', 'normalizeStats', 'normalizeName', 'normalizePlayer',
  'benchVersionOf', 'mergeSavedPlayerFields', 'replaceSquadData',
  'isSavedImageSource', 'mergeSavedImageSource', 'mergeSavedPhotoFields', 'clearPhoto',
  'mergeSavedStaffFields', 'normalizeCoachData', 'normalizeManagerData', 'normalizeLegend', 'getStaffAvatar', 'getLegendAvatar',
  'getStarterSlotLabel', 'applyStarterSlotLabel', 'swapBenchToStarter',
  'parseCloudImageReference', 'resolveImageSource', 'getCurrentAvatar', 'getDefaultPlayerAvatar'
].map(productionFunction).join('\n\n');

function session(profileId) {
  const profile = LaoheCompetition.profiles[profileId];
  const seed = LaoheCompetition.buildPlayerData(profile, master);
  const context = {
    LaoheCompetition,
    PLAYER_COUNT: profile.matchFormat,
    DEFAULT_CAPTAIN_NAME: profile.captain,
    currentFormation: profile.defaultFormation,
    currentKit: 'home',
    INLINE_PLAYER_DATA: copy(seed),
    SQUAD_DATA: { starters: copy(seed.starters), bench: copy(seed.bench) },
    canEdit: () => true,
    clearDragVisuals() {},
    renderAll() {},
    savedJson: null
  };
  context.saveLastState = () => { context.savedJson = JSON.stringify(context.SQUAD_DATA); };
  vm.createContext(context);
  vm.runInContext([
    productionObject('LEGACY_NAME_MAP'), productionObject('FORMATIONS'), functions
  ].join('\n\n'), context, { filename: 'lineup-roster-functions.js' });
  return context;
}

test('substitution keeps the outgoing player id and reload restores 15 unique members', () => {
  const first = session('wings-8');
  const outgoingIndex = first.SQUAD_DATA.starters.findIndex(player => player.name === '张天乐');
  const incomingIndex = first.SQUAD_DATA.bench.findIndex(player => player.name === '田子玉');
  const outgoingId = first.SQUAD_DATA.starters[outgoingIndex].id;
  const membershipIds = all(first.SQUAD_DATA).map(player => player.id).sort();

  first.swapBenchToStarter(incomingIndex, outgoingIndex);
  assert.equal(first.SQUAD_DATA.starters[outgoingIndex].name, '田子玉');
  assert.equal(first.SQUAD_DATA.bench[incomingIndex].name, '张天乐');
  assert.equal(first.SQUAD_DATA.bench[incomingIndex].id, outgoingId);
  assert.ok(first.savedJson, 'The real swap handler must invoke persistence');

  const reloaded = session('wings-8');
  reloaded.replaceSquadData(JSON.parse(first.savedJson));
  assert.deepEqual([reloaded.SQUAD_DATA.starters.length, reloaded.SQUAD_DATA.bench.length], [8, 7]);
  assert.equal(new Set(all(reloaded.SQUAD_DATA).map(player => player.id)).size, 15);
  assert.deepEqual(copy(all(reloaded.SQUAD_DATA).map(player => player.id).sort()), membershipIds);
  assert.equal(reloaded.SQUAD_DATA.starters[outgoingIndex].name, '田子玉');
  assert.equal(reloaded.SQUAD_DATA.starters.some(player => player.name === '张天乐'), false);

  // A second refresh must not silently append the seed starting player again.
  reloaded.replaceSquadData(copy(reloaded.SQUAD_DATA));
  assert.equal(all(reloaded.SQUAD_DATA).length, 15);
});

test('clearing a player photo stays empty after reload and restoring the default lineup', () => {
  for (const profile of ['wings-8', 'legacy-11']) {
    const first = session(profile);
    const index = first.SQUAD_DATA.starters.findIndex(player => player.name === '张子冲');
    first.SQUAD_DATA.starters[index].avatar = 'assets/old-generic-photo.png';
    first.clearPhoto('starters', index);
    const fresh = session(profile);
    fresh.replaceSquadData(JSON.parse(first.savedJson));
    const cleared = all(fresh.SQUAD_DATA).find(player => player.name === '张子冲');
    assert.equal(cleared.useDefaultPhotos, false);
    for (const kit of ['home', 'away']) {
      fresh.currentKit = kit;
      assert.equal(fresh.getCurrentAvatar(cleared), '');
      assert.equal(fresh.getDefaultPlayerAvatar(cleared), '');
    }
    const reset = defaults.arrange(copy(fresh.SQUAD_DATA), fresh.INLINE_PLAYER_DATA);
    const afterReset = all(reset).find(player => player.name === '张子冲');
    assert.equal(afterReset.avatarHome, '');
    assert.equal(afterReset.avatarAway, '');
    assert.equal(afterReset.useDefaultPhotos, false);
  }
});

test('a new upload after clearing is retained without resurrecting the old other-kit portrait', () => {
  const first = session('wings-8');
  const index = first.SQUAD_DATA.starters.findIndex(player => player.name === '张子冲');
  first.clearPhoto('starters', index);
  first.SQUAD_DATA.starters[index].avatarHome = 'data:image/png;base64,bmV3LXBvcnRyYWl0';
  const fresh = session('wings-8');
  fresh.replaceSquadData(copy(first.SQUAD_DATA));
  const player = all(fresh.SQUAD_DATA).find(player => player.name === '张子冲');
  fresh.currentKit = 'away';
  assert.equal(player.avatarAway, '');
  assert.equal(fresh.getCurrentAvatar(player), player.avatarHome);
  assert.equal(fresh.getDefaultPlayerAvatar(player), '');
});

test('explicit photo deletion persists for staff and legends while old empty records still inherit seed photos', () => {
  const c = session('legacy-11');
  const base = { name: '照片测试', avatarHome: 'assets/home.png', avatarAway: 'assets/away.png' };
  const cleared = { ...base, avatar: '', avatarHome: '', avatarAway: '', useDefaultPhotos: false };
  const staff = c.normalizeCoachData(c.mergeSavedStaffFields(base, cleared));
  const manager = c.normalizeManagerData(c.mergeSavedStaffFields(base, cleared));
  const legend = c.normalizeLegend({ ...base, ...c.mergeSavedPhotoFields(base, cleared) });
  for (const kit of ['home', 'away']) {
    c.currentKit = kit;
    assert.equal(c.getStaffAvatar(staff), '');
    assert.equal(c.getStaffAvatar(manager), '');
    assert.equal(c.getLegendAvatar(legend), '');
  }
  const oldRecord = c.mergeSavedPhotoFields(base, { avatarHome: '', avatarAway: '' });
  assert.equal(oldRecord.avatarHome, base.avatarHome);
  assert.equal(oldRecord.avatarAway, base.avatarAway);
});

test('older substitutions with a missing id are repaired before roster de-duplication', () => {
  const first = session('wings-8');
  first.swapBenchToStarter(
    first.SQUAD_DATA.bench.findIndex(player => player.name === '田子玉'),
    first.SQUAD_DATA.starters.findIndex(player => player.name === '张天乐')
  );
  const snapshot = JSON.parse(first.savedJson);
  const outgoing = snapshot.bench.find(player => player.name === '张天乐');
  delete outgoing.id;
  delete outgoing.playerId;

  const reloaded = session('wings-8');
  reloaded.replaceSquadData(snapshot);
  const roster = all(reloaded.SQUAD_DATA);
  assert.equal(roster.length, 15);
  assert.equal(roster.filter(player => player.name === '张天乐').length, 1);
  assert.equal(roster.find(player => player.name === '张天乐').id, LaoheCompetition.playerId('张天乐'));
  assert.equal(new Set(roster.map(player => player.id)).size, 15);
});

test('11-a-side substitutions and old snapshots still restore all original members', () => {
  const first = session('legacy-11');
  const total = master.starters.length + master.bench.length;
  const starterIndex = first.SQUAD_DATA.starters.findIndex(player => player.name === '张天乐');
  first.swapBenchToStarter(first.SQUAD_DATA.bench.findIndex(player => player.name === '李骁'), starterIndex);

  const reloaded = session('legacy-11');
  reloaded.replaceSquadData(JSON.parse(first.savedJson));
  assert.equal(reloaded.SQUAD_DATA.starters.length, 11);
  assert.equal(all(reloaded.SQUAD_DATA).length, total);
  assert.equal(reloaded.SQUAD_DATA.starters[starterIndex].name, '李骁');
  assert.equal(reloaded.SQUAD_DATA.bench.filter(player => player.name === '张天乐').length, 1);
  // The legacy roster intentionally contains two numbered Wu You cards.
  const wuNumbers = all(reloaded.SQUAD_DATA).filter(player => player.name === '吴优').map(player => player.num).sort((a, b) => a - b);
  assert.deepEqual(copy(wuNumbers), [1, 90]);
  assert.equal(new Set(all(reloaded.SQUAD_DATA).map(player => `${player.num}:${player.name}`)).size, total);
});

test('an explicit saved captain=false overrides the seed captain during reload', () => {
  const current = session('wings-8');
  const snapshot = copy(current.SQUAD_DATA);
  all(snapshot).find(player => player.name === '张子冲').captain = false;
  all(snapshot).find(player => player.name === '徐多').captain = true;
  current.replaceSquadData(snapshot);
  assert.deepEqual(copy(all(current.SQUAD_DATA).filter(player => player.captain).map(player => player.name)), ['徐多']);
});

test('home-only portraits remain visible in away-kit mode through the production avatar selector', () => {
  const current = session('zhiyin-8');
  current.currentKit = 'away';
  for (const [num, name] of [[19, '沈熙洲'], [21, '徐文浩']]) {
    const player = {
      id: LaoheCompetition.playerId(name), num, name,
      avatarHome: `assets/players/${num}-${name}-home.png`, avatarAway: ''
    };
    assert.equal(current.getCurrentAvatar(player), player.avatarHome);
    // Broken remote-image fallback uses the same home-only bundled source.
    current.INLINE_PLAYER_DATA = { starters: [copy(player)], bench: [] };
    assert.equal(current.getDefaultPlayerAvatar(player), player.avatarHome);
  }
});

test('an existing away portrait retains priority and home mode still selects the home portrait', () => {
  const current = session('zhiyin-8');
  const player = {
    id: LaoheCompetition.playerId('赖飞扬'), num: 47, name: '赖飞扬',
    avatar: 'assets/players/generic-portrait.png',
    avatarHome: 'assets/players/47-赖飞扬-home.png',
    avatarAway: 'assets/players/47-赖飞扬-away.png'
  };
  current.INLINE_PLAYER_DATA = { starters: [copy(player)], bench: [] };
  current.currentKit = 'away';
  assert.equal(current.getCurrentAvatar(player), player.avatarAway);
  assert.equal(current.getDefaultPlayerAvatar(player), player.avatarAway);
  current.currentKit = 'home';
  assert.equal(current.getCurrentAvatar(player), player.avatarHome);
  assert.equal(current.getDefaultPlayerAvatar(player), player.avatarHome);
});

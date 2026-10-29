'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const defaults = require('../assets/defaults.js');
const competition = require('../assets/competition.js');
const master = require('../data/players.json');
const copy = value => JSON.parse(JSON.stringify(value));
const all = squad => [...squad.starters, ...squad.bench];
const seedFor = id => competition.buildPlayerData(id, master);
const oldOrders = {
  'wings-8': [18, 28, 31, 20, 77, 4, 8, 84],
  'zhiyin-8': [10, 15, 2, 5, 39, 24, 88, 1]
};

// Fixtures reproduce the initial release's persisted order, rather than
// deriving the expected migration result from the migration implementation.
function oldSnapshot(id) {
  const seed = seedFor(id);
  const roster = all(seed);
  const numbers = oldOrders[id];
  return {
    workspaceId: id,
    matchFormat: 8,
    formation: '8-232',
    squadData: {
      starters: numbers.map(num => copy(roster.find(player => player.num === num))),
      bench: roster.filter(player => !numbers.includes(player.num)).map(copy)
    },
    coachData: { name: '陈炫', show: false, status: 'fit' },
    reviewsData: [{ id: 'review-kept', comment: '不要丢失手工数据' }],
    attendanceData: [{ playerName: '测试报名', status: 'in' }],
    mvpVotesData: [{ id: 'vote-kept', candidateNum: '20' }],
    editables: { titleCn: '排阵草稿', meta: '本场已修改信息' }
  };
}

for (const id of ['wings-8', 'zhiyin-8']) {
  test(`${id}: the previous default upgrades to the supplied lineup while retaining personal edits and interactions`, () => {
    const profile = competition.profiles[id];
    const seed = seedFor(id);
    const old = oldSnapshot(id);
    const edited = all(old.squadData).find(player => player.name === (id === 'wings-8' ? '田子玉' : '赖飞扬'));
    const editedId = edited.id;
    edited.name += '（手动备注）';
    edited.num = 111;
    edited.avatarHome = 'data:image/png;base64,cGVyc29uYWwtcGhvdG8=';
    edited.stats = { goals: 4, assists: 3, appearances: 2 };
    edited.status = 'yellow';
    const before = copy(old);

    const upgraded = defaults.upgrade(old, profile, seed, competition.formations8);
    assert.equal(upgraded.formation, profile.defaultFormation);
    assert.deepEqual(upgraded.squadData.starters.map(player => player.id), seed.starters.map(player => player.id));
    assert.deepEqual(upgraded.squadData.starters.map(player => player.pos), competition.formations8[profile.defaultFormation].slots.map(slot => slot.pos));
    const retained = all(upgraded.squadData).find(player => player.id === editedId);
    assert.equal(retained.name, edited.name);
    assert.equal(retained.num, 111);
    assert.equal(retained.avatarHome, edited.avatarHome);
    assert.deepEqual(retained.stats, edited.stats);
    assert.equal(retained.status, 'yellow');
    for (const field of ['reviewsData', 'attendanceData', 'mvpVotesData']) assert.deepEqual(upgraded[field], old[field]);
    assert.equal(upgraded.editables.meta, '本场已修改信息');
    assert.equal(upgraded.editables.titleCn, '首发阵容');
    assert.equal(upgraded.defaultsRevision, defaults.revision);
    assert.deepEqual(old, before, 'Migration must not mutate the caller snapshot');
  });
}

test('an edited starting order or an explicitly chosen formation is not replaced during migration', () => {
  const profile = competition.profiles['wings-8'];
  const seed = seedFor(profile.id);
  for (const modification of ['order', 'formation']) {
    const old = oldSnapshot(profile.id);
    if (modification === 'order') [old.squadData.starters[0], old.squadData.starters[1]] = [old.squadData.starters[1], old.squadData.starters[0]];
    else old.formation = '8-331';
    old.squadData.starters[0].pos = 'CUSTOM';
    old.editables.titleCn = '我的自定义阵容';
    const upgraded = defaults.upgrade(old, profile, seed, competition.formations8);
    assert.equal(upgraded.formation, old.formation);
    assert.deepEqual(upgraded.squadData.starters.map(player => player.id), old.squadData.starters.map(player => player.id));
    assert.equal(upgraded.squadData.starters[0].pos, 'CUSTOM');
    assert.equal(upgraded.editables.titleCn, '我的自定义阵容');
  }
});

test('injury updates are applied once to both named players and the coach, then allow recovery', () => {
  const profile = competition.profiles['legacy-11'];
  const seed = seedFor(profile.id);
  const snapshot = {
    formation: '4231',
    squadData: { starters: copy(seed.starters), bench: copy(seed.bench) },
    coachData: { ...copy(seed.coach), status: 'fit' }
  };
  all(snapshot.squadData).forEach(player => { if (['陈炫', '蒋天鸿'].includes(player.name)) player.status = 'fit'; });
  const upgraded = defaults.upgrade(snapshot, profile, seed, competition.formations8);
  for (const name of ['陈炫', '蒋天鸿']) assert.equal(all(upgraded.squadData).find(player => player.name === name).status, 'injured');
  assert.equal(upgraded.coachData.status, 'injured');
  const recovered = copy(upgraded);
  all(recovered.squadData).forEach(player => { if (['陈炫', '蒋天鸿'].includes(player.name)) player.status = 'fit'; });
  recovered.coachData.status = 'fit';
  const unchanged = defaults.upgrade(recovered, profile, seed, competition.formations8);
  assert.deepEqual(unchanged, recovered);
  assert.equal(all(unchanged.squadData).find(player => player.name === '蒋天鸿').status, 'fit');
  assert.equal(all(unchanged.squadData).find(player => player.name === '陈炫').status, 'fit');
  assert.equal(unchanged.coachData.status, 'fit');
});

test('restoring the default arrangement retains current photos and status independently for each team', () => {
  const results = [];
  for (const id of ['wings-8', 'zhiyin-8']) {
    const seed = seedFor(id);
    const current = { starters: copy(seed.starters).reverse(), bench: copy(seed.bench) };
    const selected = current.starters[0];
    selected.avatarAway = `data:image/png;base64,${id}`;
    selected.status = 'injured';
    selected.stats.goals = 6;
    const recoveredJiang = all(current).find(player => player.name === '蒋天鸿');
    if (recoveredJiang) recoveredJiang.status = 'fit';
    const before = copy(current);
    const restored = defaults.arrange(current, seed);
    assert.deepEqual(restored.starters.map(player => player.id), seed.starters.map(player => player.id));
    const player = all(restored).find(item => item.id === selected.id);
    assert.equal(player.avatarAway, selected.avatarAway);
    assert.equal(player.status, 'injured');
    assert.equal(player.stats.goals, 6);
    if (recoveredJiang) assert.equal(all(restored).find(item => item.name === '蒋天鸿').status, 'fit');
    assert.equal(all(restored).length, id === 'wings-8' ? 15 : 18);
    assert.deepEqual(current, before);
    results.push(restored);
  }
  const wingsIds = new Set(all(results[0]).map(player => player.id));
  assert.equal(all(results[1]).some(player => wingsIds.has(player.id)), false);
});

test('name-only legacy players keep their photo edits and do not duplicate when the seed has stable ids', () => {
  const profile = competition.profiles['wings-8'];
  const seed = seedFor(profile.id);
  const snapshot = oldSnapshot(profile.id);
  for (const player of all(snapshot.squadData)) { delete player.id; delete player.playerId; }
  const zhang = all(snapshot.squadData).find(player => player.name === '张天乐');
  zhang.avatarHome = 'data:image/png;base64,b2xkLWN1c3RvbS1waG90bw==';
  const upgraded = defaults.upgrade(snapshot, profile, seed, competition.formations8);
  const players = all(upgraded.squadData);
  assert.equal(players.length, 15);
  assert.equal(new Set(players.map(player => player.id)).size, 15);
  assert.equal(players.filter(player => player.name === '张天乐').length, 1);
  assert.equal(players.find(player => player.name === '张天乐').avatarHome, zhang.avatarHome);
});

test('revision 2 to 3 replaces only Zhang Zichong old bundled photo without reapplying injuries or lineup defaults', () => {
  assert.equal(defaults.revision, 3);
  for (const id of ['wings-8', 'legacy-11']) {
    const profile = competition.profiles[id];
    const seed = seedFor(id);
    const snapshot = id === 'wings-8' ? oldSnapshot(id) : {
      formation: '4231',
      squadData: { starters: copy(seed.starters), bench: copy(seed.bench) },
      coachData: copy(seed.coach)
    };
    // A user may deliberately return to the old 2-3-2 after revision 2.
    // The photo-only revision must not reinterpret that choice as untouched.
    snapshot.defaultsRevision = 2;
    if (snapshot.editables) snapshot.editables.titleCn = '我保留的首发';
    for (const player of all(snapshot.squadData)) {
      if (['陈炫', '蒋天鸿'].includes(player.name)) player.status = 'fit';
      if (player.name === '张子冲') player.avatarHome = 'assets/players/20-张子冲-home.png';
    }
    snapshot.coachData.status = 'fit';
    const before = copy(snapshot);
    const expected = copy(snapshot);
    expected.defaultsRevision = 3;
    all(expected.squadData).find(player => player.name === '张子冲').avatarHome = 'assets/players/20-张子冲-home-v2.png';

    const upgraded = defaults.upgrade(snapshot, profile, seed, competition.formations8);
    assert.deepEqual(upgraded, expected);
    assert.deepEqual(snapshot, before, 'Photo migration must not mutate its input');
    assert.equal(all(upgraded.squadData).find(player => player.name === '蒋天鸿').status, 'fit');
    assert.equal(upgraded.coachData.status, 'fit');
  }
});

test('photo revision preserves custom cloud, data, HTTPS, and already updated home portraits', () => {
  const profile = competition.profiles['wings-8'];
  const seed = seedFor(profile.id);
  const portraits = [
    'cloudimg:' + encodeURIComponent(JSON.stringify({ fileID: 'cloud://test-environment/photos/20.png', url: 'https://example.test/20.png' })),
    'cloud://test-environment/photos/20.png',
    'data:image/png;base64,cGVyc29uYWwtcGhvdG8=',
    'https://example.test/custom-player-photo.png',
    'assets/players/20-张子冲-home-v2.png',
    'assets/players/20-custom-home.png'
  ];
  for (const avatarHome of portraits) {
    const snapshot = oldSnapshot(profile.id);
    snapshot.defaultsRevision = 2;
    snapshot.formation = '8-331';
    snapshot.editables.titleCn = '手工阵容';
    all(snapshot.squadData).find(player => player.name === '张子冲').avatarHome = avatarHome;
    const expected = { ...copy(snapshot), defaultsRevision: 3 };
    const upgraded = defaults.upgrade(snapshot, profile, seed, competition.formations8);
    assert.deepEqual(upgraded, expected, `Custom portrait must remain unchanged: ${avatarHome}`);
    assert.deepEqual(defaults.upgrade(upgraded, profile, seed, competition.formations8), upgraded);
  }
});

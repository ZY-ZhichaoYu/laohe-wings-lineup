'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const competition = require('../assets/competition.js');
const master = require('../data/players.json');
const all = data => [...data.starters, ...data.bench];
const build = id => competition.buildPlayerData(competition.profiles[id], master);

test('query routing defaults to wings and rejects arbitrary document ids', () => {
  assert.equal(competition.getProfile('').id, 'wings-8');
  assert.equal(competition.getProfile('?team=zhiyin-8').docId, 'current-zhiyin-8');
  assert.equal(competition.getProfile('?team=legacy-11').docId, 'current');
  assert.equal(competition.getProfile('?team=__proto__').id, 'wings-8');
  assert.equal(competition.getProfile('?team=another-document').id, 'wings-8');
});

test('poster rosters have 15 and 18 distinct memberships with eight screenshot starters', () => {
  const wings = build('wings-8');
  const zhiyin = build('zhiyin-8');
  assert.deepEqual([wings.starters.length, wings.bench.length], [8, 7]);
  assert.deepEqual([zhiyin.starters.length, zhiyin.bench.length], [8, 10]);
  const expectedWings = '4:徐多,7:蒋天鸿,8:宋健,11:田子玉,14:范小睿,18:张天乐,20:张子冲,28:邓翔宇,31:黄于翀,35:徐潇,55:张启行,77:汪昌强,82:徐粟一,84:黄焜宇,86:黎兆荣';
  const expectedZhiyin = '1:吴优,2:李骁,5:俞智超,9:李炳灿,10:张文杰,15:程志伟,17:徐正昊,19:沈熙洲,21:徐文浩,24:刘方年,29:孙一凡,33:梁之恒,37:王开来,39:郑又畅,41:王宇畅,47:赖飞扬,83:张宏飞,88:徐乾洲';
  const text = data => all(data).sort((a, b) => a.num - b.num).map(player => `${player.num}:${player.name}`).join(',');
  assert.equal(text(wings), expectedWings);
  assert.equal(text(zhiyin), expectedZhiyin);
  assert.equal(new Set([...all(wings), ...all(zhiyin)].map(player => player.id)).size, 33);
  assert.equal(wings.starters[7].name, '黄焜宇');
  assert.equal(zhiyin.starters[7].name, '吴优');
  assert.equal(wings.competition.initialLineupDraft, false);
  assert.equal(wings.competition.lineupSource, 'user-provided');
  assert.equal(competition.profiles['wings-8'].defaultFormation, '8-322');
  assert.equal(competition.profiles['zhiyin-8'].defaultFormation, '8-331');
  assert.deepEqual(wings.starters.map(player => player.num), [18, 28, 77, 20, 31, 4, 8, 84]);
  assert.deepEqual(zhiyin.starters.map(player => player.num), [9, 37, 10, 47, 2, 5, 15, 1]);
  assert.deepEqual(wings.starters.map(player => player.pos), ['ST', 'ST', 'CM', 'CM', 'LB', 'CB', 'RB', 'GK']);
  assert.deepEqual(zhiyin.starters.map(player => player.pos), ['ST', 'LM', 'CM', 'RM', 'LB', 'CB', 'RB', 'GK']);
});

test('photo reuse matches identities, never a recycled shirt number', () => {
  const roster = [...all(build('wings-8')), ...all(build('zhiyin-8'))];
  for (const name of ['范小睿', '王宇畅']) {
    const player = roster.find(item => item.name === name);
    assert.equal(player.avatarHome, '');
    assert.equal(player.avatarAway, '');
  }
  const li = roster.find(player => player.name === '李炳灿');
  assert.equal(li.avatarHome, 'assets/players/9-李炳灿-home.png');
  assert.equal(li.avatarAway, '');
  const withoutNewPhoto = all(competition.buildPlayerData('zhiyin-8', { ...master, competitionPlayers: [] }));
  assert.equal(withoutNewPhoto.find(player => player.name === '李炳灿').avatarHome, '');
  const wu = roster.find(player => player.name === '吴优');
  assert.equal(wu.avatarHome, 'assets/players/1-吴优-home.png');
  for (const name of ['王开来', '黄焜宇']) {
    assert.match(roster.find(player => player.name === name).avatarHome, /^assets\/legends\//);
  }
});

test('23 players have existing photo files and 10 retain empty placeholders', () => {
  const wings = all(build('wings-8'));
  const zhiyin = all(build('zhiyin-8'));
  assert.equal(wings.filter(player => player.avatarHome).length, 10);
  assert.equal(zhiyin.filter(player => player.avatarHome).length, 13);
  assert.equal([...wings, ...zhiyin].filter(player => !player.avatarHome).length, 10);
  const lai = zhiyin.find(player => player.name === '赖飞扬');
  assert.equal(lai.avatarHome, 'assets/players/47-赖飞扬-home.png');
  assert.equal(lai.avatarAway, 'assets/players/47-赖飞扬-away.png');
  for (const player of [...wings, ...zhiyin]) {
    for (const field of ['avatarHome', 'avatarAway']) {
      if (player[field]) assert.ok(fs.existsSync(path.join(__dirname, '..', player[field])), player[field]);
    }
  }
});

test('captains, staff and match statistics are isolated per competition', () => {
  for (const id of ['wings-8', 'zhiyin-8']) {
    const data = build(id);
    assert.deepEqual(all(data).filter(player => player.captain).map(player => player.name), [competition.profiles[id].captain]);
    assert.equal(data.manager.name, competition.profiles[id].manager);
    assert.equal(data.manager.role, '领队');
    assert.equal(data.coach.show, false);
    assert.deepEqual(data.legends, []);
    all(data).forEach(player => {
      assert.equal(player.status, player.name === '蒋天鸿' ? 'injured' : 'fit');
      assert.deepEqual(player.stats, { goals: 0, assists: 0, appearances: 0 });
    });
  }
  assert.equal(build('zhiyin-8').manager.avatarHome, 'assets/players/25-孟红历-home.png');
});

test('current injury updates cover Jiang Tianhong and coach Chen Xuan without copying old discipline into eight-a-side', () => {
  const legacy = build('legacy-11');
  assert.equal(all(legacy).find(player => player.name === '蒋天鸿').status, 'injured');
  assert.equal(all(legacy).find(player => player.name === '陈炫').status, 'injured');
  assert.equal(legacy.coach.name, '陈炫');
  assert.equal(legacy.coach.status, 'injured');
  assert.equal(all(build('wings-8')).find(player => player.name === '蒋天鸿').status, 'injured');
  assert.equal(all(build('zhiyin-8')).find(player => player.name === '张文杰').status, 'fit');
});

test('each eight-a-side formation has seven outfield slots plus one goalkeeper', () => {
  for (const formation of Object.values(competition.formations8)) {
    assert.equal(formation.slots.length, 8);
    assert.deepEqual(formation.slots.map(slot => slot.playerIndex).sort(), [0, 1, 2, 3, 4, 5, 6, 7]);
    assert.equal(formation.slots.filter(slot => slot.pos === 'GK').length, 1);
    assert.equal(formation.slots.find(slot => slot.pos === 'GK').playerIndex, 7);
    assert.equal(new Set(formation.slots.map(slot => slot.coord.join(','))).size, 8);
    formation.slots.forEach(slot => slot.coord.forEach(coord => assert.ok(coord >= 10 && coord <= 90)));
    assert.equal(formation.label.split('-').reduce((total, count) => total + Number(count), 0), 7);
  }
});

test('legacy squad is an independent exact clone and seed building never mutates source data', () => {
  const before = JSON.stringify(master);
  const legacy = build('legacy-11');
  assert.deepEqual(legacy, master);
  assert.notEqual(legacy, master);
  legacy.starters[0].name = 'changed only in clone';
  const wings = build('wings-8');
  wings.starters[0].avatarHome = 'changed only in draft';
  build('zhiyin-8');
  assert.equal(JSON.stringify(master), before);
  assert.equal(competition.playerId('吴优'), competition.playerId(' 吴优 '));
});

test('browser UMD exports the same public interface without CommonJS', () => {
  const browser = { URLSearchParams };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/competition.js'), 'utf8'), browser);
  assert.equal(browser.LaoheCompetition.getProfile('?team=zhiyin-8').id, 'zhiyin-8');
  assert.equal(browser.LaoheCompetition.buildPlayerData('wings-8', master).starters.length, 8);
});

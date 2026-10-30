(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LaoheCompetition = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Competition memberships are separate from the historical 11-a-side squad.
  // Shirt numbers belong to a membership, never to the identity of a player.
  const profiles = {
    'wings-8': {
      id: 'wings-8', name: '老和山之翼', matchFormat: 8,
      docId: 'current-wings-8', captain: '张子冲', manager: '许俊秋',
      defaultFormation: '8-322',
      roster: [
        { num: 20, name: '张子冲' }, { num: 4, name: '徐多' },
        { num: 7, name: '蒋天鸿' }, { num: 8, name: '宋健' },
        { num: 11, name: '田子玉' }, { num: 14, name: '范小睿' },
        { num: 18, name: '张天乐' }, { num: 28, name: '邓翔宇' },
        { num: 31, name: '黄于翀' }, { num: 35, name: '徐潇' },
        { num: 55, name: '张启行' }, { num: 77, name: '汪昌强' },
        { num: 82, name: '徐粟一' }, { num: 84, name: '黄焜宇' },
        { num: 86, name: '黎兆荣' }
      ]
    },
    'zhiyin-8': {
      id: 'zhiyin-8', name: '老和山只因', matchFormat: 8,
      docId: 'current-zhiyin-8', captain: '程志伟', manager: '孟红历',
      defaultFormation: '8-331',
      roster: [
        { num: 15, name: '程志伟' }, { num: 1, name: '吴优' },
        { num: 2, name: '李骁' }, { num: 5, name: '俞智超' },
        { num: 9, name: '李炳灿' }, { num: 10, name: '张文杰' },
        { num: 17, name: '徐正昊' }, { num: 19, name: '沈熙洲' },
        { num: 21, name: '徐文浩' }, { num: 24, name: '刘方年' },
        { num: 29, name: '孙一凡' }, { num: 33, name: '梁之恒' },
        { num: 37, name: '王开来' }, { num: 39, name: '郑又畅' },
        { num: 41, name: '王宇畅' }, { num: 47, name: '赖飞扬' },
        { num: 83, name: '张宏飞' }, { num: 88, name: '徐乾洲' }
      ]
    },
    'legacy-11': {
      id: 'legacy-11', name: '老和山之翼', matchFormat: 11,
      docId: 'current', captain: '张子冲', manager: '许俊秋',
      defaultFormation: '4231', roster: []
    }
  };

  function slot(playerIndex, x, y, pos, role) {
    return { playerIndex, coord: [x, y], pos, role };
  }
  const formations8 = {
    '8-232': {
      label: '2-3-2',
      slots: [
        slot(0, 32, 18, 'ST', '前锋'), slot(1, 68, 18, 'ST', '前锋'),
        slot(2, 20, 44, 'LM', '左前卫'), slot(3, 50, 44, 'CM', '中场'),
        slot(4, 80, 44, 'RM', '右前卫'),
        slot(5, 32, 66, 'CB', '左中卫'), slot(6, 68, 66, 'CB', '右中卫'),
        slot(7, 50, 88, 'GK', '门将')
      ]
    },
    '8-322': {
      label: '3-2-2',
      slots: [
        slot(0, 32, 18, 'ST', '前锋'), slot(1, 68, 18, 'ST', '前锋'),
        slot(2, 32, 44, 'CM', '左中场'), slot(3, 68, 44, 'CM', '右中场'),
        slot(4, 20, 66, 'LB', '左后卫'), slot(5, 50, 66, 'CB', '中后卫'),
        slot(6, 80, 66, 'RB', '右后卫'), slot(7, 50, 88, 'GK', '门将')
      ]
    },
    '8-331': {
      label: '3-3-1',
      slots: [
        slot(0, 50, 18, 'ST', '前锋'),
        slot(1, 20, 44, 'LM', '左前卫'), slot(2, 50, 44, 'CM', '中场'),
        slot(3, 80, 44, 'RM', '右前卫'),
        slot(4, 20, 66, 'LB', '左后卫'), slot(5, 50, 66, 'CB', '中后卫'),
        slot(6, 80, 66, 'RB', '右后卫'), slot(7, 50, 88, 'GK', '门将')
      ]
    }
  };

  // Defaults supplied by the user in the two lineup screenshots. Later edits
  // remain local drafts until explicitly published.
  const startingNumbers = {
    'wings-8': [18, 28, 77, 20, 31, 4, 8, 84],
    'zhiyin-8': [9, 37, 10, 47, 2, 5, 15, 1]
  };
  // Explicit current updates, separate from historical disciplinary/injury data.
  const currentStatuses = { '蒋天鸿': 'injured', '陈炫': 'injured' };
  const clone = value => JSON.parse(JSON.stringify(value));
  const cleanName = name => String(name || '').trim().normalize('NFKC');
  const playerId = name => 'player-' + Array.from(cleanName(name), char => char.codePointAt(0).toString(16)).join('-');

  function getProfile(search) {
    const params = new URLSearchParams(String(search || '').replace(/^\?/, ''));
    const key = params.get('team') || params.get('profile') || 'wings-8';
    return Object.prototype.hasOwnProperty.call(profiles, key) ? profiles[key] : profiles['wings-8'];
  }

  function buildPlayerData(profile, masterJSON) {
    const selected = typeof profile === 'string' ? profiles[profile] : profile;
    if (!selected || !Object.prototype.hasOwnProperty.call(profiles, selected.id)) {
      throw new Error('Unknown competition profile');
    }
    const master = masterJSON || {};
    if (selected.matchFormat === 11) return clone(master);
    const sources = [...(master.starters || []), ...(master.bench || []), ...(master.legends || []), ...(master.competitionPlayers || [])];
    const byName = new Map();
    sources.forEach(source => {
      const key = cleanName(source.name);
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key).push(source);
    });
    const players = selected.roster.map(member => {
      const matches = byName.get(cleanName(member.name)) || [];
      // Only compare numbers AFTER matching the person's name. This also picks
      // the existing #1 Wu You portrait instead of his historical #90 card.
      const source = matches.find(item => String(item.num) === String(member.num)) || matches[0] || {};
      return {
        ...clone(source), id: playerId(member.name), playerId: playerId(member.name),
        num: member.num, name: member.name, pos: '', role: '',
        positions: Array.isArray(source.positions) ? [...source.positions] : [],
        avatar: source.avatar || '', avatarHome: source.avatarHome || '', avatarAway: source.avatarAway || '',
        stats: { goals: 0, assists: 0, appearances: 0 }, status: currentStatuses[member.name] || 'fit',
        captain: member.name === selected.captain
      };
    });
    const chosen = startingNumbers[selected.id];
    const starters = chosen.map(num => players.find(player => player.num === num));
    const slots = formations8[selected.defaultFormation].slots;
    starters.forEach((player, index) => {
      player.pos = slots[index].pos;
      player.role = slots[index].role;
    });
    const bench = players.filter(player => !chosen.includes(player.num));
    const staff = [master.manager, master.coach, ...sources].filter(Boolean);
    const managerSource = staff.find(person => cleanName(person.name) === cleanName(selected.manager)) || {};
    const intros = {};
    [...players.map(player => player.name), selected.manager].forEach(name => {
      if (master.intros && typeof master.intros[name] === 'string') intros[name] = master.intros[name];
    });
    return {
      starters, bench,
      coach: { ...(clone(master.coach || {})), show: false },
      manager: {
        ...clone(managerSource), show: true, name: selected.manager, num: '·',
        posLabel: 'MGR', role: '领队', avatar: managerSource.avatar || '',
        avatarHome: managerSource.avatarHome || '', avatarAway: managerSource.avatarAway || ''
      },
      team: { ...clone(master.team || {}), name: selected.name },
      legends: [], alumni: clone(master.alumni || []), intros,
      competition: { profileId: selected.id, matchFormat: 8, initialLineupDraft: false, lineupSource: 'user-provided' }
    };
  }

  return { profiles, formations8, getProfile, buildPlayerData, playerId };
});

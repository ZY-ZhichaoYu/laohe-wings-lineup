(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LaoheDefaults = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const revision = 5;
  const copy = value => JSON.parse(JSON.stringify(value));
  const key = player => player.id || player.playerId || String(player.name || '').trim();

  function arrange(current, seed) {
    const existing = [...(current.starters || []), ...(current.bench || [])];
    const byId = new Map(existing.filter(player => player.id || player.playerId).map(player => [key(player), player]));
    const byName = new Map(existing.map(player => [String(player.name || '').trim(), player]));
    const used = new Set();
    const merge = player => {
      const saved = byId.get(key(player)) || byName.get(String(player.name || '').trim());
      if (saved) used.add(saved);
      return { ...copy(player), ...copy(saved || {}),
        ...(player.id ? { id: player.id, playerId: player.playerId || player.id } : {}),
        avatarHome: saved?.useDefaultPhotos === false ? (saved.avatarHome || '') : (saved?.avatarHome || player.avatarHome || ''),
        avatarAway: saved?.useDefaultPhotos === false ? (saved.avatarAway || '') : (saved?.avatarAway || player.avatarAway || '') };
    };
    const starters = seed.starters.map(merge);
    const starting = new Set(starters.map(key));
    const bench = seed.bench.map(merge).filter(player => !starting.has(key(player)));
    const known = new Set([...starters, ...bench].map(key));
    for (const player of existing) if (!used.has(player) && !known.has(key(player))) bench.push(copy(player));
    return { starters, bench };
  }

  function upgrade(snapshot, profile, seed, formations) {
    if (!snapshot || Number(snapshot.defaultsRevision) >= revision) return snapshot;
    const next = copy(snapshot);
    if (!next.squadData) return next;
    const players = [...(next.squadData.starters || []), ...(next.squadData.bench || [])];
    // Injury revision 2 must not run again when later revisions add photographs.
    if ((Number(snapshot.defaultsRevision) || 0) < 2) {
      for (const player of players) {
        if (['陈炫', '蒋天鸿'].includes(player.name)) player.status = 'injured';
      }
      if (next.coachData && (next.coachData.name || seed.coach?.name) === '陈炫') next.coachData.status = 'injured';
    }
    for (const player of players) {
      if (player.name === '张子冲' && ['assets/players/20-张子冲-home.png', 'assets/players/20-张子冲-home-v2.png'].includes(player.avatarHome)) {
        player.avatarHome = 'assets/players/20-张子冲-home-v3.png';
      }
      if (player.name === '张子冲' && ['assets/players/20-张子冲-away.png', 'assets/players/20-张子冲-away-v2.png'].includes(player.avatarAway)) {
        player.avatarAway = 'assets/players/20-张子冲-away-v3.png';
      }
    }
    const oldOrder = profile.id === 'wings-8' ? [18, 28, 31, 20, 77, 4, 8, 84] : [10, 15, 2, 5, 39, 24, 88, 1];
    const untouchedOldLineup = (Number(snapshot.defaultsRevision) || 0) < 2 && profile.matchFormat === 8 && next.formation === '8-232' &&
      next.squadData.starters?.length === 8 && next.squadData.starters.every((player, index) => Number(player.num) === oldOrder[index]);
    if (untouchedOldLineup) {
      next.squadData = arrange(next.squadData, seed);
      next.formation = profile.defaultFormation;
      for (const slot of formations[next.formation].slots) {
        Object.assign(next.squadData.starters[slot.playerIndex], { pos: slot.pos, role: slot.role });
      }
    }
    if ((Number(snapshot.defaultsRevision) || 0) < 2 && profile.matchFormat === 8 && next.editables?.titleCn === '排阵草稿') next.editables.titleCn = '首发阵容';
    next.defaultsRevision = revision;
    return next;
  }
  return { revision, arrange, upgrade };
});

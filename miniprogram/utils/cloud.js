const ENV_ID = 'laohe-wings-lineup-d3cz65831519b';
const COLLECTION = 'lineups';
const DOC_ID = 'current';

function getDatabase() {
  return wx.cloud.database({ env: ENV_ID });
}

async function readCurrentLineup() {
  const result = await getDatabase().collection(COLLECTION).doc(DOC_ID).get();
  return result && result.data && result.data.snapshot ? result.data.snapshot : null;
}

function normalizePlayer(player = {}) {
  return {
    num: String(player.num || ''),
    name: String(player.name || ''),
    pos: String(player.pos || ''),
    role: String(player.role || ''),
    status: String(player.status || 'fit'),
    avatarHome: String(player.avatarHome || player.avatar || ''),
    avatarAway: String(player.avatarAway || player.avatar || '')
  };
}

function getSquad(snapshot = {}) {
  const squad = snapshot.squadData || {};
  return {
    starters: Array.isArray(squad.starters) ? squad.starters.map(normalizePlayer) : [],
    bench: Array.isArray(squad.bench) ? squad.bench.map(normalizePlayer) : []
  };
}

function getStaff(snapshot = {}) {
  const coach = snapshot.coachData && snapshot.coachData.show !== false ? snapshot.coachData : null;
  const manager = snapshot.managerData && snapshot.managerData.show !== false ? snapshot.managerData : null;
  return [coach, manager]
    .filter(Boolean)
    .map(item => ({
      num: String(item.num || ''),
      name: String(item.name || ''),
      role: String(item.role || ''),
      pos: String(item.posLabel || '')
    }));
}

function getDrawPool(snapshot = {}) {
  const squad = getSquad(snapshot);
  const legends = Array.isArray(snapshot.legendsData)
    ? snapshot.legendsData.map(item => ({ ...normalizePlayer(item), role: item.role || '绝版人物', cardType: 'legend' }))
    : [];
  const staff = getStaff(snapshot).map(item => ({ ...item, cardType: 'staff' }));
  return [
    ...squad.starters.map(item => ({ ...item, cardType: 'starter' })),
    ...squad.bench.map(item => ({ ...item, cardType: 'bench' })),
    ...legends,
    ...staff,
    {
      num: '∞',
      name: '王泊乔',
      pos: 'ST',
      role: '航院大前锋 · 抽象',
      cardType: 'special',
      avatarHome: 'cloud://laohe-wings-lineup-d3cz65831519b/assets/special/wang-boqiao.jpg'
    }
  ].filter(item => item.name);
}

function formatFormation(snapshot = {}) {
  const map = {
    433: '4-3-3',
    442: '4-4-2',
    352: '3-5-2',
    4231: '4-2-3-1'
  };
  return map[snapshot.formation] || snapshot.formation || '4-2-3-1';
}

module.exports = {
  readCurrentLineup,
  getSquad,
  getStaff,
  getDrawPool,
  formatFormation
};

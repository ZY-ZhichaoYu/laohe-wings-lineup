'use strict';
const net = require('node:net');

const WORKSPACES = Object.freeze({
  'legacy-11': { docId: 'current', matchFormat: 11, formations: ['433', '442', '352', '4231'] },
  'wings-8': { docId: 'current-wings-8', matchFormat: 8, formations: ['8-232', '8-322', '8-331'] },
  'zhiyin-8': { docId: 'current-zhiyin-8', matchFormat: 8, formations: ['8-232', '8-322', '8-331'] }
});
const ENV_ID = 'laohe-wings-lineup-d3cz65831519b';
const DEFAULT_IMAGE_HOSTS = [
  ENV_ID + '-1429692601.tcloudbaseapp.com',
  ENV_ID + '-1429692601.ap-shanghai.app.tcloudbase.com'
];

function resolveWorkspace(input) {
  const requestedDoc = input.docId === undefined ? '' : String(input.docId).trim();
  const requestedWorkspace = input.workspaceId === undefined ? '' : String(input.workspaceId).trim();
  const workspaceId = requestedWorkspace || Object.keys(WORKSPACES).find(id => WORKSPACES[id].docId === requestedDoc) || (!requestedDoc ? 'legacy-11' : '');
  const workspace = WORKSPACES[workspaceId];
  if (!workspace || (requestedDoc && requestedDoc !== workspace.docId)) {
    return { ok: false, code: 'INVALID_WORKSPACE', message: '队伍与云端文档不匹配，请刷新页面后重试' };
  }
  return { ok: true, workspaceId, ...workspace };
}

function validateSnapshot(snapshot, workspace) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return 'snapshot must be an object';
  const squad = snapshot.squadData;
  if (!squad || typeof squad !== 'object' || !Array.isArray(squad.starters) || !Array.isArray(squad.bench)) return 'snapshot.squadData.starters and bench are required';
  if (snapshot.workspaceId && snapshot.workspaceId !== workspace.workspaceId) return 'snapshot workspace does not match document';
  if (workspace.matchFormat === 8 && snapshot.workspaceId !== workspace.workspaceId) return '8-player snapshot workspaceId is required';
  if (snapshot.matchFormat !== undefined && snapshot.matchFormat !== workspace.matchFormat) return 'snapshot matchFormat does not match document';
  if (workspace.matchFormat === 8 && snapshot.matchFormat !== 8) return '8-player snapshot matchFormat is required';
  if (!workspace.formations.includes(snapshot.formation)) return 'formation does not match matchFormat';
  if (squad.starters.length !== workspace.matchFormat) return 'starter count does not match matchFormat';
  if (squad.bench.length > 40) return 'bench is too large';
  const numbers = new Set();
  for (const person of [...squad.starters, ...squad.bench]) {
    if (!person || typeof person !== 'object' || !/^\d{1,3}$/.test(String(person.num ?? '')) || typeof person.name !== 'string' || !person.name.trim() || person.name.length > 32) return 'each player needs a valid number and name';
    const number = String(Number(person.num));
    if (numbers.has(number)) return 'duplicate player number in squad';
    numbers.add(number);
  }
  return '';
}

function isPrivateIpv4(ip) {
  if (net.isIP(ip) !== 4) return true;
  const parts = ip.split('.').map(Number);
  const value = ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
  const ranges = [
    ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
    ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
    ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24],
    ['224.0.0.0', 4], ['240.0.0.0', 4]
  ];
  return ranges.some(([base, bits]) => {
    const p = base.split('.').map(Number);
    const b = ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0;
    const mask = (0xffffffff << (32 - bits)) >>> 0;
    return (value & mask) === (b & mask);
  });
}

function imageHostAllowlist(extra = '') {
  return new Set([...DEFAULT_IMAGE_HOSTS, ...String(extra).split(',').map(host => host.trim().toLowerCase()).filter(Boolean)]);
}

function validateImageUrl(value, allowedHosts) {
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error('invalid image url'); }
  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (parsed.protocol !== 'https:' || (parsed.port && parsed.port !== '443') || parsed.username || parsed.password) {
    throw new Error('only HTTPS images without credentials on port 443 are allowed');
  }
  if (net.isIP(hostname) || !allowedHosts.has(hostname)) throw new Error('image host is not allowed');
  return parsed;
}

function isOwnCloudFileId(value) {
  return typeof value === 'string' && value.startsWith('cloud://' + ENV_ID + '.') && value.includes('/');
}

module.exports = { WORKSPACES, resolveWorkspace, validateSnapshot, isPrivateIpv4, imageHostAllowlist, validateImageUrl, isOwnCloudFileId };

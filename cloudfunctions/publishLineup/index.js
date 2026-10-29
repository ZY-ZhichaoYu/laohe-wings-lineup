const cloudbase = require('@cloudbase/node-sdk');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const dns = require('dns');
const { resolveWorkspace, validateSnapshot, isPrivateIpv4, imageHostAllowlist, validateImageUrl, isOwnCloudFileId } = require('./security');

const COLLECTION = 'lineups';
const DEFAULT_DOC_ID = 'current';
const MAX_PROXY_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_REVIEWS = 800;
const MAX_REVIEW_COMMENT_LENGTH = 180;
const MAX_REVIEW_REPLY_LENGTH = 180;
const MAX_REVIEWER_NAME_LENGTH = 18;
const MAX_REVIEW_ATTACHMENTS = 6;
const MAX_REVIEW_REPLIES = 80;
const MAX_REVIEW_ATTACHMENT_SRC_LENGTH = 4000;
const REVIEW_DELETE_WINDOW_MS = 10 * 60 * 1000;
const MAX_DEVICE_ID_LENGTH = 96;
const MAX_USER_AGENT_LENGTH = 240;
const MAX_ATTENDANCE_RECORDS = 200;
const MAX_MVP_VOTES = 400;
const ATTENDANCE_STATUS_SET = new Set(['in', 'out', 'maybe']);
const REVIEW_IP_HASH_SALT = process.env.REVIEW_IP_HASH_SALT || 'laohe-wings-review';
const FUNCTION_VERSION = '20261029-teams-security';

// 编辑秘钥：只从环境变量读取，绝不硬编码进代码/前端。
// 未配置时，所有"需授权写入"（全量发布 publishLineup、队内身份 team_edit 评论）一律拒绝（fail-closed）。
const EDIT_SECRET = String(process.env.EDIT_SECRET || '');

function timingSafeEqualStr(a, b) {
  const bufA = Buffer.from(String(a || ''), 'utf8');
  const bufB = Buffer.from(String(b || ''), 'utf8');
  if (bufA.length !== bufB.length) return false;
  try {
    return crypto.timingSafeEqual(bufA, bufB);
  } catch (error) {
    return false;
  }
}

// 授权判定：请求携带的 editToken 必须与服务端 EDIT_SECRET 完全一致。
// EDIT_SECRET 未配置 => 视为未授权（不放行任何需授权写入）。
function hasValidEditSecret(input = {}) {
  if (!EDIT_SECRET) return false;
  return timingSafeEqualStr(input && input.editToken, EDIT_SECRET);
}

// Resolve only IPv4 and validate the actual address used to connect. IP literals
// are rejected before this point, and every redirect is checked separately.
function safeLookup(hostname, options, callback) {
  const cb = typeof options === 'function' ? options : callback;
  const opts = typeof options === 'function' ? {} : (options || {});
  dns.lookup(hostname, { family: 4, all: true }, (error, addresses) => {
    if (error) return cb(error);
    if (!Array.isArray(addresses) || !addresses.length || addresses.some(item => item.family !== 4 || isPrivateIpv4(item.address))) {
      return cb(new Error('blocked host: private or reserved address'));
    }
    if (opts.all) return cb(null, addresses);
    cb(null, addresses[0].address, 4);
  });
}

function initCloudBaseApp(context) {
  try {
    return cloudbase.init({ context });
  } catch (error) {
    return cloudbase.init({});
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function normalizePerson(person = {}) {
  return {
    num: String(person.num ?? '').trim(),
    name: normalizeText(person.name, 32),
    role: normalizeText(person.role, 32)
  };
}

function extractDatabaseRecord(result) {
  if (!result) return null;
  if (Array.isArray(result.data)) return result.data[0] || null;
  if (isPlainObject(result.data)) return result.data;
  if (isPlainObject(result) && result.snapshot) return result;
  return null;
}

function getSquadPeople(snapshot = {}) {
  const squad = isPlainObject(snapshot.squadData) ? snapshot.squadData : {};
  return [
    ...(Array.isArray(squad.starters) ? squad.starters : []),
    ...(Array.isArray(squad.bench) ? squad.bench : [])
  ]
    .map(normalizePerson)
    .filter(person => person.num && person.name);
}

function getLegendPeople(snapshot = {}) {
  return (Array.isArray(snapshot.legendsData) ? snapshot.legendsData : [])
    .map(normalizePerson)
    .filter(person => person.num && person.name);
}

function findFamiliarPerson(snapshot, num) {
  const key = String(num ?? '').trim();
  return [...getSquadPeople(snapshot), ...getLegendPeople(snapshot)].find(person => person.num === key) || null;
}

function getReviewTargets(snapshot = {}) {
  const byKey = new Map();
  getSquadPeople(snapshot).forEach(person => {
    const key = `player:${person.num}`;
    if (!byKey.has(key)) {
      byKey.set(key, {
        ...person,
        reviewKey: key,
        reviewType: 'player'
      });
    }
  });
  getLegendPeople(snapshot).forEach(person => {
    const key = `legend:${person.num || person.name}`;
    byKey.set(key, {
      ...person,
      role: person.role || '绝版人物',
      reviewKey: key,
      reviewType: 'legend'
    });
  });
  const coach = isPlainObject(snapshot.coachData) ? normalizePerson(snapshot.coachData) : null;
  if (coach && snapshot.coachData.show !== false) {
    byKey.set('coach', {
      num: coach.num || '3',
      name: coach.name || '教练',
      role: coach.role || '教练',
      reviewKey: 'coach',
      reviewType: 'coach'
    });
  }
  const manager = isPlainObject(snapshot.managerData) ? normalizePerson(snapshot.managerData) : null;
  if (manager && snapshot.managerData.show !== false) {
    byKey.set('manager', {
      num: manager.num || '·',
      name: manager.name || '领队',
      role: manager.role || '领队',
      reviewKey: 'manager',
      reviewType: 'manager'
    });
  }
  return Array.from(byKey.values());
}

function nextUpdateTime(record) {
  const previous = Date.parse(record && record.updatedAtText || '');
  return new Date(Math.max(Date.now(), Number.isFinite(previous) ? previous + 1 : 0));
}

function createError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function getHeaderValue(headers, name) {
  if (!headers || typeof headers !== 'object') return '';
  const lowerName = name.toLowerCase();
  const key = Object.keys(headers).find(item => String(item).toLowerCase() === lowerName);
  const value = key ? headers[key] : '';
  return Array.isArray(value) ? String(value[0] || '') : String(value || '');
}

function extractHeaders(rawEvent = {}) {
  return rawEvent.headers || rawEvent.header || rawEvent.httpContext?.headers || rawEvent.requestContext?.headers || {};
}

function extractClientIp(rawEvent = {}) {
  const headers = extractHeaders(rawEvent);
  const candidates = [
    getHeaderValue(headers, 'x-forwarded-for'),
    getHeaderValue(headers, 'x-real-ip'),
    getHeaderValue(headers, 'x-client-ip'),
    getHeaderValue(headers, 'x-original-forwarded-for'),
    getHeaderValue(headers, 'cf-connecting-ip'),
    rawEvent.requestContext?.sourceIp,
    rawEvent.httpContext?.sourceIp,
    rawEvent.ip
  ];
  const value = candidates.find(item => String(item || '').trim());
  return String(value || '').split(',')[0].trim();
}

function maskIp(ip) {
  const value = String(ip || '').trim();
  if (!value) return '';
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) {
    const parts = value.split('.');
    return `${parts[0]}.${parts[1]}.*.*`;
  }
  if (value.includes(':')) {
    return `${value.split(':').slice(0, 3).join(':')}:*:*`;
  }
  return '';
}

function hashIp(ip) {
  const value = String(ip || '').trim();
  if (!value) return '';
  return crypto.createHash('sha256').update(`${REVIEW_IP_HASH_SALT}:${value}`).digest('hex');
}

const REGION_NAME_MAP = new Map(Object.entries({
  'anhui': '安徽',
  'anhui province': '安徽',
  'beijing': '北京',
  'beijing city': '北京',
  'chongqing': '重庆',
  'chongqing city': '重庆',
  'fujian': '福建',
  'fujian province': '福建',
  'gansu': '甘肃',
  'gansu province': '甘肃',
  'guangdong': '广东',
  'guangdong province': '广东',
  'guangxi': '广西',
  'guangxi zhuang autonomous region': '广西',
  'guizhou': '贵州',
  'guizhou province': '贵州',
  'hainan': '海南',
  'hainan province': '海南',
  'hebei': '河北',
  'hebei province': '河北',
  'heilongjiang': '黑龙江',
  'heilongjiang province': '黑龙江',
  'henan': '河南',
  'henan province': '河南',
  'hong kong': '香港',
  'hubei': '湖北',
  'hubei province': '湖北',
  'hunan': '湖南',
  'hunan province': '湖南',
  'inner mongolia': '内蒙古',
  'inner mongolia autonomous region': '内蒙古',
  'jiangsu': '江苏',
  'jiangsu province': '江苏',
  'jiangxi': '江西',
  'jiangxi province': '江西',
  'jilin': '吉林',
  'jilin province': '吉林',
  'liaoning': '辽宁',
  'liaoning province': '辽宁',
  'macau': '澳门',
  'ningxia': '宁夏',
  'ningxia hui autonomous region': '宁夏',
  'qinghai': '青海',
  'qinghai province': '青海',
  'shaanxi': '陕西',
  'shaanxi province': '陕西',
  'shandong': '山东',
  'shandong province': '山东',
  'shanghai': '上海',
  'shanghai city': '上海',
  'shanxi': '山西',
  'shanxi province': '山西',
  'sichuan': '四川',
  'sichuan province': '四川',
  'tianjin': '天津',
  'tianjin city': '天津',
  'tibet': '西藏',
  'tibet autonomous region': '西藏',
  'xinjiang': '新疆',
  'xinjiang uygur autonomous region': '新疆',
  'yunnan': '云南',
  'yunnan province': '云南',
  'zhejiang': '浙江',
  'zhejiang province': '浙江',
  'hangzhou': '杭州',
  'hangzhou city': '杭州',
  'ningbo': '宁波',
  'ningbo city': '宁波',
  'wenzhou': '温州',
  'wenzhou city': '温州',
  'jiaxing': '嘉兴',
  'jiaxing city': '嘉兴',
  'huzhou': '湖州',
  'huzhou city': '湖州',
  'shaoxing': '绍兴',
  'shaoxing city': '绍兴',
  'jinhua': '金华',
  'jinhua city': '金华',
  'quzhou': '衢州',
  'quzhou city': '衢州',
  'zhoushan': '舟山',
  'zhoushan city': '舟山',
  'taizhou': '台州',
  'taizhou city': '台州',
  'lishui': '丽水',
  'lishui city': '丽水',
  'nanjing': '南京',
  'suzhou': '苏州',
  'wuxi': '无锡',
  'changzhou': '常州',
  'guangzhou': '广州',
  'shenzhen': '深圳',
  'chengdu': '成都',
  'wuhan': '武汉',
  'changsha': '长沙',
  'xiamen': '厦门',
  'fuzhou': '福州',
  'qingdao': '青岛',
  'jinan': '济南'
}));

function compactRegionPart(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const stripped = raw
    .replace(/^(中国|中华人民共和国|China|People's Republic of China)$/iu, '')
    .replace(/(省|市|自治区|壮族自治区|回族自治区|维吾尔自治区|特别行政区)$/u, '')
    .replace(/\b(province|city|municipality|autonomous region|special administrative region)\b$/iu, '')
    .replace(/\s+/g, ' ')
    .trim();
  const key = stripped
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  return REGION_NAME_MAP.get(key) || stripped;
}

function pickRegionValue(...values) {
  return values.find(value => String(value || '').trim()) || '';
}

function joinRegionParts(province, city) {
  const combined = `${province}${city}`;
  return /[A-Za-z]/.test(combined) ? `${province} ${city}` : combined;
}

function formatIpRegion(data) {
  const source = data && data.data ? data.data : data;
  if (!source || typeof source !== 'object') return '';
  const location = source.location && typeof source.location === 'object' ? source.location : {};
  const province = compactRegionPart(pickRegionValue(
    source.prov,
    source.province,
    source.region,
    source.regionName,
    source.region_name,
    location.province,
    location.region,
    location.regionName
  ));
  const city = compactRegionPart(pickRegionValue(
    source.city,
    source.cityName,
    source.city_name,
    location.city,
    location.cityName
  ));
  const country = compactRegionPart(pickRegionValue(
    source.country,
    source.countryName,
    source.country_name,
    location.country,
    location.countryName
  ));
  if (province && city && province !== city) return joinRegionParts(province, city);
  return province || city || country || '';
}

function fetchJson(url, timeoutMs = 1600) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch (error) {
      reject(new Error('invalid json url'));
      return;
    }
    const client = parsed.protocol === 'https:' ? https : http;
    const request = client.get(parsed, {
      timeout: timeoutMs,
      headers: {
        'User-Agent': 'laohe-wings-lineup-review/1.0',
        'Accept': 'application/json,text/plain,*/*'
      }
    }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        if ((response.statusCode || 0) < 200 || (response.statusCode || 0) >= 300) {
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }
        const text = Buffer.concat(chunks).toString('utf8');
        try {
          resolve(JSON.parse(text));
        } catch (error) {
          reject(new Error('invalid json response'));
        }
      });
    });
    request.on('timeout', () => request.destroy(new Error('json request timeout')));
    request.on('error', reject);
  });
}

async function resolveIpRegion(ip) {
  const value = String(ip || '').trim();
  if (!value || value.startsWith('127.') || value === '::1') return '';
  const lookupUrls = [
    `https://api.ipbot.com/${encodeURIComponent(value)}`,
    `https://freeipapi.com/api/json/${encodeURIComponent(value)}`,
    `https://api.iplocation.net/?ip=${encodeURIComponent(value)}`
  ];
  let lastError = null;
  for (const url of lookupUrls) {
    try {
      const data = await fetchJson(url);
      const region = formatIpRegion(data);
      if (region) return region;
    } catch (error) {
      lastError = error;
    }
  }
  try {
    const data = await fetchJson(`http://ip-api.com/json/${encodeURIComponent(value)}?fields=status,country,regionName,city`);
    return formatIpRegion(data);
  } catch (error) {
    console.warn('resolveIpRegion failed', {
      message: (lastError && lastError.message) || (error && error.message)
    });
    return '';
  }
}

function detectDeviceLabel(userAgent = '', clientInfo = {}) {
  const ua = String(userAgent || clientInfo.userAgent || '');
  const platform = String(clientInfo.platform || '');
  const os = /iPhone/i.test(ua) ? 'iPhone'
    : /iPad/i.test(ua) ? 'iPad'
      : /Android/i.test(ua) ? 'Android'
        : /Windows/i.test(ua) ? 'Windows'
          : /Mac OS X|Macintosh/i.test(ua) ? 'macOS'
            : platform || 'Unknown';
  const browser = /MicroMessenger/i.test(ua) ? 'WeChat'
    : /Edg\//i.test(ua) ? 'Edge'
      : /Chrome|CriOS/i.test(ua) ? 'Chrome'
        : /Safari/i.test(ua) ? 'Safari'
          : 'Browser';
  return `${os} · ${browser}`;
}

async function buildReviewMeta(rawEvent = {}, clientInfo = {}, includePublicRegion = false) {
  const headers = extractHeaders(rawEvent);
  const ip = extractClientIp(rawEvent);
  const userAgent = normalizeText(clientInfo.userAgent || getHeaderValue(headers, 'user-agent'), MAX_USER_AGENT_LENGTH);
  const ipRegion = includePublicRegion ? await resolveIpRegion(ip) : '';
  return {
    ipMasked: maskIp(ip),
    ipHash: hashIp(ip),
    ipRegion,
    deviceLabel: detectDeviceLabel(userAgent, clientInfo),
    userAgent,
    platform: normalizeText(clientInfo.platform, 80),
    language: normalizeText(clientInfo.language || getHeaderValue(headers, 'accept-language'), 80),
    timezone: normalizeText(clientInfo.timezone, 80),
    screen: normalizeText(clientInfo.screen, 40)
  };
}

function normalizeReviewAttachment(attachment = {}) {
  const source = typeof attachment === 'string' ? attachment : attachment.src;
  const src = normalizeText(source, MAX_REVIEW_ATTACHMENT_SRC_LENGTH);
  if (!src) return null;
  return {
    type: 'image',
    src,
    name: normalizeText(attachment.name, 80)
  };
}

function normalizeReviewAttachments(attachments = []) {
  if (!Array.isArray(attachments)) return [];
  return attachments
    .map(normalizeReviewAttachment)
    .filter(Boolean)
    .slice(0, MAX_REVIEW_ATTACHMENTS);
}

async function normalizeSubmittedReviewIdentity(input, snapshot, rawEvent = {}, clientInfo = {}) {
  const reviewerAuth = input.reviewerAuth === 'team_edit' ? 'team_edit' : 'friend_number';
  const reviewerNum = String(input.reviewerNum ?? input.familiarPlayerNum ?? '').trim();
  if (!/^\d{1,3}$/.test(reviewerNum)) {
    throw createError('INVALID_REVIEWER_NUM', 'reviewer player number is required');
  }
  const reviewerPerson = findFamiliarPerson(snapshot, reviewerNum);
  if (!reviewerPerson) {
    throw createError('UNKNOWN_REVIEWER_NUM', 'reviewer player number is not in the current roster');
  }
  const reviewerName = reviewerAuth === 'team_edit' ? '' : normalizeText(input.reviewerName, MAX_REVIEWER_NAME_LENGTH);
  if (reviewerAuth === 'friend_number' && !reviewerName) {
    throw createError('INVALID_REVIEWER_NAME', 'reviewer nickname is required');
  }
  const deviceId = normalizeText(input.deviceId, MAX_DEVICE_ID_LENGTH);
  if (!deviceId) {
    throw createError('INVALID_DEVICE_ID', 'deviceId is required');
  }
  const reviewMeta = await buildReviewMeta(rawEvent, isPlainObject(clientInfo) ? clientInfo : {}, true);
  return {
    reviewerNum,
    reviewerName,
    familiarPlayerNum: reviewerAuth === 'friend_number' ? reviewerNum : '',
    familiarPlayerName: reviewerAuth === 'friend_number' ? reviewerPerson.name : '',
    reviewerAuth,
    deviceId,
    ipRegion: reviewMeta.ipRegion,
    ipMasked: reviewMeta.ipMasked,
    deviceLabel: reviewMeta.deviceLabel,
    reviewMeta
  };
}

async function normalizeSubmittedReview(review, snapshot, rawEvent = {}, clientInfo = {}) {
  if (!isPlainObject(review)) {
    throw createError('INVALID_REVIEW', 'review must be an object');
  }
  const targetKey = String(review.targetKey || '').trim();
  const targetNum = String(review.targetNum ?? '').trim();
  const target = getReviewTargets(snapshot).find(item =>
    item.reviewKey === targetKey || (targetNum && String(item.num) === targetNum)
  );
  if (!target) {
    throw createError('INVALID_REVIEW_TARGET', 'review target is not in the current lineup');
  }

  const identity = await normalizeSubmittedReviewIdentity(review, snapshot, rawEvent, clientInfo);
  const rating = Math.min(5, Math.max(1, Number.parseInt(review.rating, 10) || 0));
  if (!rating) {
    throw createError('INVALID_REVIEW_RATING', 'rating must be 1-5');
  }
  const nowTime = Date.now();
  const now = new Date(nowTime).toISOString();
  return {
    id: `review:${now}:${Math.random().toString(36).slice(2, 10)}`,
    targetKey: target.reviewKey,
    targetNum: String(target.num),
    targetName: target.name,
    targetType: target.reviewType,
    ...identity,
    deleteUntil: new Date(nowTime + REVIEW_DELETE_WINDOW_MS).toISOString(),
    rating,
    comment: normalizeText(review.comment, MAX_REVIEW_COMMENT_LENGTH),
    attachments: normalizeReviewAttachments(review.attachments),
    replies: [],
    createdAt: now
  };
}

async function normalizeSubmittedReviewReply(reply, snapshot, rawEvent = {}, clientInfo = {}) {
  if (!isPlainObject(reply)) {
    throw createError('INVALID_REPLY', 'reply must be an object');
  }
  const identity = await normalizeSubmittedReviewIdentity(reply, snapshot, rawEvent, clientInfo);
  const comment = normalizeText(reply.comment, MAX_REVIEW_REPLY_LENGTH);
  const attachments = normalizeReviewAttachments(reply.attachments);
  if (!comment && !attachments.length) {
    throw createError('EMPTY_REPLY', 'reply text or image is required');
  }
  const nowTime = Date.now();
  const now = new Date(nowTime).toISOString();
  return {
    id: `reply:${now}:${Math.random().toString(36).slice(2, 10)}`,
    ...identity,
    deleteUntil: new Date(nowTime + REVIEW_DELETE_WINDOW_MS).toISOString(),
    comment,
    attachments,
    createdAt: now
  };
}

function findAttendancePerson(snapshot, num) {
  const key = String(num ?? '').trim();
  return getSquadPeople(snapshot).find(person => person.num === key) || null;
}

async function normalizeSubmittedAttendance(attendance, snapshot, rawEvent = {}, clientInfo = {}, existingRecord = null) {
  if (!isPlainObject(attendance)) {
    throw createError('INVALID_ATTENDANCE', 'attendance must be an object');
  }
  const playerNum = String(attendance.playerNum ?? '').trim();
  if (!/^\d{1,3}$/.test(playerNum)) {
    throw createError('INVALID_ATTENDANCE_PLAYER', 'attendance player number is required');
  }
  const player = findAttendancePerson(snapshot, playerNum);
  if (!player) {
    throw createError('UNKNOWN_ATTENDANCE_PLAYER', 'attendance player is not in the current roster');
  }
  const status = ATTENDANCE_STATUS_SET.has(attendance.status) ? attendance.status : 'in';
  const deviceId = normalizeText(attendance.deviceId, MAX_DEVICE_ID_LENGTH);
  if (!deviceId) {
    throw createError('INVALID_DEVICE_ID', 'deviceId is required');
  }
  const reviewMeta = await buildReviewMeta(rawEvent, isPlainObject(clientInfo) ? clientInfo : {}, true);
  const now = new Date().toISOString();
  const createdAt = existingRecord && existingRecord.createdAt ? String(existingRecord.createdAt) : now;
  return {
    id: existingRecord && existingRecord.id ? String(existingRecord.id) : `attendance:${now}:${Math.random().toString(36).slice(2, 10)}`,
    playerNum: player.num,
    playerName: player.name,
    status,
    nickname: normalizeText(attendance.nickname, MAX_REVIEWER_NAME_LENGTH),
    deviceId,
    ipRegion: reviewMeta.ipRegion,
    ipMasked: reviewMeta.ipMasked,
    deviceLabel: reviewMeta.deviceLabel,
    reviewMeta,
    createdAt,
    updatedAt: now
  };
}

async function normalizeSubmittedMvpVote(vote, snapshot, rawEvent = {}, clientInfo = {}, existingVote = null) {
  if (!isPlainObject(vote)) {
    throw createError('INVALID_MVP_VOTE', 'vote must be an object');
  }
  const targetKey = String(vote.targetKey || '').trim();
  const targetNum = String(vote.targetNum ?? '').trim();
  const target = getReviewTargets(snapshot).find(item =>
    item.reviewKey === targetKey || (targetNum && String(item.num) === targetNum)
  );
  if (!target) {
    throw createError('INVALID_MVP_TARGET', 'MVP target is not in the current lineup');
  }
  const identity = await normalizeSubmittedReviewIdentity(vote, snapshot, rawEvent, clientInfo);
  if (identity.reviewerAuth !== 'friend_number') {
    throw createError('INVALID_MVP_IDENTITY', 'MVP vote requires friend identity');
  }
  const now = new Date().toISOString();
  const createdAt = existingVote && existingVote.createdAt ? String(existingVote.createdAt) : now;
  return {
    id: existingVote && existingVote.id ? String(existingVote.id) : `mvp:${now}:${Math.random().toString(36).slice(2, 10)}`,
    targetKey: target.reviewKey,
    targetNum: String(target.num),
    targetName: target.name,
    targetType: target.reviewType,
    ...identity,
    createdAt,
    updatedAt: now
  };
}

// 事务化的"读-改-写"，解决整文档并发提交互相覆盖（last-write-wins）的问题。
// mutate(snapshot, record) 只做快照内的追加/修改（应为纯内存操作，不要在里面发网络请求）。
// 校验/网络请求请放在调用方、进入本函数之前完成。
async function mutateWithTransaction(db, docId, mutate, meta, attempt = 0) {
  const transaction = await db.startTransaction();
  let committed = false;
  try {
    const record = extractDatabaseRecord(await transaction.collection(COLLECTION).doc(docId).get());
    const snapshot = record && isPlainObject(record.snapshot) ? record.snapshot : null;
    if (!snapshot) {
      await transaction.rollback();
      return { ok: false, code: 'SNAPSHOT_NOT_FOUND', message: 'current lineup snapshot was not found' };
    }
    let mutateResult;
    try {
      mutateResult = await mutate(snapshot, record);
    } catch (validationError) {
      await transaction.rollback();
      return {
        ok: false,
        code: validationError.code || 'INVALID_INPUT',
        message: validationError.message || String(validationError)
      };
    }
    const now = nextUpdateTime(record);
    await transaction.collection(COLLECTION).doc(docId).update({
      snapshot,
      schemaVersion: record.schemaVersion || 1,
      updatedAt: now,
      updatedAtText: now.toISOString(),
      updatedBy: meta.updatedBy || 'web',
      clientUpdatedAt: meta.clientUpdatedAt || ''
    });
    await transaction.commit();
    committed = true;
    return { ok: true, updatedAt: now, record, mutateResult };
  } catch (error) {
    if (!committed) {
      try { await transaction.rollback(); } catch (rollbackError) { /* ignore */ }
    }
    if (attempt < 2) {
      return mutateWithTransaction(db, docId, mutate, meta, attempt + 1);
    }
    throw error;
  }
}

async function withDocumentMutation(db, docId, mutate, meta = {}) {
  if (typeof db.startTransaction !== 'function') {
    return { ok: false, code: 'TRANSACTIONS_REQUIRED', message: '云端暂不支持事务，已保留原数据，请管理员检查部署' };
  }
  try {
    return await mutateWithTransaction(db, docId, mutate, meta);
  } catch (error) {
    console.error('withDocumentMutation: transaction failed', { docId, code: error.code, message: error.message });
    return { ok: false, code: 'TRANSACTION_FAILED', message: '云端保存失败，原数据未被覆盖，请稍后重试' };
  }
}

async function submitAttendance(db, input, context, rawEvent = {}) {
  const docId = typeof input.docId === 'string' && input.docId.trim()
    ? input.docId.trim()
    : DEFAULT_DOC_ID;
  const preRecord = extractDatabaseRecord(await db.collection(COLLECTION).doc(docId).get());
  const preSnapshot = preRecord && isPlainObject(preRecord.snapshot) ? preRecord.snapshot : null;
  if (!preSnapshot) {
    return {
      ok: false,
      code: 'SNAPSHOT_NOT_FOUND',
      message: 'current lineup snapshot was not found'
    };
  }

  const deviceId = normalizeText(input.attendance && input.attendance.deviceId, MAX_DEVICE_ID_LENGTH);
  const preExisting = (Array.isArray(preSnapshot.attendanceData) ? preSnapshot.attendanceData : [])
    .find(item => item && item.deviceId === deviceId) || null;
  let attendance;
  try {
    attendance = await normalizeSubmittedAttendance(input.attendance, preSnapshot, rawEvent, input.clientInfo, preExisting);
  } catch (error) {
    return {
      ok: false,
      code: error.code || 'INVALID_ATTENDANCE',
      message: error.message || String(error)
    };
  }

  const auth = context.auth || context.userInfo || {};
  const updatedBy = auth.uid || auth.openId || auth.openid || 'attendance-web';

  try {
    const outcome = await withDocumentMutation(db, docId, (snapshot) => {
      const existingRecords = Array.isArray(snapshot.attendanceData) ? snapshot.attendanceData : [];
      snapshot.attendanceData = [
        attendance,
        ...existingRecords.filter(item => !item || (item.id !== attendance.id && item.deviceId !== attendance.deviceId))
      ].slice(0, MAX_ATTENDANCE_RECORDS);
    }, { updatedBy, clientUpdatedAt: input.clientUpdatedAt });
    if (!outcome.ok) return outcome;
    console.log('submitAttendance saved', {
      docId,
      playerNum: attendance.playerNum,
      status: attendance.status,
      ipRegion: attendance.ipRegion,
      functionVersion: FUNCTION_VERSION
    });
    return {
      ok: true,
      docId,
      record: attendance,
      updatedAt: outcome.updatedAt.toISOString(),
      functionVersion: FUNCTION_VERSION
    };
  } catch (error) {
    console.error('submitAttendance failed', {
      code: error && error.code,
      message: error && error.message,
      requestId: error && error.requestId
    });
    return {
      ok: false,
      code: error && error.code ? error.code : 'DATABASE_WRITE_FAILED',
      message: error && error.message ? error.message : String(error),
      requestId: error && error.requestId ? error.requestId : ''
    };
  }
}

async function submitMvpVote(db, input, context, rawEvent = {}) {
  const docId = typeof input.docId === 'string' && input.docId.trim()
    ? input.docId.trim()
    : DEFAULT_DOC_ID;
  const preRecord = extractDatabaseRecord(await db.collection(COLLECTION).doc(docId).get());
  const preSnapshot = preRecord && isPlainObject(preRecord.snapshot) ? preRecord.snapshot : null;
  if (!preSnapshot) {
    return {
      ok: false,
      code: 'SNAPSHOT_NOT_FOUND',
      message: 'current lineup snapshot was not found'
    };
  }

  const deviceId = normalizeText(input.vote && input.vote.deviceId, MAX_DEVICE_ID_LENGTH);
  const preExistingVote = (Array.isArray(preSnapshot.mvpVotesData) ? preSnapshot.mvpVotesData : [])
    .find(item => item && item.deviceId === deviceId) || null;
  let vote;
  try {
    vote = await normalizeSubmittedMvpVote(input.vote, preSnapshot, rawEvent, input.clientInfo, preExistingVote);
  } catch (error) {
    return {
      ok: false,
      code: error.code || 'INVALID_MVP_VOTE',
      message: error.message || String(error)
    };
  }

  const auth = context.auth || context.userInfo || {};
  const updatedBy = auth.uid || auth.openId || auth.openid || 'mvp-vote-web';

  try {
    const outcome = await withDocumentMutation(db, docId, (snapshot) => {
      const existingVotes = Array.isArray(snapshot.mvpVotesData) ? snapshot.mvpVotesData : [];
      snapshot.mvpVotesData = [
        vote,
        ...existingVotes.filter(item => !item || (item.id !== vote.id && item.deviceId !== vote.deviceId))
      ].slice(0, MAX_MVP_VOTES);
    }, { updatedBy, clientUpdatedAt: input.clientUpdatedAt });
    if (!outcome.ok) return outcome;
    console.log('submitMvpVote saved', {
      docId,
      targetKey: vote.targetKey,
      reviewerNum: vote.reviewerNum,
      ipRegion: vote.ipRegion,
      functionVersion: FUNCTION_VERSION
    });
    return {
      ok: true,
      docId,
      vote,
      updatedAt: outcome.updatedAt.toISOString(),
      functionVersion: FUNCTION_VERSION
    };
  } catch (error) {
    console.error('submitMvpVote failed', {
      code: error && error.code,
      message: error && error.message,
      requestId: error && error.requestId
    });
    return {
      ok: false,
      code: error && error.code ? error.code : 'DATABASE_WRITE_FAILED',
      message: error && error.message ? error.message : String(error),
      requestId: error && error.requestId ? error.requestId : ''
    };
  }
}

async function submitReview(db, input, context, rawEvent = {}) {
  const docId = typeof input.docId === 'string' && input.docId.trim()
    ? input.docId.trim()
    : DEFAULT_DOC_ID;
  const preRecord = extractDatabaseRecord(await db.collection(COLLECTION).doc(docId).get());
  const preSnapshot = preRecord && isPlainObject(preRecord.snapshot) ? preRecord.snapshot : null;
  if (!preSnapshot) {
    return {
      ok: false,
      code: 'SNAPSHOT_NOT_FOUND',
      message: 'current lineup snapshot was not found'
    };
  }

  let review;
  try {
    review = await normalizeSubmittedReview(input.review, preSnapshot, rawEvent, input.clientInfo);
  } catch (error) {
    return {
      ok: false,
      code: error.code || 'INVALID_REVIEW',
      message: error.message || String(error)
    };
  }

  // 队内身份（team_edit）必须持有正确的编辑口令，否则任何人都能冒充球队发言。
  if (review.reviewerAuth === 'team_edit' && !hasValidEditSecret(input)) {
    return {
      ok: false,
      code: 'EDIT_SECRET_REQUIRED',
      message: EDIT_SECRET ? '队内身份需要正确的编辑口令' : '服务端未配置 EDIT_SECRET，队内身份评价暂不可用'
    };
  }

  const auth = context.auth || context.userInfo || {};
  const updatedBy = auth.uid || auth.openId || auth.openid || 'review-web';

  try {
    const outcome = await withDocumentMutation(db, docId, (snapshot) => {
      const existingReviews = Array.isArray(snapshot.reviewsData) ? snapshot.reviewsData : [];
      snapshot.reviewsData = [
        review,
        ...existingReviews.filter(item => !item || item.id !== review.id)
      ].slice(0, MAX_REVIEWS);
    }, { updatedBy, clientUpdatedAt: input.clientUpdatedAt });
    if (!outcome.ok) return outcome;
    console.log('submitReview saved', {
      docId,
      targetKey: review.targetKey,
      reviewerNum: review.reviewerNum,
      attachmentCount: review.attachments.length,
      functionVersion: FUNCTION_VERSION
    });
    return {
      ok: true,
      docId,
      review,
      updatedAt: outcome.updatedAt.toISOString(),
      functionVersion: FUNCTION_VERSION
    };
  } catch (error) {
    console.error('submitReview failed', {
      code: error && error.code,
      message: error && error.message,
      requestId: error && error.requestId
    });
    return {
      ok: false,
      code: error && error.code ? error.code : 'DATABASE_WRITE_FAILED',
      message: error && error.message ? error.message : String(error),
      requestId: error && error.requestId ? error.requestId : ''
    };
  }
}

async function replyReview(db, input, context, rawEvent = {}) {
  const docId = typeof input.docId === 'string' && input.docId.trim()
    ? input.docId.trim()
    : DEFAULT_DOC_ID;
  const reviewId = String(input.reviewId || '').trim();
  if (!reviewId) {
    return {
      ok: false,
      code: 'INVALID_REPLY_REQUEST',
      message: 'reviewId is required'
    };
  }

  const preRecord = extractDatabaseRecord(await db.collection(COLLECTION).doc(docId).get());
  const preSnapshot = preRecord && isPlainObject(preRecord.snapshot) ? preRecord.snapshot : null;
  if (!preSnapshot) {
    return {
      ok: false,
      code: 'SNAPSHOT_NOT_FOUND',
      message: 'current lineup snapshot was not found'
    };
  }
  const preReviews = Array.isArray(preSnapshot.reviewsData) ? preSnapshot.reviewsData : [];
  if (!preReviews.some(item => item && item.id === reviewId)) {
    return {
      ok: false,
      code: 'REVIEW_NOT_FOUND',
      message: 'review was not found'
    };
  }

  let reply;
  try {
    reply = await normalizeSubmittedReviewReply(input.reply, preSnapshot, rawEvent, input.clientInfo);
  } catch (error) {
    return {
      ok: false,
      code: error.code || 'INVALID_REPLY',
      message: error.message || String(error)
    };
  }

  // 队内身份（team_edit）回复同样需要正确的编辑口令。
  if (reply.reviewerAuth === 'team_edit' && !hasValidEditSecret(input)) {
    return {
      ok: false,
      code: 'EDIT_SECRET_REQUIRED',
      message: EDIT_SECRET ? '队内身份需要正确的编辑口令' : '服务端未配置 EDIT_SECRET，队内身份回复暂不可用'
    };
  }

  const auth = context.auth || context.userInfo || {};
  const updatedBy = auth.uid || auth.openId || auth.openid || 'review-reply-web';

  try {
    const outcome = await withDocumentMutation(db, docId, (snapshot) => {
      const reviews = Array.isArray(snapshot.reviewsData) ? snapshot.reviewsData : [];
      const index = reviews.findIndex(item => item && item.id === reviewId);
      if (index < 0) {
        throw createError('REVIEW_NOT_FOUND', 'review was not found');
      }
      const review = isPlainObject(reviews[index]) ? reviews[index] : {};
      const existingReplies = Array.isArray(review.replies) ? review.replies : [];
      reviews[index] = {
        ...review,
        replies: [
          ...existingReplies.filter(item => !item || item.id !== reply.id),
          reply
        ].slice(-MAX_REVIEW_REPLIES)
      };
      snapshot.reviewsData = reviews.slice(0, MAX_REVIEWS);
    }, { updatedBy, clientUpdatedAt: input.clientUpdatedAt });
    if (!outcome.ok) return outcome;
    console.log('replyReview saved', {
      docId,
      reviewId,
      reviewerNum: reply.reviewerNum,
      attachmentCount: reply.attachments.length,
      ipRegion: reply.ipRegion,
      functionVersion: FUNCTION_VERSION
    });
    return {
      ok: true,
      docId,
      reviewId,
      reply,
      updatedAt: outcome.updatedAt.toISOString(),
      functionVersion: FUNCTION_VERSION
    };
  } catch (error) {
    console.error('replyReview failed', {
      code: error && error.code,
      message: error && error.message,
      requestId: error && error.requestId
    });
    return {
      ok: false,
      code: error && error.code ? error.code : 'DATABASE_WRITE_FAILED',
      message: error && error.message ? error.message : String(error),
      requestId: error && error.requestId ? error.requestId : ''
    };
  }
}

async function deleteReview(db, input, context) {
  // deviceId is public roster data, so it cannot prove ownership.
  if (!hasValidEditSecret(input)) {
    return { ok: false, code: 'EDIT_SECRET_REQUIRED', message: '删除评价需要管理员编辑口令' };
  }
  const docId = typeof input.docId === 'string' && input.docId.trim()
    ? input.docId.trim()
    : DEFAULT_DOC_ID;
  const reviewId = String(input.reviewId || '').trim();
  if (!reviewId) {
    return {
      ok: false,
      code: 'INVALID_DELETE_REQUEST',
      message: 'reviewId is required'
    };
  }

  const auth = context.auth || context.userInfo || {};
  const updatedBy = auth.uid || auth.openId || auth.openid || 'review-delete-web';

  try {
    const outcome = await withDocumentMutation(db, docId, (snapshot) => {
      const reviews = Array.isArray(snapshot.reviewsData) ? snapshot.reviewsData : [];
      const review = reviews.find(item => item && item.id === reviewId);
      if (!review) {
        throw createError('REVIEW_NOT_FOUND', 'review was not found');
      }
      snapshot.reviewsData = reviews.filter(item => !item || item.id !== reviewId).slice(0, MAX_REVIEWS);
    }, { updatedBy, clientUpdatedAt: input.clientUpdatedAt });
    if (!outcome.ok) return outcome;
    console.log('deleteReview saved', {
      docId,
      reviewId
    });
    return {
      ok: true,
      docId,
      reviewId,
      updatedAt: outcome.updatedAt.toISOString(),
      functionVersion: FUNCTION_VERSION
    };
  } catch (error) {
    console.error('deleteReview failed', {
      code: error && error.code,
      message: error && error.message,
      requestId: error && error.requestId
    });
    return {
      ok: false,
      code: error && error.code ? error.code : 'DATABASE_WRITE_FAILED',
      message: error && error.message ? error.message : String(error),
      requestId: error && error.requestId ? error.requestId : ''
    };
  }
}

async function deleteReply(db, input, context) {
  if (!hasValidEditSecret(input)) {
    return { ok: false, code: 'EDIT_SECRET_REQUIRED', message: '删除回复需要管理员编辑口令' };
  }
  const docId = typeof input.docId === 'string' && input.docId.trim()
    ? input.docId.trim()
    : DEFAULT_DOC_ID;
  const reviewId = String(input.reviewId || '').trim();
  const replyId = String(input.replyId || '').trim();
  if (!reviewId || !replyId) {
    return {
      ok: false,
      code: 'INVALID_DELETE_REPLY_REQUEST',
      message: 'reviewId and replyId are required'
    };
  }

  const auth = context.auth || context.userInfo || {};
  const updatedBy = auth.uid || auth.openId || auth.openid || 'reply-delete-web';

  try {
    const outcome = await withDocumentMutation(db, docId, (snapshot) => {
      const reviews = Array.isArray(snapshot.reviewsData) ? snapshot.reviewsData : [];
      const reviewIndex = reviews.findIndex(item => item && item.id === reviewId);
      if (reviewIndex < 0) {
        throw createError('REVIEW_NOT_FOUND', 'review was not found');
      }
      const review = isPlainObject(reviews[reviewIndex]) ? reviews[reviewIndex] : {};
      const replies = Array.isArray(review.replies) ? review.replies : [];
      const reply = replies.find(item => item && item.id === replyId);
      if (!reply) {
        throw createError('REPLY_NOT_FOUND', 'reply was not found');
      }
      reviews[reviewIndex] = {
        ...review,
        replies: replies.filter(item => !item || item.id !== replyId).slice(-MAX_REVIEW_REPLIES)
      };
      snapshot.reviewsData = reviews.slice(0, MAX_REVIEWS);
    }, { updatedBy, clientUpdatedAt: input.clientUpdatedAt });
    if (!outcome.ok) return outcome;
    console.log('deleteReply saved', {
      docId,
      reviewId,
      replyId,
      functionVersion: FUNCTION_VERSION
    });
    return {
      ok: true,
      docId,
      reviewId,
      replyId,
      updatedAt: outcome.updatedAt.toISOString(),
      functionVersion: FUNCTION_VERSION
    };
  } catch (error) {
    console.error('deleteReply failed', {
      code: error && error.code,
      message: error && error.message,
      requestId: error && error.requestId
    });
    return {
      ok: false,
      code: error && error.code ? error.code : 'DATABASE_WRITE_FAILED',
      message: error && error.message ? error.message : String(error),
      requestId: error && error.requestId ? error.requestId : ''
    };
  }
}

function parseBody(body) {
  if (!body) return {};
  if (isPlainObject(body)) return body;
  if (Buffer.isBuffer(body)) return parseBody(body.toString('utf8'));
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (error) {
      return {};
    }
  }
  return {};
}

function normalizeEvent(event = {}) {
  if (isPlainObject(event.body)) return event.body;
  if (typeof event.body === 'string' || Buffer.isBuffer(event.body)) return parseBody(event.body);
  return event;
}

function fetchImageBuffer(url, redirects = 3, allowedHosts = imageHostAllowlist(process.env.IMAGE_PROXY_ALLOWED_HOSTS)) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = validateImageUrl(url, allowedHosts);
    } catch (error) {
      reject(error);
      return;
    }

    const client = https;
    const request = client.get(parsed, {
      timeout: 10000,
      lookup: safeLookup,
      headers: {
        'User-Agent': 'laohe-wings-lineup-export/1.0',
        'Accept': 'image/*,*/*;q=0.8'
      }
    }, response => {
      const status = response.statusCode || 0;
      if ([301, 302, 303, 307, 308].includes(status) && response.headers.location && redirects > 0) {
        response.resume();
        try {
          const nextUrl = new URL(response.headers.location, parsed).href;
          fetchImageBuffer(nextUrl, redirects - 1, allowedHosts).then(resolve, reject);
        } catch (error) {
          reject(error);
        }
        return;
      }
      if (status < 200 || status >= 300) {
        response.resume();
        reject(new Error(`image request failed: HTTP ${status}`));
        return;
      }
      const contentType = String(response.headers['content-type'] || '').split(';')[0].toLowerCase();
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(contentType)) {
        response.destroy();
        reject(new Error('unsupported image content type'));
        return;
      }
      if (Number(response.headers['content-length'] || 0) > MAX_PROXY_IMAGE_BYTES) {
        response.destroy();
        reject(new Error('image is too large'));
        return;
      }
      response.on('error', reject);
      response.on('aborted', () => reject(new Error('image response aborted')));
      const chunks = [];
      let size = 0;
      response.on('data', chunk => {
        size += chunk.length;
        if (size > MAX_PROXY_IMAGE_BYTES) {
          reject(new Error('image is too large'));
          request.destroy();
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => {
        resolve({
          buffer: Buffer.concat(chunks),
          contentType
        });
      });
    });
    const deadline = setTimeout(() => request.destroy(new Error('image request timeout')), 10000);
    request.once('close', () => clearTimeout(deadline));
    request.on('timeout', () => request.destroy(new Error('image request timeout')));
    request.on('error', reject);
  });
}

function getTempFileUrlFromResponse(response, fileID) {
  const item = response?.fileList?.[0] || response?.data?.fileList?.[0] || null;
  return item?.tempFileURL || item?.download_url || item?.url || fileID;
}

async function getCloudTempFileURL(app, fileID) {
  const id = String(fileID || '').trim();
  if (!id || !app || typeof app.getTempFileURL !== 'function') return '';
  const result = await app.getTempFileURL({ fileList: [id] });
  const url = getTempFileUrlFromResponse(result, id);
  return url && !url.startsWith('cloud://') ? url : '';
}

async function proxyImage(input, app) {
  let url = String(input.url || '').trim();
  const fileID = String(input.fileID || '').trim();
  const allowedHosts = imageHostAllowlist(process.env.IMAGE_PROXY_ALLOWED_HOSTS);
  try {
    if (fileID) {
      if (!isOwnCloudFileId(fileID)) throw new Error('cloud file does not belong to this environment');
      url = await getCloudTempFileURL(app, fileID);
      if (!url) throw new Error('cloud file URL is unavailable');
      // Trust only the exact origin returned by this environment's SDK, never an
      // origin supplied by the browser. Redirects remain constrained to the set.
      const cloudUrl = new URL(url);
      allowedHosts.add(cloudUrl.hostname.toLowerCase());
    }
    const { buffer, contentType } = await fetchImageBuffer(url, 3, allowedHosts);
    return { ok: true, contentType, dataUrl: 'data:' + contentType + ';base64,' + buffer.toString('base64') };
  } catch (error) {
    console.warn('proxyImage rejected', { message: error.message });
    return { ok: false, code: 'IMAGE_PROXY_FAILED', message: error.message || String(error) };
  }
}

async function publishSnapshot(db, input, workspace, context) {
  if (!hasValidEditSecret(input)) {
    return { ok: false, code: 'EDIT_SECRET_REQUIRED', message: EDIT_SECRET ? '编辑口令不正确，无权发布阵容' : '服务端未配置 EDIT_SECRET，发布已被拒绝' };
  }
  const invalidReason = validateSnapshot(input.snapshot, workspace);
  if (invalidReason) return { ok: false, code: 'INVALID_SNAPSHOT', message: invalidReason };
  if (typeof input.baseUpdatedAt !== 'string') {
    return { ok: false, code: 'BASE_VERSION_REQUIRED', message: '请刷新页面，读取最新云端版本后再发布' };
  }
  if (typeof db.startTransaction !== 'function') {
    return { ok: false, code: 'TRANSACTIONS_REQUIRED', message: '云端暂不支持事务，发布已停止，请管理员检查部署' };
  }
  let transaction;
  try {
    transaction = await db.startTransaction();
    const doc = transaction.collection(COLLECTION).doc(workspace.docId);
    const record = extractDatabaseRecord(await doc.get());
    const currentVersion = record ? String(record.updatedAtText || '') : '';
    if (currentVersion !== input.baseUpdatedAt) {
      await transaction.rollback();
      return { ok: false, code: 'VERSION_CONFLICT', message: '云端已有新内容，请先载入最新版本再发布；本地修改仍保留', updatedAt: currentVersion };
    }
    const snapshot = { ...input.snapshot, workspaceId: workspace.workspaceId, matchFormat: workspace.matchFormat };
    // Publishing the tactical board must never restore an outdated copy of
    // other people's reviews, attendance or votes.
    for (const field of ['reviewsData', 'attendanceData', 'mvpVotesData']) {
      snapshot[field] = record && record.snapshot && Array.isArray(record.snapshot[field]) ? record.snapshot[field] : [];
    }
    const now = nextUpdateTime(record);
    const auth = context.auth || context.userInfo || {};
    await doc.set({
      snapshot,
      schemaVersion: 2,
      updatedAt: now,
      updatedAtText: now.toISOString(),
      updatedBy: auth.uid || auth.openId || auth.openid || 'editor-web',
      clientUpdatedAt: normalizeText(input.clientUpdatedAt, 64)
    });
    await transaction.commit();
    return { ok: true, docId: workspace.docId, workspaceId: workspace.workspaceId, updatedAt: now.toISOString(), functionVersion: FUNCTION_VERSION };
  } catch (error) {
    if (transaction) { try { await transaction.rollback(); } catch { /* preserve original error */ } }
    console.error('publishLineup transaction failed', { code: error.code, message: error.message });
    return { ok: false, code: 'TRANSACTION_FAILED', message: '发布未完成，请重新读取云端状态后重试；本地修改仍保留' };
  }
}

exports.main = async (event = {}, context = {}) => {
  const input = normalizeEvent(event);
  if (!isPlainObject(input)) return { ok: false, code: 'INVALID_INPUT', message: 'request must be an object' };
  const app = initCloudBaseApp(context);
  // 客户端解锁编辑时用于校验口令是否正确（不落库、不返回秘钥本身）。
  if (input.action === 'verifyEditToken') {
    return {
      ok: hasValidEditSecret(input),
      configured: Boolean(EDIT_SECRET),
      functionVersion: FUNCTION_VERSION
    };
  }
  if (input.action === 'proxyImage') {
    return proxyImage(input, app);
  }
  const allowedActions = ['publishLineup', 'submitAttendance', 'submitMvpVote', 'submitReview', 'replyReview', 'deleteReview', 'deleteReply'];
  if (input.action && !allowedActions.includes(input.action)) {
    return { ok: false, code: 'INVALID_ACTION', message: 'unsupported action' };
  }
  const workspace = resolveWorkspace(input);
  if (!workspace.ok) return workspace;
  input.docId = workspace.docId;
  input.workspaceId = workspace.workspaceId;
  const db = app.database();
  if (input.action === 'submitAttendance') {
    return submitAttendance(db, input, context, event);
  }
  if (input.action === 'submitMvpVote') {
    return submitMvpVote(db, input, context, event);
  }
  if (input.action === 'submitReview') {
    return submitReview(db, input, context, event);
  }
  if (input.action === 'replyReview') {
    return replyReview(db, input, context, event);
  }
  if (input.action === 'deleteReview') {
    return deleteReview(db, input, context);
  }
  if (input.action === 'deleteReply') {
    return deleteReply(db, input, context);
  }
  return publishSnapshot(db, input, workspace, context);
};

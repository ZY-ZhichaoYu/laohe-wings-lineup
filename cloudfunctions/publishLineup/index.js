const cloudbase = require('@cloudbase/node-sdk');
const http = require('http');
const https = require('https');
const crypto = require('crypto');

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
const FUNCTION_VERSION = '20260522-team-play-interactions';

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

function validateSnapshot(snapshot) {
  if (!isPlainObject(snapshot)) return 'snapshot must be an object';
  if (!isPlainObject(snapshot.squadData)) return 'snapshot.squadData is required';
  if (!Array.isArray(snapshot.squadData.starters)) return 'snapshot.squadData.starters is required';
  if (!Array.isArray(snapshot.squadData.bench)) return 'snapshot.squadData.bench is required';
  if (typeof snapshot.formation !== 'string') return 'snapshot.formation is required';
  return '';
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

async function submitAttendance(db, input, context, rawEvent = {}) {
  const docId = typeof input.docId === 'string' && input.docId.trim()
    ? input.docId.trim()
    : DEFAULT_DOC_ID;
  const docRef = db.collection(COLLECTION).doc(docId);
  const record = extractDatabaseRecord(await docRef.get());
  const snapshot = record && isPlainObject(record.snapshot) ? record.snapshot : null;
  if (!snapshot) {
    return {
      ok: false,
      code: 'SNAPSHOT_NOT_FOUND',
      message: 'current lineup snapshot was not found'
    };
  }

  const existingRecords = Array.isArray(snapshot.attendanceData) ? snapshot.attendanceData : [];
  const deviceId = normalizeText(input.attendance && input.attendance.deviceId, MAX_DEVICE_ID_LENGTH);
  const existingRecord = existingRecords.find(item => item && item.deviceId === deviceId) || null;
  let attendance;
  try {
    attendance = await normalizeSubmittedAttendance(input.attendance, snapshot, rawEvent, input.clientInfo, existingRecord);
  } catch (error) {
    return {
      ok: false,
      code: error.code || 'INVALID_ATTENDANCE',
      message: error.message || String(error)
    };
  }

  snapshot.attendanceData = [
    attendance,
    ...existingRecords.filter(item => !item || (item.id !== attendance.id && item.deviceId !== attendance.deviceId))
  ].slice(0, MAX_ATTENDANCE_RECORDS);

  const now = new Date();
  const auth = context.auth || context.userInfo || {};
  const updatedBy = auth.uid || auth.openId || auth.openid || 'attendance-web';

  try {
    await docRef.set({
      snapshot,
      schemaVersion: record.schemaVersion || 1,
      updatedAt: now,
      updatedAtText: now.toISOString(),
      updatedBy,
      clientUpdatedAt: input.clientUpdatedAt || ''
    });
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
      updatedAt: now.toISOString(),
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
  const docRef = db.collection(COLLECTION).doc(docId);
  const record = extractDatabaseRecord(await docRef.get());
  const snapshot = record && isPlainObject(record.snapshot) ? record.snapshot : null;
  if (!snapshot) {
    return {
      ok: false,
      code: 'SNAPSHOT_NOT_FOUND',
      message: 'current lineup snapshot was not found'
    };
  }

  const existingVotes = Array.isArray(snapshot.mvpVotesData) ? snapshot.mvpVotesData : [];
  const deviceId = normalizeText(input.vote && input.vote.deviceId, MAX_DEVICE_ID_LENGTH);
  const existingVote = existingVotes.find(item => item && item.deviceId === deviceId) || null;
  let vote;
  try {
    vote = await normalizeSubmittedMvpVote(input.vote, snapshot, rawEvent, input.clientInfo, existingVote);
  } catch (error) {
    return {
      ok: false,
      code: error.code || 'INVALID_MVP_VOTE',
      message: error.message || String(error)
    };
  }

  snapshot.mvpVotesData = [
    vote,
    ...existingVotes.filter(item => !item || (item.id !== vote.id && item.deviceId !== vote.deviceId))
  ].slice(0, MAX_MVP_VOTES);

  const now = new Date();
  const auth = context.auth || context.userInfo || {};
  const updatedBy = auth.uid || auth.openId || auth.openid || 'mvp-vote-web';

  try {
    await docRef.set({
      snapshot,
      schemaVersion: record.schemaVersion || 1,
      updatedAt: now,
      updatedAtText: now.toISOString(),
      updatedBy,
      clientUpdatedAt: input.clientUpdatedAt || ''
    });
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
      updatedAt: now.toISOString(),
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
  const docRef = db.collection(COLLECTION).doc(docId);
  const record = extractDatabaseRecord(await docRef.get());
  const snapshot = record && isPlainObject(record.snapshot) ? record.snapshot : null;
  if (!snapshot) {
    return {
      ok: false,
      code: 'SNAPSHOT_NOT_FOUND',
      message: 'current lineup snapshot was not found'
    };
  }

  let review;
  try {
    review = await normalizeSubmittedReview(input.review, snapshot, rawEvent, input.clientInfo);
  } catch (error) {
    return {
      ok: false,
      code: error.code || 'INVALID_REVIEW',
      message: error.message || String(error)
    };
  }

  const existingReviews = Array.isArray(snapshot.reviewsData) ? snapshot.reviewsData : [];
  snapshot.reviewsData = [
    review,
    ...existingReviews.filter(item => !item || item.id !== review.id)
  ].slice(0, MAX_REVIEWS);

  const now = new Date();
  const auth = context.auth || context.userInfo || {};
  const updatedBy = auth.uid || auth.openId || auth.openid || 'review-web';

  try {
    await docRef.set({
      snapshot,
      schemaVersion: record.schemaVersion || 1,
      updatedAt: now,
      updatedAtText: now.toISOString(),
      updatedBy,
      clientUpdatedAt: input.clientUpdatedAt || ''
    });
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
      updatedAt: now.toISOString(),
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

  const docRef = db.collection(COLLECTION).doc(docId);
  const record = extractDatabaseRecord(await docRef.get());
  const snapshot = record && isPlainObject(record.snapshot) ? record.snapshot : null;
  if (!snapshot) {
    return {
      ok: false,
      code: 'SNAPSHOT_NOT_FOUND',
      message: 'current lineup snapshot was not found'
    };
  }
  const reviews = Array.isArray(snapshot.reviewsData) ? snapshot.reviewsData : [];
  const index = reviews.findIndex(item => item && item.id === reviewId);
  if (index < 0) {
    return {
      ok: false,
      code: 'REVIEW_NOT_FOUND',
      message: 'review was not found'
    };
  }

  let reply;
  try {
    reply = await normalizeSubmittedReviewReply(input.reply, snapshot, rawEvent, input.clientInfo);
  } catch (error) {
    return {
      ok: false,
      code: error.code || 'INVALID_REPLY',
      message: error.message || String(error)
    };
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

  const now = new Date();
  const auth = context.auth || context.userInfo || {};
  const updatedBy = auth.uid || auth.openId || auth.openid || 'review-reply-web';

  try {
    await docRef.set({
      snapshot,
      schemaVersion: record.schemaVersion || 1,
      updatedAt: now,
      updatedAtText: now.toISOString(),
      updatedBy,
      clientUpdatedAt: input.clientUpdatedAt || ''
    });
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
      updatedAt: now.toISOString(),
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
  const docId = typeof input.docId === 'string' && input.docId.trim()
    ? input.docId.trim()
    : DEFAULT_DOC_ID;
  const reviewId = String(input.reviewId || '').trim();
  const deviceId = normalizeText(input.deviceId, MAX_DEVICE_ID_LENGTH);
  if (!reviewId || !deviceId) {
    return {
      ok: false,
      code: 'INVALID_DELETE_REQUEST',
      message: 'reviewId and deviceId are required'
    };
  }

  const docRef = db.collection(COLLECTION).doc(docId);
  const record = extractDatabaseRecord(await docRef.get());
  const snapshot = record && isPlainObject(record.snapshot) ? record.snapshot : null;
  if (!snapshot) {
    return {
      ok: false,
      code: 'SNAPSHOT_NOT_FOUND',
      message: 'current lineup snapshot was not found'
    };
  }
  const reviews = Array.isArray(snapshot.reviewsData) ? snapshot.reviewsData : [];
  const review = reviews.find(item => item && item.id === reviewId);
  if (!review) {
    return {
      ok: false,
      code: 'REVIEW_NOT_FOUND',
      message: 'review was not found'
    };
  }
  if (String(review.deviceId || '') !== deviceId) {
    return {
      ok: false,
      code: 'DELETE_FORBIDDEN',
      message: 'only the original device can delete this review'
    };
  }
  const createdAt = new Date(review.createdAt || 0).getTime();
  const deleteUntil = new Date(review.deleteUntil || (Number.isFinite(createdAt) ? createdAt + REVIEW_DELETE_WINDOW_MS : 0)).getTime();
  if (!Number.isFinite(deleteUntil) || Date.now() > deleteUntil) {
    return {
      ok: false,
      code: 'DELETE_EXPIRED',
      message: 'review delete window has expired'
    };
  }

  snapshot.reviewsData = reviews.filter(item => !item || item.id !== reviewId).slice(0, MAX_REVIEWS);
  const now = new Date();
  const auth = context.auth || context.userInfo || {};
  const updatedBy = auth.uid || auth.openId || auth.openid || 'review-delete-web';

  try {
    await docRef.set({
      snapshot,
      schemaVersion: record.schemaVersion || 1,
      updatedAt: now,
      updatedAtText: now.toISOString(),
      updatedBy,
      clientUpdatedAt: input.clientUpdatedAt || ''
    });
    console.log('deleteReview saved', {
      docId,
      reviewId
    });
    return {
      ok: true,
      docId,
      reviewId,
      updatedAt: now.toISOString(),
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
  const docId = typeof input.docId === 'string' && input.docId.trim()
    ? input.docId.trim()
    : DEFAULT_DOC_ID;
  const reviewId = String(input.reviewId || '').trim();
  const replyId = String(input.replyId || '').trim();
  const deviceId = normalizeText(input.deviceId, MAX_DEVICE_ID_LENGTH);
  if (!reviewId || !replyId || !deviceId) {
    return {
      ok: false,
      code: 'INVALID_DELETE_REPLY_REQUEST',
      message: 'reviewId, replyId, and deviceId are required'
    };
  }

  const docRef = db.collection(COLLECTION).doc(docId);
  const record = extractDatabaseRecord(await docRef.get());
  const snapshot = record && isPlainObject(record.snapshot) ? record.snapshot : null;
  if (!snapshot) {
    return {
      ok: false,
      code: 'SNAPSHOT_NOT_FOUND',
      message: 'current lineup snapshot was not found'
    };
  }
  const reviews = Array.isArray(snapshot.reviewsData) ? snapshot.reviewsData : [];
  const reviewIndex = reviews.findIndex(item => item && item.id === reviewId);
  if (reviewIndex < 0) {
    return {
      ok: false,
      code: 'REVIEW_NOT_FOUND',
      message: 'review was not found'
    };
  }

  const review = isPlainObject(reviews[reviewIndex]) ? reviews[reviewIndex] : {};
  const replies = Array.isArray(review.replies) ? review.replies : [];
  const reply = replies.find(item => item && item.id === replyId);
  if (!reply) {
    return {
      ok: false,
      code: 'REPLY_NOT_FOUND',
      message: 'reply was not found'
    };
  }
  if (String(reply.deviceId || '') !== deviceId) {
    return {
      ok: false,
      code: 'DELETE_FORBIDDEN',
      message: 'only the original device can delete this reply'
    };
  }
  const createdAt = new Date(reply.createdAt || 0).getTime();
  const deleteUntil = new Date(reply.deleteUntil || (Number.isFinite(createdAt) ? createdAt + REVIEW_DELETE_WINDOW_MS : 0)).getTime();
  if (!Number.isFinite(deleteUntil) || Date.now() > deleteUntil) {
    return {
      ok: false,
      code: 'DELETE_EXPIRED',
      message: 'reply delete window has expired'
    };
  }

  reviews[reviewIndex] = {
    ...review,
    replies: replies.filter(item => !item || item.id !== replyId).slice(-MAX_REVIEW_REPLIES)
  };
  snapshot.reviewsData = reviews.slice(0, MAX_REVIEWS);
  const now = new Date();
  const auth = context.auth || context.userInfo || {};
  const updatedBy = auth.uid || auth.openId || auth.openid || 'reply-delete-web';

  try {
    await docRef.set({
      snapshot,
      schemaVersion: record.schemaVersion || 1,
      updatedAt: now,
      updatedAtText: now.toISOString(),
      updatedBy,
      clientUpdatedAt: input.clientUpdatedAt || ''
    });
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
      updatedAt: now.toISOString(),
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

function fetchImageBuffer(url, redirects = 3) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch (error) {
      reject(new Error('invalid image url'));
      return;
    }

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      reject(new Error('unsupported image url protocol'));
      return;
    }

    const client = parsed.protocol === 'https:' ? https : http;
    const request = client.get(parsed, {
      timeout: 10000,
      headers: {
        'User-Agent': 'laohe-wings-lineup-export/1.0',
        'Accept': 'image/*,*/*;q=0.8'
      }
    }, response => {
      const status = response.statusCode || 0;
      if ([301, 302, 303, 307, 308].includes(status) && response.headers.location && redirects > 0) {
        response.resume();
        const nextUrl = new URL(response.headers.location, parsed).href;
        fetchImageBuffer(nextUrl, redirects - 1).then(resolve, reject);
        return;
      }
      if (status < 200 || status >= 300) {
        response.resume();
        reject(new Error(`image request failed: HTTP ${status}`));
        return;
      }
      const chunks = [];
      let size = 0;
      response.on('data', chunk => {
        size += chunk.length;
        if (size > MAX_PROXY_IMAGE_BYTES) {
          request.destroy(new Error('image is too large'));
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => {
        resolve({
          buffer: Buffer.concat(chunks),
          contentType: String(response.headers['content-type'] || 'image/jpeg').split(';')[0]
        });
      });
    });
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
  if (fileID) {
    try {
      url = await getCloudTempFileURL(app, fileID) || url;
    } catch (error) {
      console.warn('proxyImage getTempFileURL failed', {
        fileID,
        message: error && error.message
      });
    }
  }
  if (!url) {
    return {
      ok: false,
      code: 'INVALID_IMAGE_URL',
      message: 'url or fileID is required'
    };
  }
  try {
    const { buffer, contentType } = await fetchImageBuffer(url);
    const safeType = /^image\//i.test(contentType) ? contentType : 'image/jpeg';
    return {
      ok: true,
      contentType: safeType,
      dataUrl: `data:${safeType};base64,${buffer.toString('base64')}`
    };
  } catch (error) {
    console.error('proxyImage failed', {
      url,
      message: error && error.message
    });
    return {
      ok: false,
      code: 'IMAGE_PROXY_FAILED',
      message: error && error.message ? error.message : String(error)
    };
  }
}

exports.main = async (event = {}, context = {}) => {
  const input = normalizeEvent(event);
  const app = initCloudBaseApp(context);
  if (input.action === 'proxyImage') {
    return proxyImage(input, app);
  }
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
  const docId = typeof input.docId === 'string' && input.docId.trim()
    ? input.docId.trim()
    : DEFAULT_DOC_ID;
  const snapshot = input.snapshot;
  const invalidReason = validateSnapshot(snapshot);

  if (invalidReason) {
    return {
      ok: false,
      code: 'INVALID_SNAPSHOT',
      message: invalidReason
    };
  }

  const now = new Date();
  const auth = context.auth || context.userInfo || {};
  const updatedBy = auth.uid || auth.openId || auth.openid || 'anonymous-web';

  try {
    const result = await db.collection(COLLECTION).doc(docId).set({
      snapshot,
      schemaVersion: 1,
      updatedAt: now,
      updatedAtText: now.toISOString(),
      updatedBy,
      clientUpdatedAt: input.clientUpdatedAt || ''
    });

    console.log('publishLineup saved', {
      docId,
      updatedBy,
      result
    });

    return {
      ok: true,
      docId,
      updatedAt: now.toISOString(),
      functionVersion: FUNCTION_VERSION
    };
  } catch (error) {
    console.error('publishLineup failed', {
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
};

const ACTIVE_PROFILE = LaoheCompetition.getProfile(location.search);
const PLAYER_COUNT = ACTIVE_PROFILE.matchFormat;
// ============================================================
// 阵容数据 —— 每场比赛只需要修改这一段
// ============================================================
let SQUAD_DATA = { starters: [], bench: [] };
let COACH_DATA = {
  show: true,
  num: '3',
  posLabel: 'COACH',
  name: '陈炫',
  role: '教练',
  avatar: ''
};
let MANAGER_DATA = {
  show: true,
  num: '·',
  posLabel: 'MGR',
  name: '许俊秋',
  role: '领队',
  avatar: ''
};
const TEAM_DATA = {
  logo: '',
  logoHome: '',
  logoAway: ''
};
let LEGENDS_DATA = [];
const DEFAULT_PRESET_NAME = `${ACTIVE_PROFILE.name} 默认阵容`;
let CARD_INTROS = {};
let REVIEWS_DATA = [];
let ATTENDANCE_DATA = [];
let MVP_VOTES_DATA = [];
const EXTRA_DRAW_CARDS = [
  {
    num: '∞',
    name: '王泊乔',
    pos: 'ST',
    role: '航院大前锋 · 抽象',
    cardType: 'unbelievable',
    avatarHome: 'assets/special/wang-boqiao.jpg?v=20260512',
    avatarAway: 'assets/special/wang-boqiao.jpg?v=20260512',
    stats: { goals: 0, assists: 0, appearances: 0 },
    status: 'fit',
    intro: '航院重量级人物，人送外号“抽象”。禁区里不一定每次都按常规物理运行，但只要他起脚，所有人都会先暂停半秒，确认这球到底算射门、传球，还是一次大型空气动力学实验。'
  }
];
const PLAYER_DATA_URL = 'data/players.json';
const INLINE_PLAYER_DATA = LaoheCompetition.buildPlayerData(ACTIVE_PROFILE, window.LAOHE_PLAYER_DATA);
const DEFAULT_CAPTAIN_NAME = ACTIVE_PROFILE.captain;
const DEFAULT_FORMATION = ACTIVE_PROFILE.defaultFormation;
const LEGACY_NAME_MAP = {
  '徐俊秋': '许俊秋',
  '黄坤鱼': '黄焜宇',
  '黄坤宇': '黄焜宇',
  '黄煜宇': '黄焜宇',
  '黄于狒': '黄于翀',
  '晏世洲': '樊世洲'
};

const FORMATIONS = {
  ...LaoheCompetition.formations8,
  '433': {
    label: '4-3-3',
    slots: [
      { playerIndex: 0, coord: [20, 18], pos: 'LW', role: '左边锋' },
      { playerIndex: 1, coord: [50, 14], pos: 'ST', role: '中锋' },
      { playerIndex: 2, coord: [80, 18], pos: 'RW', role: '右边锋' },
      { playerIndex: 3, coord: [25, 40], pos: 'CM', role: '中场' },
      { playerIndex: 4, coord: [50, 42], pos: 'CAM', role: '前腰' },
      { playerIndex: 5, coord: [75, 40], pos: 'CM', role: '中场' },
      { playerIndex: 6, coord: [13, 64], pos: 'LB', role: '左后卫' },
      { playerIndex: 7, coord: [37, 66], pos: 'CB', role: '中后卫' },
      { playerIndex: 8, coord: [63, 66], pos: 'CB', role: '中后卫' },
      { playerIndex: 9, coord: [87, 64], pos: 'RB', role: '右后卫' },
      { playerIndex: 10, coord: [50, 87], pos: 'GK', role: '门将' }
    ]
  },
  '442': {
    label: '4-4-2',
    slots: [
      { playerIndex: 0, coord: [35, 18], pos: 'ST', role: '前锋' },
      { playerIndex: 1, coord: [65, 18], pos: 'ST', role: '前锋' },
      { playerIndex: 2, coord: [13, 40], pos: 'LM', role: '左前卫' },
      { playerIndex: 3, coord: [37, 42], pos: 'CM', role: '中场' },
      { playerIndex: 4, coord: [63, 42], pos: 'CM', role: '中场' },
      { playerIndex: 5, coord: [87, 40], pos: 'RM', role: '右前卫' },
      { playerIndex: 6, coord: [13, 64], pos: 'LB', role: '左后卫' },
      { playerIndex: 7, coord: [37, 66], pos: 'CB', role: '中后卫' },
      { playerIndex: 8, coord: [63, 66], pos: 'CB', role: '中后卫' },
      { playerIndex: 9, coord: [87, 64], pos: 'RB', role: '右后卫' },
      { playerIndex: 10, coord: [50, 87], pos: 'GK', role: '门将' }
    ]
  },
  '352': {
    label: '3-5-2',
    slots: [
      { playerIndex: 0, coord: [35, 16], pos: 'ST', role: '前锋' },
      { playerIndex: 1, coord: [65, 16], pos: 'ST', role: '前锋' },
      { playerIndex: 2, coord: [10, 40], pos: 'LWB', role: '左翼卫' },
      { playerIndex: 3, coord: [30, 41], pos: 'CM', role: '中场' },
      { playerIndex: 4, coord: [50, 39], pos: 'CAM', role: '前腰' },
      { playerIndex: 5, coord: [70, 41], pos: 'CM', role: '中场' },
      { playerIndex: 9, coord: [90, 40], pos: 'RWB', role: '右翼卫' },
      { playerIndex: 6, coord: [25, 64], pos: 'LCB', role: '左中卫' },
      { playerIndex: 7, coord: [50, 64], pos: 'CB', role: '中后卫' },
      { playerIndex: 8, coord: [75, 64], pos: 'RCB', role: '右中卫' },
      { playerIndex: 10, coord: [50, 88.5], pos: 'GK', role: '门将' }
    ]
  },
  '4231': {
    label: '4-2-3-1',
    slots: [
      { playerIndex: 1, coord: [50, 11], pos: 'ST', role: '中锋' },
      { playerIndex: 0, coord: [20, 33], pos: 'LW', role: '左边锋' },
      { playerIndex: 4, coord: [50, 33], pos: 'CAM', role: '前腰' },
      { playerIndex: 2, coord: [80, 33], pos: 'RW', role: '右边锋' },
      { playerIndex: 3, coord: [35, 51], pos: 'DM', role: '后腰（左）' },
      { playerIndex: 5, coord: [65, 51], pos: 'DM', role: '后腰（右）' },
      { playerIndex: 6, coord: [13, 71], pos: 'LB', role: '左边卫' },
      { playerIndex: 7, coord: [37, 71], pos: 'CB', role: '中后卫（左）' },
      { playerIndex: 8, coord: [63, 71], pos: 'CB', role: '中后卫（右）' },
      { playerIndex: 9, coord: [87, 71], pos: 'RB', role: '右边卫' },
      { playerIndex: 10, coord: [50, 89.5], pos: 'GK', role: '门将' }
    ]
  }
};

const SVG_AVATAR = `
<svg viewBox="0 0 88 100" preserveAspectRatio="xMidYMax meet">
  <ellipse cx="44" cy="32" rx="17" ry="19" fill="#e8c9a0"/>
  <path d="M 26 28 Q 28 12 44 11 Q 60 12 62 28 Q 62 22 56 18 Q 48 14 44 14 Q 40 14 32 18 Q 26 22 26 28 Z" fill="#1a1a1a"/>
  <rect x="38" y="46" width="12" height="8" fill="#d4a878"/>
  <path d="M 6 100 L 6 66 Q 18 56 32 52 L 56 52 Q 70 56 82 66 L 82 100 Z" fill="currentColor"/>
  <path d="M 32 52 L 44 60 L 56 52 L 56 56 L 44 64 L 32 56 Z" fill="rgba(0,0,0,0.25)"/>
</svg>
`;

const COACH_SVG_AVATAR = SVG_AVATAR.replace('fill="currentColor"', 'fill="#2a2a2a"');

// ============================================================
// 状态与工具
// ============================================================
const STORAGE_KEYS = {
  lastState: ACTIVE_PROFILE.id === 'legacy-11' ? 'laohe-lineup-v9-last-state' : `laohe-${ACTIVE_PROFILE.id}-last-state`,
  presets: ACTIVE_PROFILE.id === 'legacy-11' ? 'laohe-lineup-v9-presets' : `laohe-${ACTIVE_PROFILE.id}-presets`,
  reviewIdentity: ACTIVE_PROFILE.id === 'legacy-11' ? 'laohe-lineup-review-identity' : 'laohe-lineup-review-identity-' + ACTIVE_PROFILE.id,
  reviewMode: ACTIVE_PROFILE.id === 'legacy-11' ? 'laohe-lineup-review-mode' : 'laohe-lineup-review-mode-' + ACTIVE_PROFILE.id,
  reviewDeviceId: 'laohe-lineup-review-device-id',
  teamPlayIdentity: ACTIVE_PROFILE.id === 'legacy-11' ? 'laohe-lineup-team-play-identity' : 'laohe-lineup-team-play-identity-' + ACTIVE_PROFILE.id,
  legacyLastStateV8: 'laohe-lineup-v8-last-state',
  legacyPresetsV8: 'laohe-lineup-v8-presets',
  legacyLastStateV7: 'laohe-lineup-v7-last-state',
  legacyPresetsV7: 'laohe-lineup-v7-presets',
  legacyLastStateV6: 'laohe-lineup-v6-last-state',
  legacyPresetsV6: 'laohe-lineup-v6-presets',
  legacyLastState: 'laohe-lineup-v4-last-state',
  legacyPresets: 'laohe-lineup-v4-presets',
  legacyLastStateV5: 'laohe-lineup-v5-last-state',
  legacyPresetsV5: 'laohe-lineup-v5-presets',
  legacyLastStateV3: 'laohe-lineup-v3-last-state',
  legacyPresetsV3: 'laohe-lineup-v3-presets'
};

const CLOUDBASE_CONFIG = {
  enabled: false,
  envId: '',
  region: 'ap-shanghai',
  collection: 'lineups',
  currentDocId: 'current',
  publishFunction: 'publishLineup',
  publishHttpPath: 'https://laohe-wings-lineup-d3cz65831519b-1429692601.ap-shanghai.app.tcloudbase.com/api/publishLineup',
  publishFunctionType: 'auto',
  publishFunctionPath: '/',
  sdkUrl: 'https://static.cloudbase.net/cloudbase-js-sdk/latest/cloudbase.full.js',
  cloudHosts: [],
  ...(window.LAOHE_CLOUDBASE_CONFIG || {}),
  currentDocId: ACTIVE_PROFILE.docId
};

// Local editing is an explicit UI mode. Cloud editing always verifies EDIT_SECRET on the server.
const EDIT_SESSION_KEY = 'laohe-lineup-edit-unlocked';
const EDIT_TOKEN_KEY = 'laohe-lineup-edit-token';
const REVIEW_MODE_TEAM = 'team';
const REVIEW_MODE_FRIEND = 'friend';
const REVIEW_DELETE_WINDOW_MS = 10 * 60 * 1000;
const MAX_REVIEW_ATTACHMENTS = 6;
const CLOUD_IMAGE_REFERENCE_TTL_MS = 5 * 60 * 1000;
const ATTENDANCE_STATUS_META = {
  in: { label: '到场', className: 'is-in' },
  out: { label: '请假', className: 'is-out' },
  maybe: { label: '待定', className: 'is-maybe' }
};

const cloudSyncState = {
  initialized: false,
  initializing: false,
  applyingRemote: false,
  app: null,
  db: null,
  documentRef: null,
  watcher: null,
  remoteSnapshot: null,
  latestRemoteRecord: null,
  baseUpdatedAt: '',
  localDirty: false,
  publishing: false,
  publishTimer: null,
  lastError: ''
};

let currentFormation = DEFAULT_FORMATION;
let currentKit = PLAYER_COUNT === 8 ? 'away' : 'home';
let currentShowStats = PLAYER_COUNT === 11;
let reportLink = '';
let saveTimer = null;
let html5DragBenchIndex = null;
let html5DragStarterIndex = null;
let html5DragCandidateValue = null;
let pointerDrag = null;
let pointerDragStarter = null;
let currentDrawnPlayer = null;
let currentExportObjectUrl = '';
let editUnlocked = sessionStorage.getItem(EDIT_SESSION_KEY) === 'true';
let editToken = sessionStorage.getItem(EDIT_TOKEN_KEY) || '';
let currentReviewMode = localStorage.getItem(STORAGE_KEYS.reviewMode) || REVIEW_MODE_FRIEND;
let pendingReviewAttachmentFiles = [];
const pendingReplyAttachmentFiles = new Map();
const cloudImageUrlCache = new Map();
const cloudImageFileIdByUrl = new Map();
const pendingCloudImageRefreshes = new Set();

const poster = document.getElementById('poster');
const posterStage = document.getElementById('poster-stage');
const pitch = document.getElementById('pitch');
const benchGrid = document.getElementById('bench-grid');
const legendsGrid = document.getElementById('legends-grid');
const formationDisplay = document.getElementById('formation-display');
const teamLogo = document.getElementById('team-logo');
const teamLogoUploadBtn = document.getElementById('team-logo-upload-btn');
const teamLogoClearBtn = document.getElementById('team-logo-clear-btn');
const photoManager = document.getElementById('photo-manager');
const presetSelect = document.getElementById('preset-select');
const savePresetBtn = document.getElementById('save-preset-btn');
const deletePresetBtn = document.getElementById('delete-preset-btn');
const exportJsonBtn = document.getElementById('export-json-btn');
const editPasswordInput = document.getElementById('edit-password-input');
const unlockEditBtn = document.getElementById('unlock-edit-btn');
const lockEditBtn = document.getElementById('lock-edit-btn');
const editStatus = document.getElementById('edit-status');
const syncStatus = document.getElementById('sync-status');
const publishCloudBtn = document.getElementById('publish-cloud-btn');
const exportPngBtn = document.getElementById('export-png-btn');
const starterSlotSelect = document.getElementById('starter-slot-select');
const benchPlayerSelect = document.getElementById('bench-player-select');
const swapStarterBtn = document.getElementById('swap-starter-btn');
const reportLinkInput = document.getElementById('report-link-input');
const reportQr = document.getElementById('report-qr');
const qrBox = document.getElementById('qr-box');
const coachShowInput = document.getElementById('coach-show-input');
const coachNumInput = document.getElementById('coach-num-input');
const coachPosInput = document.getElementById('coach-pos-input');
const coachNameInput = document.getElementById('coach-name-input');
const coachRoleInput = document.getElementById('coach-role-input');
const coachUploadHomeBtn = document.getElementById('coach-upload-home-btn');
const coachUploadAwayBtn = document.getElementById('coach-upload-away-btn');
const coachClearBtn = document.getElementById('coach-clear-btn');
const managerShowInput = document.getElementById('manager-show-input');
const managerNumInput = document.getElementById('manager-num-input');
const managerPosInput = document.getElementById('manager-pos-input');
const managerNameInput = document.getElementById('manager-name-input');
const managerRoleInput = document.getElementById('manager-role-input');
const managerUploadHomeBtn = document.getElementById('manager-upload-home-btn');
const managerUploadAwayBtn = document.getElementById('manager-upload-away-btn');
const managerClearBtn = document.getElementById('manager-clear-btn');
const randomDrawBtn = document.getElementById('random-draw-btn');
const drawCard = document.getElementById('draw-card');
const attendancePlayerSelect = document.getElementById('attendance-player-select');
const attendanceStatusSelect = document.getElementById('attendance-status-select');
const attendanceNicknameInput = document.getElementById('attendance-nickname-input');
const attendanceSubmitBtn = document.getElementById('attendance-submit-btn');
const attendanceStatus = document.getElementById('attendance-status');
const attendanceSummary = document.getElementById('attendance-summary');
const mvpTargetSelect = document.getElementById('mvp-target-select');
const mvpFamiliarNumInput = document.getElementById('mvp-familiar-num-input');
const mvpNicknameInput = document.getElementById('mvp-nickname-input');
const mvpSubmitBtn = document.getElementById('mvp-submit-btn');
const mvpStatus = document.getElementById('mvp-status');
const mvpSummary = document.getElementById('mvp-summary');
const reviewTargetSelect = document.getElementById('review-target-select');
const reviewForm = document.querySelector('.review-form');
const reviewModeTeamBtn = document.getElementById('review-mode-team-btn');
const reviewModeFriendBtn = document.getElementById('review-mode-friend-btn');
const reviewModeNote = document.getElementById('review-mode-note');
const reviewerNumInput = document.getElementById('reviewer-num-input');
const reviewerNumLabel = document.getElementById('reviewer-num-label');
const reviewerNameField = document.getElementById('reviewer-name-field');
const reviewerNameInput = document.getElementById('reviewer-name-input');
const reviewRatingSelect = document.getElementById('review-rating-select');
const reviewCommentInput = document.getElementById('review-comment-input');
const reviewSubmitBtn = document.getElementById('review-submit-btn');
const reviewImageBtn = document.getElementById('review-image-btn');
const reviewImageClearBtn = document.getElementById('review-image-clear-btn');
const reviewImageStatus = document.getElementById('review-image-status');
const reviewStatus = document.getElementById('review-status');
const reviewSummary = document.getElementById('review-summary');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const localStorageAdapter = {
  name: 'local',
  readJson(key, fallback) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  },
  writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  },
  readLastState() {
    return this.readJson(STORAGE_KEYS.lastState, null);
  },
  writeLastState(snapshot) {
    return this.writeJson(STORAGE_KEYS.lastState, snapshot);
  },
  readPresets() {
    if (ACTIVE_PROFILE.id !== 'legacy-11') return this.readJson(STORAGE_KEYS.presets, {});
    return {
      ...this.readJson(STORAGE_KEYS.legacyPresetsV3, {}),
      ...this.readJson(STORAGE_KEYS.legacyPresets, {}),
      ...this.readJson(STORAGE_KEYS.legacyPresetsV5, {}),
      ...this.readJson(STORAGE_KEYS.legacyPresetsV6, {}),
      ...this.readJson(STORAGE_KEYS.legacyPresetsV7, {}),
      ...this.readJson(STORAGE_KEYS.presets, {})
    };
  },
  readWritablePresets() {
    return this.readJson(STORAGE_KEYS.presets, {});
  },
  writePresets(presets) {
    return this.writeJson(STORAGE_KEYS.presets, presets);
  }
};

const cloudStorageAdapter = {
  name: 'cloudbase',
  readJson(key, fallback) {
    return localStorageAdapter.readJson(key, fallback);
  },
  writeJson(key, value) {
    return localStorageAdapter.writeJson(key, value);
  },
  readLastState() {
    return cloudSyncState.remoteSnapshot || localStorageAdapter.readLastState();
  },
  writeLastState(snapshot) {
    const saved = localStorageAdapter.writeLastState(snapshot);
    queueCloudPublish(snapshot);
    return saved;
  },
  readPresets() {
    return localStorageAdapter.readPresets();
  },
  readWritablePresets() {
    return localStorageAdapter.readWritablePresets();
  },
  writePresets(presets) {
    return localStorageAdapter.writePresets(presets);
  }
};

let activeStorageAdapter = localStorageAdapter;

function setStorageAdapter(adapter = localStorageAdapter) {
  activeStorageAdapter = adapter || localStorageAdapter;
}

function canEdit() {
  return editUnlocked === true;
}

function lockEditing() {
  editUnlocked = false;
  editToken = '';
  sessionStorage.removeItem(EDIT_SESSION_KEY);
  sessionStorage.removeItem(EDIT_TOKEN_KEY);
  if (editPasswordInput) editPasswordInput.value = '';
  renderPhotoManager();
  updateControls();
}

function setEditUnlocked(value) {
  editUnlocked = true;
  editToken = value;
  sessionStorage.setItem(EDIT_SESSION_KEY, 'true');
  sessionStorage.setItem(EDIT_TOKEN_KEY, value);
  if (editPasswordInput) editPasswordInput.value = '';
  renderPhotoManager();
  updateControls();
}

function isCloudPublishReady() {
  return Boolean(isCloudBaseSyncHost() && cloudSyncState.initialized && CLOUDBASE_CONFIG.publishFunction);
}

async function unlockEditing() {
  if (!isCloudBaseSyncHost()) {
    setEditUnlocked('');
    return;
  }
  if (!isCloudPublishReady()) {
    updateSyncStatus('error', '云端尚未连接，暂不能校验编辑口令');
    return;
  }
  const value = editPasswordInput?.value.trim() || '';
  const showFail = (msg) => {
    if (editStatus) {
      editStatus.textContent = msg;
      editStatus.classList.remove('is-unlocked');
    }
  };
  if (!value) {
    showFail('请输入口令');
    return;
  }

  if (isCloudPublishReady()) {
    // 线上：口令交由云函数用服务端 EDIT_SECRET 校验（客户端不保存真正的秘钥）。
    if (editStatus) editStatus.textContent = '正在校验口令...';
    try {
      const { response } = await callPublishFunction({ action: 'verifyEditToken', editToken: value });
      const result = normalizePublishResult(response);
      if (result && result.ok) {
        setEditUnlocked(value);
        return;
      }
      if (result && result.configured === false) {
        showFail('服务端未配置 EDIT_SECRET，暂无法解锁云端编辑');
        return;
      }
      showFail('口令不对');
      return;
    } catch (error) {
      console.warn('verifyEditToken failed:', error);
      showFail('云端校验失败，请连接恢复后重试');
      return;
    }
  }

}

function updateEditMode() {
  const unlocked = canEdit();
  starterSlotSelect.closest('.control-row').hidden = !unlocked;
  document.body.classList.toggle('readonly-mode', !unlocked);
  if (editStatus) {
    editStatus.textContent = unlocked ? '编辑模式已解锁' : '只读模式';
    editStatus.classList.toggle('is-unlocked', unlocked);
  }
  if (editPasswordInput) editPasswordInput.hidden = unlocked || !isCloudBaseSyncHost();
  if (unlockEditBtn) unlockEditBtn.textContent = isCloudBaseSyncHost() ? '解锁编辑' : '编辑本机草稿';
  if (unlockEditBtn) unlockEditBtn.hidden = unlocked;
  if (lockEditBtn) lockEditBtn.hidden = !unlocked;
  document.querySelectorAll('[contenteditable]').forEach(el => {
    el.contentEditable = unlocked ? 'true' : 'false';
  });
  document.querySelectorAll('.player-card, [data-swap-value]').forEach(card => {
    card.draggable = unlocked;
  });
  if (!unlocked) {
    document.querySelectorAll('.photo-manager input, .photo-manager select, .photo-manager button').forEach(el => {
      el.disabled = true;
    });
  }
  [
    teamLogoUploadBtn,
    reportLinkInput,
    savePresetBtn,
    starterSlotSelect,
    benchPlayerSelect,
    swapStarterBtn,
    coachShowInput,
    coachNumInput,
    coachPosInput,
    coachNameInput,
    coachRoleInput,
    document.getElementById('coach-status-input'),
    document.getElementById('restore-default-lineup'),
    coachUploadHomeBtn,
    coachUploadAwayBtn,
    managerShowInput,
    managerNumInput,
    managerPosInput,
    managerNameInput,
    managerRoleInput,
    managerUploadHomeBtn,
    managerUploadAwayBtn
  ].forEach(el => {
    if (el) el.disabled = !unlocked;
  });
  if (deletePresetBtn) deletePresetBtn.disabled = !unlocked || !presetSelect.value;
  if (teamLogoClearBtn) teamLogoClearBtn.disabled = !unlocked || (!TEAM_DATA.logo && !TEAM_DATA.logoHome && !TEAM_DATA.logoAway);
  if (coachClearBtn) coachClearBtn.disabled = !unlocked || (!COACH_DATA.avatar && !COACH_DATA.avatarHome && !COACH_DATA.avatarAway);
  if (managerClearBtn) managerClearBtn.disabled = !unlocked || (!MANAGER_DATA.avatar && !MANAGER_DATA.avatarHome && !MANAGER_DATA.avatarAway);
  if (publishCloudBtn) publishCloudBtn.hidden = !(unlocked && cloudSyncState.initialized && isCloudBaseSyncHost());
  renderReviewTool();
}

function isCloudBaseSyncHost() {
  const hosts = Array.isArray(CLOUDBASE_CONFIG.cloudHosts) ? CLOUDBASE_CONFIG.cloudHosts : [];
  return Boolean(
    CLOUDBASE_CONFIG.enabled &&
    CLOUDBASE_CONFIG.envId &&
    location.protocol !== 'file:' &&
    hosts.includes(location.hostname)
  );
}

function updateSyncStatus(state = 'local', message = '') {
  if (!syncStatus) return;
  const text = message || (state === 'local' ? '本地模式' : '云端同步');
  syncStatus.dataset.state = state;
  syncStatus.textContent = text;
  if (publishCloudBtn) {
    publishCloudBtn.hidden = !(canEdit() && cloudSyncState.initialized && isCloudBaseSyncHost());
    publishCloudBtn.disabled = state === 'loading' || state === 'saving';
  }
}

function getCloudErrorMessage(error) {
  if (!error) return '未知错误';
  if (typeof error === 'string') return error;
  const parts = [];
  if (error.code) parts.push(error.code);
  if (error.message) parts.push(error.message);
  if (error.requestId) parts.push(`requestId=${error.requestId}`);
  if (!parts.length && error.errMsg) parts.push(error.errMsg);
  return parts.join(' · ') || String(error);
}

function isMobileExportContext() {
  return window.matchMedia('(max-width: 820px)').matches ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
}

function compactStatusMessage(prefix, detail) {
  const text = String(detail || '').trim();
  if (!text) return prefix;
  return `${prefix}：${text.length > 42 ? `${text.slice(0, 42)}...` : text}`;
}

function loadCloudBaseSdk() {
  if (window.cloudbase) return Promise.resolve(window.cloudbase);
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-cloudbase-sdk="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.cloudbase), { once: true });
      existingScript.addEventListener('error', reject, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = CLOUDBASE_CONFIG.sdkUrl;
    script.async = true;
    script.dataset.cloudbaseSdk = 'true';
    script.onload = () => window.cloudbase ? resolve(window.cloudbase) : reject(new Error('CloudBase SDK loaded without global cloudbase'));
    script.onerror = () => reject(new Error('CloudBase SDK 加载失败'));
    document.head.appendChild(script);
  });
}

async function signInCloudBase(app) {
  const authApi = app && app.auth;
  if (!authApi) return null;
  if (typeof authApi.signInAnonymously === 'function') {
    const result = await authApi.signInAnonymously();
    if (result && result.error) throw new Error(result.error.message || result.error.code || '匿名登录失败');
    return result;
  }
  if (typeof authApi === 'function') {
    let auth;
    try {
      auth = authApi.call(app, { persistence: 'local' });
    } catch (error) {
      auth = authApi.call(app);
    }
    if (auth && typeof auth.signInAnonymously === 'function') {
      return auth.signInAnonymously();
    }
    if (auth && typeof auth.anonymousAuthProvider === 'function') {
      return auth.anonymousAuthProvider().signIn();
    }
  }
  return null;
}

function normalizeCloudRecord(record) {
  if (!record) return null;
  if (typeof record.data === 'function') return record.data();
  return record;
}

function extractCloudRecord(response) {
  if (!response) return null;
  if (Array.isArray(response.data)) return normalizeCloudRecord(response.data[0]);
  if (response.data && typeof response.data === 'object') return normalizeCloudRecord(response.data);
  if (Array.isArray(response.docs)) return normalizeCloudRecord(response.docs[0]);
  if (Array.isArray(response.docChanges)) {
    const change = response.docChanges.find(item => item && (item.doc || item.data));
    return normalizeCloudRecord(change && (change.doc || change.data));
  }
  if (response.snapshot && Array.isArray(response.snapshot.docs)) {
    return normalizeCloudRecord(response.snapshot.docs[0]);
  }
  return normalizeCloudRecord(response);
}

function extractCloudSnapshot(record) {
  const source = normalizeCloudRecord(record);
  if (!source || typeof source !== 'object') return null;
  const candidate = source.snapshot && typeof source.snapshot === 'object' ? source.snapshot : source;
  if (!candidate || typeof candidate !== 'object') return null;
  return candidate.squadData && candidate.formation ? candidate : null;
}

function shouldApplyRemoteSnapshot(nextSnapshot) {
  if (!nextSnapshot) return false;
  const current = JSON.stringify(cloudSyncState.remoteSnapshot || null);
  return JSON.stringify(nextSnapshot) !== current;
}

function cloudDraftKey() {
  return `laohe-${ACTIVE_PROFILE.id}-draft`;
}

// Interactions have independent server mutations and are not part of a tactical draft.
function tacticalSnapshotJson(snapshot) {
  if (!snapshot) return '';
  const { reviewsData, attendanceData, mvpVotesData, ...tactics } = snapshot;
  return JSON.stringify(tactics);
}

function isCurrentWorkspaceSnapshot(snapshot) {
  return Boolean(snapshot && snapshot.squadData &&
    Array.isArray(snapshot.squadData.starters) &&
    Array.isArray(snapshot.squadData.bench) &&
    snapshot.squadData.starters.length === PLAYER_COUNT &&
    (snapshot.workspaceId || 'legacy-11') === ACTIVE_PROFILE.id &&
    (!snapshot.matchFormat || snapshot.matchFormat === PLAYER_COUNT));
}

function persistCloudDraft(snapshot = createSnapshot()) {
  localStorageAdapter.writeJson(cloudDraftKey(), {
    snapshot: clone(snapshot),
    baseUpdatedAt: cloudSyncState.baseUpdatedAt
  });
}

function rememberCloudRecord(record) {
  const snapshot = extractCloudSnapshot(record);
  if (!isCurrentWorkspaceSnapshot(snapshot)) return null;
  const next = { snapshot: clone(snapshot), updatedAtText: String(record?.updatedAtText || '') };
  const previous = cloudSyncState.latestRemoteRecord;
  // Backend timestamps are strictly increasing ISO strings. An older read or
  // delayed watch callback must never move the accepted version backwards.
  if (previous && previous.updatedAtText > next.updatedAtText) return previous;
  cloudSyncState.latestRemoteRecord = next;
  return next;
}

async function fetchLatestCloudRecord() {
  if (!cloudSyncState.documentRef) return null;
  const result = await cloudSyncState.documentRef.get();
  const record = extractCloudRecord(result);
  return rememberCloudRecord(record);
}

async function readCloudSnapshot({ discardDraft = false } = {}) {
  const record = await fetchLatestCloudRecord();
  if (!record) return null;
  if (!cloudSyncState.localDirty || discardDraft) {
    cloudSyncState.baseUpdatedAt = record.updatedAtText;
    cloudSyncState.remoteSnapshot = clone(record.snapshot);
    localStorageAdapter.writeLastState(record.snapshot);
    if (discardDraft) {
      cloudSyncState.localDirty = false;
      localStorage.removeItem(cloudDraftKey());
    }
  }
  return clone(record.snapshot);
}

function reconcileLatestCloudRecord() {
  const record = cloudSyncState.latestRemoteRecord;
  if (!record || cloudSyncState.publishing) return;
  if (cloudSyncState.localDirty) {
    if (record.updatedAtText !== cloudSyncState.baseUpdatedAt) {
      updateSyncStatus('error', '云端已有新版本；本机草稿已保留，请先备份再重新载入');
    }
    return;
  }
  if (record.updatedAtText < cloudSyncState.baseUpdatedAt) return;
  if (shouldApplyRemoteSnapshot(record.snapshot) && !applyCloudSnapshot(record.snapshot)) return;
  cloudSyncState.baseUpdatedAt = record.updatedAtText;
  cloudSyncState.remoteSnapshot = clone(record.snapshot);
}

function getFileExtension(file) {
  const typeExt = String(file?.type || '').split('/')[1] || '';
  const nameExt = String(file?.name || '').split('.').pop() || '';
  const ext = (typeExt || nameExt || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  return ext === 'jpeg' ? 'jpg' : (ext || 'jpg');
}

function sanitizeCloudPathSegment(value, fallback = 'image') {
  const text = String(value || '').trim()
    .replace(/[\\/:*?"<>|#%&{}$!@`'=+,\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return text.slice(0, 80) || fallback;
}

function buildCloudImagePath(file, context = {}) {
  const ext = getFileExtension(file);
  const kind = sanitizeCloudPathSegment(context.kind, 'misc');
  const num = sanitizeCloudPathSegment(context.num, 'no-num');
  const name = sanitizeCloudPathSegment(context.name, 'member');
  const field = sanitizeCloudPathSegment(context.field, 'photo');
  return `uploads/${kind}/${num}-${name}-${field}-${Date.now()}.${ext}`;
}

function getTempFileUrlFromResponse(response, fileID) {
  const item = response?.fileList?.[0] || response?.data?.fileList?.[0] || null;
  return item?.tempFileURL || item?.download_url || item?.url || fileID;
}

function createCloudImageReference(fileID, url = '') {
  return `cloudimg:${encodeURIComponent(JSON.stringify({
    fileID,
    url,
    refreshedAt: Date.now()
  }))}`;
}

function parseCloudImageReference(value) {
  const source = String(value || '').trim();
  if (!source.startsWith('cloudimg:')) return null;
  try {
    const data = JSON.parse(decodeURIComponent(source.slice('cloudimg:'.length)));
    return data && data.fileID ? data : null;
  } catch (error) {
    return null;
  }
}

function isCloudImageUrlFresh(ref) {
  const refreshedAt = Number(ref?.refreshedAt || 0);
  return Boolean(ref?.url && refreshedAt && Date.now() - refreshedAt < CLOUD_IMAGE_REFERENCE_TTL_MS);
}

function refreshCloudImageUrl(fileID) {
  if (!fileID || pendingCloudImageRefreshes.has(fileID)) return;
  if (!cloudSyncState.app || typeof cloudSyncState.app.getTempFileURL !== 'function') return;
  pendingCloudImageRefreshes.add(fileID);
  cloudSyncState.app.getTempFileURL({ fileList: [fileID] })
    .then(result => {
      const url = getTempFileUrlFromResponse(result, fileID);
      if (url && !url.startsWith('cloud://')) {
        cloudImageUrlCache.set(fileID, url);
        cloudImageFileIdByUrl.set(url, fileID);
        renderAll();
      }
    })
    .catch(error => {
      console.warn('refresh cloud image URL failed:', fileID, error);
    })
    .finally(() => {
      pendingCloudImageRefreshes.delete(fileID);
    });
}

async function getFreshCloudImageUrl(fileID) {
  if (!fileID) return '';
  if (!cloudSyncState.app || typeof cloudSyncState.app.getTempFileURL !== 'function') {
    return cloudImageUrlCache.get(fileID) || '';
  }
  const result = await cloudSyncState.app.getTempFileURL({ fileList: [fileID] });
  const url = getTempFileUrlFromResponse(result, fileID);
  if (url && !url.startsWith('cloud://')) {
    cloudImageUrlCache.set(fileID, url);
    cloudImageFileIdByUrl.set(url, fileID);
    return url;
  }
  return cloudImageUrlCache.get(fileID) || '';
}

async function uploadImageToCloudStorage(file, context = {}) {
  if (!cloudSyncState.initialized || !cloudSyncState.app || typeof cloudSyncState.app.uploadFile !== 'function') {
    return '';
  }
  const cloudPath = buildCloudImagePath(file, context);
  updateSyncStatus('saving', '上传图片到云存储...');
  const result = await cloudSyncState.app.uploadFile({
    cloudPath,
    filePath: file
  });
  const fileID = result?.fileID;
  if (!fileID) throw new Error('云存储没有返回 fileID');
  if (typeof cloudSyncState.app.getTempFileURL !== 'function') {
    throw new Error('当前 SDK 不能获取云存储访问链接');
  }
  const urlResult = await cloudSyncState.app.getTempFileURL({
    fileList: [fileID]
  });
  const source = getTempFileUrlFromResponse(urlResult, fileID);
  if (!source || source.startsWith('cloud://')) {
    throw new Error('云存储没有返回可直接访问的 HTTPS 图片链接');
  }
  cloudImageUrlCache.set(fileID, source);
  cloudImageFileIdByUrl.set(source, fileID);
  return createCloudImageReference(fileID, source);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result || '')));
    reader.addEventListener('error', () => reject(reader.error || new Error('读取图片失败')));
    reader.readAsDataURL(file);
  });
}

async function getUploadImageSource(file, context = {}) {
  if (!/^image\/(png|jpeg|webp)$/i.test(file.type) || file.size > 12 * 1024 * 1024) throw new Error('请选择小于 12MB 的 JPG、PNG 或 WebP 照片');
  file = await prepareReviewImageFileForUpload(file);
  if (cloudSyncState.initialized && isCloudBaseSyncHost()) {
    try {
      const source = await uploadImageToCloudStorage(file, context);
      if (source) return source;
    } catch (error) {
      console.warn('CloudBase image upload failed, falling back to local data URL:', error);
      updateSyncStatus('error', compactStatusMessage('云存储上传失败', getCloudErrorMessage(error)));
      alert('云存储上传失败：照片暂时只会保存在当前浏览器。请检查云存储权限后重试。');
    }
  }
  return readFileAsDataUrl(file);
}

function isReviewImageFile(file) {
  if (!file) return false;
  const type = String(file.type || '').toLowerCase();
  const name = String(file.name || '').toLowerCase();
  return type.startsWith('image/') || /\.(gif|png|jpe?g|webp|bmp|avif|heic|heif)$/i.test(name);
}

function normalizeReviewImageFiles(files = []) {
  return Array.from(files || [])
    .filter(isReviewImageFile)
    .slice(0, MAX_REVIEW_ATTACHMENTS);
}

function formatReviewImageStatus(files = [], emptyText = '') {
  const items = normalizeReviewImageFiles(files);
  if (!items.length) return emptyText || `可选：上传最多 ${MAX_REVIEW_ATTACHMENTS} 张图片，支持 GIF 动图。`;
  const names = items.map(file => file.name || 'image').join('、');
  return `已选择 ${items.length} 张：${names}`;
}

function chooseImageFiles() {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.gif';
    input.multiple = true;
    input.addEventListener('change', () => {
      resolve(normalizeReviewImageFiles(input.files));
    });
    input.click();
  });
}

function isGifImageFile(file) {
  const type = String(file?.type || '').toLowerCase();
  const name = String(file?.name || '').toLowerCase();
  return type === 'image/gif' || name.endsWith('.gif');
}

function loadImageElementFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image decode failed'));
    };
    image.src = url;
  });
}

function canvasToJpegFile(canvas, originalFile) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) {
        reject(new Error('image encode failed'));
        return;
      }
      const baseName = String(originalFile?.name || 'review-image')
        .replace(/\.[^.]+$/, '')
        .slice(0, 80) || 'review-image';
      const fileName = `${baseName}.jpg`;
      if (typeof File === 'function') {
        resolve(new File([blob], fileName, {
          type: 'image/jpeg',
          lastModified: originalFile?.lastModified || Date.now()
        }));
        return;
      }
      blob.name = fileName;
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}

async function prepareReviewImageFileForUpload(file) {
  if (!file || isGifImageFile(file)) return file;
  try {
    const image = await loadImageElementFromFile(file);
    const naturalWidth = image.naturalWidth || image.width || 1;
    const naturalHeight = image.naturalHeight || image.height || 1;
    const maxSide = 1800;
    const scale = Math.min(1, maxSide / Math.max(naturalWidth, naturalHeight));
    const width = Math.max(1, Math.round(naturalWidth * scale));
    const height = Math.max(1, Math.round(naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return await canvasToJpegFile(canvas, file);
  } catch (error) {
    console.warn('review image compatibility encode skipped:', error);
    return file;
  }
}

async function uploadReviewImageAttachment(file, context = {}) {
  if (!file) return null;
  if (!isReviewImageFile(file)) {
    throw new Error('请选择图片文件');
  }
  const preparedFile = await prepareReviewImageFileForUpload(file);
  const uploadContext = {
    kind: 'reviews',
    num: context.num || 'review',
    name: context.name || 'comment',
    field: context.field || 'image'
  };
  let src = '';
  if (isCloudBaseSyncHost()) {
    src = await uploadImageToCloudStorage(preparedFile, uploadContext);
    if (!src) throw new Error('云存储未返回图片地址');
  } else {
    src = await readFileAsDataUrl(preparedFile);
  }
  return {
    type: 'image',
    src,
    name: String(file.name || '').slice(0, 80)
  };
}

async function uploadReviewImageAttachments(files = [], context = {}, onProgress = null) {
  const selectedFiles = normalizeReviewImageFiles(files);
  const attachments = [];
  for (let index = 0; index < selectedFiles.length; index += 1) {
    if (typeof onProgress === 'function') onProgress(index + 1, selectedFiles.length);
    const attachment = await uploadReviewImageAttachment(selectedFiles[index], {
      ...context,
      field: `${context.field || 'image'}-${index + 1}`
    });
    if (attachment) attachments.push(attachment);
  }
  return attachments;
}

function getPublishCallOptions(payload, mode) {
  const base = {
    name: CLOUDBASE_CONFIG.publishFunction,
    data: payload,
    parse: true
  };
  if (mode !== 'cloudrun') return base;
  return {
    ...base,
    type: 'cloudrun',
    method: 'POST',
    path: CLOUDBASE_CONFIG.publishFunctionPath || '/'
  };
}

function normalizePublishResult(response) {
  if (!response) return response;
  const result = response.result ? response.result : response;
  if (result && typeof result.body === 'string') {
    try {
      return JSON.parse(result.body);
    } catch (error) {
      return result;
    }
  }
  return result;
}

function shouldRetryPublishResult(result, payload = {}) {
  return Boolean(
    payload?.action &&
    result &&
    result.ok === false &&
    result.code === 'INVALID_SNAPSHOT'
  );
}

async function callPublishHttp(payload) {
  if (!CLOUDBASE_CONFIG.publishHttpPath) {
    throw new Error('HTTP 发布路径未配置');
  }
  const response = await fetch(CLOUDBASE_CONFIG.publishHttpPath, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    data = { ok: false, code: `HTTP_${response.status}`, message: text.slice(0, 180) || response.statusText };
  }
  const result = normalizePublishResult(data);
  if (!response.ok) {
    throw new Error(`${result?.code || `HTTP_${response.status}`} · ${result?.message || response.statusText}`);
  }
  return result;
}

async function callPublishFunction(payload) {
  const preferredType = CLOUDBASE_CONFIG.publishFunctionType || 'auto';
  const modes = preferredType === 'cloudrun'
    ? ['cloudrun', 'standard']
    : preferredType === 'standard'
      ? ['standard']
      : ['standard', 'cloudrun'];
  const errors = [];

  try {
    const response = await callPublishHttp(payload);
    const result = normalizePublishResult(response);
    if (shouldRetryPublishResult(result, payload)) {
      throw new Error(`${result.code || 'FUNCTION_ERROR'} · ${result.message || '云函数保存失败'}`);
    }
    return { response, mode: 'http' };
  } catch (error) {
    errors.push(`http: ${getCloudErrorMessage(error)}`);
    console.warn('CloudBase HTTP publish failed, retrying SDK function call:', error);
    updateSyncStatus('saving', 'HTTP 发布失败，尝试云函数...');
  }

  for (const mode of modes) {
    try {
      const response = await cloudSyncState.app.callFunction(getPublishCallOptions(payload, mode));
      const result = normalizePublishResult(response);
      if (shouldRetryPublishResult(result, payload)) {
        errors.push(`${mode}: ${result.code || 'FUNCTION_ERROR'} · ${result.message || '云函数保存失败'}`);
        continue;
      }
      return { response, mode };
    } catch (error) {
      errors.push(`${mode}: ${getCloudErrorMessage(error)}`);
      if (mode === 'standard' && modes.includes('cloudrun')) {
        console.warn('CloudBase standard function call failed, retrying as cloudrun:', error);
        updateSyncStatus('saving', '普通云函数失败，尝试 cloudrun...');
      }
    }
  }

  throw new Error(errors.join(' | '));
}

async function publishCloudSnapshot(snapshot) {
  if (!canEdit()) {
    updateSyncStatus('local', '只读模式，输入口令后发布');
    return;
  }
  if (!cloudSyncState.initialized || !cloudSyncState.app || cloudSyncState.applyingRemote) return;
  if (!CLOUDBASE_CONFIG.publishFunction || typeof cloudSyncState.app.callFunction !== 'function') {
    updateSyncStatus('error', '云函数未就绪，本地已保存');
    return;
  }
  if (cloudSyncState.publishing) return;
  const submitted = clone(snapshot);
  const submittedBase = cloudSyncState.baseUpdatedAt;
  cloudSyncState.publishing = true;
  // Even an explicit publish of a previously clean board must be recoverable
  // after a failed request or a navigation while the request is in flight.
  cloudSyncState.localDirty = true;
  let saved = false;
  try {
    persistCloudDraft(submitted);
    updateSyncStatus('saving', '保存到云端...');
    const { response, mode } = await callPublishFunction({
      docId: CLOUDBASE_CONFIG.currentDocId,
      snapshot: submitted,
      workspaceId: ACTIVE_PROFILE.id,
      baseUpdatedAt: submittedBase,
      editToken,
      clientUpdatedAt: new Date().toISOString()
    });
    const result = normalizePublishResult(response);
    if (!result || result.ok !== true || typeof result.updatedAt !== 'string') {
      throw new Error(`${result?.code || 'FUNCTION_ERROR'} · ${result?.message || '云函数未确认保存成功'}`);
    }
    saved = true;
    cloudSyncState.baseUpdatedAt = result.updatedAt;
    cloudSyncState.remoteSnapshot = clone(submitted);
    cloudSyncState.localDirty = tacticalSnapshotJson(createSnapshot()) !== tacticalSnapshotJson(submitted);
    if (cloudSyncState.localDirty) persistCloudDraft();
    else localStorage.removeItem(cloudDraftKey());
    cloudSyncState.lastError = '';
    updateSyncStatus(cloudSyncState.localDirty ? 'ready' : 'synced',
      cloudSyncState.localDirty ? '已发布；之后的新修改仍保留为本机草稿' :
        mode === 'http' ? '已同步到云端（HTTP）' : mode === 'cloudrun' ? '已同步到云端（cloudrun）' : '已同步到云端');
    // Publishing deliberately preserves the server's interaction arrays.
    // Read them back, and also collect any update that arrived during the POST.
    try {
      await fetchLatestCloudRecord();
    } catch (readError) {
      console.warn('Published, but latest cloud read failed:', readError);
      updateSyncStatus('ready', '阵容已发布，最新互动暂未读取；本机内容已保留');
    }
  } catch (error) {
    cloudSyncState.lastError = getCloudErrorMessage(error);
    console.warn('CloudBase publish failed:', error);
    updateSyncStatus('error', compactStatusMessage('云端保存失败', cloudSyncState.lastError));
    try { persistCloudDraft(); } catch (storageError) { console.warn('Draft storage failed:', storageError); }
  } finally {
    cloudSyncState.publishing = false;
    if (saved) reconcileLatestCloudRecord();
  }
}

function queueCloudPublish(snapshot) {
  if (cloudSyncState.applyingRemote || (!canEdit() && !cloudSyncState.localDirty)) return;
  if (!cloudSyncState.localDirty && tacticalSnapshotJson(snapshot) === tacticalSnapshotJson(cloudSyncState.remoteSnapshot)) return;
  cloudSyncState.localDirty = true;
  persistCloudDraft(snapshot);
  updateSyncStatus('ready', cloudSyncState.initialized ? '草稿已存本机，点击发布同步给队员' : '草稿已存本机');
}

function applyCloudSnapshot(snapshot) {
  if (!isCurrentWorkspaceSnapshot(snapshot)) return false;
  cloudSyncState.applyingRemote = true;
  try {
    if (!applySnapshot(snapshot, false)) return false;
    mergeMissingBenchPlayers(false);
    localStorageAdapter.writeLastState(snapshot);
    renderPresetSelect('');
    updateSyncStatus('synced', '收到云端更新');
    return true;
  } finally {
    cloudSyncState.applyingRemote = false;
  }
}

function startCloudWatch() {
  if (!cloudSyncState.documentRef || typeof cloudSyncState.documentRef.watch !== 'function') return;
  if (cloudSyncState.watcher && typeof cloudSyncState.watcher.close === 'function') {
    cloudSyncState.watcher.close();
  }
  try {
    cloudSyncState.watcher = cloudSyncState.documentRef.watch({
      onChange(snapshot) {
        const record = extractCloudRecord(snapshot);
        if (!rememberCloudRecord(record)) return;
        reconcileLatestCloudRecord();
      },
      onError(error) {
        console.warn('CloudBase watch failed:', error);
        updateSyncStatus('error', '云端监听断开，本地可用');
      }
    });
  } catch (error) {
    console.warn('CloudBase watch init failed:', error);
    updateSyncStatus('error', '云端监听不可用，本地可用');
  }
}

async function initCloudBaseSync() {
  if (!isCloudBaseSyncHost()) {
    updateSyncStatus('local', '本地模式（未连接云端）');
    return false;
  }
  if (cloudSyncState.initialized || cloudSyncState.initializing) return cloudSyncState.initialized;
  cloudSyncState.initializing = true;
  updateSyncStatus('loading', '连接 CloudBase...');
  try {
    const cloudbase = await loadCloudBaseSdk();
    const app = cloudbase.init({
      env: CLOUDBASE_CONFIG.envId,
      region: CLOUDBASE_CONFIG.region
    });
    await signInCloudBase(app);
    const db = app.database();
    cloudSyncState.app = app;
    cloudSyncState.db = db;
    cloudSyncState.documentRef = db.collection(CLOUDBASE_CONFIG.collection).doc(CLOUDBASE_CONFIG.currentDocId);
    cloudSyncState.initialized = true;
    setStorageAdapter(cloudStorageAdapter);
    updateSyncStatus('ready', '云端已连接');
    return true;
  } catch (error) {
    cloudSyncState.lastError = error && error.message ? error.message : String(error);
    console.warn('CloudBase init failed:', error);
    setStorageAdapter(localStorageAdapter);
    updateSyncStatus('error', '云端连接失败，使用本地');
    return false;
  } finally {
    cloudSyncState.initializing = false;
  }
}

function toNonNegativeInt(value) {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function normalizeStats(stats = {}) {
  return {
    goals: toNonNegativeInt(stats.goals),
    assists: toNonNegativeInt(stats.assists),
    appearances: toNonNegativeInt(stats.appearances)
  };
}

function normalizeName(name) {
  const value = String(name ?? '');
  return LEGACY_NAME_MAP[value] || value;
}

function normalizePlayer(player) {
  const allowedStatus = ['fit', 'injured', 'yellow', 'red', 'suspended'];
  const name = normalizeName(player.name);
  const positions = Array.isArray(player.positions)
    ? player.positions.map(p => String(p).trim()).filter(Boolean)
    : (player.pos ? [String(player.pos).trim()] : []);
  return {
    ...player,
    id: player.id || (PLAYER_COUNT === 8 ? LaoheCompetition.playerId(name) : undefined),
    num: player.num ?? '',
    name,
    pos: String(player.pos ?? ''),
    role: String(player.role ?? ''),
    positions,
    avatarHome: player.avatarHome || '',
    avatarAway: player.avatarAway || '',
    stats: normalizeStats(player.stats),
    status: allowedStatus.includes(player.status) ? player.status : 'fit',
    // 以 players.json 的 captain 字段为准；缺字段的旧数据回退到按名字匹配。
    captain: typeof player.captain === 'boolean' ? player.captain : name === DEFAULT_CAPTAIN_NAME
  };
}

function normalizeCoachData(coach = {}) {
  return {
    useDefaultPhotos: coach.useDefaultPhotos !== false,
    show: coach.show !== false,
    num: String(coach.num ?? '3'),
    posLabel: String(coach.posLabel ?? 'COACH'),
    name: String(coach.name ?? '陈炫'),
    role: String(coach.role ?? '教练'),
    status: ['fit', 'injured', 'suspended'].includes(coach.status) ? coach.status : 'fit',
    avatar: coach.avatar || '',
    avatarHome: coach.avatarHome || '',
    avatarAway: coach.avatarAway || ''
  };
}

function normalizeManagerData(manager = {}) {
  return {
    useDefaultPhotos: manager.useDefaultPhotos !== false,
    show: manager.show !== false,
    num: String(manager.num ?? '·'),
    posLabel: String(manager.posLabel ?? 'MGR'),
    name: String(manager.name ?? '许俊秋'),
    role: String(manager.role ?? '领队'),
    avatar: manager.avatar || '',
    avatarHome: manager.avatarHome || '',
    avatarAway: manager.avatarAway || ''
  };
}

function normalizeTeamData(team = {}) {
  return {
    logo: team.logo || '',
    logoHome: team.logoHome || '',
    logoAway: team.logoAway || ''
  };
}

function normalizeLegend(legend = {}) {
  const name = normalizeName(legend.name);
  return {
    useDefaultPhotos: legend.useDefaultPhotos !== false,
    num: legend.num ?? '',
    name,
    role: String(legend.role ?? '绝版人物'),
    avatar: legend.avatar || '',
    avatarHome: legend.avatarHome || '',
    avatarAway: legend.avatarAway || ''
  };
}

function normalizeReviewAttachment(attachment = {}) {
  const source = typeof attachment === 'string' ? attachment : attachment.src;
  const src = String(source || '').trim();
  if (!src) return null;
  return {
    type: 'image',
    src,
    name: String(attachment.name || '').trim().slice(0, 80)
  };
}

function normalizeReviewAttachments(attachments = []) {
  if (!Array.isArray(attachments)) return [];
  return attachments
    .map(normalizeReviewAttachment)
    .filter(Boolean)
    .slice(0, MAX_REVIEW_ATTACHMENTS);
}

function hasReviewAttachments(review = {}) {
  return normalizeReviewAttachments(review.attachments).length > 0;
}

function mergeSubmittedReviewAttachments(savedReview = {}, submittedReview = {}) {
  const submittedAttachments = normalizeReviewAttachments(submittedReview.attachments);
  if (!submittedAttachments.length) return savedReview || submittedReview;
  const saved = savedReview && typeof savedReview === 'object' ? savedReview : {};
  if (normalizeReviewAttachments(saved.attachments).length) return saved;
  return {
    ...submittedReview,
    ...saved,
    attachments: submittedAttachments
  };
}

function normalizeReviewReply(reply = {}) {
  if (!reply || typeof reply !== 'object') return null;
  const reviewerNum = String(reply.reviewerNum ?? reply.familiarPlayerNum ?? '').trim();
  const reviewerName = String(reply.reviewerName || '').trim().slice(0, 18);
  const rawReviewerAuth = String(reply.reviewerAuth || (reviewerName ? 'friend_number' : 'team_edit'));
  const reviewerAuth = rawReviewerAuth === 'friend_number' && reviewerName ? 'friend_number' : 'team_edit';
  const familiarPlayerNum = reviewerAuth === 'friend_number' ? String(reply.familiarPlayerNum ?? reviewerNum).trim() : '';
  const familiarPlayerName = reviewerAuth === 'friend_number'
    ? normalizeName(reply.familiarPlayerName || findLineupPersonNameByNumber(familiarPlayerNum) || '')
    : '';
  const createdAt = String(reply.createdAt || new Date().toISOString());
  const createdTime = new Date(createdAt).getTime();
  const fallbackDeleteUntil = new Date((Number.isFinite(createdTime) ? createdTime : Date.now()) + REVIEW_DELETE_WINDOW_MS).toISOString();
  if (!reviewerNum && !reviewerName) return null;
  return {
    id: String(reply.id || `reply:${reviewerNum || reviewerName}:${createdAt}`),
    reviewerNum,
    reviewerName,
    familiarPlayerNum,
    familiarPlayerName,
    reviewerAuth,
    deviceId: String(reply.deviceId || ''),
    ipRegion: String(reply.ipRegion || reply.reviewMeta?.ipRegion || ''),
    ipMasked: String(reply.ipMasked || reply.reviewMeta?.ipMasked || ''),
    deviceLabel: String(reply.deviceLabel || reply.reviewMeta?.deviceLabel || ''),
    reviewMeta: reply.reviewMeta && typeof reply.reviewMeta === 'object' ? reply.reviewMeta : {},
    deleteUntil: String(reply.deleteUntil || fallbackDeleteUntil),
    comment: String(reply.comment || '').trim().slice(0, 180),
    attachments: normalizeReviewAttachments(reply.attachments),
    createdAt
  };
}

function normalizeReview(review = {}) {
  if (!review || typeof review !== 'object') return null;
  const targetNum = String(review.targetNum ?? '').trim();
  const reviewerNum = String(review.reviewerNum ?? review.familiarPlayerNum ?? '').trim();
  const reviewerName = String(review.reviewerName || '').trim().slice(0, 18);
  const rawReviewerAuth = String(review.reviewerAuth || (reviewerName ? 'friend_number' : 'team_edit'));
  const reviewerAuth = rawReviewerAuth === 'friend_number' && reviewerName ? 'friend_number' : 'team_edit';
  const familiarPlayerNum = reviewerAuth === 'friend_number' ? String(review.familiarPlayerNum ?? reviewerNum).trim() : '';
  const familiarPlayerName = reviewerAuth === 'friend_number'
    ? normalizeName(review.familiarPlayerName || findLineupPersonNameByNumber(familiarPlayerNum) || '')
    : '';
  const rating = Math.min(5, Math.max(1, Number.parseInt(review.rating, 10) || 0));
  if (!targetNum || (!reviewerNum && !reviewerName) || !rating) return null;
  const targetKey = String(review.targetKey || `player:${targetNum}`);
  const createdAt = String(review.createdAt || new Date().toISOString());
  const createdTime = new Date(createdAt).getTime();
  const fallbackDeleteUntil = new Date((Number.isFinite(createdTime) ? createdTime : Date.now()) + REVIEW_DELETE_WINDOW_MS).toISOString();
  return {
    id: String(review.id || `${targetKey}:${reviewerNum || reviewerName}:${createdAt}`),
    targetKey,
    targetNum,
    targetName: normalizeName(review.targetName || ''),
    targetType: String(review.targetType || 'player'),
    reviewerNum,
    reviewerName,
    familiarPlayerNum,
    familiarPlayerName,
    reviewerAuth,
    deviceId: String(review.deviceId || ''),
    ipRegion: String(review.ipRegion || review.reviewMeta?.ipRegion || ''),
    ipMasked: String(review.ipMasked || review.reviewMeta?.ipMasked || ''),
    deviceLabel: String(review.deviceLabel || review.reviewMeta?.deviceLabel || ''),
    reviewMeta: review.reviewMeta && typeof review.reviewMeta === 'object' ? review.reviewMeta : {},
    deleteUntil: String(review.deleteUntil || fallbackDeleteUntil),
    rating,
    comment: String(review.comment || '').trim().slice(0, 180),
    attachments: normalizeReviewAttachments(review.attachments),
    replies: Array.isArray(review.replies) ? review.replies.map(normalizeReviewReply).filter(Boolean) : [],
    createdAt
  };
}

function normalizeAttendanceRecord(record = {}) {
  if (!record || typeof record !== 'object') return null;
  const playerNum = String(record.playerNum ?? '').trim();
  const playerName = normalizeName(record.playerName || findLineupPersonNameByNumber(playerNum) || '');
  const status = ATTENDANCE_STATUS_META[record.status] ? record.status : 'in';
  const nickname = String(record.nickname || '').trim().slice(0, 18);
  const createdAt = String(record.createdAt || new Date().toISOString());
  const updatedAt = String(record.updatedAt || createdAt);
  if (!playerNum || !playerName) return null;
  return {
    id: String(record.id || `attendance:${playerNum}:${record.deviceId || createdAt}`),
    playerNum,
    playerName,
    status,
    nickname,
    deviceId: String(record.deviceId || ''),
    ipRegion: String(record.ipRegion || record.reviewMeta?.ipRegion || ''),
    ipMasked: String(record.ipMasked || record.reviewMeta?.ipMasked || ''),
    deviceLabel: String(record.deviceLabel || record.reviewMeta?.deviceLabel || ''),
    reviewMeta: record.reviewMeta && typeof record.reviewMeta === 'object' ? record.reviewMeta : {},
    createdAt,
    updatedAt
  };
}

function normalizeMvpVote(vote = {}) {
  if (!vote || typeof vote !== 'object') return null;
  const rawTargetKey = String(vote.targetKey || '').trim();
  const rawTargetNum = String(vote.targetNum ?? '').trim();
  const target = findReviewablePlayer(rawTargetKey || rawTargetNum);
  const targetNum = String(vote.targetNum ?? target?.num ?? '').trim();
  const targetKey = rawTargetKey || (target?.reviewKey || (targetNum ? `player:${targetNum}` : ''));
  const targetName = normalizeName(vote.targetName || target?.name || '');
  const targetType = String(vote.targetType || target?.reviewType || 'player');
  const reviewerNum = String(vote.reviewerNum ?? vote.familiarPlayerNum ?? '').trim();
  const reviewerName = String(vote.reviewerName || '').trim().slice(0, 18);
  const familiarPlayerNum = String(vote.familiarPlayerNum ?? reviewerNum).trim();
  const familiarPlayerName = normalizeName(vote.familiarPlayerName || findLineupPersonNameByNumber(familiarPlayerNum) || '');
  const createdAt = String(vote.createdAt || new Date().toISOString());
  const updatedAt = String(vote.updatedAt || createdAt);
  if (!targetKey || !targetName || !reviewerNum || !reviewerName) return null;
  return {
    id: String(vote.id || `mvp:${vote.deviceId || reviewerNum}:${createdAt}`),
    targetKey,
    targetNum,
    targetName,
    targetType,
    reviewerNum,
    reviewerName,
    familiarPlayerNum,
    familiarPlayerName,
    reviewerAuth: 'friend_number',
    deviceId: String(vote.deviceId || ''),
    ipRegion: String(vote.ipRegion || vote.reviewMeta?.ipRegion || ''),
    ipMasked: String(vote.ipMasked || vote.reviewMeta?.ipMasked || ''),
    deviceLabel: String(vote.deviceLabel || vote.reviewMeta?.deviceLabel || ''),
    reviewMeta: vote.reviewMeta && typeof vote.reviewMeta === 'object' ? vote.reviewMeta : {},
    createdAt,
    updatedAt
  };
}

function normalizeIntroMap(intros = {}) {
  const result = {};
  if (!intros || typeof intros !== 'object' || Array.isArray(intros)) return result;
  Object.entries(intros).forEach(([name, intro]) => {
    if (typeof name === 'string' && typeof intro === 'string') {
      result[normalizeName(name)] = intro;
    }
  });
  return result;
}

function normalizeSquadData() {
  SQUAD_DATA.starters = SQUAD_DATA.starters.map(normalizePlayer);
  SQUAD_DATA.bench = SQUAD_DATA.bench.map(normalizePlayer);
  Object.assign(COACH_DATA, normalizeCoachData(COACH_DATA));
  Object.assign(MANAGER_DATA, normalizeManagerData(MANAGER_DATA));
  Object.assign(TEAM_DATA, normalizeTeamData(TEAM_DATA));
  LEGENDS_DATA = LEGENDS_DATA.map(normalizeLegend);
}

function applyCurrentFormationLabels() {
  const formation = FORMATIONS[currentFormation];
  if (!formation?.slots) return;
  formation.slots.forEach(slot => {
    const player = SQUAD_DATA.starters[slot.playerIndex];
    if (!player) return;
    player.pos = slot.pos;
    player.role = slot.role;
  });
}

function benchVersionOf(player) {
  const normalized = normalizePlayer(player);
  return {
    ...normalized,
    num: normalized.num,
    name: normalized.name,
    pos: normalized.pos,
    role: normalized.role,
    positions: normalized.positions,
    avatarHome: normalized.avatarHome,
    avatarAway: normalized.avatarAway,
    stats: normalized.stats,
    status: normalized.status,
    captain: normalized.captain
  };
}

function resolveImageSource(value) {
  const source = String(value || '').trim();
  if (!source) return '';
  const cloudRef = parseCloudImageReference(source);
  if (cloudRef) {
    if (cloudRef.url) cloudImageFileIdByUrl.set(cloudRef.url, cloudRef.fileID);
    if (cloudImageUrlCache.has(cloudRef.fileID)) {
      const cached = cloudImageUrlCache.get(cloudRef.fileID);
      cloudImageFileIdByUrl.set(cached, cloudRef.fileID);
      return cached;
    }
    if (isCloudImageUrlFresh(cloudRef)) return cloudRef.url;
    refreshCloudImageUrl(cloudRef.fileID);
    return cloudRef.url || '';
  }
  return source.startsWith('data:') ? source : source.replace(/\\/g, '/');
}

function getCloudImageFileID(value, resolvedSource = '') {
  const cloudRef = parseCloudImageReference(value);
  if (cloudRef?.fileID) return cloudRef.fileID;
  const source = String(resolvedSource || value || '').trim();
  return cloudImageFileIdByUrl.get(source) || '';
}

function findDefaultPlayerByNum(num) {
  const key = String(num ?? '');
  return [...(INLINE_PLAYER_DATA.starters || []), ...(INLINE_PLAYER_DATA.bench || [])]
    .map(normalizePlayer)
    .find(player => String(player.num) === key) || null;
}

function getDefaultPlayerAvatar(player) {
  if (player?.useDefaultPhotos === false) return '';
  const source = [...INLINE_PLAYER_DATA.starters, ...INLINE_PLAYER_DATA.bench].find(item =>
    player?.id && item.id ? player.id === item.id : player?.name === item.name && String(player?.num) === String(item.num));
  if (!source) return '';
  const avatar = (currentKit === 'away' ? source.avatarAway : source.avatarHome) || source.avatar || source.avatarHome || source.avatarAway;
  return resolveImageSource(avatar);
}

function renderImageTag(className, source, fallback = '', alt = '') {
  if (!source && !fallback) return '';
  const classAttr = className ? ` class="${escapeAttr(className)}"` : '';
  const fallbackAttr = fallback && fallback !== source ? ` data-fallback-src="${escapeAttr(fallback)}"` : '';
  return `<img${classAttr} src="${escapeAttr(source || fallback)}"${fallbackAttr} alt="${escapeAttr(alt)}">`;
}

function applyImageFallback(image) {
  const fallback = image.dataset.fallbackSrc;
  image.dataset.fallbackApplied = 'true';
  image.src = fallback || getExportPlaceholderImage();
}

function isProxyableImageSource(source) {
  try {
    const resolved = new URL(String(source || ''), location.href);
    return resolved.protocol === 'http:' || resolved.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

function tryProxiedImageFallback(image, fileID = '', currentSource = '') {
  if (image.dataset.cloudProxyTried === 'true') {
    applyImageFallback(image);
    return;
  }
  if (!fileID && !isProxyableImageSource(currentSource)) {
    applyImageFallback(image);
    return;
  }
  image.dataset.cloudProxyTried = 'true';
  proxyImageAsDataUrl(currentSource, { fileID })
    .then(dataUrl => {
      if (dataUrl) {
        image.dataset.fallbackApplied = 'false';
        image.src = dataUrl;
        return;
      }
      applyImageFallback(image);
    })
    .catch(() => applyImageFallback(image));
}

function handleImageError(event) {
  const image = event.target?.closest?.('img');
  if (!image || image.dataset.fallbackApplied === 'true') return;
  const currentSource = image.currentSrc || image.src || image.getAttribute('src') || '';
  const fileID = image.dataset.cloudFileId || getCloudImageFileID(currentSource);
  if (fileID && image.dataset.cloudRefreshTried !== 'true') {
    image.dataset.cloudRefreshTried = 'true';
    getFreshCloudImageUrl(fileID)
      .then(freshSource => {
        if (freshSource) {
          image.dataset.fallbackApplied = 'false';
          image.src = freshSource;
          return;
        }
        tryProxiedImageFallback(image, fileID, currentSource);
      })
      .catch(() => tryProxiedImageFallback(image, fileID, currentSource));
    return;
  }
  tryProxiedImageFallback(image, fileID, currentSource);
}

function getCurrentAvatar(player) {
  const normalized = normalizePlayer(player);
  const avatar = (currentKit === 'away' ? normalized.avatarAway : normalized.avatarHome) || normalized.avatar || normalized.avatarHome || normalized.avatarAway;
  return resolveImageSource(avatar);
}

function getLegendAvatar(legend) {
  const n = normalizeLegend(legend);
  const chosen = currentKit === 'away'
    ? (n.avatarAway || n.avatarHome || n.avatar)
    : (n.avatarHome || n.avatarAway || n.avatar);
  return resolveImageSource(chosen);
}

function getStaffAvatar(data) {
  const chosen = currentKit === 'away'
    ? (data.avatarAway || data.avatarHome || data.avatar || '')
    : (data.avatarHome || data.avatarAway || data.avatar || '');
  return resolveImageSource(chosen);
}

function getStatusIcon(status) {
  return {
    injured: '受伤',
    yellow: '🟨',
    red: '🟥',
    suspended: '⛔'
  }[status] || '';
}

function getStatsBadgeText(player) {
  if (!currentShowStats) return '';
  const stats = normalizeStats(player.stats);
  return `进${stats.goals} 助${stats.assists} 场${stats.appearances}`;
}

function getEditableTexts() {
  const values = {};
  document.querySelectorAll('[data-edit-key]').forEach(el => {
    values[el.dataset.editKey] = el.textContent;
  });
  return values;
}

function setEditableTexts(values = {}) {
  document.querySelectorAll('[data-edit-key]').forEach(el => {
    const value = values[el.dataset.editKey];
    if (typeof value === 'string') {
      el.textContent = value;
    }
  });
}

function syncFormationMetaText() {
  const metaEl = document.querySelector('[data-edit-key="meta"]');
  const formation = FORMATIONS[currentFormation];
  if (!metaEl || !formation) return;
  const currentText = metaEl.textContent.trim();
  const defaultText = `老和山之翼 · ${formation.label} 本场名单`;
  if (!currentText) {
    metaEl.textContent = defaultText;
    return;
  }
  const formationMetaPattern = /^(.*?·\s*)\d-\d(?:-\d){1,2}(\s*本场名单)$/;
  if (formationMetaPattern.test(currentText)) {
    metaEl.textContent = currentText.replace(formationMetaPattern, `$1${formation.label}$2`);
  }
}

function createSnapshot() {
  return {
    version: 11,
    defaultsRevision: LaoheDefaults.revision,
    workspaceId: ACTIVE_PROFILE.id,
    matchFormat: PLAYER_COUNT,
    squadData: clone(SQUAD_DATA),
    coachData: clone(COACH_DATA),
    managerData: clone(MANAGER_DATA),
    teamData: clone(TEAM_DATA),
    legendsData: clone(LEGENDS_DATA),
    reviewsData: clone(REVIEWS_DATA),
    attendanceData: clone(ATTENDANCE_DATA),
    mvpVotesData: clone(MVP_VOTES_DATA),
    formation: currentFormation,
    kit: currentKit,
    showStats: currentShowStats,
    reportLink,
    editables: getEditableTexts()
  };
}

function normalizeReviewsForSnapshot(reviews = REVIEWS_DATA) {
  return (Array.isArray(reviews) ? reviews : [])
    .map(normalizeReview)
    .filter(Boolean)
    .slice(0, 800);
}

function normalizeAttendanceForSnapshot(records = ATTENDANCE_DATA) {
  return (Array.isArray(records) ? records : [])
    .map(normalizeAttendanceRecord)
    .filter(Boolean)
    .slice(0, 200);
}

function normalizeMvpVotesForSnapshot(votes = MVP_VOTES_DATA) {
  return (Array.isArray(votes) ? votes : [])
    .map(normalizeMvpVote)
    .filter(Boolean)
    .slice(0, 400);
}

function createSnapshotWithReviewsData(reviews = REVIEWS_DATA) {
  const snapshot = createSnapshot();
  snapshot.reviewsData = clone(normalizeReviewsForSnapshot(reviews));
  return snapshot;
}

function buildReviewsWithSubmittedReview(review, reviews = REVIEWS_DATA) {
  const normalized = normalizeReview(review);
  const existing = normalizeReviewsForSnapshot(reviews);
  if (!normalized) return existing;
  return [
    normalized,
    ...existing.filter(item => item.id !== normalized.id)
  ].slice(0, 800);
}

function buildReviewsWithReply(reviewId, reply, reviews = REVIEWS_DATA) {
  const id = String(reviewId || '');
  const normalizedReply = normalizeReviewReply(reply);
  const existingReviews = normalizeReviewsForSnapshot(reviews);
  if (!id || !normalizedReply) return existingReviews;
  return existingReviews.map(review => {
    if (review.id !== id) return review;
    const existingReplies = Array.isArray(review.replies) ? review.replies : [];
    return {
      ...review,
      replies: [
        ...existingReplies.filter(item => item && item.id !== normalizedReply.id),
        normalizedReply
      ].slice(-80)
    };
  });
}

function buildReviewsWithoutReview(reviewId, reviews = REVIEWS_DATA) {
  const id = String(reviewId || '');
  return normalizeReviewsForSnapshot(reviews).filter(review => review.id !== id);
}

function buildReviewsWithoutReply(reviewId, replyId, reviews = REVIEWS_DATA) {
  const id = String(reviewId || '');
  const childId = String(replyId || '');
  return normalizeReviewsForSnapshot(reviews).map(review => {
    if (review.id !== id) return review;
    return {
      ...review,
      replies: (Array.isArray(review.replies) ? review.replies : [])
        .map(normalizeReviewReply)
        .filter(Boolean)
        .filter(reply => reply.id !== childId)
    };
  });
}

function mergeSavedPlayerFields(basePlayer, savedPlayer) {
  const base = normalizePlayer(basePlayer);
  if (!savedPlayer || typeof savedPlayer !== 'object') return base;
  const saved = normalizePlayer(savedPlayer);
  return {
    ...base,
    num: saved.num || base.num,
    name: saved.name || base.name,
    pos: saved.pos,
    role: saved.role,
    positions: Array.isArray(saved.positions) ? saved.positions : base.positions,
    ...mergeSavedPhotoFields(base, saved),
    stats: saved.stats || base.stats,
    status: saved.status || base.status,
    captain: typeof savedPlayer.captain === 'boolean' ? savedPlayer.captain : base.captain
  };
}

function isSavedImageSource(value) {
  const source = String(value || '').trim();
  return Boolean(
    source &&
    (
      source.startsWith('data:') ||
      source.startsWith('http://') ||
      source.startsWith('https://') ||
      source.startsWith('cloud://') ||
      source.startsWith('cloudimg:') ||
      source.startsWith('assets/')
    )
  );
}

function mergeSavedImageSource(savedValue, baseValue) {
  return isSavedImageSource(savedValue) ? savedValue : baseValue;
}

// Explicitly clearing a portrait must survive reload, preset restoration and
// cloud snapshots. Older empty fields still inherit newly supplied seed photos.
function mergeSavedPhotoFields(base, saved) {
  const useDefaultPhotos = saved.useDefaultPhotos !== false;
  const result = { useDefaultPhotos };
  for (const field of ['avatar', 'avatarHome', 'avatarAway']) {
    result[field] = useDefaultPhotos
      ? mergeSavedImageSource(saved[field], base[field])
      : (isSavedImageSource(saved[field]) ? saved[field] : '');
  }
  return result;
}

function replaceSquadData(nextSquadData) {
  if (!nextSquadData || !Array.isArray(nextSquadData.starters) || !Array.isArray(nextSquadData.bench)) return;
  const basePlayers = [
    ...SQUAD_DATA.starters.map(normalizePlayer),
    ...SQUAD_DATA.bench.map(normalizePlayer)
  ];
  const playerKey = p => p.id || `${p.num}:${p.name}`;
  const baseByNum = new Map(basePlayers.map(player => [playerKey(player), player]));
  const seenNums = new Set();
  const mergeSavedList = savedPlayers => savedPlayers
    .filter(Boolean)
    .map(savedPlayer => {
      const saved = normalizePlayer(savedPlayer);
      const key = playerKey(saved);
      if (seenNums.has(key)) return null;
      seenNums.add(key);
      return mergeSavedPlayerFields(baseByNum.get(key) || saved, saved);
    })
    .filter(Boolean);
  const nextStarters = mergeSavedList(nextSquadData.starters).slice(0, PLAYER_COUNT);
  const nextBench = mergeSavedList(nextSquadData.bench);
  basePlayers.forEach(player => {
    const key = playerKey(player);
    if (!seenNums.has(key)) {
      seenNums.add(key);
      nextBench.push(player);
    }
  });
  if (nextStarters.length === PLAYER_COUNT) {
    SQUAD_DATA.starters = nextStarters;
    SQUAD_DATA.bench = nextBench;
  }
}

function mergeSavedStaffFields(baseData, savedData) {
  const saved = savedData && typeof savedData === 'object' ? savedData : {};
  return {
    ...baseData,
    show: saved.show !== false,
    status: saved.status || baseData.status || 'fit',
    ...mergeSavedPhotoFields(baseData, saved)
  };
}

function replaceCoachData(nextCoachData) {
  Object.assign(COACH_DATA, normalizeCoachData(mergeSavedStaffFields(COACH_DATA, nextCoachData)));
}

function replaceManagerData(nextManagerData) {
  Object.assign(MANAGER_DATA, normalizeManagerData(mergeSavedStaffFields(MANAGER_DATA, nextManagerData)));
}

function replaceTeamData(nextTeamData) {
  const saved = normalizeTeamData(nextTeamData || {});
  Object.assign(TEAM_DATA, {
    ...TEAM_DATA,
    logo: mergeSavedImageSource(saved.logo, TEAM_DATA.logo),
    logoHome: mergeSavedImageSource(saved.logoHome, TEAM_DATA.logoHome),
    logoAway: mergeSavedImageSource(saved.logoAway, TEAM_DATA.logoAway)
  });
}

function applyPlayerData(data) {
  SQUAD_DATA = {
    starters: Array.isArray(data.starters) ? data.starters.map(normalizePlayer) : [],
    bench: Array.isArray(data.bench) ? data.bench.map(normalizePlayer) : []
  };
  COACH_DATA = normalizeCoachData(data.coach);
  MANAGER_DATA = normalizeManagerData(data.manager);
  Object.assign(TEAM_DATA, normalizeTeamData(data.team));
  LEGENDS_DATA = Array.isArray(data.legends) ? data.legends.map(normalizeLegend) : [];
  CARD_INTROS = normalizeIntroMap(data.intros);
  REVIEWS_DATA = Array.isArray(data.reviews) ? data.reviews.map(normalizeReview).filter(Boolean) : [];
}

async function loadPlayerData() {
  if (location.protocol === 'file:') {
    applyPlayerData(INLINE_PLAYER_DATA);
    return;
  }
  try {
    const response = await fetch(PLAYER_DATA_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    applyPlayerData(LaoheCompetition.buildPlayerData(ACTIVE_PROFILE, await response.json()));
  } catch (error) {
    console.warn('fetch players.json failed, using inline data:', error);
    applyPlayerData(INLINE_PLAYER_DATA);
  }
}

function saveLastState() {
  try {
    const snapshot = createSnapshot();
    localStorageAdapter.writeLastState(snapshot);
    if (cloudSyncState.localDirty || canEdit()) queueCloudPublish(snapshot);
  } catch (error) {
    console.warn(`写入当前阵容失败（${activeStorageAdapter.name}）：`, error);
    updateSyncStatus('error', '本机保存失败，请立即导出 JSON 备份');
  }
}

function queueSaveLastState() {
  // Protect immediately, before the debounce and even if editing is locked
  // before the timer runs. Existing dirty state is independent of edit auth.
  if (!cloudSyncState.applyingRemote && (canEdit() || cloudSyncState.localDirty)) {
    cloudSyncState.localDirty = true;
    try { persistCloudDraft(); } catch (error) {
      console.warn('Draft storage failed:', error);
      updateSyncStatus('error', '草稿暂未写入本机，请导出 JSON 备份');
    }
  }
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(saveLastState, 180);
}

function applySnapshot(snapshot, shouldSave = true) {
  if (!snapshot || !snapshot.squadData || !Array.isArray(snapshot.squadData.starters) || !Array.isArray(snapshot.squadData.bench)) return false;
  if ((snapshot.workspaceId || 'legacy-11') !== ACTIVE_PROFILE.id) return false;
  if (snapshot.squadData.starters.length !== PLAYER_COUNT) return false;
  if (snapshot.matchFormat && snapshot.matchFormat !== PLAYER_COUNT) return false;
  snapshot = LaoheDefaults.upgrade(snapshot, ACTIVE_PROFILE, INLINE_PLAYER_DATA, FORMATIONS);
  replaceSquadData(snapshot.squadData);
  replaceCoachData(snapshot.coachData);
  replaceManagerData(snapshot.managerData);
  replaceTeamData(snapshot.teamData);
  if (Array.isArray(snapshot.legendsData) && snapshot.legendsData.length) {
    const nextLegends = LEGENDS_DATA.map(normalizeLegend);
    snapshot.legendsData.forEach((item, i) => {
      if (item && typeof item === 'object') {
        const normalizedItem = normalizeLegend(item);
        const targetIndex = nextLegends.findIndex(legend =>
          legend.name === normalizedItem.name || String(legend.num) === String(normalizedItem.num)
        );
        const index = targetIndex >= 0 ? targetIndex : i;
        if (nextLegends[index]) {
          nextLegends[index] = normalizeLegend({
            ...nextLegends[index],
            ...mergeSavedPhotoFields(nextLegends[index], item)
          });
        }
      }
    });
    LEGENDS_DATA = nextLegends;
  }
  if (Array.isArray(snapshot.reviewsData)) {
    REVIEWS_DATA = snapshot.reviewsData.map(normalizeReview).filter(Boolean);
  }
  if (Array.isArray(snapshot.attendanceData)) {
    ATTENDANCE_DATA = snapshot.attendanceData.map(normalizeAttendanceRecord).filter(Boolean);
  }
  if (Array.isArray(snapshot.mvpVotesData)) {
    MVP_VOTES_DATA = snapshot.mvpVotesData.map(normalizeMvpVote).filter(Boolean);
  }
  setEditableTexts(snapshot.editables);
  currentFormation = FORMATIONS[snapshot.formation]?.slots.length === PLAYER_COUNT ? snapshot.formation : DEFAULT_FORMATION;
  currentKit = snapshot.kit === 'away' ? 'away' : 'home';
  currentShowStats = snapshot.showStats !== false;
  reportLink = typeof snapshot.reportLink === 'string' ? snapshot.reportLink : '';
  const snapshotHasPlayerLabels = Array.isArray(snapshot.squadData?.starters) &&
    snapshot.squadData.starters.some(player => player && (player.pos || player.role));
  if (!snapshotHasPlayerLabels) applyCurrentFormationLabels();
  updateControls();
  renderAll();
  if (shouldSave) saveLastState();
  return true;
}

function renderLineupSwitcher() {
  const formation = FORMATIONS[currentFormation];
  starterSlotSelect.innerHTML = '';
  benchPlayerSelect.innerHTML = '';

  formation.slots.forEach(slot => {
    const player = SQUAD_DATA.starters[slot.playerIndex];
    if (!player) return;
    const option = document.createElement('option');
    option.value = String(slot.playerIndex);
    option.textContent = `${slot.pos} · #${player.num} ${player.name}`;
    starterSlotSelect.appendChild(option);
  });

  SQUAD_DATA.bench.forEach((player, index) => {
    const option = document.createElement('option');
    option.value = `bench:${index}`;
    option.textContent = `#${player.num} ${player.name} · ${player.role || player.pos || '替补'}`;
    benchPlayerSelect.appendChild(option);
  });
  getSpecialSwapCandidates().forEach(candidate => {
    const option = document.createElement('option');
    option.value = candidate.value;
    option.textContent = candidate.label;
    benchPlayerSelect.appendChild(option);
  });

  const disabled = !canEdit() || !starterSlotSelect.options.length || !benchPlayerSelect.options.length;
  starterSlotSelect.disabled = disabled;
  benchPlayerSelect.disabled = disabled;
  swapStarterBtn.disabled = disabled;
}

function setUploadButtonState(button, hasImage, emptyLabel) {
  if (!button) return;
  button.classList.toggle('is-uploaded', Boolean(hasImage));
  button.textContent = hasImage ? '✓ 已上传' : emptyLabel;
}

function updateControls() {
  document.querySelectorAll('.formation-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.formation === currentFormation);
    btn.setAttribute('aria-pressed', String(btn.dataset.formation === currentFormation));
  });
  document.querySelectorAll('.kit-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.kit === currentKit);
    btn.setAttribute('aria-pressed', String(btn.dataset.kit === currentKit));
  });
  poster.dataset.kit = currentKit;
  formationDisplay.textContent = FORMATIONS[currentFormation].label;
  syncFormationMetaText();
  document.querySelectorAll('.stats-toggle-btn').forEach(btn => {
    btn.classList.toggle('active', String(currentShowStats) === btn.dataset.statsVisible);
  });
  reportLinkInput.value = reportLink;
  coachShowInput.checked = COACH_DATA.show;
  coachNumInput.value = COACH_DATA.num;
  coachPosInput.value = COACH_DATA.posLabel;
  coachNameInput.value = COACH_DATA.name;
  coachRoleInput.value = COACH_DATA.role;
  document.getElementById('coach-status-input').value = COACH_DATA.status || 'fit';
  setUploadButtonState(coachUploadHomeBtn, Boolean(COACH_DATA.avatarHome || COACH_DATA.avatar), '上传主场照');
  setUploadButtonState(coachUploadAwayBtn, Boolean(COACH_DATA.avatarAway), '上传客场照');
  coachClearBtn.disabled = !COACH_DATA.avatar && !COACH_DATA.avatarHome && !COACH_DATA.avatarAway;
  managerShowInput.checked = MANAGER_DATA.show;
  managerNumInput.value = MANAGER_DATA.num;
  managerPosInput.value = MANAGER_DATA.posLabel;
  managerNameInput.value = MANAGER_DATA.name;
  managerRoleInput.value = MANAGER_DATA.role;
  setUploadButtonState(managerUploadHomeBtn, Boolean(MANAGER_DATA.avatarHome || MANAGER_DATA.avatar), '上传主场照');
  setUploadButtonState(managerUploadAwayBtn, Boolean(MANAGER_DATA.avatarAway), '上传客场照');
  managerClearBtn.disabled = !MANAGER_DATA.avatar && !MANAGER_DATA.avatarHome && !MANAGER_DATA.avatarAway;
  teamLogoClearBtn.disabled = !TEAM_DATA.logo && !TEAM_DATA.logoHome && !TEAM_DATA.logoAway;
  renderLineupSwitcher();
  updateEditMode();
}

function updatePosterPreviewScale() {
  if (!poster || !posterStage) return;
  if (window.matchMedia('(min-width: 821px)').matches || document.body.classList.contains('exporting-poster')) {
    poster.style.setProperty('--poster-scale', '1');
    posterStage.style.height = '';
    return;
  }

  const scale = Math.min(1, posterStage.clientWidth / 760);
  poster.style.setProperty('--poster-scale', String(scale));
  posterStage.style.height = `${poster.offsetHeight * scale}px`;
}

// ============================================================
// 渲染
// ============================================================
function getCurrentTeamLogo() {
  const kitLogo = currentKit === 'away' ? TEAM_DATA.logoAway : TEAM_DATA.logoHome;
  return resolveImageSource(kitLogo || TEAM_DATA.logo);
}

function renderTeamLogo() {
  const logo = getCurrentTeamLogo();
  teamLogo.classList.toggle('has-image', Boolean(logo));
  teamLogo.innerHTML = logo
    ? `<img class="head-logo-img" src="${escapeAttr(logo)}" alt="">`
    : '🦅';
}

function renderReportQr() {
  const value = reportLink.trim();
  reportQr.hidden = !value;
  qrBox.innerHTML = '';
  if (!value) return;

  if (typeof QRCode === 'function') {
    new QRCode(qrBox, {
      text: value,
      width: 52,
      height: 52,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  } else {
    qrBox.textContent = 'QR';
  }
}

function renderPitch() {
  const formation = FORMATIONS[currentFormation];
  formationDisplay.textContent = formation.label;
  pitch.innerHTML = '<div class="penalty"></div><div class="small-box"></div>';

  formation.slots.forEach(slot => {
    const player = SQUAD_DATA.starters[slot.playerIndex];
    const coord = slot.coord;
    if (!player || !coord) return;
    const avatar = getCurrentAvatar(player);
    const fallbackAvatar = getDefaultPlayerAvatar(player);
    const statusIcon = getStatusIcon(player.status);
    const statsBadge = getStatsBadgeText(player);
    const card = document.createElement('div');
    card.className = `player-card ${player.status === 'injured' || player.status === 'suspended' ? 'unavailable' : ''}`;
    card.dataset.starterIndex = String(slot.playerIndex);
    card.style.left = coord[0] + '%';
    card.style.top = coord[1] + '%';
    card.draggable = canEdit();
    card.innerHTML = `
      <div class="player-avatar">
        <span class="player-pos" contenteditable="${canEdit() ? 'true' : 'false'}" data-player-field="pos" data-starter-index="${slot.playerIndex}">${escapeHtml(player.pos)}</span>
        ${statusIcon ? `<span class="status-badge">${statusIcon}</span>` : ''}
        ${statsBadge ? `<span class="stats-badge">${escapeHtml(statsBadge)}</span>` : ''}
        ${avatar || fallbackAvatar ? renderImageTag('player-avatar-img', avatar, fallbackAvatar, player.name) : `<span class="missing-photo"><strong>${escapeHtml(player.num)}</strong><small>待补照片</small></span>`}
      </div>
      <div class="player-name"><span contenteditable="${canEdit() ? 'true' : 'false'}" data-player-field="name" data-starter-index="${slot.playerIndex}">${escapeHtml(player.name)}</span>${player.captain ? '<span class="captain-badge">C</span>' : ''}</div>
      <div class="player-role" contenteditable="${canEdit() ? 'true' : 'false'}" data-player-field="role" data-starter-index="${slot.playerIndex}">${escapeHtml(player.role)}</div>
    `;
    card.addEventListener('dragstart', handleStarterDragStart);
    card.addEventListener('dragend', handleStarterDragEnd);
    card.addEventListener('dragover', handleStarterDragOver);
    card.addEventListener('dragenter', handleStarterDragEnter);
    card.addEventListener('dragleave', handleStarterDragLeave);
    card.addEventListener('drop', handleStarterDrop);
    card.addEventListener('pointerdown', handleStarterPointerDown);
    pitch.appendChild(card);
  });
}
// staff cards no longer rendered on pitch — moved to staff-section strip

function renderBench() {
  // 只排序显示项；管理输入和拖拽仍使用原数组索引。
  const sortedBench = SQUAD_DATA.bench.map((player, index) => ({ player, index })).sort((a, b) => {
    const na = Number.parseInt(a.player.num, 10);
    const nb = Number.parseInt(b.player.num, 10);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return Number.isFinite(na) ? -1 : Number.isFinite(nb) ? 1 : 0;
  });
  benchGrid.innerHTML = '';
  sortedBench.forEach(({ player, index }) => {
    const avatar = getCurrentAvatar(player);
    const fallbackAvatar = getDefaultPlayerAvatar(player);
    const statusIcon = getStatusIcon(player.status);
    const item = document.createElement('div');
    item.className = `bench-item ${player.status === 'injured' || player.status === 'suspended' ? 'unavailable' : ''}`;
    item.draggable = canEdit();
    item.dataset.benchIndex = String(index);
    item.dataset.swapValue = `bench:${index}`;
    item.innerHTML = `
      <div class="bench-avatar">
        ${avatar || fallbackAvatar ? renderImageTag('bench-avatar-img', avatar, fallbackAvatar, player.name) : `<span class="missing-photo"><strong>${escapeHtml(player.num)}</strong><small>待补照片</small></span>`}
        ${statusIcon ? `<span class="bench-status-badge">${statusIcon}</span>` : ''}
      </div>
      <div class="bench-name">${escapeHtml(player.name)}${player.captain ? '<span class="captain-badge">C</span>' : ''}</div>
      <div class="bench-role">${escapeHtml(player.role || player.pos || '替补')}</div>
      ${(player.positions && player.positions.length) ? `<div class="bench-positions">${escapeHtml(player.positions.slice(0, 3).join(' · '))}</div>` : ''}
    `;
    item.addEventListener('dragstart', handleBenchDragStart);
    item.addEventListener('dragend', handleBenchDragEnd);
    item.addEventListener('pointerdown', handleBenchPointerDown);
    benchGrid.appendChild(item);
  });
}

function renderStaffSection() {
  const section = document.getElementById('staff-section');
  if (!section) return;
  const staff = [];
  if (COACH_DATA.show) staff.push({ data: COACH_DATA, swapValue: 'coach:0' });
  if (MANAGER_DATA.show) staff.push({ data: MANAGER_DATA, swapValue: '' });
  if (!staff.length) { section.hidden = true; return; }
  section.hidden = false;
  section.innerHTML = '';
  const title = document.createElement('div');
  title.className = 'staff-section-title';
  title.textContent = '▌ 教练与领队 · COACH & MANAGER';
  section.appendChild(title);
  const grid = document.createElement('div');
  grid.className = 'staff-grid';
  staff.forEach(({ data, swapValue }) => {
    const avatar = getStaffAvatar(data);
    const item = document.createElement('div');
    item.className = 'staff-item';
    item.classList.toggle('unavailable', data.status === 'injured' || data.status === 'suspended');
    item.draggable = Boolean(canEdit() && swapValue);
    if (swapValue) item.dataset.swapValue = swapValue;
    item.innerHTML = `
      <div class="staff-avatar">
        ${avatar ? renderImageTag('', avatar) : COACH_SVG_AVATAR}
      </div>
      <div class="staff-info">
        <div class="staff-pos-tag">${escapeHtml(data.posLabel)}</div>
        <div class="staff-name">${escapeHtml(data.name)}</div>
        <div class="staff-role">${escapeHtml(data.role)}</div>
        ${data.status === 'injured' ? '<span class="staff-status">受伤 · 暂不出场</span>' : ''}
      </div>
    `;
    if (swapValue) {
      item.addEventListener('dragstart', handleBenchDragStart);
      item.addEventListener('dragend', handleBenchDragEnd);
      item.addEventListener('pointerdown', handleBenchPointerDown);
    }
    grid.appendChild(item);
  });
  section.appendChild(grid);
}

function renderLegends() {
  if (!legendsGrid) return;
  legendsGrid.innerHTML = '';
  LEGENDS_DATA.forEach((legend, index) => {
    const normalized = normalizeLegend(legend);
    const avatar = getLegendAvatar(normalized);
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.draggable = canEdit();
    item.dataset.swapValue = `legend:${index}`;
    item.innerHTML = `
      <div class="legend-avatar" data-legend-index="${index}" title="点击上传照片">
        ${avatar ? renderImageTag('', avatar) : escapeHtml(String(normalized.num !== '' ? normalized.num : normalized.name.charAt(0)))}
      </div>
      <div class="legend-name">${escapeHtml(normalized.name)}</div>
      <div class="legend-role">${escapeHtml(normalized.role || '绝版人物')}</div>
    `;
    const avatarEl = item.querySelector('.legend-avatar');
    avatarEl.addEventListener('click', () => {
      if (!canEdit()) return;
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.addEventListener('change', async () => {
        const file = input.files && input.files[0];
        if (!file) return;
        try {
          LEGENDS_DATA[index].avatar = await getUploadImageSource(file, {
            kind: 'legends',
            num: normalized.num,
            name: normalized.name,
            field: 'avatar'
          });
          renderLegends();
          saveLastState();
        } catch (error) {
          console.warn('legend upload failed:', error);
          alert('照片上传失败，请稍后重试。');
        }
      });
      input.click();
    });
    item.addEventListener('dragstart', handleBenchDragStart);
    item.addEventListener('dragend', handleBenchDragEnd);
    item.addEventListener('pointerdown', handleBenchPointerDown);
    legendsGrid.appendChild(item);
  });
}

function renderStatusOptions(selectedStatus) {
  const options = [
    ['fit', '健康'],
    ['injured', '受伤'],
    ['yellow', '黄牌'],
    ['red', '红牌'],
    ['suspended', '停赛']
  ];
  return options.map(([value, label]) => (
    `<option value="${value}" ${value === selectedStatus ? 'selected' : ''}>${label}</option>`
  )).join('');
}

function renderPhotoManager() {
  photoManager.innerHTML = '';
  const rows = [
    ...SQUAD_DATA.starters.map((player, index) => ({ player, list: 'starters', index })),
    ...SQUAD_DATA.bench.map((player, index) => ({ player, list: 'bench', index })),
    ...LEGENDS_DATA.map((legend, index) => ({ player: normalizeLegend(legend), list: 'legends', index }))
  ].sort((a, b) => {
    const numA = Number.parseInt(a.player.num, 10);
    const numB = Number.parseInt(b.player.num, 10);
    if (Number.isFinite(numA) && Number.isFinite(numB) && numA !== numB) return numA - numB;
    return String(a.player.num).localeCompare(String(b.player.num), 'zh-CN');
  });
  photoManager.innerHTML = `
    <div class="photo-header">
      <div>成员（号 / 名 / 擅长位置 / 角色）</div>
      <div>进球 / 助攻 / 出场</div>
      <div>状态</div>
      <div>主场/照片</div>
      <div>客场照</div>
      <div>清除</div>
      </div>
    `;
  rows.forEach(({ player, list, index }) => {
    const isLegend = list === 'legends';
    const row = document.createElement('div');
    const hasHome = isLegend ? Boolean(player.avatarHome || player.avatar) : Boolean(player.avatarHome);
    const hasAway = Boolean(player.avatarAway);
    const disabledAttr = canEdit() ? '' : 'disabled';
    row.className = 'photo-row';
    row.innerHTML = `
      <div class="player-fields ${isLegend ? 'legend-fields' : ''}">
        <input class="ctrl-input player-field-input" type="text" value="${escapeAttr(player.num)}" data-action="update-player-field" data-list="${list}" data-index="${index}" data-field="num" aria-label="号码" ${disabledAttr}>
        <input class="ctrl-input player-field-input" type="text" value="${escapeAttr(player.name)}" data-action="update-player-field" data-list="${list}" data-index="${index}" data-field="name" aria-label="姓名" ${disabledAttr}>
        <input class="ctrl-input player-field-input" type="text" value="${escapeAttr(isLegend ? 'HOF' : (player.positions || []).join(', '))}" ${isLegend || !canEdit() ? 'disabled' : ''} data-action="update-player-field" data-list="${list}" data-index="${index}" data-field="positions" placeholder="${isLegend ? '' : 'LW, CAM...'}" aria-label="擅长位置（逗号分隔）">
        <input class="ctrl-input player-field-input" type="text" value="${escapeAttr(player.role || '')}" data-action="update-player-field" data-list="${list}" data-index="${index}" data-field="role" aria-label="角色" ${disabledAttr}>
      </div>
      ${isLegend ? '<div class="row-note">绝版人物</div>' : `<div class="stats-inputs" title="进球 / 助攻 / 出场">
        <input class="ctrl-input stat-input" type="number" min="0" step="1" value="${escapeAttr(player.stats.goals)}" data-action="update-stat" data-list="${list}" data-index="${index}" data-field="goals" aria-label="进球" ${disabledAttr}>
        <input class="ctrl-input stat-input" type="number" min="0" step="1" value="${escapeAttr(player.stats.assists)}" data-action="update-stat" data-list="${list}" data-index="${index}" data-field="assists" aria-label="助攻" ${disabledAttr}>
        <input class="ctrl-input stat-input" type="number" min="0" step="1" value="${escapeAttr(player.stats.appearances)}" data-action="update-stat" data-list="${list}" data-index="${index}" data-field="appearances" aria-label="出场" ${disabledAttr}>
      </div>`}
      ${isLegend ? '<div class="row-note">金色卡</div>' : `<select class="ctrl-select status-select" data-action="update-status" data-list="${list}" data-index="${index}" aria-label="状态">
        ${renderStatusOptions(player.status)}
      </select>`}
      <button class="ctrl-btn photo-btn ${hasHome ? 'is-uploaded' : ''}" data-action="upload-photo" data-list="${list}" data-index="${index}" data-field="avatarHome" ${disabledAttr}>${hasHome ? '✓ 已上传' : '上传主场照'}</button>
      <button class="ctrl-btn photo-btn ${hasAway ? 'is-uploaded' : ''}" data-action="upload-photo" data-list="${list}" data-index="${index}" data-field="avatarAway" ${disabledAttr}>${hasAway ? '✓ 已上传' : '上传客场照'}</button>
      <button class="ctrl-btn photo-btn" data-action="clear-photo" data-list="${list}" data-index="${index}" ${hasHome || hasAway ? disabledAttr : 'disabled'}>清除</button>
    `;
    if (!isLegend && !canEdit()) {
      const statusSelect = row.querySelector('select[data-action="update-status"]');
      if (statusSelect) statusSelect.disabled = true;
    }
    photoManager.appendChild(row);
  });
}

function getReviewablePlayers() {
  const byKey = new Map();
  [...SQUAD_DATA.starters, ...SQUAD_DATA.bench].forEach(player => {
    const normalized = normalizePlayer(player);
    const key = String(normalized.num ?? '').trim();
    if (key && !byKey.has(`player:${key}`)) {
      byKey.set(`player:${key}`, {
        ...normalized,
        reviewKey: `player:${key}`,
        reviewType: 'player'
      });
    }
  });
  if (COACH_DATA.show) {
    byKey.set('coach', {
      num: COACH_DATA.num || '3',
      name: COACH_DATA.name || '教练',
      role: COACH_DATA.role || '教练',
      reviewKey: 'coach',
      reviewType: 'coach'
    });
  }
  if (MANAGER_DATA.show) {
    byKey.set('manager', {
      num: MANAGER_DATA.num || '·',
      name: MANAGER_DATA.name || '领队',
      role: MANAGER_DATA.role || '领队',
      reviewKey: 'manager',
      reviewType: 'manager'
    });
  }
  LEGENDS_DATA.forEach(legend => {
    const item = normalizeLegend(legend);
    const key = `legend:${item.num || item.name}`;
    byKey.set(key, {
      num: item.num,
      name: item.name,
      role: item.role || '绝版人物',
      reviewKey: key,
      reviewType: 'legend'
    });
  });
  return Array.from(byKey.values()).sort((a, b) => {
    const numA = Number.parseInt(a.num, 10);
    const numB = Number.parseInt(b.num, 10);
    if (Number.isFinite(numA) && Number.isFinite(numB) && numA !== numB) return numA - numB;
    if (a.reviewType !== b.reviewType) {
      const order = { player: 0, coach: 1, manager: 2, legend: 3 };
      return (order[a.reviewType] ?? 9) - (order[b.reviewType] ?? 9);
    }
    return String(a.num).localeCompare(String(b.num), 'zh-CN');
  });
}

function findReviewablePlayer(value) {
  const key = String(value ?? '').trim();
  return getReviewablePlayers().find(player =>
    player.reviewKey === key || String(player.num) === key
  ) || null;
}

function findLineupPersonByNumber(value) {
  const key = String(value ?? '').trim();
  if (!key) return null;
  const players = [
    ...SQUAD_DATA.starters.map(normalizePlayer),
    ...SQUAD_DATA.bench.map(normalizePlayer),
    ...LEGENDS_DATA.map(normalizeLegend)
  ];
  return players.find(player => String(player.num ?? '').trim() === key) || null;
}

function findLineupPersonNameByNumber(value) {
  const player = findLineupPersonByNumber(value);
  return player ? player.name : '';
}

function getAttendancePlayers() {
  const byNum = new Map();
  [...SQUAD_DATA.starters, ...SQUAD_DATA.bench].forEach(player => {
    const normalized = normalizePlayer(player);
    const key = String(normalized.num ?? '').trim();
    if (key && normalized.name && !byNum.has(key)) {
      byNum.set(key, normalized);
    }
  });
  return Array.from(byNum.values()).sort((a, b) => {
    const numA = Number.parseInt(a.num, 10);
    const numB = Number.parseInt(b.num, 10);
    if (Number.isFinite(numA) && Number.isFinite(numB) && numA !== numB) return numA - numB;
    return String(a.num).localeCompare(String(b.num), 'zh-CN');
  });
}

function findAttendancePlayer(value) {
  const key = String(value ?? '').trim();
  return getAttendancePlayers().find(player => String(player.num) === key) || null;
}

function getAttendanceStatusInfo(status) {
  return ATTENDANCE_STATUS_META[status] || ATTENDANCE_STATUS_META.in;
}

function setTeamPlayStatus(element, message = '', isError = false) {
  if (!element) return;
  element.textContent = message;
  element.classList.toggle('is-error', Boolean(isError));
}

function getTeamPlayIdentity() {
  try {
    return localStorageAdapter.readJson(STORAGE_KEYS.teamPlayIdentity, {});
  } catch (error) {
    console.warn('读取互动身份失败：', error);
    return {};
  }
}

function saveTeamPlayIdentity(identity = {}) {
  try {
    localStorageAdapter.writeJson(STORAGE_KEYS.teamPlayIdentity, {
      attendancePlayerNum: String(identity.attendancePlayerNum || attendancePlayerSelect?.value || ''),
      attendanceNickname: String(identity.attendanceNickname || attendanceNicknameInput?.value || '').slice(0, 18),
      familiarPlayerNum: String(identity.familiarPlayerNum || mvpFamiliarNumInput?.value || ''),
      nickname: String(identity.nickname || mvpNicknameInput?.value || '').slice(0, 18)
    });
  } catch (error) {
    console.warn('保存互动身份失败：', error);
  }
}

function applyTeamPlayIdentityToInputs() {
  const identity = getTeamPlayIdentity();
  if (attendanceNicknameInput && !attendanceNicknameInput.value) {
    attendanceNicknameInput.value = identity.attendanceNickname || identity.nickname || '';
  }
  if (mvpFamiliarNumInput && !mvpFamiliarNumInput.value) {
    mvpFamiliarNumInput.value = identity.familiarPlayerNum || '';
  }
  if (mvpNicknameInput && !mvpNicknameInput.value) {
    mvpNicknameInput.value = identity.nickname || identity.attendanceNickname || '';
  }
}

function buildAttendanceWithRecord(record, records = ATTENDANCE_DATA) {
  const normalized = normalizeAttendanceRecord(record);
  const existing = normalizeAttendanceForSnapshot(records);
  if (!normalized) return existing;
  const deviceId = normalized.deviceId;
  return [
    normalized,
    ...existing.filter(item => item.id !== normalized.id && (!deviceId || item.deviceId !== deviceId))
  ].slice(0, 200);
}

function buildMvpVotesWithVote(vote, votes = MVP_VOTES_DATA) {
  const normalized = normalizeMvpVote(vote);
  const existing = normalizeMvpVotesForSnapshot(votes);
  if (!normalized) return existing;
  const deviceId = normalized.deviceId;
  return [
    normalized,
    ...existing.filter(item => item.id !== normalized.id && (!deviceId || item.deviceId !== deviceId))
  ].slice(0, 400);
}

function upsertAttendanceRecord(record) {
  ATTENDANCE_DATA = buildAttendanceWithRecord(record);
  return normalizeAttendanceRecord(record);
}

function upsertMvpVote(vote) {
  MVP_VOTES_DATA = buildMvpVotesWithVote(vote);
  return normalizeMvpVote(vote);
}

function renderAttendanceSummary() {
  if (!attendanceSummary) return;
  const records = normalizeAttendanceForSnapshot().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const counts = records.reduce((acc, record) => {
    acc[record.status] = (acc[record.status] || 0) + 1;
    return acc;
  }, { in: 0, maybe: 0, out: 0 });
  const countHtml = ['in', 'maybe', 'out'].map(status => {
    const info = getAttendanceStatusInfo(status);
    return `<span class="team-play-chip ${info.className}">${escapeHtml(info.label)} ${counts[status] || 0}</span>`;
  }).join('');
  const listHtml = records.length
    ? records.slice(0, 12).map(record => {
      const info = getAttendanceStatusInfo(record.status);
      const time = formatReviewTime(record.updatedAt);
      const nickname = record.nickname ? ` · ${record.nickname}` : '';
      const region = record.ipRegion ? ` · IP：${record.ipRegion}` : '';
      return `<div class="team-play-item">
        <div><strong>#${escapeHtml(record.playerNum)} ${escapeHtml(record.playerName)}</strong> <span class="team-play-chip ${info.className}">${escapeHtml(info.label)}</span></div>
        <div class="muted">${escapeHtml(`${time || '刚刚'}${nickname}${region}`)}</div>
      </div>`;
    }).join('')
    : '<div class="team-play-empty">还没有报名记录。</div>';
  attendanceSummary.innerHTML = `<div class="team-play-counts">${countHtml}</div><div class="team-play-list">${listHtml}</div>`;
}

function renderMvpSummary() {
  if (!mvpSummary) return;
  const votes = normalizeMvpVotesForSnapshot().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const grouped = new Map();
  votes.forEach(vote => {
    const key = vote.targetKey || `player:${vote.targetNum}`;
    const current = grouped.get(key) || { vote, count: 0, latestAt: vote.updatedAt };
    current.count += 1;
    if (new Date(vote.updatedAt) > new Date(current.latestAt)) {
      current.vote = vote;
      current.latestAt = vote.updatedAt;
    }
    grouped.set(key, current);
  });
  const ranking = Array.from(grouped.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return new Date(b.latestAt) - new Date(a.latestAt);
  });
  const countHtml = `<span class="team-play-chip is-in">已投 ${votes.length}</span><span class="team-play-chip">候选 ${ranking.length}</span>`;
  const listHtml = ranking.length
    ? ranking.slice(0, 8).map((item, index) => {
      const vote = item.vote;
      const voter = vote.reviewerName ? ` · 最新：${vote.reviewerName}` : '';
      const region = vote.ipRegion ? ` · IP：${vote.ipRegion}` : '';
      return `<div class="team-play-item">
        <div><strong>${index + 1}. ${vote.targetType === 'player' ? '#' : ''}${escapeHtml(vote.targetNum)} ${escapeHtml(vote.targetName)}</strong> <span class="team-play-chip is-maybe">${item.count} 票</span></div>
        <div class="muted">${escapeHtml(`${formatReviewTime(item.latestAt) || '刚刚'}${voter}${region}`)}</div>
      </div>`;
    }).join('')
    : '<div class="team-play-empty">还没有 MVP 投票。</div>';
  mvpSummary.innerHTML = `<div class="team-play-counts">${countHtml}</div><div class="team-play-list">${listHtml}</div>`;
}

function renderTeamPlayTool() {
  const attendancePlayers = getAttendancePlayers();
  const previousAttendance = attendancePlayerSelect?.value || getTeamPlayIdentity().attendancePlayerNum || '';
  if (attendancePlayerSelect) {
    attendancePlayerSelect.innerHTML = attendancePlayers.map(player => (
      `<option value="${escapeAttr(player.num)}">#${escapeHtml(player.num)} ${escapeHtml(player.name)}</option>`
    )).join('');
    if (attendancePlayers.some(player => String(player.num) === previousAttendance)) {
      attendancePlayerSelect.value = previousAttendance;
    } else if (attendancePlayers[0]) {
      attendancePlayerSelect.value = String(attendancePlayers[0].num);
    }
  }
  if (attendanceSubmitBtn) attendanceSubmitBtn.disabled = !attendancePlayers.length;

  const mvpTargets = getReviewablePlayers();
  const previousMvpTarget = mvpTargetSelect?.value || '';
  if (mvpTargetSelect) {
    mvpTargetSelect.innerHTML = mvpTargets.map(player => (
      `<option value="${escapeAttr(player.reviewKey)}">${player.reviewType === 'player' ? '#' : ''}${escapeHtml(player.num)} ${escapeHtml(player.name)}</option>`
    )).join('');
    if (mvpTargets.some(player => player.reviewKey === previousMvpTarget)) {
      mvpTargetSelect.value = previousMvpTarget;
    } else if (mvpTargets[0]) {
      mvpTargetSelect.value = String(mvpTargets[0].reviewKey);
    }
  }
  if (mvpSubmitBtn) mvpSubmitBtn.disabled = !mvpTargets.length;
  applyTeamPlayIdentityToInputs();
  renderAttendanceSummary();
  renderMvpSummary();
}

async function submitAttendance() {
  const player = findAttendancePlayer(attendancePlayerSelect?.value || '');
  if (!player) {
    setTeamPlayStatus(attendanceStatus, '请选择要报名的球员。', true);
    return;
  }
  const status = ATTENDANCE_STATUS_META[attendanceStatusSelect?.value] ? attendanceStatusSelect.value : 'in';
  const nickname = String(attendanceNicknameInput?.value || '').trim().slice(0, 18);
  const now = new Date().toISOString();
  const record = normalizeAttendanceRecord({
    playerNum: String(player.num),
    playerName: player.name,
    status,
    nickname,
    deviceId: getReviewDeviceId(),
    createdAt: now,
    updatedAt: now
  });
  if (!record) {
    setTeamPlayStatus(attendanceStatus, '报名内容不完整。', true);
    return;
  }
  saveTeamPlayIdentity({ attendancePlayerNum: record.playerNum, attendanceNickname: nickname });
  if (isCloudBaseSyncHost() && cloudSyncState.initialized && CLOUDBASE_CONFIG.publishFunction) {
    try {
      setTeamPlayStatus(attendanceStatus, '正在提交报名...');
      const { response } = await callPublishFunction({
        action: 'submitAttendance',
        docId: CLOUDBASE_CONFIG.currentDocId,
        attendance: record,
        clientInfo: getReviewClientInfo(),
        clientUpdatedAt: new Date().toISOString()
      });
      const result = normalizePublishResult(response);
      if (result && result.ok === false) {
        throw new Error(`${result.code || 'FUNCTION_ERROR'} · ${result.message || '报名保存失败'}`);
      }
      const savedRecord = upsertAttendanceRecord(result?.record || record);
      localStorageAdapter.writeLastState(createSnapshot());
      renderTeamPlayTool();
      setTeamPlayStatus(attendanceStatus, `已报名：#${savedRecord.playerNum} ${savedRecord.playerName} · ${getAttendanceStatusInfo(savedRecord.status).label}`);
      return;
    } catch (error) {
      console.warn('CloudBase attendance submit failed:', error);
      upsertAttendanceRecord(record);
      localStorageAdapter.writeLastState(createSnapshot());
      renderTeamPlayTool();
      setTeamPlayStatus(attendanceStatus, `云端报名失败，已暂存在本机：${getCloudErrorMessage(error)}`, true);
      return;
    }
  }
  const savedRecord = upsertAttendanceRecord(record);
  renderTeamPlayTool();
  setTeamPlayStatus(attendanceStatus, `已本地报名：#${savedRecord.playerNum} ${savedRecord.playerName} · ${getAttendanceStatusInfo(savedRecord.status).label}`);
  saveLastState();
}

async function submitMvpVote() {
  const target = findReviewablePlayer(mvpTargetSelect?.value || '');
  if (!target) {
    setTeamPlayStatus(mvpStatus, '请选择 MVP 球员。', true);
    return;
  }
  const reviewerNum = String(mvpFamiliarNumInput?.value || '').trim();
  if (!/^\d{1,3}$/.test(reviewerNum)) {
    setTeamPlayStatus(mvpStatus, '投票前请先输入一个你熟悉的老和山球员号码。', true);
    mvpFamiliarNumInput?.focus();
    return;
  }
  const familiarPlayer = findLineupPersonByNumber(reviewerNum);
  if (!familiarPlayer) {
    setTeamPlayStatus(mvpStatus, '这个号码暂时不在老和山名单里，请换一个熟悉球员号码。', true);
    mvpFamiliarNumInput?.focus();
    return;
  }
  const reviewerName = String(mvpNicknameInput?.value || '').trim().slice(0, 18);
  if (!reviewerName) {
    setTeamPlayStatus(mvpStatus, '投票前请先输入你的昵称。', true);
    mvpNicknameInput?.focus();
    return;
  }
  const now = new Date().toISOString();
  const vote = normalizeMvpVote({
    targetKey: target.reviewKey,
    targetNum: String(target.num),
    targetName: target.name,
    targetType: target.reviewType,
    reviewerNum,
    reviewerName,
    familiarPlayerNum: reviewerNum,
    familiarPlayerName: familiarPlayer.name,
    deviceId: getReviewDeviceId(),
    createdAt: now,
    updatedAt: now
  });
  if (!vote) {
    setTeamPlayStatus(mvpStatus, '投票内容不完整。', true);
    return;
  }
  saveTeamPlayIdentity({ familiarPlayerNum: reviewerNum, nickname: reviewerName });
  if (isCloudBaseSyncHost() && cloudSyncState.initialized && CLOUDBASE_CONFIG.publishFunction) {
    try {
      setTeamPlayStatus(mvpStatus, '正在提交 MVP 投票...');
      const { response } = await callPublishFunction({
        action: 'submitMvpVote',
        docId: CLOUDBASE_CONFIG.currentDocId,
        vote,
        clientInfo: getReviewClientInfo(),
        clientUpdatedAt: new Date().toISOString()
      });
      const result = normalizePublishResult(response);
      if (result && result.ok === false) {
        throw new Error(`${result.code || 'FUNCTION_ERROR'} · ${result.message || '投票保存失败'}`);
      }
      const savedVote = upsertMvpVote(result?.vote || vote);
      localStorageAdapter.writeLastState(createSnapshot());
      renderTeamPlayTool();
      setTeamPlayStatus(mvpStatus, `已投 MVP：${savedVote.targetType === 'player' ? '#' : ''}${savedVote.targetNum} ${savedVote.targetName}`);
      return;
    } catch (error) {
      console.warn('CloudBase MVP submit failed:', error);
      upsertMvpVote(vote);
      localStorageAdapter.writeLastState(createSnapshot());
      renderTeamPlayTool();
      setTeamPlayStatus(mvpStatus, `云端投票失败，已暂存在本机：${getCloudErrorMessage(error)}`, true);
      return;
    }
  }
  const savedVote = upsertMvpVote(vote);
  renderTeamPlayTool();
  setTeamPlayStatus(mvpStatus, `已本地投 MVP：${savedVote.targetType === 'player' ? '#' : ''}${savedVote.targetNum} ${savedVote.targetName}`);
  saveLastState();
}

function formatReviewTime(value) {
  const time = new Date(value);
  if (Number.isNaN(time.getTime())) return '';
  return `${time.getMonth() + 1}/${time.getDate()} ${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
}

function getReviewDeviceId() {
  try {
    let id = localStorage.getItem(STORAGE_KEYS.reviewDeviceId);
    if (!id) {
      id = (window.crypto?.randomUUID && window.crypto.randomUUID()) || `review-device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(STORAGE_KEYS.reviewDeviceId, id);
    }
    return id;
  } catch (error) {
    return `review-device-memory-${Date.now()}`;
  }
}

function getReviewClientInfo() {
  const screenInfo = window.screen
    ? `${window.screen.width || 0}x${window.screen.height || 0}@${window.devicePixelRatio || 1}`
    : '';
  return {
    userAgent: navigator.userAgent || '',
    platform: navigator.platform || '',
    language: navigator.language || '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    screen: screenInfo
  };
}

function getReviewAttribution(review = {}) {
  const normalized = normalizeReview(review);
  if (!normalized) return '匿名评价';
  if (normalized.reviewerAuth === 'team_edit') {
    return normalized.reviewerNum ? `#${normalized.reviewerNum}` : '队内成员';
  }
  const nickname = normalized.reviewerName ? ` ${normalized.reviewerName}` : '';
  if (normalized.familiarPlayerName) {
    const region = normalized.ipRegion ? `（IP：${normalized.ipRegion}）` : '';
    return `${normalized.familiarPlayerName}的朋友${nickname}${region}`;
  }
  if (normalized.reviewerName) {
    return normalized.reviewerNum ? `#${normalized.reviewerNum} ${normalized.reviewerName}` : normalized.reviewerName;
  }
  return normalized.reviewerNum ? `#${normalized.reviewerNum}` : '匿名朋友';
}

function getReviewIpRegion(review = {}) {
  const region = String(review.ipRegion || review.reviewMeta?.ipRegion || '').trim();
  return region;
}

function getReviewMetaHtml(review = {}) {
  const normalized = normalizeReview(review);
  if (!normalized) return '<span class="review-meta-id">匿名评价</span>';
  const parts = [];
  if (normalized.reviewerAuth === 'team_edit') {
    parts.push(`<span class="review-meta-id">${escapeHtml(normalized.reviewerNum ? `#${normalized.reviewerNum}` : '队内成员')}</span>`);
  } else {
    const friendLabel = normalized.familiarPlayerName ? `${normalized.familiarPlayerName}的朋友` : '朋友评价';
    parts.push(`<span class="review-meta-friend">${escapeHtml(friendLabel)}</span>`);
    if (normalized.reviewerName) {
      parts.push(`<span class="review-meta-nickname">${escapeHtml(normalized.reviewerName)}</span>`);
    }
  }
  parts.push(`<span class="review-meta-score">${escapeHtml(normalized.rating)} 分</span>`);
  const time = formatReviewTime(normalized.createdAt);
  if (time) {
    parts.push(`<span class="review-meta-time">${escapeHtml(time)}</span>`);
  }
  const region = getReviewIpRegion(normalized);
  if (region) {
    parts.push(`<span class="review-meta-ip">IP：${escapeHtml(region)}</span>`);
  }
  return parts.join('<span class="review-meta-dot">·</span>');
}

function getReviewReplyMetaHtml(reply = {}) {
  const normalized = normalizeReviewReply(reply);
  if (!normalized) return '<span class="review-meta-id">匿名回复</span>';
  const parts = [];
  if (normalized.reviewerAuth === 'team_edit') {
    parts.push(`<span class="review-meta-id">${escapeHtml(normalized.reviewerNum ? `#${normalized.reviewerNum}` : '队内成员')}</span>`);
  } else {
    const friendLabel = normalized.familiarPlayerName ? `${normalized.familiarPlayerName}的朋友` : '朋友回复';
    parts.push(`<span class="review-meta-friend">${escapeHtml(friendLabel)}</span>`);
    if (normalized.reviewerName) {
      parts.push(`<span class="review-meta-nickname">${escapeHtml(normalized.reviewerName)}</span>`);
    }
  }
  const time = formatReviewTime(normalized.createdAt);
  if (time) {
    parts.push(`<span class="review-meta-time">${escapeHtml(time)}</span>`);
  }
  const region = getReviewIpRegion(normalized);
  if (region) {
    parts.push(`<span class="review-meta-ip">IP：${escapeHtml(region)}</span>`);
  }
  return parts.join('<span class="review-meta-dot">·</span>');
}

function renderReviewAttachmentsHtml(attachments = []) {
  const items = normalizeReviewAttachments(attachments);
  if (!items.length) return '';
  return `<div class="review-attachments">${items.map(attachment => {
    const src = resolveImageSource(attachment.src);
    const fileID = getCloudImageFileID(attachment.src, src);
    const fileAttr = fileID ? ` data-cloud-file-id="${escapeAttr(fileID)}"` : '';
    return src ? `<img class="review-attachment-img" src="${escapeAttr(src)}"${fileAttr} alt="${escapeAttr(attachment.name || '评价图片')}" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : '';
  }).join('')}</div>`;
}

function renderReviewRepliesHtml(replies = [], reviewId = '') {
  const items = Array.isArray(replies) ? replies.map(normalizeReviewReply).filter(Boolean) : [];
  if (!items.length) return '';
  return `<div class="review-replies">${items.map(reply => `
    <div class="review-reply">
      <div class="review-reply-meta">
        <span class="review-meta-line">${getReviewReplyMetaHtml(reply)}</span>
        ${canDeleteReviewReply(reply) ? `<button class="review-delete-btn" type="button" data-action="delete-reply" data-review-id="${escapeAttr(reviewId)}" data-reply-id="${escapeAttr(reply.id)}">删除</button>` : ''}
      </div>
      ${reply.comment ? `<div class="review-item-comment">${escapeHtml(reply.comment)}</div>` : ''}
      ${renderReviewAttachmentsHtml(reply.attachments)}
    </div>
  `).join('')}</div>`;
}

function canDeleteReview(review = {}) {
  return canEdit() && Boolean(review.id);
}

function canDeleteReviewReply(reply = {}) {
  return canEdit() && Boolean(reply.id);
}

function prependReview(review) {
  const normalized = normalizeReview(review);
  if (!normalized) return null;
  REVIEWS_DATA = [
    normalized,
    ...REVIEWS_DATA
      .map(normalizeReview)
      .filter(Boolean)
      .filter(item => item.id !== normalized.id)
  ].slice(0, 800);
  return normalized;
}

function removeReviewById(reviewId) {
  const id = String(reviewId || '');
  REVIEWS_DATA = REVIEWS_DATA
    .map(normalizeReview)
    .filter(Boolean)
    .filter(review => review.id !== id);
}

function removeReplyById(reviewId, replyId) {
  REVIEWS_DATA = buildReviewsWithoutReply(reviewId, replyId);
}

function setReviewMode(mode, shouldRender = true) {
  currentReviewMode = mode === REVIEW_MODE_TEAM ? REVIEW_MODE_TEAM : REVIEW_MODE_FRIEND;
  try {
    localStorage.setItem(STORAGE_KEYS.reviewMode, currentReviewMode);
  } catch (error) {
    console.warn('保存评价模式失败：', error);
  }
  applyReviewIdentityToInputs();
  if (shouldRender) renderReviewTool();
}

function getReviewIdentity() {
  try {
    return localStorageAdapter.readJson(STORAGE_KEYS.reviewIdentity, {});
  } catch (error) {
    console.warn('读取评价身份失败：', error);
    return {};
  }
}

function applyReviewIdentityToInputs() {
  const identity = getReviewIdentity();
  if (currentReviewMode === REVIEW_MODE_TEAM) {
    if (reviewerNumInput) reviewerNumInput.value = identity.teamReviewerNum || '';
    if (reviewerNameInput) reviewerNameInput.value = '';
  } else {
    if (reviewerNumInput) reviewerNumInput.value = identity.friendPlayerNum || '';
    if (reviewerNameInput) reviewerNameInput.value = identity.friendReviewerName || '';
  }
}

function loadReviewIdentity() {
  applyReviewIdentityToInputs();
}

function saveReviewIdentityForMode(reviewerNum, reviewerName = '') {
  try {
    const identity = getReviewIdentity();
    if (currentReviewMode === REVIEW_MODE_TEAM) {
      identity.teamReviewerNum = reviewerNum;
    } else {
      identity.friendPlayerNum = reviewerNum;
      identity.friendReviewerName = reviewerName;
    }
    localStorageAdapter.writeJson(STORAGE_KEYS.reviewIdentity, identity);
  } catch (error) {
    console.warn('保存评价身份失败：', error);
  }
}

function setReviewStatus(message = '', isError = false) {
  if (!reviewStatus) return;
  reviewStatus.textContent = message;
  reviewStatus.classList.toggle('is-error', Boolean(isError));
}

function setMainReviewImages(files = []) {
  pendingReviewAttachmentFiles = normalizeReviewImageFiles(files);
  if (reviewImageStatus) {
    reviewImageStatus.textContent = formatReviewImageStatus(pendingReviewAttachmentFiles, `可选：上传最多 ${MAX_REVIEW_ATTACHMENTS} 张评价图片，支持 GIF 动图。`);
  }
  if (reviewImageClearBtn) reviewImageClearBtn.hidden = !pendingReviewAttachmentFiles.length;
}

function clearMainReviewImage() {
  setMainReviewImages([]);
}

async function chooseMainReviewImage() {
  const files = await chooseImageFiles();
  if (!files.length) return;
  setMainReviewImages(files);
}

function setReplyImages(reviewId, files = []) {
  const id = String(reviewId || '');
  if (!id) return;
  const selectedFiles = normalizeReviewImageFiles(files);
  if (selectedFiles.length) pendingReplyAttachmentFiles.set(id, selectedFiles);
  else pendingReplyAttachmentFiles.delete(id);
  const form = Array.from(reviewSummary?.querySelectorAll('.review-reply-form') || [])
    .find(item => item.dataset.reviewId === id);
  const status = form?.querySelector('[data-role="reply-image-status"]');
  if (status) status.textContent = formatReviewImageStatus(selectedFiles, `可选：添加最多 ${MAX_REVIEW_ATTACHMENTS} 张回复图片，支持 GIF 动图。`);
}

async function chooseReplyImage(reviewId) {
  const files = await chooseImageFiles();
  if (!files.length) return;
  setReplyImages(reviewId, files);
}

function renderReviewTool() {
  if (!reviewTargetSelect || !reviewSummary) return;
  const isTeamMode = currentReviewMode === REVIEW_MODE_TEAM;
  const players = getReviewablePlayers();
  const previousTarget = reviewTargetSelect.value;
  reviewTargetSelect.innerHTML = players.map(player => (
    `<option value="${escapeAttr(player.reviewKey)}">${player.reviewType === 'player' ? '#' : ''}${escapeHtml(player.num)} ${escapeHtml(player.name)} · ${escapeHtml(player.role || player.reviewType)}</option>`
  )).join('');
  if (players.some(player => player.reviewKey === previousTarget)) {
    reviewTargetSelect.value = previousTarget;
  } else if (players[0]) {
    reviewTargetSelect.value = String(players[0].reviewKey);
  }

  const targetNum = reviewTargetSelect.value;
  const target = findReviewablePlayer(targetNum);
  const reviews = REVIEWS_DATA
    .map(normalizeReview)
    .filter(Boolean)
    .filter(review => String(review.targetKey || `player:${review.targetNum}`) === String(targetNum))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const average = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : '';

  reviewSummary.innerHTML = target
    ? `<div class="review-summary-head">
        <strong>#${escapeHtml(target.num)} ${escapeHtml(target.name)}</strong>
        <span>${reviews.length ? `${average} / 5 · ${reviews.length} 条评价` : '暂无评价'}</span>
      </div>
      <div class="review-list">
        ${reviews.length ? reviews.slice(0, 8).map(review => `
          <div class="review-item">
            <div class="review-item-meta">
              <span class="review-meta-line">${getReviewMetaHtml(review)}</span>
              ${canDeleteReview(review) ? `<button class="review-delete-btn" type="button" data-action="delete-review" data-review-id="${escapeAttr(review.id)}">删除</button>` : ''}
            </div>
            <div class="review-item-comment">${escapeHtml(review.comment || '没有写文字评价。')}</div>
            ${renderReviewAttachmentsHtml(review.attachments)}
            ${renderReviewRepliesHtml(review.replies, review.id)}
            <div class="review-reply-form" data-review-id="${escapeAttr(review.id)}">
              <input class="ctrl-input" data-role="reply-comment" maxlength="180" placeholder="回复这条评价">
              <button class="ctrl-btn" type="button" data-action="reply-image" data-review-id="${escapeAttr(review.id)}">加图</button>
              <button class="ctrl-btn export" type="button" data-action="submit-reply" data-review-id="${escapeAttr(review.id)}">回复</button>
              <div class="review-reply-image-status" data-role="reply-image-status">${escapeHtml(formatReviewImageStatus(pendingReplyAttachmentFiles.get(review.id) || [], `可选：添加最多 ${MAX_REVIEW_ATTACHMENTS} 张回复图片，支持 GIF 动图。`))}</div>
            </div>
          </div>
        `).join('') : '<div class="review-empty">选择一种评价身份后，可以给这名成员提交第一条评价。</div>'}
      </div>`
    : '<div class="review-empty">暂无可评价球员。</div>';

  reviewModeTeamBtn?.classList.toggle('is-active', isTeamMode);
  reviewModeFriendBtn?.classList.toggle('is-active', !isTeamMode);
  reviewForm?.classList.toggle('is-team', isTeamMode);
  reviewForm?.classList.toggle('is-friend', !isTeamMode);
  if (reviewModeNote) {
    reviewModeNote.textContent = isTeamMode
      ? '队内评价字段：评价的球员 / 你的号码 / 分数。需要先解锁编辑口令，评价人显示为自己的号码。'
      : '朋友评价字段：评价的球员 / 熟悉球员号码 / 昵称或微信昵称 / 分数。提交会记录粗略 IP 属地和设备类型，用于防乱评。';
  }
  if (reviewerNumLabel) reviewerNumLabel.textContent = isTeamMode ? '你的号码' : '熟悉球员号码';
  if (reviewerNumInput) reviewerNumInput.placeholder = isTeamMode ? '如 5' : '如 20';
  if (reviewerNameField) reviewerNameField.hidden = isTeamMode;
  if (reviewerNameInput) {
    reviewerNameInput.hidden = isTeamMode;
    reviewerNameInput.disabled = isTeamMode || !target;
  }
  const canSubmit = Boolean(target) && (!isTeamMode || canEdit());
  [reviewerNumInput, reviewerNameInput, reviewRatingSelect, reviewCommentInput, reviewSubmitBtn].forEach(el => {
    if (el && el !== reviewerNameInput) el.disabled = !canSubmit;
  });
  const helperText = isTeamMode
    ? (canEdit() ? '队内评价已开启：输入自己的号码即可提交。' : '队内评价需要先解锁编辑口令。')
    : '朋友评价已开启：输入熟悉球员号码和昵称即可提交。';
  const statusText = reviewStatus?.textContent || '';
  if (target && reviewStatus && (!statusText || statusText.startsWith('只读模式') || statusText.startsWith('队内评价') || statusText.startsWith('朋友评价') || statusText.startsWith('评价无需编辑口令'))) {
    setReviewStatus(helperText, isTeamMode && !canEdit());
  }
}

async function submitPlayerReview() {
  if (isCloudBaseSyncHost() && (!cloudSyncState.initialized || !CLOUDBASE_CONFIG.publishFunction)) {
    setReviewStatus('云端尚未连接，文字和图片仍保留，请连接后重试。', true);
    return;
  }
  const targetNum = reviewTargetSelect?.value || '';
  const target = findReviewablePlayer(targetNum);
  if (!target) {
    setReviewStatus('请选择要评价的球员。', true);
    return;
  }
  const isTeamMode = currentReviewMode === REVIEW_MODE_TEAM;
  if (isTeamMode && !canEdit()) {
    setReviewStatus('队内评价需要先解锁编辑口令。', true);
    return;
  }
  const reviewerNum = String(reviewerNumInput?.value || '').trim();
  if (!/^\d{1,3}$/.test(reviewerNum)) {
    setReviewStatus(isTeamMode ? '提交前请先输入自己的队内号码。' : '提交前请先输入一个你熟悉的老和山球员号码。', true);
    reviewerNumInput?.focus();
    return;
  }
  const familiarPlayer = findLineupPersonByNumber(reviewerNum);
  if (!familiarPlayer) {
    setReviewStatus('这个号码暂时不在老和山名单里，请换一个你熟悉的球员号码。', true);
    reviewerNumInput?.focus();
    return;
  }
  const reviewerName = isTeamMode ? '' : String(reviewerNameInput?.value || '').trim().slice(0, 18);
  if (!isTeamMode && !reviewerName) {
    setReviewStatus('提交前请先输入你的昵称。', true);
    reviewerNameInput?.focus();
    return;
  }
  const attachments = [];
  if (pendingReviewAttachmentFiles.length) {
    try {
      const uploaded = await uploadReviewImageAttachments(pendingReviewAttachmentFiles, {
        num: target.num,
        name: target.name,
        field: 'review'
      }, (current, total) => {
        setReviewStatus(`正在上传评价图片 ${current}/${total}...`);
      });
      attachments.push(...uploaded);
    } catch (error) {
      setReviewStatus(`评价图片上传失败：${getCloudErrorMessage(error)}`, true);
      return;
    }
  }
  const createdAt = new Date().toISOString();
  const review = normalizeReview({
    targetNum: String(target.num),
    targetName: target.name,
    targetKey: target.reviewKey,
    targetType: target.reviewType,
    reviewerNum,
    reviewerName,
    familiarPlayerNum: isTeamMode ? '' : reviewerNum,
    familiarPlayerName: isTeamMode ? '' : familiarPlayer.name,
    reviewerAuth: isTeamMode ? 'team_edit' : 'friend_number',
    deviceId: getReviewDeviceId(),
    rating: reviewRatingSelect?.value || 5,
    comment: reviewCommentInput?.value || '',
    attachments,
    createdAt,
    deleteUntil: new Date(new Date(createdAt).getTime() + REVIEW_DELETE_WINDOW_MS).toISOString()
  });
  if (!review) {
    setReviewStatus('评价内容不完整。', true);
    return;
  }
  saveReviewIdentityForMode(reviewerNum, reviewerName);
  if (isCloudBaseSyncHost() && cloudSyncState.initialized && CLOUDBASE_CONFIG.publishFunction) {
    try {
      setReviewStatus('正在提交评价...');
      const fallbackReviews = buildReviewsWithSubmittedReview(review);
      const { response, mode } = await callPublishFunction({
        action: 'submitReview',
        docId: CLOUDBASE_CONFIG.currentDocId,
        review,
        editToken,
        snapshot: createSnapshotWithReviewsData(fallbackReviews),
        clientInfo: getReviewClientInfo(),
        clientUpdatedAt: new Date().toISOString()
      });
      const result = normalizePublishResult(response);
      if (!result || result.ok !== true || !result.review) {
        throw new Error(`${result?.code || 'FUNCTION_ERROR'} · ${result?.message || '云端未确认评价保存成功'}`);
      }
      const responseReview = result?.review || review;
      const repairMissingAttachments = hasReviewAttachments(review) && !hasReviewAttachments(responseReview);
      const savedReviewPayload = mergeSubmittedReviewAttachments(responseReview, review);
      const savedReview = prependReview(savedReviewPayload);
      const repairMode = repairMissingAttachments ? 'failed' : '';
      localStorageAdapter.writeLastState(createSnapshot());
      if (reviewCommentInput) reviewCommentInput.value = '';
      clearMainReviewImage();
      renderReviewTool();
      const repairText = repairMode === 'failed' ? '（图片已本机显示，云端补写失败）' : (repairMode ? '（已补写图片）' : (mode === 'http' ? '' : '（云函数）'));
      setReviewStatus(`已提交：${getReviewAttribution(savedReview)} 对 #${target.num} ${target.name} 的 ${savedReview.rating} 分评价。${repairText}`);
      return;
    } catch (error) {
      console.warn('CloudBase review submit failed:', error);
      // Keep the form and selected File objects intact. An unsaved review must
      // not be mixed into server-backed arrays that the next watch can replace.
      setReviewStatus(`云端提交未完成，文字和图片仍保留，请确认列表后重试：${getCloudErrorMessage(error)}`, true);
      return;
    }
  }
  const savedReview = prependReview(review);
  if (reviewCommentInput) reviewCommentInput.value = '';
  clearMainReviewImage();
  renderReviewTool();
  setReviewStatus(`已本地提交：${getReviewAttribution(savedReview)} 对 #${target.num} ${target.name} 的 ${savedReview.rating} 分评价。`);
  saveLastState();
}

function appendReplyToReview(reviewId, reply) {
  const normalizedReply = normalizeReviewReply(reply);
  if (!normalizedReply) return null;
  REVIEWS_DATA = buildReviewsWithReply(reviewId, normalizedReply);
  return normalizedReply;
}

async function submitReviewReply(reviewId) {
  if (isCloudBaseSyncHost() && (!cloudSyncState.initialized || !CLOUDBASE_CONFIG.publishFunction)) {
    setReviewStatus('云端尚未连接，回复文字和图片仍保留，请连接后重试。', true);
    return;
  }
  const id = String(reviewId || '');
  const parentReview = REVIEWS_DATA.map(normalizeReview).filter(Boolean).find(item => item.id === id);
  if (!parentReview) {
    setReviewStatus('这条评价不存在，无法回复。', true);
    return;
  }
  const form = Array.from(reviewSummary?.querySelectorAll('.review-reply-form') || [])
    .find(item => item.dataset.reviewId === id);
  const input = form?.querySelector('[data-role="reply-comment"]');
  const comment = String(input?.value || '').trim().slice(0, 180);
  const imageFiles = normalizeReviewImageFiles(pendingReplyAttachmentFiles.get(id) || []);
  if (!comment && !imageFiles.length) {
    setReviewStatus('回复需要写点文字，或添加图片。', true);
    input?.focus();
    return;
  }
  const isTeamMode = currentReviewMode === REVIEW_MODE_TEAM;
  if (isTeamMode && !canEdit()) {
    setReviewStatus('队内回复需要先解锁编辑口令。', true);
    return;
  }
  const reviewerNum = String(reviewerNumInput?.value || '').trim();
  if (!/^\d{1,3}$/.test(reviewerNum)) {
    setReviewStatus(isTeamMode ? '回复前请先输入自己的队内号码。' : '回复前请先输入一个你熟悉的老和山球员号码。', true);
    reviewerNumInput?.focus();
    return;
  }
  const familiarPlayer = findLineupPersonByNumber(reviewerNum);
  if (!familiarPlayer) {
    setReviewStatus('这个号码暂时不在老和山名单里，请换一个你熟悉的球员号码。', true);
    reviewerNumInput?.focus();
    return;
  }
  const reviewerName = isTeamMode ? '' : String(reviewerNameInput?.value || '').trim().slice(0, 18);
  if (!isTeamMode && !reviewerName) {
    setReviewStatus('朋友回复前请先输入你的昵称。', true);
    reviewerNameInput?.focus();
    return;
  }
  const attachments = [];
  if (imageFiles.length) {
    try {
      const uploaded = await uploadReviewImageAttachments(imageFiles, {
        num: parentReview.targetNum,
        name: parentReview.targetName || 'reply',
        field: 'reply'
      }, (current, total) => {
        setReviewStatus(`正在上传回复图片 ${current}/${total}...`);
      });
      attachments.push(...uploaded);
    } catch (error) {
      setReviewStatus(`回复图片上传失败：${getCloudErrorMessage(error)}`, true);
      return;
    }
  }
  const createdAt = new Date().toISOString();
  const reply = normalizeReviewReply({
    reviewerNum,
    reviewerName,
    familiarPlayerNum: isTeamMode ? '' : reviewerNum,
    familiarPlayerName: isTeamMode ? '' : familiarPlayer.name,
    reviewerAuth: isTeamMode ? 'team_edit' : 'friend_number',
    deviceId: getReviewDeviceId(),
    comment,
    attachments,
    createdAt
  });
  if (!reply) {
    setReviewStatus('回复内容不完整。', true);
    return;
  }
  saveReviewIdentityForMode(reviewerNum, reviewerName);
  if (isCloudBaseSyncHost() && cloudSyncState.initialized && CLOUDBASE_CONFIG.publishFunction) {
    try {
      setReviewStatus('正在提交回复...');
      const fallbackReviews = buildReviewsWithReply(id, reply);
      const { response } = await callPublishFunction({
        action: 'replyReview',
        docId: CLOUDBASE_CONFIG.currentDocId,
        reviewId: id,
        reply,
        editToken,
        snapshot: createSnapshotWithReviewsData(fallbackReviews),
        clientInfo: getReviewClientInfo(),
        clientUpdatedAt: new Date().toISOString()
      });
      const result = normalizePublishResult(response);
      if (!result || result.ok !== true || !result.reply) {
        throw new Error(`${result?.code || 'FUNCTION_ERROR'} · ${result?.message || '云端未确认回复保存成功'}`);
      }
      const savedReply = appendReplyToReview(id, result?.reply || reply);
      localStorageAdapter.writeLastState(createSnapshot());
      if (input) input.value = '';
      setReplyImages(id, []);
      renderReviewTool();
      setReviewStatus(`已回复：${getReviewReplyMetaHtml(savedReply).replace(/<[^>]*>/g, '')}`);
      return;
    } catch (error) {
      console.warn('CloudBase review reply failed:', error);
      setReviewStatus(`云端回复未完成，文字和图片仍保留，请确认列表后重试：${getCloudErrorMessage(error)}`, true);
      return;
    }
  }
  appendReplyToReview(id, reply);
  if (input) input.value = '';
  setReplyImages(id, []);
  renderReviewTool();
  setReviewStatus('已本地回复。');
  saveLastState();
}

async function deleteReview(reviewId) {
  if (isCloudBaseSyncHost() && (!cloudSyncState.initialized || !CLOUDBASE_CONFIG.publishFunction)) {
    setReviewStatus('云端尚未连接，评价仍保留，请连接后重试删除。', true);
    return;
  }
  const review = REVIEWS_DATA.map(normalizeReview).filter(Boolean).find(item => item.id === reviewId);
  if (!review) {
    setReviewStatus('这条评价不存在或已经被删除。', true);
    return;
  }
  if (!canDeleteReview(review)) {
    setReviewStatus('请先解锁管理员编辑，再删除评价。', true);
    return;
  }
  if (isCloudBaseSyncHost() && cloudSyncState.initialized && CLOUDBASE_CONFIG.publishFunction) {
    try {
      setReviewStatus('正在删除评价...');
      const { response } = await callPublishFunction({
        action: 'deleteReview',
        editToken,
        docId: CLOUDBASE_CONFIG.currentDocId,
        reviewId,
        deviceId: getReviewDeviceId(),
        snapshot: createSnapshotWithReviewsData(buildReviewsWithoutReview(reviewId)),
        clientUpdatedAt: new Date().toISOString()
      });
      const result = normalizePublishResult(response);
      if (!result || result.ok !== true) {
        throw new Error(`${result?.code || 'FUNCTION_ERROR'} · ${result?.message || '云端未确认删除成功'}`);
      }
      removeReviewById(reviewId);
      localStorageAdapter.writeLastState(createSnapshot());
      renderReviewTool();
      setReviewStatus('已删除这条评价。');
      return;
    } catch (error) {
      console.warn('CloudBase review delete failed:', error);
      setReviewStatus(`删除失败：${getCloudErrorMessage(error)}`, true);
      return;
    }
  }
  removeReviewById(reviewId);
  saveLastState();
  renderReviewTool();
  setReviewStatus('已从本机删除这条评价。');
}

async function deleteReviewReply(reviewId, replyId) {
  if (isCloudBaseSyncHost() && (!cloudSyncState.initialized || !CLOUDBASE_CONFIG.publishFunction)) {
    setReviewStatus('云端尚未连接，回复仍保留，请连接后重试删除。', true);
    return;
  }
  const parentReview = REVIEWS_DATA.map(normalizeReview).filter(Boolean).find(item => item.id === reviewId);
  const reply = parentReview?.replies?.map(normalizeReviewReply).filter(Boolean).find(item => item.id === replyId);
  if (!parentReview || !reply) {
    setReviewStatus('这条回复不存在或已经被删除。', true);
    return;
  }
  if (!canDeleteReviewReply(reply)) {
    setReviewStatus('请先解锁管理员编辑，再删除回复。', true);
    return;
  }
  if (isCloudBaseSyncHost() && cloudSyncState.initialized && CLOUDBASE_CONFIG.publishFunction) {
    try {
      setReviewStatus('正在删除回复...');
      const { response } = await callPublishFunction({
        action: 'deleteReply',
        editToken,
        docId: CLOUDBASE_CONFIG.currentDocId,
        reviewId,
        replyId,
        deviceId: getReviewDeviceId(),
        snapshot: createSnapshotWithReviewsData(buildReviewsWithoutReply(reviewId, replyId)),
        clientUpdatedAt: new Date().toISOString()
      });
      const result = normalizePublishResult(response);
      if (!result || result.ok !== true) {
        throw new Error(`${result?.code || 'FUNCTION_ERROR'} · ${result?.message || '云端未确认回复删除成功'}`);
      }
      removeReplyById(reviewId, replyId);
      localStorageAdapter.writeLastState(createSnapshot());
      renderReviewTool();
      setReviewStatus('已删除这条回复。');
      return;
    } catch (error) {
      console.warn('CloudBase reply delete failed:', error);
      setReviewStatus(`删除回复失败：${getCloudErrorMessage(error)}`, true);
      return;
    }
  }
  removeReplyById(reviewId, replyId);
  saveLastState();
  renderReviewTool();
  setReviewStatus('已从本机删除这条回复。');
}

function renderAll() {
  normalizeSquadData();
  renderWorkspaceSummary();
  renderTeamLogo();
  renderPitch();
  renderBench();
  renderStaffSection();
  renderLegends();
  renderPhotoManager();
  renderTeamPlayTool();
  renderReviewTool();
  renderReportQr();
  updateControls();
  updatePosterPreviewScale();
}

// ============================================================
// 照片管理
// ============================================================
function uploadPhoto(list, index, field) {
  if (!canEdit()) return;
  const item = list === 'legends' ? LEGENDS_DATA[index] : SQUAD_DATA[list]?.[index];
  if (!item) return;

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      item[field] = await getUploadImageSource(file, {
        kind: list === 'legends' ? 'legends' : 'players',
        num: item.num,
        name: item.name,
        field
      });
      renderAll();
      saveLastState();
    } catch (error) {
      console.warn('photo upload failed:', error);
      alert('照片上传失败，请稍后重试。');
    }
  }, { once: true });
  input.click();
}

function clearPhoto(list, index) {
  if (!canEdit()) return;
  const item = list === 'legends' ? LEGENDS_DATA[index] : SQUAD_DATA[list]?.[index];
  if (!item) return;
  item.avatar = '';
  item.avatarHome = '';
  item.avatarAway = '';
  item.useDefaultPhotos = false;
  renderAll();
  saveLastState();
}

function updatePlayerField(list, index, field, value) {
  if (!canEdit()) return;
  const item = list === 'legends' ? LEGENDS_DATA[index] : SQUAD_DATA[list]?.[index];
  if (!item || (list === 'legends' && (field === 'pos' || field === 'positions'))) return;
  if (field === 'positions') {
    item.positions = value.split(',').map(s => s.trim()).filter(Boolean);
  } else {
    item[field] = value.trim();
  }
  if (field === 'name') item.name = normalizeName(item.name);
  renderPitch();
  renderBench();
  renderLegends();
  renderWorkspaceSummary();
  updateControls();
  queueSaveLastState();
}

function updatePlayerStat(list, index, field, value) {
  if (!canEdit()) return;
  const player = SQUAD_DATA[list]?.[index];
  if (!player) return;
  player.stats = normalizeStats({
    ...player.stats,
    [field]: value
  });
  renderPitch();
  queueSaveLastState();
}

function updatePlayerStatus(list, index, status) {
  if (!canEdit()) return;
  const player = SQUAD_DATA[list]?.[index];
  if (!player) return;
  player.status = status;
  renderPitch();
  renderBench();
  renderWorkspaceSummary();
  queueSaveLastState();
}

photoManager.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const { action, list, field } = button.dataset;
  const index = Number(button.dataset.index);
  if (action === 'upload-photo') uploadPhoto(list, index, field);
  if (action === 'clear-photo') clearPhoto(list, index);
});

photoManager.addEventListener('input', event => {
  const fieldInput = event.target.closest('input[data-action="update-player-field"]');
  if (fieldInput) {
    updatePlayerField(fieldInput.dataset.list, Number(fieldInput.dataset.index), fieldInput.dataset.field, fieldInput.value);
    return;
  }
  const input = event.target.closest('input[data-action="update-stat"]');
  if (!input) return;
  updatePlayerStat(input.dataset.list, Number(input.dataset.index), input.dataset.field, input.value);
});

photoManager.addEventListener('change', event => {
  const statusSelect = event.target.closest('select[data-action="update-status"]');
  if (statusSelect) {
    updatePlayerStatus(statusSelect.dataset.list, Number(statusSelect.dataset.index), statusSelect.value);
  }
});

pitch.addEventListener('input', event => {
  if (!canEdit()) return;
  const target = event.target.closest('[data-player-field]');
  if (!target) return;
  const starterIndex = Number(target.dataset.starterIndex);
  const player = SQUAD_DATA.starters[starterIndex];
  if (!player) return;
  player[target.dataset.playerField] = target.textContent.trim();
  renderBench();
  queueSaveLastState();
});

// ============================================================
// 首发 / 替补拖拽换人
// ============================================================
function setDropTarget(card) {
  document.querySelectorAll('.player-card.drop-target').forEach(el => {
    if (el !== card) el.classList.remove('drop-target');
  });
  if (card) card.classList.add('drop-target');
}

function clearDragVisuals() {
  document.querySelectorAll('.dragging-source').forEach(el => el.classList.remove('dragging-source'));
  document.querySelectorAll('.player-card.drop-target').forEach(el => el.classList.remove('drop-target'));
  document.querySelectorAll('.drag-ghost').forEach(el => el.remove());
}

function getStarterSlotLabel(starterIndex) {
  const slot = FORMATIONS[currentFormation]?.slots?.find(item => item.playerIndex === starterIndex);
  return {
    pos: slot?.pos || SQUAD_DATA.starters[starterIndex]?.pos || '',
    role: slot?.role || SQUAD_DATA.starters[starterIndex]?.role || ''
  };
}

function applyStarterSlotLabel(player, starterIndex) {
  const label = getStarterSlotLabel(starterIndex);
  return normalizePlayer({
    ...player,
    pos: label.pos,
    role: label.role
  });
}

function specialCandidateToPlayer(candidate) {
  if (!candidate) return null;
  if (candidate.type === 'coach') {
    return normalizePlayer({
      num: COACH_DATA.num || '3',
      name: COACH_DATA.name || '教练',
      pos: '',
      role: COACH_DATA.role || COACH_DATA.posLabel || '教练',
      positions: [],
      avatarHome: COACH_DATA.avatarHome || COACH_DATA.avatar || '',
      avatarAway: COACH_DATA.avatarAway || COACH_DATA.avatar || '',
      stats: {},
      status: COACH_DATA.status || 'fit'
    });
  }
  if (candidate.type === 'legend') {
    const legend = normalizeLegend(LEGENDS_DATA[candidate.index]);
    return normalizePlayer({
      num: legend.num,
      name: legend.name,
      pos: '',
      role: legend.role || '绝版人物',
      positions: [],
      avatarHome: legend.avatarHome || legend.avatar || '',
      avatarAway: legend.avatarAway || legend.avatar || '',
      stats: {},
      status: 'fit'
    });
  }
  return null;
}

function getSpecialSwapCandidates() {
  const candidates = [];
  if (COACH_DATA.show) {
    candidates.push({
      type: 'coach',
      value: 'coach:0',
      label: `教练 · #${COACH_DATA.num || '3'} ${COACH_DATA.name || '教练'}`
    });
  }
  LEGENDS_DATA.forEach((legend, index) => {
    const item = normalizeLegend(legend);
    candidates.push({
      type: 'legend',
      index,
      value: `legend:${index}`,
      label: `绝版 · #${item.num} ${item.name}`
    });
  });
  return candidates;
}

function swapBenchToStarter(benchIndex, starterIndex) {
  if (!canEdit()) return;
  const benchPlayer = SQUAD_DATA.bench[benchIndex];
  const starterPlayer = SQUAD_DATA.starters[starterIndex];
  if (!benchPlayer || !starterPlayer) return;

  SQUAD_DATA.starters[starterIndex] = applyStarterSlotLabel(benchPlayer, starterIndex);
  SQUAD_DATA.bench[benchIndex] = benchVersionOf(starterPlayer);

  clearDragVisuals();
  renderAll();
  saveLastState();
}

function swapSpecialToStarter(candidateValue, starterIndex) {
  if (!canEdit()) return;
  const [type, indexText] = String(candidateValue || '').split(':');
  const starterPlayer = SQUAD_DATA.starters[starterIndex];
  const candidate = { type, index: Number(indexText) };
  const incomingPlayer = specialCandidateToPlayer(candidate);
  if (!incomingPlayer || !starterPlayer) return;

  SQUAD_DATA.starters[starterIndex] = applyStarterSlotLabel(incomingPlayer, starterIndex);
  SQUAD_DATA.bench.push(benchVersionOf(starterPlayer));

  clearDragVisuals();
  renderAll();
  saveLastState();
}

function swapCandidateToStarter(candidateValue, starterIndex) {
  const [type, indexText] = String(candidateValue || '').split(':');
  if (type === 'bench') {
    const benchIndex = Number(indexText);
    if (Number.isFinite(benchIndex)) swapBenchToStarter(benchIndex, starterIndex);
    return;
  }
  swapSpecialToStarter(candidateValue, starterIndex);
}

function swapStarterToStarter(fromIndex, toIndex) {
  if (!canEdit()) return;
  if (fromIndex === toIndex) return;
  const fromPlayer = SQUAD_DATA.starters[fromIndex];
  const toPlayer = SQUAD_DATA.starters[toIndex];
  SQUAD_DATA.starters[fromIndex] = applyStarterSlotLabel(toPlayer, fromIndex);
  SQUAD_DATA.starters[toIndex] = applyStarterSlotLabel(fromPlayer, toIndex);
  clearDragVisuals();
  renderAll();
  saveLastState();
}

function swapSelectedStarter() {
  if (!canEdit()) return;
  const candidateValue = benchPlayerSelect.value || '';
  const starterIndex = Number(starterSlotSelect.value);
  if (!Number.isFinite(starterIndex)) return;
  swapCandidateToStarter(candidateValue, starterIndex);
}

function handleBenchDragStart(event) {
  if (!canEdit()) { event.preventDefault(); return; }
  html5DragBenchIndex = Number(event.currentTarget.dataset.benchIndex);
  html5DragCandidateValue = event.currentTarget.dataset.swapValue || `bench:${html5DragBenchIndex}`;
  event.currentTarget.classList.add('dragging-source');
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', html5DragCandidateValue);
}

function handleBenchDragEnd() {
  html5DragBenchIndex = null;
  html5DragCandidateValue = null;
  clearDragVisuals();
}

function handleStarterDragStart(event) {
  if (!canEdit()) { event.preventDefault(); return; }
  if (event.target.isContentEditable) { event.preventDefault(); return; }
  html5DragStarterIndex = Number(event.currentTarget.dataset.starterIndex);
  event.currentTarget.classList.add('dragging-source');
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', 'starter:' + html5DragStarterIndex);
}

function handleStarterDragEnd() {
  html5DragStarterIndex = null;
  clearDragVisuals();
}

function handleStarterDragOver(event) {
  if (!canEdit()) return;
  if (html5DragCandidateValue === null && html5DragStarterIndex === null) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  setDropTarget(event.currentTarget);
}

function handleStarterDragEnter(event) {
  if (!canEdit()) return;
  if (html5DragCandidateValue === null && html5DragStarterIndex === null) return;
  event.preventDefault();
  setDropTarget(event.currentTarget);
}

function handleStarterDragLeave(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    event.currentTarget.classList.remove('drop-target');
  }
}

function handleStarterDrop(event) {
  if (!canEdit()) return;
  event.preventDefault();
  const raw = event.dataTransfer.getData('text/plain');
  const toIndex = Number(event.currentTarget.dataset.starterIndex);
  if (raw.startsWith('starter:')) {
    const fromIndex = Number(raw.slice(8));
    html5DragStarterIndex = null;
    swapStarterToStarter(fromIndex, toIndex);
  } else if (raw) {
    html5DragBenchIndex = null;
    html5DragCandidateValue = null;
    swapCandidateToStarter(raw, toIndex);
  }
}

function createDragGhost(source) {
  const ghost = source.cloneNode(true);
  ghost.classList.add('drag-ghost');
  ghost.style.width = source.offsetWidth + 'px';
  document.body.appendChild(ghost);
  return ghost;
}

function autoScrollForPointer(clientY) {
  const edge = 72;
  if (clientY < edge) {
    window.scrollBy(0, -18);
  } else if (clientY > window.innerHeight - edge) {
    window.scrollBy(0, 18);
  }
}

function movePointerDrag(event) {
  if (!pointerDrag) return;
  event.preventDefault();
  autoScrollForPointer(event.clientY);
  pointerDrag.ghost.style.left = event.clientX + 'px';
  pointerDrag.ghost.style.top = event.clientY + 'px';

  const element = document.elementFromPoint(event.clientX, event.clientY);
  const card = element?.closest?.('.player-card[data-starter-index]') || null;
  pointerDrag.target = card;
  setDropTarget(card);
}

function stopPointerDrag(event, shouldDrop) {
  if (!pointerDrag) return;
  const { benchIndex, candidateValue, target } = pointerDrag;
  window.removeEventListener('pointermove', movePointerDrag);
  window.removeEventListener('pointerup', handlePointerUp);
  window.removeEventListener('pointercancel', handlePointerCancel);
  pointerDrag = null;

  if (shouldDrop && target) {
    swapCandidateToStarter(candidateValue || `bench:${benchIndex}`, Number(target.dataset.starterIndex));
  } else {
    clearDragVisuals();
  }
}

function handlePointerUp(event) {
  stopPointerDrag(event, true);
}

function handlePointerCancel(event) {
  stopPointerDrag(event, false);
}

function handleBenchPointerDown(event) {
  if (!canEdit()) return;
  if (event.pointerType === 'mouse' || event.button > 0) return;
  event.preventDefault();
  const source = event.currentTarget;
  pointerDrag = {
    benchIndex: Number(source.dataset.benchIndex),
    candidateValue: source.dataset.swapValue || `bench:${source.dataset.benchIndex}`,
    source,
    ghost: createDragGhost(source),
    target: null
  };
  source.classList.add('dragging-source');
  movePointerDrag(event);
  window.addEventListener('pointermove', movePointerDrag, { passive: false });
  window.addEventListener('pointerup', handlePointerUp);
  window.addEventListener('pointercancel', handlePointerCancel);
}

// 首发球员触摸拖拽（场上互换位置）
function handleStarterPointerDown(event) {
  if (!canEdit()) return;
  if (event.pointerType === 'mouse' || event.button > 0) return;
  if (event.target.isContentEditable) return;
  event.preventDefault();
  const card = event.currentTarget;
  pointerDragStarter = {
    starterIndex: Number(card.dataset.starterIndex),
    source: card,
    ghost: createDragGhost(card),
    target: null
  };
  card.classList.add('dragging-source');
  movePointerDragStarter(event);
  window.addEventListener('pointermove', movePointerDragStarter, { passive: false });
  window.addEventListener('pointerup', handleStarterPointerUp);
  window.addEventListener('pointercancel', handleStarterPointerCancel);
}

function movePointerDragStarter(event) {
  if (!pointerDragStarter) return;
  event.preventDefault();
  autoScrollForPointer(event.clientY);
  pointerDragStarter.ghost.style.left = event.clientX + 'px';
  pointerDragStarter.ghost.style.top = event.clientY + 'px';
  const element = document.elementFromPoint(event.clientX, event.clientY);
  const card = element?.closest?.('.player-card[data-starter-index]') || null;
  pointerDragStarter.target = card;
  setDropTarget(card);
}

function stopPointerDragStarter(event, shouldDrop) {
  if (!pointerDragStarter) return;
  const { starterIndex, target } = pointerDragStarter;
  window.removeEventListener('pointermove', movePointerDragStarter);
  window.removeEventListener('pointerup', handleStarterPointerUp);
  window.removeEventListener('pointercancel', handleStarterPointerCancel);
  pointerDragStarter = null;
  if (shouldDrop && target) {
    swapStarterToStarter(starterIndex, Number(target.dataset.starterIndex));
  } else {
    clearDragVisuals();
  }
}

function handleStarterPointerUp(event) { stopPointerDragStarter(event, true); }
function handleStarterPointerCancel(event) { stopPointerDragStarter(event, false); }

// ============================================================
// 战报二维码与教练设置
// ============================================================
function uploadTeamLogo() {
  if (!canEdit()) return;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const value = await getUploadImageSource(file, {
        kind: 'team',
        num: 'logo',
        name: currentKit,
        field: 'logo'
      });
      TEAM_DATA.logo = value;
      TEAM_DATA.logoHome = value;
      TEAM_DATA.logoAway = value;
      renderAll();
      saveLastState();
    } catch (error) {
      console.warn('team logo upload failed:', error);
      alert('队徽上传失败，请稍后重试。');
    }
  }, { once: true });
  input.click();
}

function clearTeamLogo() {
  if (!canEdit()) return;
  TEAM_DATA.logo = '';
  TEAM_DATA.logoHome = '';
  TEAM_DATA.logoAway = '';
  renderAll();
  saveLastState();
}

function uploadCoachPhoto(field) {
  if (!canEdit()) return;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      COACH_DATA[field] = await getUploadImageSource(file, {
        kind: 'staff',
        num: COACH_DATA.num || 'coach',
        name: COACH_DATA.name || 'coach',
        field
      });
      renderAll();
      saveLastState();
    } catch (error) {
      console.warn('coach photo upload failed:', error);
      alert('教练照片上传失败，请稍后重试。');
    }
  }, { once: true });
  input.click();
}

function clearCoachPhoto() {
  if (!canEdit()) return;
  COACH_DATA.avatar = '';
  COACH_DATA.avatarHome = '';
  COACH_DATA.avatarAway = '';
  COACH_DATA.useDefaultPhotos = false;
  renderAll();
  saveLastState();
}

function syncCoachFromControls() {
  if (!canEdit()) return;
  COACH_DATA.show = coachShowInput.checked;
  COACH_DATA.num = coachNumInput.value.trim() || '3';
  COACH_DATA.posLabel = coachPosInput.value.trim() || 'COACH';
  COACH_DATA.name = coachNameInput.value.trim() || '陈炫';
  COACH_DATA.role = coachRoleInput.value.trim() || '教练';
  COACH_DATA.status = document.getElementById('coach-status-input').value;
  renderPitch();
  renderStaffSection();
  updateControls();
  queueSaveLastState();
}

function syncManagerFromControls() {
  if (!canEdit()) return;
  MANAGER_DATA.show = managerShowInput.checked;
  MANAGER_DATA.num = managerNumInput.value.trim() || '·';
  MANAGER_DATA.posLabel = managerPosInput.value.trim() || 'MGR';
  MANAGER_DATA.name = managerNameInput.value.trim() || '许俊秋';
  MANAGER_DATA.role = managerRoleInput.value.trim() || '领队';
  renderPitch();
  renderStaffSection();
  updateControls();
  queueSaveLastState();
}

function uploadManagerPhoto(field) {
  if (!canEdit()) return;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      MANAGER_DATA[field] = await getUploadImageSource(file, {
        kind: 'staff',
        num: MANAGER_DATA.num || 'manager',
        name: MANAGER_DATA.name || 'manager',
        field
      });
      renderAll();
      saveLastState();
    } catch (error) {
      console.warn('manager photo upload failed:', error);
      alert('领队照片上传失败，请稍后重试。');
    }
  }, { once: true });
  input.click();
}

function clearManagerPhoto() {
  if (!canEdit()) return;
  MANAGER_DATA.avatar = '';
  MANAGER_DATA.avatarHome = '';
  MANAGER_DATA.avatarAway = '';
  MANAGER_DATA.useDefaultPhotos = false;
  renderAll();
  saveLastState();
}

function getAllCardPlayers() {
  return [
    ...SQUAD_DATA.starters.map(player => ({ ...normalizePlayer(player), cardType: 'player' })),
    ...SQUAD_DATA.bench.map(player => ({ ...normalizePlayer(player), cardType: 'player' })),
    ...LEGENDS_DATA.map(legend => ({ ...normalizeLegend(legend), cardType: 'legend' })),
    ...(COACH_DATA.show ? [{ ...COACH_DATA, cardType: 'staff' }] : []),
    ...(MANAGER_DATA.show ? [{ ...MANAGER_DATA, cardType: 'staff' }] : []),
    ...EXTRA_DRAW_CARDS.map(card => ({ ...card }))
  ];
}

function getCardIntro(player) {
  const numberedKey = `${player.name}${player.num}`;
  if (CARD_INTROS[numberedKey]) return CARD_INTROS[numberedKey];
  if (CARD_INTROS[player.name]) return CARD_INTROS[player.name];
  if (player.cardType === 'legend') {
    return `${player.num}号，绝版人物。时间不一定记得每一场比赛，但老和山之翼会记得这个名字。`;
  }
  if (player.cardType === 'staff') {
    return `${player.role || '教练与领队'}。幕后一站，比谁都清楚场上发生了什么；这张卡抽到了，说明今天队伍的凝聚力值满格。`;
  }
  if (player.cardType === 'unbelievable') {
    return player.intro || '这张卡不在常规名单里，但抽出来就说明今天的气氛已经进入非常规时间。';
  }
  const role = player.role || player.pos || '万能替补';
  return `${player.num}号，${role}。这张卡的隐藏属性是：上场前看起来很冷静，上场后让对手也开始不冷静。`;
}

function renderDrawCard(player) {
  currentDrawnPlayer = player;
  const isLegend = player.cardType === 'legend';
  const isStaff = player.cardType === 'staff';
  const isUnbelievable = player.cardType === 'unbelievable';
  const avatar = isLegend
    ? getLegendAvatar(player)
    : isStaff
      ? getStaffAvatar(player)
      : getCurrentAvatar(player);
  drawCard.className = `draw-card${isLegend ? ' legend-draw' : isStaff ? ' staff-draw' : isUnbelievable ? ' unbelievable-draw' : ''}`;
  const fallbackAvatar = isLegend
    ? '<span class="legend-star-fallback">★</span>'
    : isStaff
      ? '<span class="staff-star-fallback">⚙</span>'
      : isUnbelievable
        ? '<span class="unbelievable-fallback">抽象</span>'
        : SVG_AVATAR;
  const metaText = isLegend
    ? `${player.role || '绝版人物'} · 金色卡`
    : isStaff
      ? `${player.role || '教练与领队'} · 紫卡`
      : isUnbelievable
        ? `${player.role || '隐藏人物'} · UNBELIEVABLE`
        : (player.role || player.pos || '老和山之翼');
  drawCard.innerHTML = `
    <div class="draw-avatar">
      ${avatar ? `<img src="${escapeAttr(avatar)}" alt="">` : fallbackAvatar}
    </div>
    <div>
      ${isLegend ? '<div class="draw-tag">HALL OF FAME</div>' : ''}
      ${isStaff ? '<div class="draw-tag staff-tag">COACH & MANAGER</div>' : ''}
      ${isUnbelievable ? '<div class="draw-tag unbelievable-tag">UNBELIEVABLE</div>' : ''}
      <div class="draw-name">${escapeHtml(player.name)}</div>
      <div class="draw-meta">${isStaff ? '' : `#${escapeHtml(player.num)} · `}${escapeHtml(metaText)}</div>
      <div class="draw-intro">${escapeHtml(getCardIntro(player))}</div>
    </div>
  `;
}

function drawRandomPlayer() {
  const players = getAllCardPlayers();
  if (!players.length) return;
  const player = players[Math.floor(Math.random() * players.length)];
  renderDrawCard(player);
}

// ============================================================
// 预设与自动恢复
// ============================================================
function getPresets() {
  try {
    return activeStorageAdapter.readPresets();
  } catch (error) {
    console.warn(`读取预设失败（${activeStorageAdapter.name}）：`, error);
    return {};
  }
}

function setPresets(presets, notify = false) {
  try {
    return activeStorageAdapter.writePresets(presets);
  } catch (error) {
    console.warn(`写入预设失败（${activeStorageAdapter.name}）：`, error);
    if (notify) {
      alert('保存失败：浏览器本地存储空间不足。请尝试压缩照片后再保存。');
    }
    return false;
  }
}

function ensureDefaultPreset() {
  let presets = {};
  try {
    presets = activeStorageAdapter.readWritablePresets();
  } catch (error) {
    console.warn(`读取当前预设失败（${activeStorageAdapter.name}）：`, error);
  }
  if (presets[DEFAULT_PRESET_NAME]) return;
  presets[DEFAULT_PRESET_NAME] = createSnapshot();
  setPresets(presets, false);
}

async function readInitialState() {
  let draft = null;
  try {
    draft = localStorageAdapter.readJson(cloudDraftKey(), null);
  } catch (error) {
    console.warn('读取本机草稿失败：', error);
  }
  if (isCurrentWorkspaceSnapshot(draft?.snapshot)) {
    // Protect the draft before any await. A remote read must not overwrite its
    // snapshot or advance the version on which these local edits were based.
    cloudSyncState.baseUpdatedAt = typeof draft.baseUpdatedAt === 'string' ? draft.baseUpdatedAt : '';
    cloudSyncState.localDirty = true;
    let record = null;
    if (cloudSyncState.initialized) {
      try { record = await fetchLatestCloudRecord(); } catch (error) { console.warn('读取云端版本失败，保留草稿：', error); }
    }
    const conflict = record && record.updatedAtText !== cloudSyncState.baseUpdatedAt;
    updateSyncStatus(conflict ? 'error' : 'ready',
      conflict ? '已恢复本机草稿；云端有新版本，请先备份再载入' : '已恢复未发布草稿');
    return clone(draft.snapshot);
  }
  try {
    if (cloudSyncState.initialized) {
      const cloudSnapshot = await readCloudSnapshot();
      if (cloudSnapshot) {
        updateSyncStatus('synced', '已读取云端阵容');
        return cloudSnapshot;
      }
      updateSyncStatus('ready', '云端暂无阵容，使用本地');
    }
    return activeStorageAdapter.readLastState();
  } catch (error) {
    console.warn(`读取当前阵容失败（${activeStorageAdapter.name}）：`, error);
    if (cloudSyncState.initialized) updateSyncStatus('error', '读取云端失败，使用本地');
    try {
      return localStorageAdapter.readLastState();
    } catch (fallbackError) {
      console.warn('读取本地阵容也失败：', fallbackError);
      return null;
    }
  }
}

function renderPresetSelect(selectedName = '') {
  const presets = getPresets();
  const names = Object.keys(presets).sort((a, b) => a.localeCompare(b, 'zh-CN'));
  const nextSelected = names.includes(selectedName) ? selectedName : '';
  presetSelect.innerHTML = '<option value="">载入预设...</option>';
  names.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    presetSelect.appendChild(option);
  });
  presetSelect.value = nextSelected;
  deletePresetBtn.disabled = !nextSelected;
}

function saveCurrentAsPreset() {
  if (!canEdit()) return;
  const defaultName = document.querySelector('[data-edit-key="meta"]')?.textContent?.trim() || '';
  const name = prompt('输入预设名称', defaultName);
  if (!name || !name.trim()) return;
  const presetName = name.trim();
  const presets = getPresets();
  presets[presetName] = createSnapshot();
  if (setPresets(presets, true)) {
    renderPresetSelect(presetName);
  }
}

function loadSelectedPreset() {
  if (!canEdit()) return;
  const name = presetSelect.value;
  deletePresetBtn.disabled = !name;
  if (!name) return;
  const presets = getPresets();
  applySnapshot(presets[name], true);
  renderPresetSelect(name);
}

function deleteSelectedPreset() {
  if (!canEdit()) return;
  const name = presetSelect.value;
  if (!name) return;
  if (!confirm(`删除预设「${name}」？`)) return;
  const presets = getPresets();
  delete presets[name];
  if (setPresets(presets, true)) {
    renderPresetSelect('');
  }
}

function safeFileName(value, fallback = 'laohe-lineup-preset') {
  const text = String(value || '').trim().replace(/[\\/:*?"<>|]+/g, '-');
  return text.slice(0, 80) || fallback;
}

function exportCurrentPresetJson() {
  const defaultName = document.querySelector('[data-edit-key="meta"]')?.textContent?.trim() || DEFAULT_PRESET_NAME;
  const json = JSON.stringify(createSnapshot(), null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${safeFileName(defaultName)}.json`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

function bindControls() {
  unlockEditBtn?.addEventListener('click', unlockEditing);
  lockEditBtn?.addEventListener('click', lockEditing);
  editPasswordInput?.addEventListener('keydown', event => {
    if (event.key === 'Enter') unlockEditing();
  });

  document.querySelectorAll('.formation-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!FORMATIONS[btn.dataset.formation] || FORMATIONS[btn.dataset.formation].slots.length !== PLAYER_COUNT) return;
      currentFormation = btn.dataset.formation;
      applyCurrentFormationLabels();
      updateControls();
      renderPitch();
      renderPhotoManager();
      queueSaveLastState();
    });
  });

  document.querySelectorAll('.kit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentKit = btn.dataset.kit;
      updateControls();
      renderTeamLogo();
      renderPitch();
      renderBench();
      renderStaffSection();
      renderLegends();
      if (currentDrawnPlayer) renderDrawCard(currentDrawnPlayer);
      queueSaveLastState();
    });
  });

  document.querySelectorAll('.stats-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentShowStats = btn.dataset.statsVisible === 'true';
      updateControls();
      renderPitch();
      queueSaveLastState();
    });
  });

  reportLinkInput.addEventListener('input', () => {
    reportLink = reportLinkInput.value.trim();
    renderReportQr();
    updatePosterPreviewScale();
    queueSaveLastState();
  });

  teamLogoUploadBtn.addEventListener('click', uploadTeamLogo);
  teamLogoClearBtn.addEventListener('click', clearTeamLogo);

  coachShowInput.addEventListener('change', syncCoachFromControls);
  document.getElementById('coach-status-input').addEventListener('change', syncCoachFromControls);
  [coachNumInput, coachPosInput, coachNameInput, coachRoleInput].forEach(input => {
    input.addEventListener('input', syncCoachFromControls);
  });
  coachUploadHomeBtn.addEventListener('click', () => uploadCoachPhoto('avatarHome'));
  coachUploadAwayBtn.addEventListener('click', () => uploadCoachPhoto('avatarAway'));
  coachClearBtn.addEventListener('click', clearCoachPhoto);
  managerShowInput.addEventListener('change', syncManagerFromControls);
  [managerNumInput, managerPosInput, managerNameInput, managerRoleInput].forEach(input => {
    input.addEventListener('input', syncManagerFromControls);
  });
  managerUploadHomeBtn.addEventListener('click', () => uploadManagerPhoto('avatarHome'));
  managerUploadAwayBtn.addEventListener('click', () => uploadManagerPhoto('avatarAway'));
  managerClearBtn.addEventListener('click', clearManagerPhoto);
  randomDrawBtn.addEventListener('click', drawRandomPlayer);
  attendancePlayerSelect?.addEventListener('change', () => saveTeamPlayIdentity({ attendancePlayerNum: attendancePlayerSelect.value }));
  attendanceNicknameInput?.addEventListener('input', () => saveTeamPlayIdentity({ attendanceNickname: attendanceNicknameInput.value }));
  attendanceSubmitBtn?.addEventListener('click', submitAttendance);
  mvpFamiliarNumInput?.addEventListener('input', () => saveTeamPlayIdentity({ familiarPlayerNum: mvpFamiliarNumInput.value }));
  mvpNicknameInput?.addEventListener('input', () => saveTeamPlayIdentity({ nickname: mvpNicknameInput.value }));
  mvpSubmitBtn?.addEventListener('click', submitMvpVote);
  reviewTargetSelect?.addEventListener('change', renderReviewTool);
  reviewModeTeamBtn?.addEventListener('click', () => setReviewMode(REVIEW_MODE_TEAM));
  reviewModeFriendBtn?.addEventListener('click', () => setReviewMode(REVIEW_MODE_FRIEND));
  reviewImageBtn?.addEventListener('click', chooseMainReviewImage);
  reviewImageClearBtn?.addEventListener('click', clearMainReviewImage);
  reviewSubmitBtn?.addEventListener('click', submitPlayerReview);
  reviewSummary?.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    const reviewId = button.dataset.reviewId || '';
    const replyId = button.dataset.replyId || '';
    if (action === 'delete-review') deleteReview(reviewId);
    if (action === 'delete-reply') deleteReviewReply(reviewId, replyId);
    if (action === 'reply-image') chooseReplyImage(reviewId);
    if (action === 'submit-reply') submitReviewReply(reviewId);
  });

  savePresetBtn.addEventListener('click', saveCurrentAsPreset);
  presetSelect.addEventListener('change', loadSelectedPreset);
  deletePresetBtn.addEventListener('click', deleteSelectedPreset);
  exportJsonBtn.addEventListener('click', exportCurrentPresetJson);
  publishCloudBtn?.addEventListener('click', () => publishCloudSnapshot(createSnapshot()));
  exportPngBtn?.addEventListener('click', exportPoster);
  swapStarterBtn.addEventListener('click', swapSelectedStarter);

  document.querySelectorAll('[contenteditable="true"]').forEach(el => {
    el.addEventListener('input', queueSaveLastState);
  });

  window.addEventListener('resize', updatePosterPreviewScale);
  window.addEventListener('orientationchange', () => setTimeout(updatePosterPreviewScale, 250));
  window.addEventListener('load', updatePosterPreviewScale);
  document.addEventListener('error', handleImageError, true);
  poster.addEventListener('load', updatePosterPreviewScale, true);
  window.addEventListener('beforeunload', saveLastState);
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    try {
      if (canvas.toBlob) {
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('PNG 生成失败'));
        }, 'image/png');
      } else {
        const dataUrl = canvas.toDataURL('image/png');
        const binary = atob(dataUrl.split(',')[1]);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        resolve(new Blob([bytes], { type: 'image/png' }));
      }
    } catch (error) {
      reject(error);
    }
  });
}

function closeExportPreview() {
  document.getElementById('export-preview-overlay')?.remove();
  if (currentExportObjectUrl) {
    URL.revokeObjectURL(currentExportObjectUrl);
    currentExportObjectUrl = '';
  }
}

async function canvasToPreviewUrl(canvas) {
  const blob = await canvasToBlob(canvas);
  return URL.createObjectURL(blob);
}

function showExportPreview(imageUrl = '') {
  closeExportPreview();
  if (imageUrl && imageUrl.startsWith('blob:')) currentExportObjectUrl = imageUrl;
  const overlay = document.createElement('div');
  overlay.className = 'export-preview-overlay';
  overlay.id = 'export-preview-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', '海报导出预览');
  const content = imageUrl
    ? `<div class="export-preview-actions">
        <div class="export-preview-title">海报已生成。手机端请长按图片保存。</div>
        <button class="ctrl-btn export-preview-close" type="button">关闭</button>
      </div>
      <img class="export-preview-img" src="${imageUrl}" alt="${escapeAttr(ACTIVE_PROFILE.name)}阵容海报">`
    : `<div class="export-preview-actions">
        <div class="export-preview-title">正在生成海报...</div>
        <button class="ctrl-btn export-preview-close" type="button">关闭</button>
      </div>
      <div class="export-preview-loading">正在生成 PNG，请稍等</div>`;
  overlay.innerHTML = `<div class="export-preview-panel">${content}</div>`;
  overlay.querySelector('.export-preview-close')?.addEventListener('click', closeExportPreview);
  overlay.addEventListener('click', event => {
    if (event.target === overlay) closeExportPreview();
  });
  document.body.appendChild(overlay);
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result || '')));
    reader.addEventListener('error', () => reject(reader.error || new Error('图片读取失败')));
    reader.readAsDataURL(blob);
  });
}

async function fetchImageAsDataUrl(source) {
  const response = await fetch(source, {
    mode: 'cors',
    cache: 'force-cache',
    credentials: 'omit'
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  if (!String(blob.type || '').startsWith('image/')) {
    throw new Error(`不是图片资源：${blob.type || 'unknown'}`);
  }
  return blobToDataUrl(blob);
}

async function proxyImageAsDataUrl(source, options = {}) {
  if (!CLOUDBASE_CONFIG.publishHttpPath) {
    throw new Error('未配置 CloudBase 图片代理');
  }
  const payload = {
    action: 'proxyImage'
  };
  const url = String(source || '').trim();
  const fileID = String(options.fileID || '').trim();
  if (url) payload.url = url;
  if (fileID) payload.fileID = fileID;
  if (!payload.url && !payload.fileID) {
    throw new Error('图片代理缺少图片地址');
  }
  const result = normalizePublishResult(await callPublishHttp({
    ...payload
  }));
  if (!result || result.ok === false || !result.dataUrl) {
    throw new Error(result?.message || result?.code || '图片代理失败');
  }
  return result.dataUrl;
}

async function getExportSafeImageSource(source) {
  if (!source) return '';
  const resolved = new URL(source, location.href);
  if (resolved.protocol === 'data:' || resolved.protocol === 'blob:') return source;
  if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') return source;
  try {
    return await fetchImageAsDataUrl(resolved.href);
  } catch (error) {
    console.warn('direct export image fetch failed, trying proxy:', resolved.href, error);
    return proxyImageAsDataUrl(resolved.href);
  }
}

function waitForImageReady(image) {
  if (!image) return Promise.resolve();
  if (image.decode) {
    return image.decode().catch(() => undefined);
  }
  if (image.complete) return Promise.resolve();
  return new Promise(resolve => {
    const done = () => resolve();
    image.addEventListener('load', done, { once: true });
    image.addEventListener('error', done, { once: true });
    window.setTimeout(done, 5000);
  });
}

function getExportPlaceholderImage() {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4"></svg>'
  );
}

async function prepareImagesForExport(root, options = {}) {
  if (!root || location.protocol === 'file:') return () => {};
  const forcePlaceholder = Boolean(options.forcePlaceholder);
  const images = Array.from(root.querySelectorAll('img'));
  const restores = [];
  await Promise.all(images.map(async image => {
    const originalSrc = image.getAttribute('src');
    const renderedSrc = image.currentSrc || image.src || originalSrc;
    if (!renderedSrc || renderedSrc.startsWith('data:') || renderedSrc.startsWith('blob:')) return;
    const originalCrossOrigin = image.getAttribute('crossorigin');
    const restore = () => {
      if (originalSrc === null) image.removeAttribute('src');
      else image.setAttribute('src', originalSrc);
      if (originalCrossOrigin === null) image.removeAttribute('crossorigin');
      else image.setAttribute('crossorigin', originalCrossOrigin);
    };
    try {
      let exportSource = renderedSrc;
      if (!forcePlaceholder) {
        const cloudFileID = cloudImageFileIdByUrl.get(renderedSrc) || cloudImageFileIdByUrl.get(originalSrc) || '';
        if (cloudFileID) {
          try {
            const freshCloudUrl = await getFreshCloudImageUrl(cloudFileID);
            if (freshCloudUrl) exportSource = freshCloudUrl;
          } catch (refreshError) {
            console.warn('export cloud image refresh failed:', cloudFileID, refreshError);
          }
        }
      }
      const safeSource = forcePlaceholder ? getExportPlaceholderImage() : await getExportSafeImageSource(exportSource);
      if (!safeSource || safeSource === renderedSrc) return;
      restores.push(restore);
      image.removeAttribute('crossorigin');
      image.setAttribute('src', safeSource);
      await waitForImageReady(image);
    } catch (error) {
      console.warn('export image skipped:', renderedSrc, error);
      restores.push(restore);
      image.removeAttribute('crossorigin');
      let fallbackSource = '';
      if (!forcePlaceholder && image.dataset.fallbackSrc) {
        try {
          fallbackSource = await getExportSafeImageSource(image.dataset.fallbackSrc);
        } catch (fallbackError) {
          console.warn('export fallback image skipped:', image.dataset.fallbackSrc, fallbackError);
        }
      }
      image.setAttribute('src', fallbackSource || getExportPlaceholderImage());
      await waitForImageReady(image);
    }
  }));
  return () => {
    restores.reverse().forEach(restore => restore());
  };
}

async function capturePosterCanvas(options = {}) {
  const restoreExportImages = await prepareImagesForExport(poster, options);
  try {
    await new Promise(resolve => requestAnimationFrame(resolve));
    return await html2canvas(poster, {
      backgroundColor: null,
      scale: options.scale || 2,
      logging: false,
      useCORS: true,
      allowTaint: false,
      imageTimeout: 15000,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 760
    });
  } finally {
    restoreExportImages();
  }
}

async function exportPoster() {
  if (document.body.classList.contains('exporting-poster')) return;
  const mobileExport = isMobileExportContext();
  if (mobileExport) showExportPreview('');
  if (exportPngBtn) {
    exportPngBtn.disabled = true;
    exportPngBtn.textContent = '正在导出...';
  }
  clearDragVisuals();
  const editables = document.querySelectorAll('[contenteditable="true"]');
  editables.forEach(el => el.contentEditable = 'false');
  document.body.classList.add('exporting-poster');
  updatePosterPreviewScale();

  try {
    let canvas = await capturePosterCanvas();
    if (mobileExport) {
      let imageUrl = '';
      try {
        imageUrl = await canvasToPreviewUrl(canvas);
      } catch (error) {
        console.warn('mobile blob export failed, retrying with placeholders:', error);
        canvas = await capturePosterCanvas({ forcePlaceholder: true, scale: 1 });
        imageUrl = await canvasToPreviewUrl(canvas);
      }
      showExportPreview(imageUrl);
    } else {
      let blob = null;
      try {
        blob = await canvasToBlob(canvas);
      } catch (error) {
        console.warn('desktop blob export failed, retrying with placeholders:', error);
      }
      if (!blob) {
        canvas = await capturePosterCanvas({ forcePlaceholder: true, scale: 1.5 });
        blob = await canvasToBlob(canvas);
      }
      if (!blob) throw new Error('PNG 生成失败');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `LAOHE_lineup_${new Date().toISOString().slice(0,10)}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
  } catch (error) {
    console.warn('export poster failed:', error);
    closeExportPreview();
    alert(`导出失败：${error?.message || error}`);
  } finally {
    editables.forEach(el => el.contentEditable = canEdit() ? 'true' : 'false');
    document.body.classList.remove('exporting-poster');
    updatePosterPreviewScale();
    if (exportPngBtn) {
      exportPngBtn.disabled = false;
      exportPngBtn.innerHTML = uiIcon('download') + '导出 PNG 海报';
    }
  }
}

// 把 INLINE_PLAYER_DATA 里有、但 localStorage 旧状态里没有的替补球员补进来
// 注意：已经在首发里的球员也要排除，防止换人后重复出现
function mergeMissingBenchPlayers(shouldSave = true) {
  if (ACTIVE_PROFILE.id !== 'legacy-11') return;
  const existingNums = new Set([
    ...SQUAD_DATA.bench.map(p => String(p.num)),
    ...SQUAD_DATA.starters.map(p => String(p.num))
  ]);
  const newPlayers = (INLINE_PLAYER_DATA.bench || []).filter(p => !existingNums.has(String(p.num)));
  if (newPlayers.length === 0) return;
  SQUAD_DATA.bench.push(...newPlayers.map(normalizePlayer));
  renderAll();
  if (shouldSave) saveLastState();
}

async function init() {
  await loadPlayerData();
  setupWorkspaceShell();
  normalizeSquadData();
  bindControls();
  loadReviewIdentity();
  applyTeamPlayIdentityToInputs();
  await initCloudBaseSync();

  const initialState = await readInitialState();
  if (!applySnapshot(initialState, false)) {
    applyCurrentFormationLabels();
    updateControls();
    renderAll();
    saveLastState();
    ensureDefaultPreset();
  } else {
    mergeMissingBenchPlayers();
    // 兼容旧存档：补上替补卡片的英文副标题
    const benchTitleEl = document.querySelector('[data-edit-key="benchTitle"]');
    if (benchTitleEl && !benchTitleEl.textContent.includes('BENCH')) {
      benchTitleEl.textContent = '▌ 替补卡片 · BENCH';
    }
  }
  renderPresetSelect(initialState ? '' : DEFAULT_PRESET_NAME);
  startCloudWatch();
}

init();

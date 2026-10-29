/* Workspace presentation. Lineup state is owned by lineup.js. */
function setMobileWorkspaceView(view) {
  document.body.dataset.mobileView = view === 'controls' ? 'controls' : 'lineup';
  document.querySelectorAll('button[data-mobile-view]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.mobileView === document.body.dataset.mobileView));
  });
  requestAnimationFrame(updatePosterPreviewScale);
}

function setupWorkspaceShell() {
  document.title = `${ACTIVE_PROFILE.name} · 阵容工作台`;
  document.body.dataset.workspace = ACTIVE_PROFILE.id;
  setMobileWorkspaceView('lineup');
  document.querySelectorAll('button[data-mobile-view]').forEach(button => {
    const view = button.dataset.mobileView;
    button.innerHTML = uiIcon(view === 'lineup' ? 'users-round' : 'sliders-horizontal') + (view === 'lineup' ? '看阵容' : '调整');
    button.addEventListener('click', () => setMobileWorkspaceView(view));
  });
  document.getElementById('mobile-export-btn').innerHTML = uiIcon('download') + '导出';
  document.getElementById('mobile-export-btn').addEventListener('click', exportPoster);
  document.querySelectorAll('.workspace-nav button[data-workspace]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.workspace === ACTIVE_PROFILE.id));
    button.addEventListener('click', () => {
      if (button.dataset.workspace === ACTIVE_PROFILE.id) return;
      saveLastState();
      const target = new URL(location.href);
      target.searchParams.set('team', button.dataset.workspace);
      // Full navigation gives each team its own listeners, pending requests and storage.
      location.assign(target.href);
    });
  });
  const formationRow = document.querySelector('.formation-btn').parentElement;
  formationRow.querySelectorAll('button').forEach(button => button.remove());
  Object.entries(FORMATIONS).filter(([,value]) => value.slots.length === PLAYER_COUNT).forEach(([key,value]) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'ctrl-btn formation-btn';
    button.dataset.formation = key; button.textContent = value.label;
    formationRow.appendChild(button);
  });
  const panel = document.querySelector('.control-panel');
  const restore = document.createElement('button');
  restore.type = 'button'; restore.id = 'restore-default-lineup'; restore.className = 'ctrl-btn';
  restore.innerHTML = uiIcon('rotate-ccw') + '恢复默认阵容';
  restore.title = '恢复本场默认首发与阵型，保留照片和互动；当前排阵自动存为备份';
  restore.addEventListener('click', restoreDefaultLineup);
  formationRow.appendChild(restore);
  const advanced = document.createElement('details');
  advanced.className = 'advanced-controls';
  advanced.innerHTML = '<summary>球队管理与保存</summary><div class="advanced-inner"></div>';
  panel.appendChild(advanced);
  const coreRows = [formationRow, document.querySelector('.kit-btn').parentElement, document.getElementById('starter-slot-select').closest('.control-row'), document.getElementById('export-png-btn').closest('.control-row')];
  const editRow = document.querySelector('.edit-row');
  // Keep editing and primary actions discoverable; move less frequent settings into one disclosure.
  panel.querySelectorAll(':scope > .control-row, :scope > .control-section').forEach(row => {
    if (!coreRows.includes(row) && row !== editRow && !row.classList.contains('sync-row')) advanced.lastElementChild.appendChild(row);
  });
  const roster = document.createElement('details');
  roster.className = 'control-section roster-section';
  roster.innerHTML = '<summary>完整名单与照片</summary><input type="search" class="ctrl-input roster-search" id="roster-search" aria-label="按姓名或号码搜索名单" placeholder="搜索姓名或号码"><div id="workspace-roster" class="roster-list"></div><button type="button" class="ctrl-btn" id="manage-roster-photos">补充球员照片</button><p class="help">缺照片先保留空位。解锁编辑后可在球员管理中上传主、客场照。</p>';
  panel.insertBefore(roster, advanced);
  document.getElementById('roster-search').addEventListener('input', renderWorkspaceSummary);
  const help = panel.querySelector(':scope > .help');
  if (help && help.id !== 'draft-notice') advanced.lastElementChild.appendChild(help);
  panel.querySelectorAll(':scope > .help:not(#draft-notice)').forEach(item => advanced.lastElementChild.appendChild(item));
  document.getElementById('manage-roster-photos').addEventListener('click', () => {
    setMobileWorkspaceView('controls');
    advanced.open = true;
    const manager = document.getElementById('photo-manager').closest('details');
    manager.open = true;
    (canEdit() ? manager : editRow).scrollIntoView({behavior:'smooth',block:'center'});
  });
  const reload = document.createElement('button');
  reload.type = 'button'; reload.className = 'ctrl-btn'; reload.textContent = '重新载入云端';
  reload.hidden = !isCloudBaseSyncHost();
  reload.addEventListener('click', async () => {
    if (!cloudSyncState.initialized) return;
    if (cloudSyncState.localDirty && !confirm('重新载入会替换当前草稿。建议先导出 JSON 备份，再继续。')) return;
    const snapshot = await readCloudSnapshot({ discardDraft: true }).catch(error => { updateSyncStatus('error',error.message); return null; });
    if (snapshot && applySnapshot(snapshot, false)) {
      cloudSyncState.localDirty = false;
      localStorage.removeItem(`laohe-${ACTIVE_PROFILE.id}-draft`);
      updateSyncStatus('synced','已载入云端最新阵容');
    }
  });
  document.querySelector('.sync-row').appendChild(reload);
  if (ACTIVE_PROFILE.id !== 'legacy-11') {
    const texts = {teamCn:ACTIVE_PROFILE.name,teamEn:'ZJU SAA · 星辰杯',titleCn:'首发阵容',titleEn:'8-A-SIDE',style:'8 人制',meta:`2026 浙大星辰杯 · ${ACTIVE_PROFILE.name}`,footer:ACTIVE_PROFILE.name + ' · 2026 星辰杯'};
    for (const [key,value] of Object.entries(texts)) document.querySelector(`[data-edit-key="${key}"]`).textContent = value;
    document.querySelector('.legends').hidden = true;
  }
  document.querySelector('.control-panel h2').innerHTML = uiIcon('sliders-horizontal') + '排阵工作台';
  document.querySelector('#team-play-tool > h2').innerHTML = uiIcon('trophy') + '赛前互动';
  document.querySelector('.draw-tool > h2').textContent = '认识队友';
  document.querySelector('#review-tool > h2').textContent = '球员评价';
  document.querySelector('#draw-card .draw-meta').textContent = `${ACTIVE_PROFILE.name} · 球员与球队成员`;
  document.querySelector('#draw-card .draw-intro').textContent = '抽一张卡，看看这次是谁。';
  document.getElementById('draw-card').classList.add('is-empty');
  document.querySelector('#draw-card .draw-avatar').innerHTML = uiIcon('users-round');
  document.getElementById('export-png-btn').innerHTML = uiIcon('download') + '导出 PNG 海报';
  renderWorkspaceSummary();
}

function renderWorkspaceSummary() {
  const roster = [...SQUAD_DATA.starters, ...SQUAD_DATA.bench];
  const missing = roster.filter(p => !(p.avatar || p.avatarHome || p.avatarAway));
  document.getElementById('workspace-team-title').textContent = `${ACTIVE_PROFILE.name} · ${PLAYER_COUNT} 人制`;
  const captains = roster.filter(p=>p.captain).map(p=>p.name).join('、') || '待指定';
  document.getElementById('workspace-team-meta').textContent = `队长 ${captains} · 领队 ${MANAGER_DATA.name}`;
  document.getElementById('workspace-roster-note').textContent = `${roster.length} 人名单 · ${missing.length} 人待补照片`;
  const list = document.getElementById('workspace-roster');
  if (!list) return;
  list.replaceChildren();
  const query = (document.getElementById('roster-search')?.value || '').trim().toLowerCase();
  roster.filter(player => `${player.name} ${player.num}`.toLowerCase().includes(query)).sort((a,b)=>Number(a.num)-Number(b.num)).forEach(player => {
    const row = document.createElement('div'); row.className = 'roster-person';
    row.dataset.injured = String(player.status === 'injured');
    const number = document.createElement('strong'); number.textContent = `#${player.num}`;
    const name = document.createElement('span'); name.textContent = player.name + (player.captain ? ' C' : '');
    const status = document.createElement('small'); status.className = player.status === 'injured' ? 'status-pill' : '';
    status.textContent = player.status === 'injured' ? '受伤' : missing.includes(player) ? '待补照片' : '已有照片';
    row.append(number,name,status); list.append(row);
  });
  if (!list.children.length) { const empty = document.createElement('p'); empty.className = 'help'; empty.textContent = '没有匹配的队员，请换一个姓名或号码。'; list.appendChild(empty); }
}

function restoreDefaultLineup() {
  if (!canEdit()) return;
  const presets = getPresets();
  presets['恢复默认前的备份'] = createSnapshot();
  if (!setPresets(presets, true)) return;
  SQUAD_DATA = LaoheDefaults.arrange(SQUAD_DATA, INLINE_PLAYER_DATA);
  currentFormation = DEFAULT_FORMATION;
  normalizeSquadData();
  applyCurrentFormationLabels();
  updateControls();
  renderAll();
  saveLastState();
  renderPresetSelect('');
  updateSyncStatus('ready', '已恢复默认阵容，原排阵已存入预设');
}

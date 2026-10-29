'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/lineup.js'), 'utf8');

function productionFunction(name) {
  const match = source.match(new RegExp('^function ' + name + '\\([^]*?^\\}', 'm'));
  assert.ok(match, `Missing production function: ${name}`);
  return match[0];
}

// Run the real mutations, bench renderer and drag/drop handlers. Only DOM
// construction, unrelated views and persistence are replaced at the boundary.
const code = [
  'renderBench', 'updatePlayerField', 'updatePlayerStatus',
  'handleBenchDragStart', 'handleStarterDrop', 'swapCandidateToStarter',
  'swapBenchToStarter', 'handleBenchPointerDown', 'stopPointerDrag'
].map(productionFunction).join('\n\n');

function fixture() {
  const benchGrid = {
    children: [],
    set innerHTML(value) { this.children = []; },
    appendChild(item) { this.children.push(item); }
  };
  const focusedInput = { value: '2', selectionStart: 1 };
  const calls = { pitch: 0, summary: [], all: 0, save: 0, queuedSave: 0 };
  const context = {
    SQUAD_DATA: {
      starters: [{ id: 'starter', num: '10', name: '首发', status: 'fit', positions: [] }],
      bench: [
        { id: 'a', num: '2', name: '甲', status: 'fit', positions: [] },
        { id: 'b', num: '5', name: '乙', status: 'fit', positions: [] }
      ]
    },
    LEGENDS_DATA: [],
    benchGrid,
    canEdit: () => true,
    normalizeName: value => value,
    getCurrentAvatar: () => '',
    getDefaultPlayerAvatar: () => '',
    getStatusIcon: status => status === 'injured' ? '伤' : status === 'suspended' ? '停' : '',
    escapeHtml: value => String(value),
    document: {
      activeElement: focusedInput,
      createElement: () => ({
        dataset: {}, classList: { add() {} }, listeners: {},
        addEventListener(name, handler) { this.listeners[name] = handler; }
      })
    },
    window: { addEventListener() {}, removeEventListener() {} },
    renderPitch: () => { calls.pitch++; },
    renderWorkspaceSummary: () => {
      calls.summary.push(JSON.parse(JSON.stringify(context.SQUAD_DATA)));
    },
    renderLegends() {},
    updateControls() {},
    renderAll: () => { calls.all++; },
    renderPhotoManager: () => { throw new Error('Must preserve the active management input'); },
    queueSaveLastState: () => { calls.queuedSave++; },
    saveLastState: () => { calls.save++; },
    applyStarterSlotLabel: player => ({ ...player }),
    benchVersionOf: player => ({ ...player }),
    clearDragVisuals() {},
    handleBenchDragEnd() {},
    handlePointerUp() {},
    handlePointerCancel() {},
    createDragGhost: () => ({ style: {} }),
    movePointerDrag() {},
    html5DragBenchIndex: null,
    html5DragCandidateValue: null,
    html5DragStarterIndex: null,
    pointerDrag: null
  };
  vm.createContext(context);
  vm.runInContext(code, context, { filename: 'lineup-player-management-functions.js' });
  return { context, benchGrid, calls, focusedInput };
}

test('changing a bench number then the name in the same management row never edits another player', () => {
  const { context: c, benchGrid, calls, focusedInput } = fixture();
  c.updatePlayerField('bench', 0, 'num', '9');
  assert.deepEqual(c.SQUAD_DATA.bench.map(player => player.id), ['a', 'b']);
  assert.deepEqual(benchGrid.children.map(item => item.dataset.benchIndex), ['1', '0']);
  assert.deepEqual(benchGrid.children.map(item => item.dataset.swapValue), ['bench:1', 'bench:0']);

  c.updatePlayerField('bench', 0, 'name', '甲的新名字');
  assert.equal(c.SQUAD_DATA.bench[0].name, '甲的新名字');
  assert.equal(c.SQUAD_DATA.bench[1].name, '乙');
  assert.match(benchGrid.children[1].innerHTML, /甲的新名字/);
  assert.equal(calls.summary.at(-1).bench[0].name, '甲的新名字');
  assert.equal(calls.summary.at(-1).bench[0].num, '9');
  assert.equal(calls.all, 0, 'Typing must not rebuild the management table');
  assert.equal(c.document.activeElement, focusedInput);
  assert.equal(focusedInput.selectionStart, 1);
});

test('injury and suspension updates immediately refresh bench cards and roster summary without rebuilding inputs', () => {
  const { context: c, benchGrid, calls, focusedInput } = fixture();
  for (const status of ['injured', 'suspended', 'fit']) {
    c.updatePlayerStatus('bench', 0, status);
    const card = benchGrid.children.find(item => item.dataset.benchIndex === '0');
    assert.equal(card.className.includes('unavailable'), status !== 'fit');
    assert.equal(card.innerHTML.includes('bench-status-badge'), status !== 'fit');
    assert.equal(calls.summary.at(-1).bench[0].status, status);
  }
  assert.equal(calls.pitch, 3);
  assert.equal(calls.queuedSave, 3);
  assert.equal(calls.all, 0);
  assert.equal(c.document.activeElement, focusedInput);
});

for (const inputMode of ['mouse drag', 'touch drag']) {
  test(`${inputMode} uses the original bench index after display sorting`, () => {
    const { context: c, benchGrid, calls } = fixture();
    c.updatePlayerField('bench', 0, 'num', '9');
    const firstDisplayedCard = benchGrid.children[0];
    assert.equal(firstDisplayedCard.dataset.benchIndex, '1');
    const target = { dataset: { starterIndex: '0' } };
    if (inputMode === 'mouse drag') {
      let payload;
      const dataTransfer = {
        setData(type, value) { payload = value; },
        getData() { return payload; }
      };
      firstDisplayedCard.listeners.dragstart({ currentTarget: firstDisplayedCard, dataTransfer });
      c.handleStarterDrop({ preventDefault() {}, currentTarget: target, dataTransfer });
    } else {
      firstDisplayedCard.listeners.pointerdown({
        currentTarget: firstDisplayedCard, pointerType: 'touch', button: 0, preventDefault() {}
      });
      c.pointerDrag.target = target;
      c.stopPointerDrag({}, true);
    }
    assert.equal(c.SQUAD_DATA.starters[0].id, 'b');
    assert.equal(c.SQUAD_DATA.bench[0].id, 'a');
    assert.equal(c.SQUAD_DATA.bench[1].id, 'starter');
    assert.equal(calls.save, 1);
  });
}

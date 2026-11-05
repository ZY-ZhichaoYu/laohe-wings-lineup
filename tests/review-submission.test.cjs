'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/lineup.js'), 'utf8');
const code = source.slice(source.indexOf('async function submitPlayerReview()'), source.indexOf('function appendReplyToReview(')) +
  source.slice(source.indexOf('async function submitReviewReply('), source.indexOf('async function deleteReview('));
function fixture({ online = true, connected = true } = {}) {
  const mainInput = { value: 'My unsent review' };
  const replyInput = { value: 'My unsent reply' };
  const mainFiles = [{ name: 'review.png' }];
  const replyFiles = new Map([['parent', [{ name: 'reply.png' }]]]);
  const records = [{ id: 'parent', targetNum: '8', targetName: 'Player', replies: [] }];
  const statuses = [];
  const counters = { render: 0, persisted: 0, uploads: 0, calls: 0, localWrites: 0 };
  let call = async () => { throw new Error('network unavailable'); };
  let uploadFailure = false;
  const prepend = review => { records.unshift(review); return review; };
  const append = (id, reply) => { records.find(item => item.id === id).replies.push(reply); return reply; };
  const context = vm.createContext({
    isCloudBaseSyncHost: () => online,
    cloudSyncState: { initialized: connected }, CLOUDBASE_CONFIG: { publishFunction: 'publishLineup', currentDocId: 'current-wings-8' },
    reviewTargetSelect: { value: 'player:8' },
    findReviewablePlayer: () => ({ num: '8', name: 'Player', reviewKey: 'player:8', reviewType: 'player' }),
    currentReviewMode: 'friend', REVIEW_MODE_TEAM: 'team', canEdit: () => false,
    reviewerNumInput: { value: '8', focus() {} }, reviewerNameInput: { value: 'Friend', focus() {} },
    findLineupPersonByNumber: () => ({ num: '8', name: 'Player' }),
    pendingReviewAttachmentFiles: mainFiles, pendingReplyAttachmentFiles: replyFiles,
    uploadReviewImageAttachments: async files => {
      counters.uploads++;
      if (uploadFailure) throw new Error('upload failed');
      return files.map(file => ({ src: 'cloudimg:test/' + file.name, name: file.name }));
    },
    normalizeReview: review => ({ id: review.id || 'local-review', ...review }),
    normalizeReviewReply: reply => ({ id: reply.id || 'local-reply', ...reply }),
    normalizeReviewImageFiles: files => files,
    reviewCommentInput: mainInput, reviewRatingSelect: { value: '5' },
    REVIEW_DELETE_WINDOW_MS: 600000, getReviewDeviceId: () => 'private-device',
    saveReviewIdentityForMode() {}, getReviewClientInfo: () => ({}), editToken: '',
    callPublishFunction: payload => { counters.calls++; return call(payload); },
    buildReviewsWithSubmittedReview: review => [review, ...records],
    buildReviewsWithReply: (id, reply) => records.map(item => item.id === id ? { ...item, replies: [...item.replies, reply] } : item),
    createSnapshotWithReviewsData: reviews => ({ reviewsData: reviews || records }),
    normalizePublishResult: response => response,
    hasReviewAttachments: review => Boolean(review.attachments && review.attachments.length),
    mergeSubmittedReviewAttachments: (saved, submitted) => ({ ...submitted, ...saved }),
    prependReview: prepend, appendReplyToReview: append,
    localStorageAdapter: { writeLastState() { counters.localWrites++; } },
    createSnapshot: () => ({ reviewsData: records }),
    clearMainReviewImage: () => { mainFiles.length = 0; },
    renderReviewTool: () => { counters.render++; },
    getReviewAttribution: () => 'Friend', getReviewReplyMetaHtml: () => 'Friend',
    setReviewStatus: (message, error) => statuses.push({ message, error }),
    getCloudErrorMessage: error => error.message,
    saveLastState: () => { counters.persisted++; },
    REVIEWS_DATA: records,
    reviewSummary: { querySelectorAll: () => [{ dataset: { reviewId: 'parent' }, querySelector: () => replyInput }] },
    setReplyImages: (id, files) => replyFiles.set(id, files),
    console: { warn() {} }
  });
  const api = vm.runInContext(code + '\n({submitPlayerReview, submitReviewReply})', context);
  return {
    mainInput, replyInput, mainFiles, replyFiles, records, statuses, counters, api,
    set call(value) { call = value; }, set uploadFailure(value) { uploadFailure = value; }
  };
}

for (const kind of ['review', 'reply']) {
  const run = f => kind === 'review' ? f.api.submitPlayerReview() : f.api.submitReviewReply('parent');
  const input = f => kind === 'review' ? f.mainInput : f.replyInput;
  const files = f => kind === 'review' ? f.mainFiles : f.replyFiles.get('parent');
  test(kind + ': network failure keeps text and files and does not add unsaved records', async () => {
    const f = fixture();
    const original = input(f).value;
    await run(f);
    assert.equal(input(f).value, original);
    assert.equal(files(f).length, 1);
    assert.equal(f.records.length, 1);
    assert.equal(f.records[0].replies.length, 0);
    assert.equal(f.counters.render, 0);
    assert.equal(f.counters.localWrites, 0);
    assert.match(f.statuses.at(-1).message, /仍保留/);
  });

  test(kind + ': server rejection and empty confirmation also preserve the form', async () => {
    for (const response of [{ ok: false, code: 'TRANSACTION_FAILED' }, {}, { ok: true }]) {
      const f = fixture();
      f.call = async () => ({ response, mode: 'http' });
      const original = input(f).value;
      await run(f);
      assert.equal(input(f).value, original);
      assert.equal(files(f).length, 1);
      assert.equal(f.records.length, 1);
      assert.equal(f.records[0].replies.length, 0);
      assert.equal(f.statuses.at(-1).error, true);
    }
  });

  test(kind + ': failed upload leaves input available to retry', async () => {
    const f = fixture();
    f.uploadFailure = true;
    const original = input(f).value;
    await run(f);
    assert.equal(input(f).value, original);
    assert.equal(files(f).length, 1);
    assert.equal(f.counters.calls, 0);
    assert.equal(f.records.length, 1);
  });

  test(kind + ': cloud host with no connection does not silently save as offline', async () => {
    const f = fixture({ connected: false });
    const original = input(f).value;
    await run(f);
    assert.equal(input(f).value, original);
    assert.equal(files(f).length, 1);
    assert.equal(f.counters.persisted, 0);
    assert.equal(f.counters.uploads, 0);
    assert.match(f.statuses.at(-1).message, /尚未连接/);
  });

  test(kind + ': successful retry clears form only after server confirmation', async () => {
    const f = fixture();
    await run(f);
    f.call = async payload => ({
      response: { ok: true, [kind]: { ...(payload.review || payload.reply), id: 'server-saved' } },
      mode: 'http'
    });
    await run(f);
    assert.equal(input(f).value, '');
    assert.equal(files(f).length, 0);
    assert.equal(f.counters.localWrites, 1);
    if (kind === 'review') assert.equal(f.records[0].id, 'server-saved');
    else assert.equal(f.records[0].replies[0].id, 'server-saved');
  });

  test(kind + ': explicit offline mode retains existing local persistence', async () => {
    const f = fixture({ online: false, connected: false });
    await run(f);
    assert.equal(input(f).value, '');
    assert.equal(files(f).length, 0);
    assert.equal(f.counters.calls, 0);
    assert.equal(f.counters.persisted, 1);
    if (kind === 'review') assert.equal(f.records.length, 2);
    else assert.equal(f.records[0].replies.length, 1);
  });
}

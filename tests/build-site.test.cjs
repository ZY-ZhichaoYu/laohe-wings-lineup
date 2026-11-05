'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { buildSite } = require('../scripts/build-site.cjs');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'laohe-build-test-'));
  t.after(() => {
    if (path.dirname(root) !== os.tmpdir() || !path.basename(root).startsWith('laohe-build-test-')) throw new Error('Unexpected test directory');
    fs.rmSync(root, { recursive: true, force: true });
  });
  const put = (relative, content) => { const file = path.join(root, relative); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); };
  put('index.html', '<link rel="stylesheet" href="./assets/app.css"><script src="./cloudbase-config.js"></script><script src="./assets/app.js"></script>');
  put('cloudbase-config.js', 'window.config = {};');
  put('assets/app.js', 'window.ready = true;');
  put('assets/app.css', '.hero { background: url("./hero.png"); }');
  put('assets/hero.png', 'hero fixture');
  put('assets/player.png', 'player fixture');
  put('data/players.json', JSON.stringify({ starters: [{ avatarHome: 'assets/player.png' }], alumni: [] }));
  return { root, put };
}

test('public build excludes old images, credentials and developer files, removes stale output, and preserves source files', t => {
  const { root, put } = fixture(t);
  put('assets/player-old.png', 'keep only in source');
  put('assets/.private.env', 'never public');
  put('data/backup.json', 'never public');
  put('cloudfunctions/publishLineup/index.js', 'never public');
  put('dist/stale.txt', 'previous build');
  const manifest = buildSite(root, { sourceCommit: 'test-source' });
  const publicFiles = manifest.files.map(f => f.path);
  for (const expected of ['assets/app.js','assets/app.css','assets/hero.png','assets/player.png','data/players.json']) assert.ok(publicFiles.includes(expected));
  for (const absent of ['assets/player-old.png','assets/.private.env','data/backup.json','cloudfunctions/publishLineup/index.js','stale.txt']) assert.ok(!fs.existsSync(path.join(root,'dist',absent)), absent);
  assert.equal(fs.readFileSync(path.join(root,'assets/player-old.png'),'utf8'), 'keep only in source');
});

test('each build fingerprints scripts and styles and records the exact public bytes', t => {
  const { root, put } = fixture(t);
  const first = buildSite(root, { sourceCommit: 'first-source' });
  const html1 = fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
  assert.match(html1, /assets\/app\.js\?v=[a-f0-9]{12}/);
  assert.match(html1, /cloudbase-config\.js\?v=[a-f0-9]{12}/);
  assert.match(html1, /assets\/app\.css\?v=[a-f0-9]{12}/);
  for (const file of first.files) {
    const bytes = fs.readFileSync(path.join(root,'dist',file.path));
    assert.equal(file.sha256, crypto.createHash('sha256').update(bytes).digest('hex'));
    assert.equal(file.bytes, bytes.length);
  }
  put('assets/app.js', 'window.ready = "new release";');
  buildSite(root, { sourceCommit: 'next-source' });
  const html2 = fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
  assert.notEqual(html1.match(/app\.js\?v=([a-f0-9]+)/)[1], html2.match(/app\.js\?v=([a-f0-9]+)/)[1]);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root,'dist/release.json'),'utf8')).sourceCommit,'next-source');
});

test('a missing referenced image fails before replacing the previously valid public build', t => {
  const { root, put } = fixture(t);
  buildSite(root);
  put('data/players.json', '{"avatarHome":"assets/missing.png"}');
  assert.throws(() => buildSite(root), /ENOENT/);
  assert.ok(fs.existsSync(path.join(root,'dist/index.html')));
});

test('public asset paths reject attempts to include credentials outside the assets tree', t => {
  const { root, put } = fixture(t);
  put('.credential', 'not public');
  put('data/players.json', '{"avatarHome":"assets/../.credential"}');
  assert.throws(() => buildSite(root), /Unsafe public asset path/);
});

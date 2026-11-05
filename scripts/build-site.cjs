'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const digest = content => crypto.createHash('sha256').update(content).digest('hex');

function readSiteFiles(root) {
  const files = new Map();
  const pending = ['index.html', 'cloudbase-config.js', 'data/players.json'];
  const master = JSON.parse(fs.readFileSync(path.join(root, 'data/players.json'), 'utf8'));
  function addDataImages(value) {
    if (typeof value === 'string' && value.startsWith('assets/')) pending.push(value);
    else if (Array.isArray(value)) value.forEach(addDataImages);
    else if (value && typeof value === 'object') Object.values(value).forEach(addDataImages);
  }
  addDataImages(master);
  while (pending.length) {
    const relative = pending.pop().replace(/^\.\//, '').split(/[?#]/, 1)[0];
    const absolute = path.resolve(root, relative);
    if (!absolute.startsWith(root + path.sep) || relative.split(/[\\/]/).some(part => part.startsWith('.'))) throw new Error(`Unsafe public asset path: ${relative}`);
    if (files.has(relative)) continue;
    if (!fs.realpathSync(absolute).startsWith(fs.realpathSync(root) + path.sep)) throw new Error(`Asset escapes the project: ${relative}`);
    const content = fs.readFileSync(absolute);
    files.set(relative, content);
    if (relative.endsWith('.html')) {
      for (const match of content.toString('utf8').matchAll(/(?:src|href)=["']([^"'#]+)["']/g)) {
        if (/^(?:\.\/)?assets\//.test(match[1])) pending.push(match[1]);
      }
    } else if (relative.endsWith('.css')) {
      for (const match of content.toString('utf8').matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
        if (!/^(?:data:|https?:|\/\/|#)/i.test(match[1])) pending.push(path.posix.join(path.posix.dirname(relative), match[1]));
      }
    }
  }
  return files;
}

function buildSite(root = path.resolve(__dirname, '..'), options = {}) {
  root = path.resolve(root);
  const files = readSiteFiles(root);
  const out = path.resolve(root, 'dist');
  if (path.dirname(out) !== root || path.basename(out) !== 'dist' || (fs.existsSync(out) && fs.lstatSync(out).isSymbolicLink())) throw new Error('Refusing to replace an unexpected build directory');
  let html = files.get('index.html').toString('utf8');
  html = html.replace(/((?:src|href)=["'])(\.\/(?:assets\/[^"']+\.(?:js|css)|cloudbase-config\.js))(["'])/g,
    (match, before, url, after) => `${before}${url}?v=${digest(files.get(url.slice(2))).slice(0, 12)}${after}`);
  files.set('index.html', Buffer.from(html));
  let sourceCommit = options.sourceCommit || null;
  if (!sourceCommit) {
    try { sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
    catch { /* Source archives can build without .git metadata. */ }
  }
  const manifest = {
    schemaVersion: 1, sourceCommit, builtAt: new Date().toISOString(),
    files: [...files.entries()].sort(([a], [b]) => a.localeCompare(b, 'en')).map(([file, content]) => ({ path: file, bytes: content.length, sha256: digest(content) }))
  };
  // Both validation and reads complete before replacing this generated folder.
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  for (const [relative, content] of files) {
    const target = path.join(out, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  fs.writeFileSync(path.join(out, 'release.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}
if (require.main === module) {
  require('./build-player-data.cjs');
  const manifest = buildSite();
  const total = manifest.files.reduce((sum, file) => sum + file.bytes, 0);
  console.log(`Static deployment files: dist/ (${manifest.files.length} files, ${(total / 1024 / 1024).toFixed(1)} MiB). Deploy publishLineup separately.`);
}
module.exports = { buildSite, readSiteFiles };

#!/usr/bin/env node
/**
 * 用 data/players.json 覆盖 index.html 里的 INLINE_PLAYER_DATA。
 *
 * 背景：index.html 里内联了一份 INLINE_PLAYER_DATA，作为 file://（离线打开）或
 * 抓取 players.json 失败时的回退数据。它和 data/players.json 是同一份数据的两处副本，
 * 手动维护必然漂移。约定：data/players.json 是唯一数据源，改完球员数据后跑一次本脚本即可同步。
 *
 * 用法：node scripts/sync-inline-players.js  [--check]
 *   --check  只校验是否一致，不写文件（不一致时退出码为 1，可用于 CI/pre-commit）。
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dataPath = path.join(root, 'data', 'players.json');
const htmlPath = path.join(root, 'index.html');
const checkOnly = process.argv.includes('--check');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const nextLine = 'const INLINE_PLAYER_DATA = ' + JSON.stringify(data) + ';';

const html = fs.readFileSync(htmlPath, 'utf8');
const pattern = /const INLINE_PLAYER_DATA = \{[\s\S]*?\};/;
if (!pattern.test(html)) {
  console.error('✗ 未在 index.html 中找到 INLINE_PLAYER_DATA 定义。');
  process.exit(2);
}

const current = html.match(pattern)[0];
if (current === nextLine) {
  console.log('✓ INLINE_PLAYER_DATA 已与 data/players.json 一致。');
  process.exit(0);
}

if (checkOnly) {
  console.error('✗ INLINE_PLAYER_DATA 与 data/players.json 不一致，请运行：node scripts/sync-inline-players.js');
  process.exit(1);
}

fs.writeFileSync(htmlPath, html.replace(pattern, () => nextLine));
console.log('✓ 已用 data/players.json 同步 index.html 的 INLINE_PLAYER_DATA。');

const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const data = JSON.parse(fs.readFileSync(path.join(root,'data/players.json'),'utf8'));
const output = '// Generated from data/players.json. Run npm run build:data; do not edit.\nwindow.LAOHE_PLAYER_DATA = ' + JSON.stringify(data) + ';\n';
const target = path.join(root,'assets/players-data.js');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(target) || fs.readFileSync(target,'utf8') !== output) throw new Error('Player data bundle is stale. Run npm run build:data.');
} else fs.writeFileSync(target,output);

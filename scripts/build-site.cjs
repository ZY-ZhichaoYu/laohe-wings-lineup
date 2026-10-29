const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
require('./build-player-data.cjs');
const out = path.join(root,'dist');
fs.mkdirSync(out,{recursive:true});
for (const name of ['index.html','cloudbase-config.js','assets','data']) fs.cpSync(path.join(root,name),path.join(out,name),{recursive:true});
console.log('Static deployment files: dist/ (deploy cloudfunctions/publishLineup separately)');

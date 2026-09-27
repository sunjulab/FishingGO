const fs = require('fs');
let code = fs.readFileSync('server/index.js', 'utf8');
code = code.replace(/\\\'/g, "'");
fs.writeFileSync('server/index.js', code, 'utf8');
console.log('fixed');

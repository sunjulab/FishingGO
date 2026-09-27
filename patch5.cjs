
const fs = require('fs');
let code = fs.readFileSync('server/index.js', 'utf8');
code = code.replace('const ADMIN_EMAIL = process.env.ADMIN_EMAIL || \x27sunjulab@gmail.com\x27;', '');
fs.writeFileSync('server/index.js', code, 'utf8');


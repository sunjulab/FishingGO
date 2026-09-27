
const fs = require('fs');
let code = fs.readFileSync('server/index.js', 'utf8');

const decl = String.fromCharCode(10) + 'const ADMIN_EMAIL = process.env.ADMIN_EMAIL || \u0022sunjulab.k@gmail.com\u0022;' + String.fromCharCode(10) + 'const ADMIN_ID = process.env.ADMIN_ID || \u0022admin\u0022;' + String.fromCharCode(10);

if (code.indexOf('ADMIN_ID = process.env') === -1) {
  code = code.replace('require(\u0022dotenv\u0022).config();', 'require(\u0022dotenv\u0022).config();' + decl);
  code = code.replace('require(\x27dotenv\x27).config();', 'require(\x27dotenv\x27).config();' + decl);
}

fs.writeFileSync('server/index.js', code, 'utf8');


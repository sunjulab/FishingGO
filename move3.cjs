
const fs = require('fs');
let code = fs.readFileSync('server/index.js', 'utf8');
const start = code.indexOf('// ─── KHOA 조석예보 API 프록시 ───');
const end = code.indexOf('// ? FIX-SIGTERM', start);
console.log('start:', start, 'end:', end);
if (start > -1 && end > -1) {
  const block = code.substring(start, end);
  code = code.substring(0, start) + code.substring(end);
  const catchAll = code.indexOf('// ? FIX-404-HANDLER:');
  console.log('catchAll:', catchAll);
  if (catchAll > -1) {
    code = code.substring(0, catchAll) + block + '\n' + code.substring(catchAll);
    fs.writeFileSync('server/index.js', code, 'utf8');
    console.log('Moved block!');
  }
}


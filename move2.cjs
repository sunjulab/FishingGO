
const fs = require('fs');
let code = fs.readFileSync('server/index.js', 'utf8');
const start = code.indexOf('// ─── KHOA 조석예보 API 프록시');
const end = code.indexOf('require(\u0027./graceful_shutdown\u0027)', start);
if (start > -1 && end > -1) {
  const block = code.substring(start, end);
  code = code.replace(block, '');
  const catchAll = code.indexOf('// ? FIX-404-HANDLER:');
  if (catchAll > -1) {
    code = code.substring(0, catchAll) + block + '\n' + code.substring(catchAll);
    fs.writeFileSync('server/index.js', code, 'utf8');
    console.log('Moved block BEFORE 404 handler');
  } else {
    console.log('Could not find 404 handler');
  }
} else {
  console.log('Could not find block');
}


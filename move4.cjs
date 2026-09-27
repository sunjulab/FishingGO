
const fs = require('fs');
let code = fs.readFileSync('server/index.js', 'utf8');
const KHOA = 'const KHOA_KEY = process.env.KHOA_KEY';
const startLine = code.lastIndexOf('\n', code.indexOf(KHOA) - 50); 
const end = code.indexOf('// ? FIX-SIGTERM', code.indexOf(KHOA));
console.log('start:', startLine, 'end:', end);
if (startLine > -1 && end > -1) {
  const block = code.substring(startLine, end);
  code = code.substring(0, startLine) + code.substring(end);
  const catchAll = code.indexOf('// ? FIX-404-HANDLER:');
  console.log('catchAll:', catchAll);
  if (catchAll > -1) {
    code = code.substring(0, catchAll) + block + '\n' + code.substring(catchAll);
    fs.writeFileSync('server/index.js', code, 'utf8');
    console.log('Moved successfully!');
  }
}


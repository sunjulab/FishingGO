
const fs = require('fs');
let code = fs.readFileSync('server/index.js', 'utf8');
const KHOA = 'const KHOA_KEY = process.env.KHOA_KEY';
const startLine = code.lastIndexOf('\n', code.indexOf(KHOA) - 50); 
const endStr = 'require(\\'./graceful_shutdown\\')';
const endLine = code.lastIndexOf('\n', code.indexOf(endStr)) - 150; // go back a few lines
const blockEnd = code.indexOf(endStr);
console.log('start:', startLine, 'end:', blockEnd);
if (startLine > -1 && blockEnd > -1) {
  // Wait, let's just find the closing brace of the app.get
  const closingBrace = code.indexOf('});\n', code.indexOf('app.get(\\'/api/tide/obs\\'')) + 4;
  const block = code.substring(startLine, closingBrace);
  code = code.substring(0, startLine) + code.substring(closingBrace);
  const catchAll = code.indexOf('app.use((req, res, next) => {');
  console.log('catchAll:', catchAll);
  if (catchAll > -1) {
    code = code.substring(0, catchAll) + block + '\n\n  ' + code.substring(catchAll);
    fs.writeFileSync('server/index.js', code, 'utf8');
    console.log('Moved successfully!');
  }
}


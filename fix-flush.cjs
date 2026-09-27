const fs = require('fs');
let lines = fs.readFileSync('server/index.js', 'utf8').split('\n');
const i1 = lines.findIndex(l => l.includes('function flushAllData() {'));
const i2 = lines.findIndex((l, idx) => l.includes('function flushAllData() {') && idx > i1);

if (i2 !== -1) {
  // Find the end of the second function (assuming it ends with '}' on a single line)
  let end = i2;
  while(lines[end] !== '}') {
    end++;
  }
  lines.splice(i2 - 1, end - i2 + 2); // remove comment above it + function
  fs.writeFileSync('server/index.js', lines.join('\n'), 'utf8');
  console.log('removed duplicate flushAllData');
} else {
  console.log('only one found');
}

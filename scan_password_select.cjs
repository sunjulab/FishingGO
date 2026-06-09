// scan_password_select.cjs - User.findOne without .select('-password') check
const fs = require('fs');
const content = fs.readFileSync('server/index.js', 'utf8');
const lines = content.split(/\r?\n/);

const issues = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // User.findOne / User.findById without .select('-password')
  if (/User\.findOne\(|User\.findById\(/.test(line)) {
    // 같은 라인 또는 다음 3줄에 select('-password') 없는 경우
    const context = lines.slice(i, i + 4).join('\n');
    const hasSelect = /select.*password|password.*select|\.select\(/.test(context);
    if (!hasSelect) {
      issues.push({ line: i + 1, content: line.trim().slice(0, 110) });
    }
  }
}

console.log(`User.findOne/findById + password 미제거 의심 ${issues.length}건:`);
issues.forEach(q => console.log(`  L${q.line}: ${q.content}`));

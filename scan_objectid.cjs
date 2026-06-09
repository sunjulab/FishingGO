// scan_objectid.cjs - ObjectId isValid 누락 전수 검사
const fs = require('fs');
const content = fs.readFileSync('server/index.js', 'utf8');
const lines = content.split(/\r?\n/);

// findById/findByIdAndDelete/findByIdAndUpdate + req.params.id 사용 라인 수집
// 그 앞에 isValid 체크가 없는 경우 리포트
const issues = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // findById / findByIdAndDelete / findByIdAndUpdate + req.params.id
  if (/findById|findByIdAndDelete|findByIdAndUpdate/.test(line) && /req\.params\.\w+|const\s+id\s*=\s*req\.params|const\s+\w+id\s*=\s*req\.params/.test(line)) {
    // 이전 10줄 내에 isValid 있는지 확인
    const prevLines = lines.slice(Math.max(0, i - 10), i).join('\n');
    const hasIsValid = /isValid|mongoose\.Types\.ObjectId\.isValid/.test(prevLines);
    if (!hasIsValid) {
      issues.push({ line: i + 1, content: line.trim().slice(0, 120) });
    }
  }
  // const { id } = req.params; 이후에 findById(id) 사용
  if (/const\s*\{[^}]*\bid\b[^}]*\}\s*=\s*req\.params/.test(line)) {
    // 이전 10줄 내 isValid 없으면 다음 findById(id) 를 찾음
    const prevLines = lines.slice(Math.max(0, i - 5), i).join('\n');
    const hasIsValid = /isValid/.test(prevLines);
    if (!hasIsValid) {
      // 이후 5줄에서 findById 확인
      const nextLines = lines.slice(i, i + 8).join('\n');
      if (/findById/.test(nextLines)) {
        issues.push({ line: i + 1, content: '[BLOCK] ' + line.trim().slice(0, 80) });
      }
    }
  }
}

console.log(`ObjectId isValid 누락 의심 ${issues.length}건:`);
issues.forEach(q => console.log(`  L${q.line}: ${q.content}`));

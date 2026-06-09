// scan_r17.cjs - Round 17: 심층 취약점 탐색
const fs = require('fs');
const content = fs.readFileSync('server/index.js', 'utf8');
const lines = content.split(/\r?\n/);

// 1. URL redirect open redirect 취약점
console.log('\n=== 1. Open Redirect 위험 ===');
lines.forEach((line, i) => {
  if (/res\.redirect\(/.test(line) && /req\.(query|body|params)/.test(line)) {
    console.log(`  L${i+1}: ${line.trim().slice(0, 100)}`);
  }
});

// 2. req.body를 직접 $set으로 사용하는 곳 (Mass Assignment)
console.log('\n=== 2. Mass Assignment 위험 ($set: req.body) ===');
lines.forEach((line, i) => {
  if (/\$set.*req\.body|\$push.*req\.body|\$inc.*req\.body/.test(line) && !/FIX/.test(line)) {
    console.log(`  L${i+1}: ${line.trim().slice(0, 100)}`);
  }
});

// 3. exec() shell injection 위험
console.log('\n=== 3. exec() shell injection ===');
lines.forEach((line, i) => {
  if (/\bexec\s*\(|child_process|execSync/.test(line) && !/node --check|git add|npm run|FIX/.test(line)) {
    console.log(`  L${i+1}: ${line.trim().slice(0, 100)}`);
  }
});

// 4. SQL/NoSQL injection — req.params/body를 직접 RegExp() 생성
console.log('\n=== 4. 동적 RegExp 생성 위험 ===');
lines.forEach((line, i) => {
  if (/new RegExp\(.*req\.(query|body|params)/.test(line)) {
    console.log(`  L${i+1}: ${line.trim().slice(0, 100)}`);
  }
});

// 5. SSRF 위험 — req 값으로 fetch/axios URL 생성
console.log('\n=== 5. SSRF 위험 — 외부 URL fetch ===');
lines.forEach((line, i) => {
  if (/fetch\(.*req\.|axios.*req\.|https\.get.*req\./.test(line)) {
    console.log(`  L${i+1}: ${line.trim().slice(0, 100)}`);
  }
});

// 6. 응답에 password 포함 여부 
console.log('\n=== 6. 응답에 password 직접 포함 ===');
lines.forEach((line, i) => {
  if (/res\.json.*password|JSON\.stringify.*password/.test(line) && !/\/\// .test(line.trim().slice(0, 2))) {
    console.log(`  L${i+1}: ${line.trim().slice(0, 100)}`);
  }
});

// 7. __proto__ / prototype 오염 위험
console.log('\n=== 7. Prototype Pollution ===');
lines.forEach((line, i) => {
  if (/__proto__|Object\.assign.*req\.(body|query)|Object\.prototype/.test(line)) {
    console.log(`  L${i+1}: ${line.trim().slice(0, 100)}`);
  }
});

console.log('\n=== 전수조사 완료 ===');

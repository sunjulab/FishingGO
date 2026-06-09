// scan_r20_extra.cjs - R20 추가 탐색: 미사용/위험 엔드포인트
const fs = require('fs');
const content = fs.readFileSync('server/index.js', 'utf8');
const lines = content.split(/\r?\n/);

// 1. /api/test, /api/debug 등 테스트 엔드포인트
console.log('\n=== 1. 테스트/디버그 엔드포인트 ===');
lines.forEach((line, i) => {
  const trimmed = line.trim();
  if (trimmed.startsWith('//')) return;
  if (/api\/(test|debug|dev|temp|tmp|dummy|mock|seed)/.test(line) && /app\.(get|post|put|delete)/.test(line)) {
    console.log(`  L${i+1}: ${line.trim().slice(0,100)}`);
  }
});

// 2. verifyToken 미들웨어 없이 민감 작업하는 엔드포인트
console.log('\n=== 2. verifyToken 없는 민감 라우트 ===');
lines.forEach((line, i) => {
  const trimmed = line.trim();
  if (trimmed.startsWith('//')) return;
  // admin, shop/manual, push 등 민감 엔드포인트인데 verifyToken 없는 것
  if (/api\/(admin|shop\/manual|push\/all)/.test(line) && /app\.(get|post|put|delete)/.test(line)) {
    const hasVerifyToken = line.includes('verifyToken');
    console.log(`  L${i+1}: ${line.trim().slice(0,90)} | verifyToken: ${hasVerifyToken ? '✅' : '❌'}`);
  }
});

// 3. 하드코딩된 비밀 키/토큰
console.log('\n=== 3. 하드코딩 비밀 키 ===');
lines.forEach((line, i) => {
  const trimmed = line.trim();
  if (trimmed.startsWith('//')) return;
  // 평문 비밀 키
  if (/secret.*=.*['"]\w{10,}['"]|key.*=.*['"]\w{15,}['"]/.test(line) && 
      !line.includes('process.env') && !line.includes('JWT_SECRET') && !line.includes('//')) {
    console.log(`  L${i+1}: ${line.trim().slice(0,80)}`);
  }
});

// 4. 소켓 disconnect 핸들러 — 정리 로직 있는지
console.log('\n=== 4. 소켓 disconnect 정리 ===');
lines.forEach((line, i) => {
  if (/socket\.on.*disconnect/.test(line)) {
    const next5 = lines.slice(i, i+5).join('\n');
    const hasCleanup = /delete|clear|filter|remove|Map|Set/.test(next5);
    console.log(`  L${i+1}: ${line.trim().slice(0,80)} | cleanup: ${hasCleanup ? '✅' : '⚠️'}`);
  }
});

// 5. /privacy, /terms 등 정적 페이지에 민감 정보 노출
console.log('\n=== 5. 정적 페이지 민감 정보 ===');
lines.forEach((line, i) => {
  if (/app\.get.*\/(privacy|terms|license|about)/.test(line)) {
    console.log(`  L${i+1}: ${line.trim().slice(0,80)}`);
  }
});

console.log('\n=== R20 추가 탐색 완료 ===');

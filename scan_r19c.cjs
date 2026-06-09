// scan_r19c.cjs - 미탐지 영역 탐색
const fs = require('fs');
const content = fs.readFileSync('server/index.js', 'utf8');
const lines = content.split(/\r?\n/);

// 1. 크루 채팅 GET 엔드포인트 멤버 체크
console.log('\n=== 1. 크루 채팅 조회 ===');
lines.forEach((line, i) => {
  if (/crews.*chat|chat.*crew/.test(line) && /app\.(get|post)/.test(line)) {
    const next10 = lines.slice(i, i+10).join('\n');
    const hasMemberCheck = /member|owner|isAdmin/.test(next10);
    console.log(`  L${i+1}: ${line.trim().slice(0,90)} | check: ${hasMemberCheck ? 'OK' : 'MISSING'}`);
  }
});

// 2. 결제 히스토리 IDOR
console.log('\n=== 2. 결제 히스토리 IDOR ===');
lines.forEach((line, i) => {
  if (/payment.*history|PaymentHistory.*find/.test(line) && /app\.get/.test(line)) {
    const next10 = lines.slice(i, i+10).join('\n');
    const hasAuth = /jwt|tp\.email|userId|isAdmin/.test(next10);
    console.log(`  L${i+1}: ${line.trim().slice(0,90)} | auth: ${hasAuth ? 'OK' : 'MISSING'}`);
  }
});

// 3. 사용자 프로필 PUT — 본인 검증
console.log('\n=== 3. 사용자 프로필 수정 IDOR ===');
lines.forEach((line, i) => {
  if (/api\/user.*put|api\/users.*put|app\.put.*user/.test(line) && /app\./.test(line)) {
    const next15 = lines.slice(i, i+15).join('\n');
    const hasSelfCheck = /tp\.email|jwt|isAdmin/.test(next15);
    console.log(`  L${i+1}: ${line.trim().slice(0,90)} | self-check: ${hasSelfCheck ? 'OK' : 'MISSING'}`);
  }
});

// 4. 비밀번호 변경 전 현재 비밀번호 확인 여부
console.log('\n=== 4. 비밀번호 변경 시 현재 비밀번호 확인 ===');
lines.forEach((line, i) => {
  if (/api.*password.*put|api.*change.*pwd|change-password|newPassword/.test(line) && /app\./.test(line)) {
    const next20 = lines.slice(i, i+20).join('\n');
    const hasCurrent = /currentPassword|oldPassword|current.*pass|bcrypt\.compare.*password/.test(next20);
    console.log(`  L${i+1}: ${line.trim().slice(0,90)} | currentPwd: ${hasCurrent ? 'OK' : 'MISSING'}`);
  }
});

// 5. 소켓 chat 저장 시 메시지 길이 제한
console.log('\n=== 5. 소켓 채팅 메시지 길이 제한 ===');
lines.forEach((line, i) => {
  if (/const safeText|text.*slice|msg.*length/.test(line) && /socket/.test(lines.slice(Math.max(0,i-5), i).join('\n'))) {
    console.log(`  L${i+1}: ${line.trim().slice(0,90)}`);
  }
});

console.log('\n=== 완료 ===');

// scan_r19b.cjs - Round 19 simplified scan
const fs = require('fs');
const content = fs.readFileSync('server/index.js', 'utf8');
const lines = content.split(/\r?\n/);

// 1. crew kick/ban 권한 확인
console.log('\n=== 1. 크루 kick 권한 체크 ===');
lines.forEach((line, i) => {
  if (/kick|ban.*member|member.*kick/.test(line) && /app\./.test(line)) {
    const next15 = lines.slice(i, i+15).join('\n');
    const hasAuth = /isAdmin|owner|role.*master|jwt/.test(next15);
    console.log(`  L${i+1}: ${line.trim().slice(0,80)} | auth: ${hasAuth ? '있음' : '없음'}`);
  }
});

// 2. crew DELETE 권한
console.log('\n=== 2. 크루 DELETE 권한 ===');
lines.forEach((line, i) => {
  if (/app\.delete.*crew|app\.delete.*crews/.test(line)) {
    const next20 = lines.slice(i, i+20).join('\n');
    const hasAuth = /isAdmin|owner|isAdminToken/.test(next20);
    console.log(`  L${i+1}: ${line.trim().slice(0,80)} | auth: ${hasAuth ? '있음' : '없음'}`);
  }
});

// 3. CS 문의 조회 IDOR
console.log('\n=== 3. CS 문의 API ===');
lines.forEach((line, i) => {
  if (/api\/cs|api\/inquiry|customer.*support/.test(line) && /app\./.test(line)) {
    const next15 = lines.slice(i, i+15).join('\n');
    const hasAuth = /jwt\.verify|verifyToken|email.*jwt|tp\.email/.test(next15);
    console.log(`  L${i+1}: ${line.trim().slice(0,80)} | auth: ${hasAuth ? '있음' : '없음'}`);
  }
});

// 4. 구독 조회 IDOR
console.log('\n=== 4. 구독 정보 조회 ===');
lines.forEach((line, i) => {
  if (/api.*subscription.*get|api.*payment.*sub|get.*subscription/.test(line) && /app\./.test(line)) {
    const next15 = lines.slice(i, i+15).join('\n');
    const hasAuth = /jwt\.verify|verifyToken|tp\.email|email.*jwt/.test(next15);
    console.log(`  L${i+1}: ${line.trim().slice(0,80)} | auth: ${hasAuth ? '있음' : '없음'}`);
  }
});

// 5. 크루 채팅 기록 조회 멤버 검증
console.log('\n=== 5. 크루 채팅 기록 조회 ===');
lines.forEach((line, i) => {
  if (/api.*crews.*chat|api.*chat.*crew|crew.*chat.*get/.test(line) && /app\./.test(line)) {
    const next15 = lines.slice(i, i+15).join('\n');
    const hasMemberCheck = /member|isMember|members.*email|email.*members/.test(next15);
    console.log(`  L${i+1}: ${line.trim().slice(0,80)} | 멤버체크: ${hasMemberCheck ? '있음' : '없음'}`);
  }
});

// 6. 중복 신고 방어
console.log('\n=== 6. 신고 중복 방어 ===');
lines.forEach((line, i) => {
  if (/api.*report|app\.post.*report/.test(line) && /app\./.test(line)) {
    const next20 = lines.slice(i, i+20).join('\n');
    const hasDedup = /Map|Set|reportedBy|already|dup/.test(next20);
    console.log(`  L${i+1}: ${line.trim().slice(0,80)} | 중복방어: ${hasDedup ? '있음' : '없음'}`);
  }
});

console.log('\n=== R19 탐색 완료 ===');

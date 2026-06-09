// scan_r19.cjs - Round 19 추가 취약점 탐색
const fs = require('fs');
const content = fs.readFileSync('server/index.js', 'utf8');
const lines = content.split(/\r?\n/);

// 1. 게시글 PUT (수정) IDOR 확인
console.log('\n=== 1. 게시글 PUT 작성자 검증 ===');
lines.forEach((line, i) => {
  if (/app\.put.*posts.*id|app\.patch.*posts.*id/.test(line)) {
    const next20 = lines.slice(i, i+25).join('\n');
    const hasOwnerCheck = /author_email|jwtEmail|isAdmin/.test(next20);
    console.log(`  L${i+1}: ${line.trim().slice(0,80)} | 권한체크: ${hasOwnerCheck ? '✅' : '❌'}`);
  }
});

// 2. 크루 채팅 저장 텍스트 직접 DB 저장 여부
console.log('\n=== 2. 채팅 DB 저장 시 text HTML strip 여부 ===');
lines.forEach((line, i) => {
  if (/ChatMessage.*new|new ChatMessage/.test(line)) {
    const prev10 = lines.slice(Math.max(0, i-10), i).join('\n');
    const hasSafeText = /safeText|censorText|FIX-CHAT-XSS|strip|replace.*</.test(prev10);
    console.log(`  L${i+1}: ${line.trim().slice(0,80)} | HTML strip: ${hasSafeText ? '✅' : '❌'}`);
  }
});

// 3. 조황기록 삭제 IDOR 재확인 (userId !== jwtEmail)
console.log('\n=== 3. 조황기록 삭제 권한 체크 ===');
lines.forEach((line, i) => {
  if (/CatchRecord.*delete|delete.*CatchRecord|\/api\/catch.*delete/.test(line) && 
      !line.includes('//')) {
    const prev10 = lines.slice(Math.max(0, i-15), i).join('\n');
    const hasAuth = /isAdmin|jwtEmail|userId|email.*jp\.email|jwt\.verify/.test(prev10);
    console.log(`  L${i+1}: ${line.trim().slice(0,80)} | auth: ${hasAuth ? '✅' : '❌'}`);
  }
});

// 4. 관리자 단독 API — isAdminToken 없는 곳 재확인
console.log('\n=== 4. /api/admin 엔드포인트 권한 누락 ===');
for (let i = 0; i < lines.length; i++) {
  if (/app\.(get|post|put|delete|patch).*\/api\/admin/.test(lines[i])) {
    const next5 = lines.slice(i, i+6).join('\n');
    const hasAdmin = /isAdminToken|isMaster|ADMIN_EMAIL|adminEmails|verifyToken/.test(next5);
    if (!hasAdmin) {
      console.log(`  L${i+1}: ${lines[i].trim().slice(0,80)} | 권한없음`);
    }
  }
});

// 5. 중복 엔드포인트 체크
console.log('\n=== 5. 중복 라우트 감지 ===');
const routes = {};
lines.forEach((line, i) => {
  const m = line.match(/app\.(get|post|put|delete|patch)\s*\(\s*'([^']+)'/);
  if (m) {
    const key = `${m[1].toUpperCase()} ${m[2]}`;
    if (routes[key]) {
      console.log(`  중복: ${key} (L${routes[key]} + L${i+1})`);
    } else {
      routes[key] = i+1;
    }
  }
});

console.log('\n=== R19 탐색 완료 ===');

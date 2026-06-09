// scan_r24.cjs - Round 24
const fs = require('fs');
const content = fs.readFileSync('server/index.js', 'utf8');
const lines = content.split(/\r?\n/);

// 1. MongoDB 저장 HTML이 그대로 반환되는 패턴
console.log('\n=== 1. HTML 태그 그대로 DB 저장/반환 ===');
lines.forEach((line, i) => {
  // body에서 가져온 값을 sanitize 없이 바로 MongoDB 필드에 저장
  if (/content.*req\.body|title.*req\.body|text.*req\.body/.test(line) &&
      /=/.test(line) && !line.trim().startsWith('//')) {
    const prev5 = lines.slice(Math.max(0, i-3), i).join('\n');
    const hasSanitize = /censorText|sanitize|replace.*<|strip|xss/.test(prev5 + line);
    if (!hasSanitize) {
      console.log(`  L${i+1}: ${line.trim().slice(0, 90)} ← HTML 미검증`);
    }
  }
});

// 2. category 파라미터 NoSQL injection
console.log('\n=== 2. category 파라미터 DB query 직접 사용 ===');
lines.forEach((line, i) => {
  if (/category.*req\.(query|body|params)|query.*category.*req/.test(line) && 
      !line.trim().startsWith('//')) {
    const next5 = lines.slice(i, i+5).join('\n');
    const hasEscape = /safeQ|replace|slice|trim|typeof.*string|allowedCat/.test(next5);
    console.log(`  L${i+1}: ${line.trim().slice(0, 90)} | escape: ${hasEscape ? '✅' : '⚠️'}`);
  }
});

// 3. 사진 외부 URL 저장 (SSRF)
console.log('\n=== 3. 외부 URL 저장 — SSRF 확인 ===');
lines.forEach((line, i) => {
  if (/imageUrl.*req\.(body|query)|url.*req\.body|image.*http/.test(line) && 
      !line.trim().startsWith('//')) {
    const prev5 = lines.slice(Math.max(0, i-3), i).join('\n');
    const hasSanitize = /sanitizeImageUrl|safeUrl|checkUrl|SSRF|allowedHost/.test(prev5 + line);
    if (!hasSanitize) {
      console.log(`  L${i+1}: ${line.trim().slice(0, 90)} ← SSRF 미검증 가능성`);
    }
  }
});

// 4. /api/admin/users 이메일 목록 노출
console.log('\n=== 4. 관리자 user 목록 이메일 노출 ===');
lines.forEach((line, i) => {
  if (/api.*admin.*user|api.*users.*admin/.test(line) && /app\.get/.test(line)) {
    const next10 = lines.slice(i, i+10).join('\n');
    const hasEmailFilter = /select.*-email|-email|email.*false/.test(next10);
    console.log(`  L${i+1}: ${line.trim().slice(0, 80)} | email 제외: ${hasEmailFilter ? '✅' : '❌'}`);
  }
});

// 5. 소켓 채팅 verifiedUser 없이 전송 (이미 확인됐지만 재확인)
console.log('\n=== 5. 소켓 send_msg verifiedUser 체크 ===');
lines.forEach((line, i) => {
  if (/send_msg|socket\.on.*msg/.test(line) && !line.trim().startsWith('//')) {
    const next20 = lines.slice(i, i+20).join('\n');
    const hasAuth = /verifiedUser|jwt|auth/.test(next20);
    console.log(`  L${i+1}: ${line.trim().slice(0, 80)} | auth: ${hasAuth ? '✅' : '❌'}`);
  }
});

// 6. Mongoose select 미적용 find
console.log('\n=== 6. User.find 전체 필드 반환 (응답에 포함) ===');
lines.forEach((line, i) => {
  const trimmed = line.trim();
  if (trimmed.startsWith('//')) return;
  if (/User\.find\b/.test(line)) {
    const next3 = lines.slice(i, i+3).join('\n');
    const hasSelect = /\.select\(/.test(line + next3);
    const directJson = /res\.json|return.*json/.test(next3);
    if (!hasSelect && directJson) {
      console.log(`  L${i+1}: ${line.trim().slice(0, 90)} ← 전체 반환 의심`);
    }
  }
});

console.log('\n=== R24 완료 ===');

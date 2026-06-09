// scan_r22.cjs - Round 22: 남은 미탐지 영역
const fs = require('fs');
const content = fs.readFileSync('server/index.js', 'utf8');
const lines = content.split(/\r?\n/);

// 1. 크루 가입 rate limit 없음
console.log('\n=== 1. 크루 join rate limit ===');
lines.forEach((line, i) => {
  const trimmed = line.trim();
  if (trimmed.startsWith('//')) return;
  if (/app\.post.*crews.*join/.test(line)) {
    const hasLimit = /Limiter/.test(line);
    console.log(`  L${i+1}: ${line.trim().slice(0,80)} | limit: ${hasLimit ? '✅' : '❌'}`);
  }
});

// 2. 좋아요 rate limit 없음
console.log('\n=== 2. 좋아요 rate limit ===');
lines.forEach((line, i) => {
  const trimmed = line.trim();
  if (trimmed.startsWith('//')) return;
  if (/app\.post.*like|app\.post.*likes/.test(line)) {
    const hasLimit = /Limiter/.test(line);
    console.log(`  L${i+1}: ${line.trim().slice(0,80)} | limit: ${hasLimit ? '✅' : '❌'}`);
  }
});

// 3. 조황기록 이미지 URL SSRF (sanitizeImageUrl 사용 여부)
console.log('\n=== 3. 조황기록 이미지 SSRF 검증 ===');
lines.forEach((line, i) => {
  if (/imageUrl|safeImageUrl|sanitizeImageUrl/.test(line) && /catch|record|CatchRecord/.test(line)) {
    console.log(`  L${i+1}: ${line.trim().slice(0,90)}`);
  }
});

// 4. 게시글 수정 시 조회수 초기화 방지
console.log('\n=== 4. 게시글 PUT - views 초기화 방지 ===');
lines.forEach((line, i) => {
  if (/app\.put.*posts\/:id/.test(line) && !line.trim().startsWith('//')) {
    const next30 = lines.slice(i, i+30).join('\n');
    const hasViewProtect = /views.*\$set.*inc|views.*protect|delete.*views/.test(next30);
    const allowedFields = next30.includes('ALLOWED_FIELDS') || next30.includes('safeFields');
    console.log(`  L${i+1}: ${line.trim().slice(0,80)} | views보호: ${allowedFields ? '✅(화이트리스트)' : '❌'}`);
  }
});

// 5. 소켓 join_crew 중복 방어
console.log('\n=== 5. 소켓 join_crew 중복 room 방지 ===');
lines.forEach((line, i) => {
  if (/socket\.join\(|joinRateMap|join_crew/.test(line)) {
    console.log(`  L${i+1}: ${line.trim().slice(0,80)}`);
  }
});

// 6. 공개된 사용자 프로필 API 민감 정보 노출
console.log('\n=== 6. 공개 프로필 API 민감 필드 노출 ===');
lines.forEach((line, i) => {
  if (/app\.get.*user\/profile/.test(line) && !line.trim().startsWith('//')) {
    const next15 = lines.slice(i, i+15).join('\n');
    const hasFilter = /select|password|email.*delete|\.pick/.test(next15);
    console.log(`  L${i+1}: ${line.trim().slice(0,80)} | 필드필터: ${hasFilter ? '✅' : '⚠️'}`);
  }
});

console.log('\n=== R22 탐색 완료 ===');

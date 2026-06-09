// scan_r21.cjs - Round 21 탐색
const fs = require('fs');
const content = fs.readFileSync('server/index.js', 'utf8');
const lines = content.split(/\r?\n/);

// 1. ALLOWED_ORIGINS 환경변수 미설정 시 fallback
console.log('\n=== 1. CORS ALLOWED_ORIGINS 설정 ===');
lines.forEach((line, i) => {
  if (/ALLOWED_ORIGINS|allowedOrigins/.test(line) && /=/.test(line)) {
    console.log(`  L${i+1}: ${line.trim().slice(0,100)}`);
  }
});

// 2. JWT algorithms: ['HS256'] 전수조사
console.log('\n=== 2. JWT algorithms 누락 탐색 ===');
let missingAlg = 0;
lines.forEach((line, i) => {
  if (/jwt\.verify\(/.test(line) && !line.includes('algorithms')) {
    console.log(`  L${i+1}: ${line.trim().slice(0,100)}`);
    missingAlg++;
  }
});
console.log(`  총 algorithms 누락: ${missingAlg}건`);

// 3. 비밀번호 재설정 토큰 (reset token) — 유효시간 및 1회 사용 제한
console.log('\n=== 3. 비밀번호 재설정 토큰 로직 ===');
lines.forEach((line, i) => {
  if (/reset.*token|otp.*reset|resetToken|passwordReset|forgot.*password/.test(line) && 
      /app\.|resetToken|otp/.test(line)) {
    console.log(`  L${i+1}: ${line.trim().slice(0,100)}`);
  }
});

// 4. rate limit 적용 확인
console.log('\n=== 4. rate limit 미적용 중요 POST 엔드포인트 ===');
lines.forEach((line, i) => {
  const trimmed = line.trim();
  if (trimmed.startsWith('//')) return;
  if (/app\.post\('\/api\/(user|community|crews|business)/.test(line)) {
    // rate limit 미들웨어 포함 여부
    const hasLimit = /Limiter|rateLimiter|authLimiter|catchLimiter|followLimit/.test(line);
    if (!hasLimit) {
      console.log(`  L${i+1}: ${line.trim().slice(0,90)} ← limit 없음`);
    }
  }
});

// 5. 인증 없는 GET으로 사용자 목록/이메일 노출 
console.log('\n=== 5. 인증 없는 GET 사용자 정보 노출 ===');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (/app\.get.*api\/(users|user)/.test(line) && !line.trim().startsWith('//')) {
    const next5 = lines.slice(i, i + 5).join('\n');
    const hasAuth = /jwt\.verify|verifyToken|authorization/.test(next5);
    if (!hasAuth) {
      console.log(`  L${i+1}: ${line.trim().slice(0,90)} ← 인증 없음`);
    }
  }
}

// 6. Content-Security-Policy 헤더
console.log('\n=== 6. CSP 헤더 설정 ===');
lines.forEach((line, i) => {
  if (/content.security.policy|contentSecurityPolicy|CSP/.test(line.toLowerCase())) {
    console.log(`  L${i+1}: ${line.trim().slice(0,100)}`);
  }
});

console.log('\n=== R21 탐색 완료 ===');

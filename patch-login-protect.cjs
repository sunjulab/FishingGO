// patch-login-protect.cjs — 계정 기반 브루트포스 보호 추가
const fs = require('fs');
let c = fs.readFileSync('server/index.js', 'utf8');
const hasCRLF = c.includes('\r\n');
let text = c.replace(/\r\n/g, '\n');

// 1. loginAttemptMap 전역 선언 추가 (Rate Limiter 블록 바로 아래)
const AFTER_RATELIMIT = `(logger?.info || console.log)('✅ Rate Limiter 적용 (로그인 10분/500회, 일반 1분/1000회) — 동시 1만 사용자 지원');`;
const AFTER_RATELIMIT_NEW = `(logger?.info || console.log)('✅ Rate Limiter 적용 (로그인 10분/500회, 일반 1분/1000회) — 동시 1만 사용자 지원');

// ✅ SCALE-FIX: 계정 기반 로그인 실패 추적 (IP 대신 이메일 단위)
// IP 기반 제한은 통신사 NAT로 수백명 차단 → 계정 기반으로 전환
const loginAttemptMap = new Map(); // email → { count, lockedUntil }
const MAX_LOGIN_FAIL = 10;          // 계정당 최대 실패 10회
const LOGIN_LOCK_MS  = 5 * 60 * 1000; // 잠금 5분
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of loginAttemptMap.entries()) {
    if (val.lockedUntil && now > val.lockedUntil + LOGIN_LOCK_MS) {
      loginAttemptMap.delete(key); // 만료된 잠금 자동 해제
    }
  }
}, 10 * 60 * 1000); // 10분마다 정리`;

if (!text.includes("'✅ Rate Limiter 적용 (로그인 10분/500회, 일반 1분/1000회) — 동시 1만 사용자 지원');")) {
  console.error('NOT FOUND: Rate Limiter log line');
  process.exit(1);
}
text = text.replace(AFTER_RATELIMIT, AFTER_RATELIMIT_NEW);

// 2. 로그인 엔드포인트에 계정 잠금 체크 삽입
const LOGIN_BEFORE = `    const email = (req.body.email || '').trim();
    const password = req.body.password || '';
    if (!email || !password) return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });`;

const LOGIN_BEFORE_NEW = `    const email = (req.body.email || '').trim();
    const password = req.body.password || '';
    if (!email || !password) return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });

    // ✅ SCALE-FIX: 계정 기반 브루트포스 보호 (IP 대신 이메일 단위)
    const attemptKey = email.toLowerCase();
    const attemptInfo = loginAttemptMap.get(attemptKey) || { count: 0, lockedUntil: null };
    if (attemptInfo.lockedUntil && Date.now() < attemptInfo.lockedUntil) {
      const remainSec = Math.ceil((attemptInfo.lockedUntil - Date.now()) / 1000);
      return res.status(429).json({ error: \`로그인 시도가 너무 많습니다. \${remainSec}초 후 다시 시도해주세요.\` });
    }`;

if (!text.includes("// ✅ AUTH-FIX-8: 이메일 공백 trim")) {
  console.error('NOT FOUND: login email trim');
  process.exit(1);
}
text = text.replace(LOGIN_BEFORE, LOGIN_BEFORE_NEW);

// 3. 비밀번호 불일치 시 실패 카운트 증가
const FAIL_MATCH = `    if (!isMatch) return res.status(400).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });`;
const FAIL_MATCH_NEW = `    if (!isMatch) {
      // 실패 카운트 증가
      attemptInfo.count += 1;
      if (attemptInfo.count >= MAX_LOGIN_FAIL) {
        attemptInfo.lockedUntil = Date.now() + LOGIN_LOCK_MS;
        attemptInfo.count = 0;
      }
      loginAttemptMap.set(attemptKey, attemptInfo);
      const remain = MAX_LOGIN_FAIL - attemptInfo.count;
      return res.status(400).json({ error: \`이메일 또는 비밀번호가 올바르지 않습니다.\${remain <= 3 ? \` (경고: \${remain}회 남음)\` : ''}\` });
    }
    // 로그인 성공 시 실패 카운트 초기화
    loginAttemptMap.delete(attemptKey);`;

if (!text.includes("    if (!isMatch) return res.status(400).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });")) {
  console.error('NOT FOUND: isMatch check');
  process.exit(1);
}
text = text.replace(FAIL_MATCH, FAIL_MATCH_NEW);

if (hasCRLF) text = text.replace(/\n/g, '\r\n');
fs.writeFileSync('server/index.js', text, 'utf8');
console.log('✅ 계정 기반 로그인 보호 추가 완료');
console.log('   - Rate Limit: IP당 10분/500회 (통신사 NAT 지원)');
console.log('   - 브루트포스: 계정당 10회 실패 시 5분 잠금');

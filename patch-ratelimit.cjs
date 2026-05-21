const fs = require('fs');
let c = fs.readFileSync('server/index.js', 'utf8');
const hasCRLF = c.includes('\r\n');
let text = c.replace(/\r\n/g, '\n');

const OLD = `// ─── Rate Limiter ────────────────────────────────────────────────────
try {
  const rateLimit = require('express-rate-limit');
  // 로그인/회원가입/OTP: 10분당 20회
  const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 20,
    message: { error: '너무 많은 요청입니다. 10분 후 다시 시도해주세요.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  // 일반 API: 1분당 100회
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
  });`;

const NEW = `// ─── Rate Limiter ────────────────────────────────────────────────────
// ✅ SCALE-FIX: IP 기반 → 완화 (한국 이동통신사 NAT: 수백명이 같은 IP 공유)
// 실제 브루트포스 보호는 계정 기반으로 처리 (아래 loginAttemptMap)
try {
  const rateLimit = require('express-rate-limit');
  // 로그인/회원가입: IP당 10분/500회 (통신사 NAT 환경 수백명 커버)
  const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 500,
    message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // OTP 발송은 별도 쿨다운 처리하므로 auth 리미터 제외
      return req.path.includes('/send-otp') || req.path.includes('/verify-otp');
    },
  });
  // 일반 API: IP당 1분/1000회 (동시 1만 사용자 커버)
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 1000,
    message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
    standardHeaders: true,
    legacyHeaders: false,
  });`;

if (!text.includes('// 로그인/회원가입/OTP: 10분당 20회')) {
  console.error('NOT FOUND - OLD pattern missing');
  process.exit(1);
}

text = text.replace(OLD, NEW);

// 로그 메시지도 업데이트
text = text.replace(
  "'✅ Rate Limiter 적용 (로그인 10분/20회, 일반 1분/100회)'",
  "'✅ Rate Limiter 적용 (로그인 10분/500회, 일반 1분/1000회) — 동시 1만 사용자 지원'"
);

if (hasCRLF) text = text.replace(/\n/g, '\r\n');
fs.writeFileSync('server/index.js', text, 'utf8');
console.log('✅ Rate Limiter 대용량 설정 완료');

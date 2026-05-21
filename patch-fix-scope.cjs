// patch-fix-scope.cjs — loginAttemptMap 스코프 버그 수정
const fs = require('fs');
let c = fs.readFileSync('server/index.js', 'utf8');
const hasCRLF = c.includes('\r\n');
let text = c.replace(/\r\n/g, '\n');

// 1. try 블록 안의 loginAttemptMap 선언 제거
const REMOVE_FROM_TRY = `\n// ✅ SCALE-FIX: 계정 기반 로그인 실패 추적 (IP 대신 이메일 단위)\n// IP 기반 제한은 통신사 NAT로 수백명 차단 → 계정 기반으로 전환\nconst loginAttemptMap = new Map(); // email → { count, lockedUntil }\nconst MAX_LOGIN_FAIL = 10;          // 계정당 최대 실패 10회\nconst LOGIN_LOCK_MS  = 5 * 60 * 1000; // 잠금 5분\nsetInterval(() => {\n  const now = Date.now();\n  for (const [key, val] of loginAttemptMap.entries()) {\n    if (val.lockedUntil && now > val.lockedUntil + LOGIN_LOCK_MS) {\n      loginAttemptMap.delete(key); // 만료된 잠금 자동 해제\n    }\n  }\n}, 10 * 60 * 1000); // 10분마다 정리`;

if (!text.includes('const loginAttemptMap = new Map();')) {
  console.error('NOT FOUND: loginAttemptMap');
  process.exit(1);
}

text = text.replace(REMOVE_FROM_TRY, '');
console.log('✅ try 블록 내부 loginAttemptMap 제거');

// 2. try 블록 바깥(앞)에 전역으로 선언
const INSERT_BEFORE = `// ─── Rate Limiter ────────────────────────────────────────────────────\n// ✅ SCALE-FIX: IP 기반 → 완화`;

const GLOBAL_DECL = `// ✅ 계정 기반 로그인 실패 추적 — try 블록 밖 전역 선언 (스코프 오류 방지)
const loginAttemptMap = new Map(); // email → { count, lockedUntil }
const MAX_LOGIN_FAIL = 10;         // 계정당 최대 실패 10회
const LOGIN_LOCK_MS  = 5 * 60 * 1000; // 잠금 5분
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of loginAttemptMap.entries()) {
    if (val.lockedUntil && now > val.lockedUntil + LOGIN_LOCK_MS) {
      loginAttemptMap.delete(key);
    }
  }
}, 10 * 60 * 1000);

// ─── Rate Limiter ────────────────────────────────────────────────────\n// ✅ SCALE-FIX: IP 기반 → 완화`;

if (!text.includes(INSERT_BEFORE)) {
  console.error('NOT FOUND: Rate Limiter header');
  process.exit(1);
}

text = text.replace(INSERT_BEFORE, GLOBAL_DECL);
console.log('✅ loginAttemptMap 전역 선언으로 이동');

if (hasCRLF) text = text.replace(/\n/g, '\r\n');
fs.writeFileSync('server/index.js', text, 'utf8');
console.log('✅ 스코프 버그 수정 완료');

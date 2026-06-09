// fix_r22.cjs - Round 22: 좋아요/크루가입 rate limit
const fs = require('fs');
const { execSync } = require('child_process');
const FILE = 'server/index.js';

function check() {
  try { execSync(`node --check ${FILE}`, { stdio: 'pipe' }); return true; }
  catch (e) { console.error('Syntax error:', e.stderr?.toString().slice(0, 200)); return false; }
}

function apply(desc, from, to) {
  const raw = fs.readFileSync(FILE, 'utf8');
  const normalized = raw.replace(/\r\n/g, '\n');
  if (!normalized.includes(from)) { console.log('SKIP:', desc); return false; }
  const patched = normalized.replace(from, to);
  fs.writeFileSync(FILE, patched.replace(/\r?\n/g, '\r\n'), 'utf8');
  if (check()) { console.log('OK:', desc); return true; }
  fs.writeFileSync(FILE, raw, 'utf8');
  console.log('FAIL:', desc); return false;
}

// Fix 1: postCreateLimiter 아래에 likeLimiter 추가
apply('LIKE-RATE-LIMITER-DEF',
  [
    "// FIX-POST-RATE: 게시글 작성 rate limit (1분 5회)",
    "const postCreateLimiter = rateLimit({",
  ].join('\n'),
  [
    "// FIX-LIKE-RATE: 좋아요 rate limit (1분 30회)",
    "const likeLimiter = rateLimit({",
    "  windowMs: 60 * 1000,",
    "  max: 30,",
    "  message: { error: '좋아요 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },",
    "  keyGenerator: (req) => req.headers.authorization?.slice(-20) || req.ip || 'unknown',",
    "  standardHeaders: true,",
    "  legacyHeaders: false,",
    "});",
    "",
    "// FIX-CREW-JOIN-RATE: 크루 가입 rate limit (1분 10회)",
    "const crewJoinLimiter = rateLimit({",
    "  windowMs: 60 * 1000,",
    "  max: 10,",
    "  message: { error: '크루 가입 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },",
    "  keyGenerator: (req) => req.headers.authorization?.slice(-20) || req.ip || 'unknown',",
    "  standardHeaders: true,",
    "  legacyHeaders: false,",
    "});",
    "",
    "// FIX-POST-RATE: 게시글 작성 rate limit (1분 5회)",
    "const postCreateLimiter = rateLimit({",
  ].join('\n')
);

// Fix 2: 좋아요 엔드포인트에 limiter 적용
apply('LIKE-LIMITER-APPLY',
  "app.post('/api/community/posts/:id/like', async (req, res) => {",
  "app.post('/api/community/posts/:id/like', likeLimiter, async (req, res) => { // FIX-LIKE-RATE-APPLY"
);

// Fix 3: catch 좋아요에도 적용
apply('CATCH-LIKE-LIMITER-APPLY',
  "app.post('/api/catch/:id/like', async (req, res) => {",
  "app.post('/api/catch/:id/like', likeLimiter, async (req, res) => { // FIX-LIKE-RATE-APPLY"
);

// Fix 4: 크루 가입 rate limit 적용
apply('CREW-JOIN-LIMITER-APPLY',
  "app.post('/api/community/crews/:id/join', async (req, res) => {",
  "app.post('/api/community/crews/:id/join', crewJoinLimiter, async (req, res) => { // FIX-CREW-JOIN-RATE-APPLY"
);

// 최종 검증
console.log('\n--- 최종 문법 검사 ---');
if (check()) console.log('ALL DONE - PASS');
else { execSync('git checkout HEAD -- server/index.js'); console.log('ROLLBACK'); }

const final = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
console.log('\n--- 패치 확인 ---');
console.log('likeLimiter:', final.includes('likeLimiter'));
console.log('crewJoinLimiter:', final.includes('crewJoinLimiter'));
console.log('FIX-LIKE-RATE-APPLY (posts):', (final.match(/FIX-LIKE-RATE-APPLY/g) || []).length);
console.log('FIX-CREW-JOIN-RATE-APPLY:', final.includes('FIX-CREW-JOIN-RATE-APPLY'));

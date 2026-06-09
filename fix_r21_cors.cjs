// fix_r21_cors.cjs - CORS 개선 + 커뮤니티 게시글 rate limit 추가
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

// Fix 1: CORS ALLOWED_ORIGINS - 프로덕션에서 환경변수로 제한 + 명확한 경고 주석
apply('CORS-PRODUCTION-RESTRICT',
  [
    '// ─── CORS: 허용 도메인 화이트리스트 ──────────────────────────────',
    '// 모든 origin 허용 (모바일 앱 특성 상 JWT로 인증, origin 제한 불필요)',
    'const ALLOWED_ORIGINS = [/.*/];  // 전체 허용',
    '',
    '// 환경변수로 추가 허용 도메인 설정 (프로덕션 배포 시 사용)',
    'if (process.env.ALLOWED_ORIGIN) {',
    '  ALLOWED_ORIGINS.push(process.env.ALLOWED_ORIGIN);',
    '}',
  ].join('\n'),
  [
    '// ─── CORS: 허용 도메인 화이트리스트 ──────────────────────────────',
    '// FIX-CORS-ORIGIN: 프로덕션에서는 ALLOWED_ORIGIN_LIST 환경변수로 Origin 제한',
    '// 모바일 앱(React Native)은 Origin 없이 접근하므로 null origin은 별도 처리',
    'const PROD_ORIGINS = process.env.ALLOWED_ORIGIN_LIST',
    "  ? process.env.ALLOWED_ORIGIN_LIST.split(',').map(o => o.trim()).filter(Boolean)",
    '  : null; // null이면 전체 허용 (개발 환경)',
    'const ALLOWED_ORIGINS = PROD_ORIGINS && PROD_ORIGINS.length > 0',
    '  ? PROD_ORIGINS.map(o => o.startsWith("/") ? new RegExp(o.slice(1, -1)) : o)',
    '  : [/.*/];  // 환경변수 미설정 시 모두 허용 (개발용)',
    '',
    '// 환경변수로 추가 허용 도메인 설정 (프로덕션 배포 시 사용)',
    'if (process.env.ALLOWED_ORIGIN) {',
    '  ALLOWED_ORIGINS.push(process.env.ALLOWED_ORIGIN);',
    '}',
  ].join('\n')
);

// Fix 2: 커뮤니티 게시글 작성 rate limit (게시글 스팸 방어)
// POST /api/community/posts 에 rate limit 적용
// 이미 authLimiter 등이 있는지 확인 후 새로 추가
const raw2 = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');

// postCreateLimiter 가 이미 있는지 확인
if (raw2.includes('postCreateLimiter')) {
  console.log('INFO: postCreateLimiter 이미 있음');
} else {
  // authLimiter 정의 바로 뒤에 postCreateLimiter 추가
  apply('POST-CREATE-RATE-LIMIT',
    "const authLimiter = rateLimit({",
    [
      '// FIX-POST-RATE: 게시글 작성 rate limit (1분 5회)',
      'const postCreateLimiter = rateLimit({',
      '  windowMs: 60 * 1000, // 1분',
      '  max: 5,',
      "  message: { error: '게시글 작성이 너무 빠릅니다. 잠시 후 다시 시도해주세요.' },",
      "  keyGenerator: (req) => req.headers.authorization?.slice(-20) || req.ip || 'unknown',",
      '  standardHeaders: true,',
      '  legacyHeaders: false,',
      '});',
      '',
      'const authLimiter = rateLimit({',
    ].join('\n')
  );

  // 게시글 생성 엔드포인트에 적용
  const raw3 = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
  if (raw3.includes('postCreateLimiter')) {
    apply('POST-COMMUNITY-LIMITER',
      "app.post('/api/community/posts', async (req, res) => {",
      "app.post('/api/community/posts', postCreateLimiter, async (req, res) => { // FIX-POST-RATE-APPLY"
    );
  }
}

// 최종 검증
console.log('\n--- 최종 문법 검사 ---');
if (check()) console.log('ALL DONE - PASS');
else { execSync('git checkout HEAD -- server/index.js'); console.log('ROLLBACK'); }

const final = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
console.log('\n--- 패치 확인 ---');
console.log('FIX-CORS-ORIGIN:', final.includes('FIX-CORS-ORIGIN'));
console.log('postCreateLimiter:', final.includes('postCreateLimiter'));
console.log('FIX-POST-RATE-APPLY:', final.includes('FIX-POST-RATE-APPLY'));

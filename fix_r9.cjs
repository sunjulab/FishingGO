// fix_r9.cjs - Round 9 Security Fixes
const fs = require('fs');
const { execSync } = require('child_process');
const FILE = 'server/index.js';

function check() {
  try { execSync(`node --check ${FILE}`, { stdio: 'pipe' }); return true; }
  catch (e) { console.error('  Syntax error:', e.stderr?.toString().slice(0, 300)); return false; }
}

function apply(desc, from, to) {
  const raw = fs.readFileSync(FILE, 'utf8');
  const normalized = raw.replace(/\r\n/g, '\n');
  if (!normalized.includes(from)) {
    console.log('⚠️  SKIP (not found):', desc);
    return false;
  }
  const patched = normalized.replace(from, to);
  const withCRLF = patched.replace(/\r?\n/g, '\r\n');
  fs.writeFileSync(FILE, withCRLF, 'utf8');
  if (check()) { console.log('✅ OK:', desc); return true; }
  fs.writeFileSync(FILE, raw, 'utf8');
  console.log('❌ FAIL (syntax):', desc);
  return false;
}

// ─── Fix 1: /api/shop/manual/dbtest 인증 없음 ──────────────────────────────
const dbtestFrom = `app.get('/api/shop/manual/dbtest', async (req, res) => {
  const startMs = Date.now();
  try {
    if (!dbReady) return res.json({ ok: false, error: 'dbReady=false', ms: Date.now() - startMs });`;

const dbtestTo = `app.get('/api/shop/manual/dbtest', async (req, res) => {
  // ✅ FIX-DBTEST-AUTH: 인증 없는 MongoDB 쓰기 테스트 → DIRECT_KEY 또는 관리자 토큰 필요
  const keyOk = process.env.DIRECT_KEY && req.query.key === process.env.DIRECT_KEY;
  if (!keyOk) {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
    try {
      const tp = require('jsonwebtoken').verify(auth.slice(7), process.env.JWT_SECRET || 'fishinggo_jwt_secret_2024', { algorithms: ['HS256'] });
      const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'sunjulab@gmail.com';
      const ADMIN_ID = process.env.ADMIN_ID || 'sunjulab';
      if (tp.email !== ADMIN_EMAIL && tp.id !== ADMIN_ID && tp.email !== 'sunjulab.k@gmail.com') {
        return res.status(403).json({ error: '관리자 권한 필요' });
      }
    } catch { return res.status(401).json({ error: '토큰 오류' }); }
  }
  const startMs = Date.now();
  try {
    if (!dbReady) return res.json({ ok: false, error: 'dbReady=false', ms: Date.now() - startMs });`;

apply('DBTEST-AUTH', dbtestFrom, dbtestTo);

// ─── Fix 2: /api/shop/manual/add-tab jwt.decode 폴백 제거 ──────────────────
const addTabFrom = `  if (!token) return res.send(html({ ok: false, error: '인증 토큰 필요' }));
  let user;
  try { user = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }); }
  catch { user = jwt.decode(token); if (!user) return res.send(html({ ok: false, error: '유효하지 않은 토큰' })); }`;

const addTabTo = `  if (!token) return res.send(html({ ok: false, error: '인증 토큰 필요' }));
  // ✅ FIX-ADDTAB-JWT: jwt.decode() 폴백 제거 — 만료/위조된 토큰 수락 취약점 수정
  let user;
  try { user = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }); }
  catch { return res.send(html({ ok: false, error: '유효하지 않거나 만료된 토큰' })); }`;

apply('ADDTAB-JWT', addTabFrom, addTabTo);

// ─── Fix 3: /api/shop/manual/add jwt.decode 폴백 제거 ────────────────────
const addFrom = `  if (!token) return send(401, { error: '인증 토큰 필요' });
  let user;
  try { user = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }); }
  catch {
    user = jwt.decode(token);
    if (!user) return send(401, { error: '유효하지 않은 토큰 형식' });
  }`;

const addTo = `  if (!token) return send(401, { error: '인증 토큰 필요' });
  // ✅ FIX-ADD-JWT: jwt.decode() 폴백 제거 — 만료/위조된 토큰 수락 취약점 수정
  let user;
  try { user = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }); }
  catch { return send(401, { error: '유효하지 않거나 만료된 토큰' }); }`;

apply('ADD-JWT', addFrom, addTo);

// ─── Fix 4: /api/shop/click/stats admin 체크 추가 ─────────────────────────
// verifyToken만 있고 isAdmin 체크 없음 → 일반 사용자도 클릭 통계 조회 가능
// 확인
const content = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const statsIdx = content.indexOf("app.get('/api/shop/click/stats', verifyToken");
if (statsIdx !== -1) {
  const statsSlice = content.slice(statsIdx, statsIdx + 300);
  if (!statsSlice.includes('isAdminToken') && !statsSlice.includes('FIX-STATS-AUTH')) {
    console.log('⚠️  NEED FIX: /api/shop/click/stats — admin check missing');
  } else {
    console.log('ℹ️  /api/shop/click/stats — already protected');
  }
}

// ─── 최종 검증 ──────────────────────────────────────────────────────────────
console.log('\n─── 최종 문법 검사 ───');
if (check()) {
  console.log('✅ ALL DONE — node --check PASS');
} else {
  console.log('❌ SYNTAX ERROR — 롤백');
  execSync('git checkout HEAD -- server/index.js');
}

const finalContent = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
console.log('\n─── 패치 확인 ───');
console.log('FIX-DBTEST-AUTH:', finalContent.includes('FIX-DBTEST-AUTH'));
console.log('FIX-ADDTAB-JWT:', finalContent.includes('FIX-ADDTAB-JWT'));
console.log('FIX-ADD-JWT:', finalContent.includes('FIX-ADD-JWT'));

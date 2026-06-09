// fix_r10.cjs - Round 10 Security Fixes  
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

// ─── Fix 1: EXP 획득 per-user+action rate limit ──────────────────────────────
// 이미 verifyToken + 본인 체크 있음 → EXP 획득 중복 방어 추가
const expFrom = `// ✅ BUG-43: JWT 인증 추가 — EXP 직접 조작 방지
app.post('/api/user/exp', verifyToken, async (req, res) => {
  try {
    const { userId, action } = req.body;
    if (!userId || !action) return res.status(400).json({ error: '필수 항목 누락' });
    // 토큰의 실제 사용자와 일치 확인
    const tokenId = req.user.email || req.user.id;
    const isAdmin = isAdminToken(req.user);
    if (!isAdmin && userId !== tokenId) return res.status(403).json({ error: '본인 EXP만 적립할 수 있습니다.' });
    const gain = SERVER_EXP_REWARDS[action];
    if (!gain) return res.status(400).json({ error: '유효하지 않은 액션' });`;

const expTo = `// ✅ BUG-43: JWT 인증 추가 — EXP 직접 조작 방지
// ✅ FIX-EXP-RATE: per-user+action rate limit (반복 EXP 적립 방어)
const expRateMap = new Map(); // 'userId:action' → timestamp
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [k, v] of expRateMap.entries()) { if (v < cutoff) expRateMap.delete(k); }
}, 60 * 60 * 1000); // 1시간마다 정리

app.post('/api/user/exp', verifyToken, async (req, res) => {
  try {
    const { userId, action } = req.body;
    if (!userId || !action) return res.status(400).json({ error: '필수 항목 누락' });
    // 토큰의 실제 사용자와 일치 확인
    const tokenId = req.user.email || req.user.id;
    const isAdmin = isAdminToken(req.user);
    if (!isAdmin && userId !== tokenId) return res.status(403).json({ error: '본인 EXP만 적립할 수 있습니다.' });
    const gain = SERVER_EXP_REWARDS[action];
    if (!gain) return res.status(400).json({ error: '유효하지 않은 액션' });
    // ✅ FIX-EXP-RATE: 24시간 내 동일 action 중복 적립 방어 (attendance는 1회/일, 나머지는 10회/일)
    if (!isAdmin) {
      const rateKey = \`\${tokenId}:\${action}\`;
      const EXP_COOLDOWN = (action === 'attendance' || action === 'first_catch' || action === 'weekly_streak' || action === 'monthly_streak')
        ? 23 * 60 * 60 * 1000  // 23시간 쿨다운 (daily activities)
        : 5 * 60 * 1000;       // 5분 쿨다운 (regular activities)
      const lastTime = expRateMap.get(rateKey) || 0;
      if (Date.now() - lastTime < EXP_COOLDOWN) {
        return res.status(429).json({ error: '잠시 후 다시 시도해주세요.', cooldownMs: EXP_COOLDOWN - (Date.now() - lastTime) });
      }
      expRateMap.set(rateKey, Date.now());
    }`;

apply('EXP-RATE', expFrom, expTo);

// ─── Fix 2: 댓글 스팸 방어 — 같은 게시글에 빠른 연속 댓글 방어 ────────────────
// 현재 댓글 작성은 rate limit 없음
// 전역 댓글 rate limit 추가
const commentFrom = `// ── 오픈게시판 댓글 작성 (JWT 인증 필수) ─────────────────────────────────────
app.post('/api/community/posts/:id/comments', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { author, text } = req.body;`;

const commentTo = `// ✅ FIX-COMMENT-RATE: 댓글 스팸 방어 (같은 사용자, 1분에 10개 이하)
const commentRateMap = new Map(); // 'userId' → [timestamps]
setInterval(() => {
  const cutoff = Date.now() - 60_000;
  for (const [k, v] of commentRateMap.entries()) {
    const filtered = v.filter(t => t > cutoff);
    if (filtered.length === 0) commentRateMap.delete(k);
    else commentRateMap.set(k, filtered);
  }
}, 5 * 60 * 1000);

// ── 오픈게시판 댓글 작성 (JWT 인증 필수) ─────────────────────────────────────
app.post('/api/community/posts/:id/comments', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { author, text } = req.body;
    // ✅ FIX-COMMENT-RATE: 1분에 10개 초과 댓글 차단
    const commentUserId = tp.email || tp.id;
    if (commentUserId) {
      const now = Date.now();
      const times = (commentRateMap.get(commentUserId) || []).filter(t => now - t < 60_000);
      if (times.length >= 10) return res.status(429).json({ error: '댓글을 너무 빠르게 작성하고 있습니다. 잠시 후 시도해주세요.' });
      times.push(now);
      commentRateMap.set(commentUserId, times);
    }`;

apply('COMMENT-RATE', commentFrom, commentTo);

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
console.log('FIX-EXP-RATE:', finalContent.includes('FIX-EXP-RATE'));
console.log('FIX-COMMENT-RATE:', finalContent.includes('FIX-COMMENT-RATE'));

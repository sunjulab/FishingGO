// fix_r2b.cjs - CATCH-AUTH + CREW-JOIN 패치 (CRLF 처리)
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

// ─── Fix 1: /api/catch JWT 인증 + SSRF 방어 ───────────────────────────────
const catchFrom = `// POST /api/catch — 조황 등록
app.post('/api/catch', catchLimiter, async (req, res) => { // ✅ FIX-CATCH-RATE: 1분 5회 제한
  try {
    const { userId, userName, userAvatar, fishName, fishSize, fishWeight,
            imageUrl, location, lat, lng, memo, weather, tide, contestId,
            verified, aiConfidence } = req.body;
    if (!userId || !fishName) return res.status(400).json({ error: '필수 항목 누락' });
    await waitForDb(5000);
    const record = await CatchRecord.create({
      userId, userName, userAvatar, fishName,
      fishSize: fishSize || 0, fishWeight: fishWeight || 0,
      imageUrl, location, lat, lng, memo, weather, tide,
      contestId, verified: !!verified, aiConfidence: aiConfidence || 0,
    });
    // EXP 보상 (+30 EXP)
    if (dbReady && User) {
      await User.updateOne({ _id: userId }, { $inc: { exp: 30, totalExp: 30 } }).catch(() => {});
    }
    res.json({ success: true, record });
  } catch (err) {
    (logger?.error || console.error)('[POST /api/catch]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});`;

const catchTo = `// ✅ FIX-IMAGEURL-SSRF: 이미지 URL SSRF 방어 헬퍼 — 내부망/file://javascript: 차단
function sanitizeImageUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const u = url.trim();
  if (u.startsWith('data:image/')) return u;
  if (!u.startsWith('http://') && !u.startsWith('https://')) return null;
  if (/^https?:\\/\\/(127\\.|10\\.|192\\.168\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.|169\\.254\\.|::1|localhost|0\\.0\\.0\\.0)/i.test(u)) return null;
  if (/^https?:\\/\\/metadata\\.(google|aws|azure)/i.test(u)) return null;
  return u.slice(0, 2000);
}
// POST /api/catch — 조황 등록 (✅ FIX-CATCH-AUTH)
app.post('/api/catch', catchLimiter, async (req, res) => { // ✅ FIX-CATCH-RATE: 1분 5회 제한
  try {
    // ✅ FIX-CATCH-AUTH: JWT 인증 필수 (userId body 신뢰 제거 → JWT에서만 추출)
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { userName, userAvatar, fishName, fishSize, fishWeight,
            imageUrl, location, lat, lng, memo, weather, tide, contestId,
            verified, aiConfidence } = req.body;
    const userId = tp.email || tp.id; // ✅ FIX-CATCH-AUTH: userId는 JWT에서만 (주입 방지)
    if (!userId || !fishName) return res.status(400).json({ error: '필수 항목 누락' });
    const safeImageUrl = sanitizeImageUrl(imageUrl); // ✅ FIX-IMAGEURL-SSRF
    await waitForDb(5000);
    const record = await CatchRecord.create({
      userId, userName, userAvatar, fishName,
      fishSize: fishSize || 0, fishWeight: fishWeight || 0,
      imageUrl: safeImageUrl, location, lat, lng, memo, weather, tide,
      contestId, verified: !!verified, aiConfidence: aiConfidence || 0,
    });
    // EXP 보상 (+30 EXP)
    if (dbReady && User) {
      await User.updateOne({ email: userId }, { $inc: { exp: 30, totalExp: 30 } }).catch(() => {});
    }
    res.json({ success: true, record });
  } catch (err) {
    (logger?.error || console.error)('[POST /api/catch]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});`;

apply('CATCH-AUTH+SSRF', catchFrom, catchTo);

// ─── Fix 2: 크루 가입 rate limit ─────────────────────────────────────────────
const crewJoinFrom = `app.post('/api/community/crews/:id/join', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }`;

const crewJoinTo = `// ✅ FIX-CREW-JOIN-RATE: 크루 가입/탈퇴 rate limit — IP당 1분/10회 (스팸 방어)
const crewJoinRateMap = new Map();
function checkCrewJoinRate(ip) {
  const key = hashIp(ip);
  const now = Date.now();
  const entry = crewJoinRateMap.get(key) || { count: 0, windowStart: now };
  if (now - entry.windowStart > 60_000) { entry.count = 0; entry.windowStart = now; }
  entry.count++;
  crewJoinRateMap.set(key, entry);
  return entry.count <= 10;
}
app.post('/api/community/crews/:id/join', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    // ✅ FIX-CREW-JOIN-RATE: rate limit 체크 (스팸 가입 방어)
    const rawJoinIp = (String(req.headers['x-forwarded-for'] || '')).split(',')[0].trim() || req.ip || 'unknown';
    if (!isAdminToken(tp) && !checkCrewJoinRate(rawJoinIp)) return res.status(429).json({ error: '가입 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' });`;

apply('CREW-JOIN-RATE', crewJoinFrom, crewJoinTo);

// ─── 최종 검증 ──────────────────────────────────────────────────────────────
console.log('\n─── 최종 문법 검사 ───');
if (check()) {
  console.log('✅ ALL DONE — node --check PASS');
} else {
  console.log('❌ SYNTAX ERROR — 롤백');
  execSync('git checkout HEAD -- server/index.js');
}

// 패치 확인
const finalContent = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
console.log('\n─── 패치 확인 ───');
console.log('FIX-CATCH-AUTH:', finalContent.includes('FIX-CATCH-AUTH'));
console.log('FIX-IMAGEURL-SSRF:', finalContent.includes('FIX-IMAGEURL-SSRF'));
console.log('FIX-CREW-JOIN-RATE:', finalContent.includes('FIX-CREW-JOIN-RATE'));
console.log('FIX-CONTEST-INPUT:', finalContent.includes('FIX-CONTEST-INPUT'));

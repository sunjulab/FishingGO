# Round 2 Security Patch Script
$file = "server\index.js"
$content = Get-Content $file -Raw -Encoding UTF8

# 1. /api/catch JWT 인증 + SSRF 방어
$oldCatch = @'
// POST /api/catch — 조황 등록
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
});
'@

$newCatch = @'
// ✅ FIX-IMAGEURL-SSRF: 이미지 URL SSRF 방어 헬퍼 — 내부망/file://javascript: 차단
function sanitizeImageUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const u = url.trim();
  if (u.startsWith('data:image/')) return u;
  if (!u.startsWith('http://') && !u.startsWith('https://')) return null;
  if (/^https?:\/\/(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.|::1|localhost|0\.0\.0\.0)/i.test(u)) return null;
  if (/^https?:\/\/metadata\.(google|aws|azure)/i.test(u)) return null;
  return u.slice(0, 2000);
}

// POST /api/catch — 조황 등록
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
});
'@

if ($content.Contains($oldCatch)) {
    $content = $content.Replace($oldCatch, $newCatch)
    Write-Host "✅ catch endpoint patched"
} else {
    Write-Host "❌ catch endpoint not found"
    exit 1
}

# 2. Contest 입력 길이 검증 추가
$oldContest = @'
    if (!title || !fishName || !startDate || !endDate) return res.status(400).json({ error: '필수 항목 누락' });
    await waitForDb(5000);
    const contest = await Contest.create({ title, fishName, region, metric, startDate, endDate, description, prize });
'@
$newContest = @'
    if (!title || !fishName || !startDate || !endDate) return res.status(400).json({ error: '필수 항목 누락' });
    // ✅ FIX-CONTEST-INPUT: 대회 입력 길이 제한 (DoS 방어)
    if (typeof title === 'string' && title.length > 100) return res.status(400).json({ error: '대회 제목은 최대 100자입니다.' });
    if (typeof description === 'string' && description.length > 1000) return res.status(400).json({ error: '대회 설명은 최대 1000자입니다.' });
    if (typeof prize === 'string' && prize.length > 200) return res.status(400).json({ error: '상품 설명은 최대 200자입니다.' });
    await waitForDb(5000);
    const contest = await Contest.create({ title, fishName, region, metric, startDate, endDate, description, prize });
'@
if ($content.Contains($oldContest)) {
    $content = $content.Replace($oldContest, $newContest)
    Write-Host "✅ contest input validation patched"
} else {
    Write-Host "❌ contest target not found"
    exit 1
}

# 3. 크루 가입 rate limit 추가
$oldCrewJoin = @'
// ── ✅ CREW-ENH: 크루 가입 (비번 검증 + 멤버 DB 저장) ──────────────────────────
app.post('/api/community/crews/:id/join', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
'@
$newCrewJoin = @'
// ✅ FIX-CREW-JOIN-RATE: 크루 가입/탈퇴 rate limit — IP당 1분/10회 (스팸 방어)
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
// ── ✅ CREW-ENH: 크루 가입 (비번 검증 + 멤버 DB 저장) ──────────────────────────
app.post('/api/community/crews/:id/join', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    // ✅ FIX-CREW-JOIN-RATE: rate limit 체크
    const rawJoinIp = (String(req.headers['x-forwarded-for'] || '')).split(',')[0].trim() || req.ip || 'unknown';
    if (!isAdminToken(tp) && !checkCrewJoinRate(rawJoinIp)) return res.status(429).json({ error: '가입 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' });
'@
if ($content.Contains($oldCrewJoin)) {
    $content = $content.Replace($oldCrewJoin, $newCrewJoin)
    Write-Host "✅ crew join rate limit patched"
} else {
    Write-Host "❌ crew join target not found"
    exit 1
}

# 파일 저장
Set-Content -Path $file -Value $content -Encoding UTF8 -NoNewline
Write-Host "✅ File saved successfully"

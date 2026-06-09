// fix_r9b.cjs - Round 9b: additional fixes
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

// ─── Fix 1: channelVideos Mass Assignment 방어 ─────────────────────────────
const channelVideoFrom = `  const video = req.body;
  if (!video.id) video.id = Date.now();
  channelVideos.push(video);
  res.json({ success: true, video });`;

const channelVideoTo = `  // ✅ FIX-CHANNEL-MASS-ASSIGN: 화이트리스트 필드만 허용 (Mass Assignment 방어)
  const { title, category, url, thumbnail, duration, views: viewsStr, description } = req.body;
  if (!title || !url) return res.status(400).json({ error: 'title, url 필수' });
  if (typeof title !== 'string' || title.length > 200) return res.status(400).json({ error: 'title 최대 200자' });
  if (typeof url !== 'string' || !/^https:\/\//.test(url) || url.length > 500) return res.status(400).json({ error: '유효한 https URL 필요' });
  if (thumbnail && (typeof thumbnail !== 'string' || !/^https:\/\//.test(thumbnail))) return res.status(400).json({ error: '유효한 thumbnail URL 필요' });
  const video = {
    id: Date.now(),
    title: title.trim(),
    category: typeof category === 'string' ? category.trim().slice(0, 50) : '기타',
    url: url.trim(),
    thumbnail: thumbnail ? thumbnail.trim() : '',
    duration: typeof duration === 'string' ? duration.trim().slice(0, 10) : '',
    views: typeof viewsStr === 'string' ? viewsStr.trim().slice(0, 20) : '0',
    description: typeof description === 'string' ? description.trim().slice(0, 500) : '',
  };
  channelVideos.push(video);
  res.json({ success: true, video });`;

apply('CHANNEL-MASS-ASSIGN', channelVideoFrom, channelVideoTo);

// ─── Fix 2: appConfig min_version/store_url 형식 검증 ─────────────────────
const appConfigFrom = `  if (req.body.min_version) appConfig.min_version = req.body.min_version;
  if (req.body.store_url) appConfig.store_url = req.body.store_url;`;

const appConfigTo = `  // ✅ FIX-APPCONFIG-VALID: 형식 검증 추가 (임의 값/XSS URL 주입 방어)
  if (req.body.min_version !== undefined) {
    const mv = String(req.body.min_version);
    if (/^\\d+\\.\\d+\\.\\d+$/.test(mv)) appConfig.min_version = mv;
    else return res.status(400).json({ error: 'min_version 형식: x.y.z' });
  }
  if (req.body.store_url !== undefined) {
    const su = String(req.body.store_url);
    if (/^https:\\/\\/.{5,500}/.test(su)) appConfig.store_url = su;
    else return res.status(400).json({ error: 'store_url은 https로 시작해야 합니다.' });
  }`;

apply('APPCONFIG-VALID', appConfigFrom, appConfigTo);

// ─── Fix 3: /api/shop/click/stats admin check 추가 ────────────────────────
const statsFrom = `app.get('/api/shop/click/stats', verifyToken, async (req, res) => {
  try {
    if (!dbReady) return res.json([]);
    const stats = await ShopClick.aggregate([`;

const statsTo = `app.get('/api/shop/click/stats', verifyToken, async (req, res) => {
  // ✅ FIX-STATS-AUTH: 클릭 통계는 관리자 전용
  if (!isAdminToken(req.user)) return res.status(403).json({ error: '관리자 권한 필요' });
  try {
    if (!dbReady) return res.json([]);
    const stats = await ShopClick.aggregate([`;

apply('STATS-AUTH', statsFrom, statsTo);

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
console.log('FIX-CHANNEL-MASS-ASSIGN:', finalContent.includes('FIX-CHANNEL-MASS-ASSIGN'));
console.log('FIX-APPCONFIG-VALID:', finalContent.includes('FIX-APPCONFIG-VALID'));
console.log('FIX-STATS-AUTH:', finalContent.includes('FIX-STATS-AUTH'));

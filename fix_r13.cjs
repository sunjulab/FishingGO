// fix_r13.cjs - Round 13 & 14 Security Fixes
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
    console.log('SKIP (not found):', desc);
    return false;
  }
  const patched = normalized.replace(from, to);
  const withCRLF = patched.replace(/\r?\n/g, '\r\n');
  fs.writeFileSync(FILE, withCRLF, 'utf8');
  if (check()) { console.log('OK:', desc); return true; }
  fs.writeFileSync(FILE, raw, 'utf8');
  console.log('FAIL (syntax):', desc);
  return false;
}

// Fix 1: 조황기록 fishName/location/memo 길이 제한 + lat/lng 범위 검증
const catchFrom = [
  '    const { userName, userAvatar, fishName, fishSize, fishWeight,',
  '            imageUrl, location, lat, lng, memo, weather, tide, contestId,',
  '            verified, aiConfidence } = req.body;',
  '    const userId = tp.email || tp.id; // ✅ FIX-CATCH-AUTH: userId는 JWT에서만 (주입 방지)',
  "    if (!userId || !fishName) return res.status(400).json({ error: '필수 항목 누락' });",
].join('\n');

const catchTo = [
  '    const { userName, userAvatar, fishName, fishSize, fishWeight,',
  '            imageUrl, location, lat, lng, memo, weather, tide, contestId,',
  '            verified, aiConfidence } = req.body;',
  '    const userId = tp.email || tp.id; // FIX-CATCH-AUTH: userId는 JWT에서만 (주입 방지)',
  "    if (!userId || !fishName) return res.status(400).json({ error: '필수 항목 누락' });",
  '    // FIX-CATCH-VALID: 필드 길이 제한 및 좌표 범위 검증',
  "    if (typeof fishName !== 'string' || fishName.trim().length < 1 || fishName.trim().length > 50) return res.status(400).json({ error: 'fishName 1~50자' });",
  "    if (location !== undefined && typeof location !== 'string') return res.status(400).json({ error: 'location은 문자열' });",
  "    if (location && location.length > 100) return res.status(400).json({ error: 'location 최대 100자' });",
  "    if (memo !== undefined && typeof memo === 'string' && memo.length > 500) return res.status(400).json({ error: 'memo 최대 500자' });",
  '    if (lat !== undefined && (typeof lat !== \'number\' || lat < -90 || lat > 90)) return res.status(400).json({ error: \'lat 범위 오류 (-90~90)\' });',
  '    if (lng !== undefined && (typeof lng !== \'number\' || lng < -180 || lng > 180)) return res.status(400).json({ error: \'lng 범위 오류 (-180~180)\' });',
  '    const safeFishName = fishName.trim().substring(0, 50);',
].join('\n');

apply('CATCH-VALID', catchFrom, catchTo);

// Fix 2: fishName → safeFishName 치환
const catchFrom2 = [
  '    const safeImageUrl = sanitizeImageUrl(imageUrl); // ✅ FIX-IMAGEURL-SSRF',
  '    await waitForDb(5000);',
  '    const record = await CatchRecord.create({',
  '      userId, userName, userAvatar, fishName,',
].join('\n');

const catchTo2 = [
  '    const safeImageUrl = sanitizeImageUrl(imageUrl); // FIX-IMAGEURL-SSRF',
  '    await waitForDb(5000);',
  '    const record = await CatchRecord.create({',
  '      userId, userName, userAvatar, fishName: safeFishName,',
].join('\n');

apply('CATCH-FISHNAME', catchFrom2, catchTo2);

// Fix 3: community post category 화이트리스트
const postCategoryFrom = [
  "    let { author, category, content, image, images, location } = req.body;",
  "    // ✅ BUG-FIX: author_email은 JWT에서만 추출 (보안 취약점 수정)",
  "    const author_email = tp.email || tp.id || 'guest@fishinggo.kr';",
  "    if (!author || !category || !content) return res.status(400).json({ error: '필수 항목 누락' });",
].join('\n');

const postCategoryTo = [
  "    let { author, category, content, image, images, location } = req.body;",
  "    // BUG-FIX: author_email은 JWT에서만 추출 (보안 취약점 수정)",
  "    const author_email = tp.email || tp.id || 'guest@fishinggo.kr';",
  "    if (!author || !category || !content) return res.status(400).json({ error: '필수 항목 누락' });",
  "    // FIX-CATEGORY-WHITELIST: 허용된 카테고리만 수락",
  "    const VALID_POST_CATEGORIES = ['일반', '조황', '정보', '질문', '장터', '유머', '낚시터', '채비', '기타'];",
  "    if (!VALID_POST_CATEGORIES.includes(category)) return res.status(400).json({ error: '유효하지 않은 카테고리' });",
  "    if (typeof author !== 'string' || author.length > 30) return res.status(400).json({ error: 'author 최대 30자' });",
  "    if (typeof content !== 'string' || content.length > 15000) return res.status(400).json({ error: 'content 최대 15000자' });",
].join('\n');

apply('CATEGORY-WHITELIST', postCategoryFrom, postCategoryTo);

// 최종 검증
console.log('\n--- 최종 문법 검사 ---');
if (check()) {
  console.log('ALL DONE - node --check PASS');
} else {
  console.log('SYNTAX ERROR - rolling back');
  execSync('git checkout HEAD -- server/index.js');
}

const final = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
console.log('\n--- 패치 확인 ---');
console.log('FIX-CATCH-VALID:', final.includes('FIX-CATCH-VALID'));
console.log('FIX-CATEGORY-WHITELIST:', final.includes('FIX-CATEGORY-WHITELIST'));

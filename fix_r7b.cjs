// fix_r7b.cjs - Round 7b: Fishing point lat/lng range validation
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

// ─── Fix 1: 낚시 포인트 생성 lat/lng 범위 검증 ──────────────────────────────
// L1167 쪽
const createPointFrom = `  const { name, type, region, lat, lng, fish, obsCode, aiDescription, season, recommend, status } = req.body;
  if (!name || !type || lat == null || lng == null) return res.status(400).json({ error: 'name, type, lat, lng 필수' });
  const id = \`custom_\${Date.now()}\`;`;

const createPointTo = `  const { name, type, region, lat, lng, fish, obsCode, aiDescription, season, recommend, status } = req.body;
  if (!name || !type || lat == null || lng == null) return res.status(400).json({ error: 'name, type, lat, lng 필수' });
  // ✅ FIX-POINT-LATNG-RANGE: 좌표 범위 검증 (한국 좌표 ± 넓은 범위 허용)
  const latNum = parseFloat(lat); const lngNum = parseFloat(lng);
  if (isNaN(latNum) || latNum < -90 || latNum > 90) return res.status(400).json({ error: '유효하지 않은 위도값 (-90~90)' });
  if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) return res.status(400).json({ error: '유효하지 않은 경도값 (-180~180)' });
  // ✅ FIX-POINT-NAME-LEN: 포인트명/어종 길이 제한
  if (typeof name !== 'string' || name.length > 100) return res.status(400).json({ error: '포인트명은 최대 100자입니다.' });
  if (typeof type !== 'string' || type.length > 50) return res.status(400).json({ error: '타입은 최대 50자입니다.' });
  if (typeof fish === 'string' && fish.length > 200) return res.status(400).json({ error: '어종 정보는 최대 200자입니다.' });
  const id = \`custom_\${Date.now()}\`;`;

apply('POINT-LATNG-RANGE+NAME-LEN', createPointFrom, createPointTo);

// ─── Fix 2: spot-location-overrides lat/lng 범위 검증 (L1114) ───────────────
const spotOverrideFrom = `  const { id, lat, lng, name } = req.body;
  if (!id || lat == null || lng == null) return res.status(400).json({ error: 'id, lat, lng 필수' });`;

const spotOverrideTo = `  const { id, lat, lng, name } = req.body;
  if (!id || lat == null || lng == null) return res.status(400).json({ error: 'id, lat, lng 필수' });
  // ✅ FIX-SPOT-LATNG-RANGE: 좌표 범위 검증
  const latNumS = parseFloat(lat); const lngNumS = parseFloat(lng);
  if (isNaN(latNumS) || latNumS < -90 || latNumS > 90) return res.status(400).json({ error: '유효하지 않은 위도값' });
  if (isNaN(lngNumS) || lngNumS < -180 || lngNumS > 180) return res.status(400).json({ error: '유효하지 않은 경도값' });`;

apply('SPOT-LATNG-RANGE', spotOverrideFrom, spotOverrideTo);

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
console.log('FIX-POINT-LATNG-RANGE:', finalContent.includes('FIX-POINT-LATNG-RANGE'));
console.log('FIX-SPOT-LATNG-RANGE:', finalContent.includes('FIX-SPOT-LATNG-RANGE'));

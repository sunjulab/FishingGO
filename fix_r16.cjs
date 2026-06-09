// fix_r16.cjs - Round 16: ObjectId isValid + MIME whitelist
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

// Fix 1: /api/business/posts/:id DELETE — isValid 누락
apply('BUSINESS-POSTS-DELETE-ISVALID',
  [
    '    const { id } = req.params;',
    '    if (dbReady && BusinessPost) {',
    '      const post = await BusinessPost.findById(id);',
    "      if (!post) return res.status(404).json({ error: '게시글 없음' });",
    "      if (!isAdmin && post.author_email !== email) return res.status(403).json({ error: '권한 없음' });",
    '      await BusinessPost.findByIdAndDelete(id);',
  ].join('\n'),
  [
    '    const { id } = req.params;',
    '    // FIX-OBJID-BPOST-DEL: ObjectId 유효성 사전 검증 → CastError 방지',
    "    if (id && !/^[a-fA-F0-9]{24}$/.test(id)) return res.status(400).json({ error: '유효하지 않은 ID 형식' });",
    '    if (dbReady && BusinessPost) {',
    '      const post = await BusinessPost.findById(id);',
    "      if (!post) return res.status(404).json({ error: '게시글 없음' });",
    "      if (!isAdmin && post.author_email !== email) return res.status(403).json({ error: '권한 없음' });",
    '      await BusinessPost.findByIdAndDelete(id);',
  ].join('\n')
);

// Fix 2: Notice DELETE — isValid 누락
apply('NOTICE-DELETE-ISVALID',
  [
    '    if (!isAdminToken(tp)) return res.status(403).json({ error: \'마스터 권한 필요\' });',
    '    if (dbReady && Notice) {',
    '      await Notice.findByIdAndDelete(req.params.id);',
  ].join('\n'),
  [
    '    if (!isAdminToken(tp)) return res.status(403).json({ error: \'마스터 권한 필요\' });',
    '    // FIX-OBJID-NOTICE-DEL: ObjectId 유효성 검증',
    "    if (!/^[a-fA-F0-9]{24}$/.test(req.params.id || '')) return res.status(400).json({ error: '유효하지 않은 ID' });",
    '    if (dbReady && Notice) {',
    '      await Notice.findByIdAndDelete(req.params.id);',
  ].join('\n')
);

// Fix 3: ManualShopItem DELETE — isValid 누락
apply('MANUAL-SHOP-DELETE-ISVALID',
  [
    '  try {',
    '    await ManualShopItem.findByIdAndDelete(req.params.id);',
    '    res.json({ ok: true });',
    '  } catch (err) {',
    "    logger.error('[Shop Manual] 삭제 실패:', err.message);",
    "    res.status(500).json({ error: '삭제 실패' });",
  ].join('\n'),
  [
    '  try {',
    '    // FIX-OBJID-SHOP-DEL: ObjectId 유효성 검증',
    "    if (!/^[a-fA-F0-9]{24}$/.test(req.params.id || '')) return res.status(400).json({ error: '유효하지 않은 ID' });",
    '    await ManualShopItem.findByIdAndDelete(req.params.id);',
    '    res.json({ ok: true });',
    '  } catch (err) {',
    "    logger.error('[Shop Manual] 삭제 실패:', err.message);",
    "    res.status(500).json({ error: '삭제 실패' });",
  ].join('\n')
);

// Fix 4: 채팅 post_share 이미지 MIME 화이트리스트
apply('CHAT-IMAGE-MIME',
  [
    "      const rawImage = (data.postImage || '').toString();",
    '      // ✅ BASE64-FIX: base64 이미지는 실시간 emit에는 전체 전송, DB에는 저장 안 함 (16MB 문서 한도 보호)',
    "      const isBase64 = rawImage.startsWith('data:');",
    "      const dbSafeImage = isBase64 ? '' : rawImage.slice(0, 500); // URL은 500자 이내 저장",
  ].join('\n'),
  [
    "      const rawImage = (data.postImage || '').toString();",
    '      // FIX-CHAT-MIME: base64 이미지 MIME 타입 화이트리스트 (허용: jpeg/png/gif/webp)',
    "      const isBase64 = rawImage.startsWith('data:');",
    '      if (isBase64) {',
    "        const mimeMatch = rawImage.match(/^data:([^;]+);base64,/);",
    "        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];",
    '        if (!mimeMatch || !allowedMimes.includes(mimeMatch[1])) {',
    "          socket.emit('error', { message: '허용되지 않는 이미지 형식입니다.' }); return;",
    '        }',
    '      }',
    "      const dbSafeImage = isBase64 ? '' : rawImage.slice(0, 500); // URL은 500자 이내 저장",
  ].join('\n')
);

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
console.log('FIX-OBJID-BPOST-DEL:', final.includes('FIX-OBJID-BPOST-DEL'));
console.log('FIX-OBJID-NOTICE-DEL:', final.includes('FIX-OBJID-NOTICE-DEL'));
console.log('FIX-OBJID-SHOP-DEL:', final.includes('FIX-OBJID-SHOP-DEL'));
console.log('FIX-CHAT-MIME:', final.includes('FIX-CHAT-MIME'));

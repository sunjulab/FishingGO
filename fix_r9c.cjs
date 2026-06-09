// fix_r9c.cjs - Channel videos mass assignment fix (regex fix)
const fs = require('fs');
const { execSync } = require('child_process');
const FILE = 'server/index.js';

function check() {
  try { execSync(`node --check ${FILE}`, { stdio: 'pipe' }); return true; }
  catch (e) { console.error('  Syntax error:', e.stderr?.toString().slice(0, 300)); return false; }
}

const raw = fs.readFileSync(FILE, 'utf8');
const normalized = raw.replace(/\r\n/g, '\n');

const from = `  const video = req.body;
  if (!video.id) video.id = Date.now();
  channelVideos.push(video);
  res.json({ success: true, video });`;

if (!normalized.includes(from)) {
  console.log('⚠️  SKIP (not found): CHANNEL-MASS-ASSIGN');
  process.exit(0);
}

// 정규식을 문자열 이스케이프 없이 작성
const to = `  // ✅ FIX-CHANNEL-MASS-ASSIGN: 화이트리스트 필드만 허용 (Mass Assignment 방어)
  const { title, category, url, thumbnail, duration, views: viewsStr, description } = req.body;
  if (!title || !url) return res.status(400).json({ error: 'title, url 필수' });
  if (typeof title !== 'string' || title.length > 200) return res.status(400).json({ error: 'title 최대 200자' });
  const urlStr = String(url || '');
  if (!urlStr.startsWith('https://') || urlStr.length > 500) return res.status(400).json({ error: '유효한 https URL 필요' });
  if (thumbnail) {
    const thStr = String(thumbnail);
    if (!thStr.startsWith('https://') || thStr.length > 500) return res.status(400).json({ error: '유효한 https thumbnail URL 필요' });
  }
  const video = {
    id: Date.now(),
    title: title.trim(),
    category: typeof category === 'string' ? category.trim().slice(0, 50) : '기타',
    url: urlStr.trim(),
    thumbnail: thumbnail ? String(thumbnail).trim() : '',
    duration: typeof duration === 'string' ? duration.trim().slice(0, 10) : '',
    views: typeof viewsStr === 'string' ? viewsStr.trim().slice(0, 20) : '0',
    description: typeof description === 'string' ? description.trim().slice(0, 500) : '',
  };
  channelVideos.push(video);
  res.json({ success: true, video });`;

const patched = normalized.replace(from, to);
const withCRLF = patched.replace(/\r?\n/g, '\r\n');
fs.writeFileSync(FILE, withCRLF, 'utf8');

if (check()) {
  console.log('✅ OK: CHANNEL-MASS-ASSIGN');
} else {
  fs.writeFileSync(FILE, raw, 'utf8');
  console.log('❌ FAIL (syntax): CHANNEL-MASS-ASSIGN — rolled back');
  process.exit(1);
}

const finalContent = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
console.log('FIX-CHANNEL-MASS-ASSIGN:', finalContent.includes('FIX-CHANNEL-MASS-ASSIGN'));

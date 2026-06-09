// fix_r20_disconnect.cjs - 소켓 disconnect 시 Map 정리 추가
const fs = require('fs');
const { execSync } = require('child_process');
const FILE = 'server/index.js';

function check() {
  try { execSync(`node --check ${FILE}`, { stdio: 'pipe' }); return true; }
  catch (e) { console.error('Syntax error:', e.stderr?.toString().slice(0, 200)); return false; }
}

const raw = fs.readFileSync(FILE, 'utf8');
const normalized = raw.replace(/\r\n/g, '\n');

// Fix 1: disconnect 시 socketFloodMap, joinRateMap 정리
const from = [
  "  socket.on('disconnect', () => {",
  "    logger.info(`[Socket] User disconnected: ${socket.id}`); // ✅ 21TH-B1: console.log → logger.info",
  "  });",
].join('\n');

const to = [
  "  socket.on('disconnect', () => {",
  "    logger.info(`[Socket] User disconnected: ${socket.id}`); // ✅ 21TH-B1: console.log → logger.info",
  "    // FIX-SOCKET-DISCONNECT-CLEANUP: 연결 해제 시 rate limit Map 정리 (메모리 누수 방지)",
  "    socketFloodMap.delete(socket.id);",
  "    if (typeof joinRateMap !== 'undefined') joinRateMap.delete(socket.id);",
  "  });",
].join('\n');

if (!normalized.includes(from)) {
  console.log('disconnect pattern not found');
} else {
  const patched = normalized.replace(from, to);
  fs.writeFileSync(FILE, patched.replace(/\r?\n/g, '\r\n'), 'utf8');
  if (check()) {
    console.log('OK - FIX-SOCKET-DISCONNECT-CLEANUP applied');
  } else {
    fs.writeFileSync(FILE, raw, 'utf8');
    console.log('FAIL - reverted');
  }
}

// Fix 2: /api/debug 에 관리자 JWT 인증 추가 (production 체크만으로 부족)
const debugFrom = [
  "app.get('/api/debug', async (req, res) => {",
  "  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: '접근 불가' });",
].join('\n');

const raw2 = fs.readFileSync(FILE, 'utf8');
const normalized2 = raw2.replace(/\r\n/g, '\n');

const debugTo = [
  "app.get('/api/debug', async (req, res) => {",
  "  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: '접근 불가' });",
  "  // FIX-DEBUG-AUTH: production이 아닌 경우에도 관리자 JWT 필요",
  "  const auth = req.headers.authorization || '';",
  "  if (auth.startsWith('Bearer ')) {",
  "    try { const tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); if (!isAdminToken(tp)) return res.status(403).json({ error: '관리자 권한 필요' }); }",
  "    catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }",
  "  } else { return res.status(401).json({ error: '인증 필요' }); }",
].join('\n');

if (!normalized2.includes(debugFrom)) {
  console.log('debug pattern not found');
} else {
  const patched2 = normalized2.replace(debugFrom, debugTo);
  fs.writeFileSync(FILE, patched2.replace(/\r?\n/g, '\r\n'), 'utf8');
  if (check()) {
    console.log('OK - FIX-DEBUG-AUTH applied');
  } else {
    fs.writeFileSync(FILE, raw2, 'utf8');
    console.log('FAIL - debug auth reverted');
  }
}

const final = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
console.log('\n--- 패치 확인 ---');
console.log('FIX-SOCKET-DISCONNECT-CLEANUP:', final.includes('FIX-SOCKET-DISCONNECT-CLEANUP'));
console.log('FIX-DEBUG-AUTH:', final.includes('FIX-DEBUG-AUTH'));

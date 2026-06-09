// fix_dup_endpoint.cjs - 중복 엔드포인트 제거
const fs = require('fs');
const { execSync } = require('child_process');
const FILE = 'server/index.js';

const raw = fs.readFileSync(FILE, 'utf8');
const normalized = raw.replace(/\r\n/g, '\n');

// 중복된 블록 제거
const dupBlock = [
  '',
  "app.get('/api/records/:id', async (req, res) => {",
  '  try {',
  '    const { id } = req.params;',
  '    // FIX-OBJID-RECORDS-GET: ObjectId 사전 검증 → CastError 방지',
  "    if (id && !/^[a-fA-F0-9]{24}$/.test(id)) return res.status(400).json({ error: '유효하지 않은 ID 형식' });",
  '    if (dbReady && CatchRecord) {',
  '      let record = null;',
  '      try { record = await CatchRecord.findById(id); } catch (castErr) { /* ObjectId 캐스팅 오류 무시 */ }',
  "      if (!record) return res.status(404).json({ error: '기록을 찾을 수 없습니다.' });",
  '      return res.json(record);',
  '    }',
  "    return res.status(503).json({ error: '데이터베이스 연결 중입니다.' });",
  "  } catch (err) { (logger?.error || console.error)('[records] 서버 오류:', err.message); res.status(500).json({ error: '서버 오류' }); }",
  '});',
  '',
  '// --- 사용자 차단 ---',
].join('\n');

if (!normalized.includes(dupBlock)) {
  console.log('Pattern not found, checking partial...');
  // 블록 앞쪽만 찾기
  const startIdx = normalized.indexOf("\napp.get('/api/records/:id', async (req, res) => {\n  try {\n    const { id } = req.params;\n    // FIX-OBJID-RECORDS-GET:");
  const endIdx = normalized.indexOf('\n// --- 사용자 차단 ---\n', startIdx);
  console.log('startIdx:', startIdx, 'endIdx:', endIdx);
  if (startIdx !== -1 && endIdx !== -1) {
    const toRemove = normalized.slice(startIdx, endIdx);
    console.log('Block to remove (first 200 chars):', toRemove.slice(0, 200));
    const fixed = normalized.slice(0, startIdx) + '\n' + normalized.slice(endIdx);
    fs.writeFileSync(FILE, fixed.replace(/\r?\n/g, '\r\n'), 'utf8');
    try {
      execSync(`node --check ${FILE}`, { stdio: 'pipe' });
      console.log('SYNTAX OK - 중복 제거 성공');
    } catch (e) {
      console.error('SYNTAX ERROR - 롤백');
      execSync('git checkout HEAD -- server/index.js');
    }
  }
} else {
  const fixed = normalized.replace(dupBlock, '\n\n// --- 사용자 차단 ---');
  fs.writeFileSync(FILE, fixed.replace(/\r?\n/g, '\r\n'), 'utf8');
  try {
    execSync(`node --check ${FILE}`, { stdio: 'pipe' });
    console.log('SYNTAX OK - 중복 제거 성공');
  } catch (e) {
    console.error('SYNTAX ERROR - 롤백');
    execSync('git checkout HEAD -- server/index.js');
  }
}

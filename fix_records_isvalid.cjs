// fix_records_isvalid.cjs
const fs = require('fs');
const { execSync } = require('child_process');
const FILE = 'server/index.js';

function check() {
  try { execSync(`node --check ${FILE}`, { stdio: 'pipe' }); return true; }
  catch (e) { console.error('Syntax error:', e.stderr?.toString().slice(0, 200)); return false; }
}

const raw = fs.readFileSync(FILE, 'utf8');
const normalized = raw.replace(/\r\n/g, '\n');

const from = [
  '    const { id } = req.params;',
  '    if (dbReady && CatchRecord) {',
  '      let record = null;',
  '      try { record = await CatchRecord.findById(id); } catch (castErr) { /* ObjectId 캐스팅 오류 무시 */ }',
  '      if (record) return res.json(record);',
].join('\n');

const to = [
  '    const { id } = req.params;',
  '    // FIX-OBJID-RECORDS-GET: isValid 검증으로 CastError 방지 및 불필요한 DB 쿼리 차단',
  "    if (id && !/^[a-fA-F0-9]{24}$/.test(id)) return res.status(400).json({ error: '유효하지 않은 ID 형식' });",
  '    if (dbReady && CatchRecord) {',
  '      let record = null;',
  '      try { record = await CatchRecord.findById(id); } catch (castErr) { /* ObjectId 캐스팅 오류 무시 */ }',
  '      if (record) return res.json(record);',
].join('\n');

if (!normalized.includes(from)) {
  console.log('Pattern not found');
} else {
  const patched = normalized.replace(from, to);
  fs.writeFileSync(FILE, patched.replace(/\r?\n/g, '\r\n'), 'utf8');
  if (check()) {
    console.log('OK - FIX-OBJID-RECORDS-GET applied');
  } else {
    fs.writeFileSync(FILE, raw, 'utf8');
    console.log('FAIL - reverted');
  }
}

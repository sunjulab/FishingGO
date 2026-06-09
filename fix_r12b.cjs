// fix_r12b.cjs - Round 12 fixes with proper escaping
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

// Fix 1: Payple webhook 결제 금액 검증 - 템플릿 리터럴 피하기
const paypleFrom = [
  '    // planId 추출 (goodsName 또는 커스텀 파라미터로 전달)',
  "    const planId = req.body.PCD_CUSTOM_PLAN || 'BASIC';",
  '    const planInfo = PAYPLE_PLAN_MAP[planId];',
  "    if (!planInfo) return res.status(400).json({ error: '알 수 없는 플랜' });",
  '',
  '    const email = PCD_PAYER_EMAIL;',
].join('\n');

const paypleTo = [
  '    // planId 추출 (goodsName 또는 커스텀 파라미터로 전달)',
  "    const planId = req.body.PCD_CUSTOM_PLAN || 'BASIC';",
  '    const planInfo = PAYPLE_PLAN_MAP[planId];',
  "    if (!planInfo) return res.status(400).json({ error: '알 수 없는 플랜' });",
  '',
  '    // FIX-PAYPLE-AMOUNT: 결제 금액 서버사이드 재계산 (위조 방어)',
  '    const paidAmount = Number(PCD_PAY_TOTAL);',
  '    if (!paidAmount || paidAmount < planInfo.amount) {',
  "      (logger?.warn || console.warn)('[Payple] 금액 불일치: 기대=' + planInfo.amount + ', 수신=' + paidAmount + ', planId=' + planId);",
  "      return res.status(400).json({ error: '결제 금액이 플랜 가격과 일치하지 않습니다.' });",
  '    }',
  '',
  '    const email = PCD_PAYER_EMAIL;',
].join('\n');

apply('PAYPLE-AMOUNT', paypleFrom, paypleTo);

// Fix 2: CCTV PUT youtubeId/type/label 검증
const cctvFrom = [
  '  const { youtubeId, type, label } = req.body;',
  "  if (!obsCode) return res.status(400).json({ error: 'obsCode 필요' });",
].join('\n');

const cctvTo = [
  '  const { youtubeId, type, label } = req.body;',
  "  if (!obsCode) return res.status(400).json({ error: 'obsCode 필요' });",
  '  // FIX-CCTV-VALID: 입력 길이/형식 검증',
  "  if (youtubeId !== undefined && (typeof youtubeId !== 'string' || youtubeId.length > 20)) return res.status(400).json({ error: '유효하지 않은 YouTube ID' });",
  "  if (type !== undefined && !['live', 'youtube', 'hls', 'dash', 'cctv'].includes(type)) return res.status(400).json({ error: '유효하지 않은 타입' });",
  "  if (label !== undefined && (typeof label !== 'string' || label.length > 50)) return res.status(400).json({ error: '라벨은 최대 50자' });",
].join('\n');

apply('CCTV-VALID', cctvFrom, cctvTo);

// Fix 3: express body limit 확인 및 설정
const raw = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
if (raw.includes('express.json({ limit')) {
  console.log('INFO: express.json limit 이미 설정됨');
} else if (raw.includes("express.json()")) {
  // limit 추가 시도
  const jsonFrom = "app.use(express.json());\n";
  if (raw.includes(jsonFrom)) {
    const jsonTo = "app.use(express.json({ limit: '2mb' })); // FIX-BODY-LIMIT\n";
    apply('BODY-LIMIT', jsonFrom, jsonTo);
  } else {
    console.log('INFO: express.json 단독 사용 패턴 없음');
  }
} else {
  console.log('INFO: express.json 설정 미발견');
}

// 최종 검증
console.log('\n--- 최종 문법 검사 ---');
if (check()) {
  console.log('ALL DONE - node --check PASS');
} else {
  console.log('SYNTAX ERROR');
  execSync('git checkout HEAD -- server/index.js');
}

const final = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
console.log('\n--- 패치 확인 ---');
console.log('FIX-PAYPLE-AMOUNT:', final.includes('FIX-PAYPLE-AMOUNT'));
console.log('FIX-CCTV-VALID:', final.includes('FIX-CCTV-VALID'));

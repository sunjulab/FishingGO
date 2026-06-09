// fix_r12.cjs - Round 12 Security Fixes
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

// ─── Fix 1: Payple webhook 결제 금액 검증 없음 ───────────────────────────────
const paypleAmountFrom = `    // planId 추출 (goodsName 또는 커스텀 파라미터로 전달)
    const planId = req.body.PCD_CUSTOM_PLAN || 'BASIC';
    const planInfo = PAYPLE_PLAN_MAP[planId];
    if (!planInfo) return res.status(400).json({ error: '알 수 없는 플랜' });

    const email = PCD_PAYER_EMAIL;
    const newTier = planInfo.tier;
    const expiresAt = new Date(Date.now() + planInfo.days * 24 * 60 * 60 * 1000);`;

const paypleAmountTo = `    // planId 추출 (goodsName 또는 커스텀 파라미터로 전달)
    const planId = req.body.PCD_CUSTOM_PLAN || 'BASIC';
    const planInfo = PAYPLE_PLAN_MAP[planId];
    if (!planInfo) return res.status(400).json({ error: '알 수 없는 플랜' });

    // ✅ FIX-PAYPLE-AMOUNT: 결제 금액 서버사이드 재계산 (위조 방어)
    const paidAmount = Number(PCD_PAY_TOTAL);
    if (!paidAmount || paidAmount < planInfo.amount) {
      (logger?.warn || console.warn)(\`[Payple] 금액 불일치: 기대=${planInfo.amount}, 수신=${paidAmount}, planId=${planId}\`);
      return res.status(400).json({ error: '결제 금액이 플랜 가격과 일치하지 않습니다.' });
    }

    const email = PCD_PAYER_EMAIL;
    const newTier = planInfo.tier;
    const expiresAt = new Date(Date.now() + planInfo.days * 24 * 60 * 60 * 1000);`;

apply('PAYPLE-AMOUNT', paypleAmountFrom, paypleAmountTo);

// ─── Fix 2: 닉네임 예약어 차단 확인 및 추가 ──────────────────────────────────
const raw = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
if (raw.includes('isBannedName')) {
  // isBannedName 함수 내용 확인
  const fnIdx = raw.indexOf('function isBannedName');
  const fnSnippet = raw.slice(fnIdx, fnIdx + 500);
  const hasAdmin = fnSnippet.includes('admin') || fnSnippet.includes('master');
  console.log('isBannedName includes admin/master:', hasAdmin);
  if (!hasAdmin) {
    console.log('⚠️  NEED FIX: isBannedName - admin/master 예약어 미포함');
  }
}

// ─── Fix 3: CCTV PUT youtubeId 길이 검증 ────────────────────────────────────
const cctvFrom = `  const { youtubeId, type, label } = req.body;
  if (!obsCode) return res.status(400).json({ error: 'obsCode 필요' });`;

const cctvTo = `  const { youtubeId, type, label } = req.body;
  if (!obsCode) return res.status(400).json({ error: 'obsCode 필요' });
  // ✅ FIX-CCTV-VALID: youtubeId/type/label 길이 및 형식 검증
  if (youtubeId !== undefined && (typeof youtubeId !== 'string' || youtubeId.length > 20)) return res.status(400).json({ error: '유효하지 않은 YouTube ID' });
  if (type !== undefined && !['live', 'youtube', 'hls', 'dash'].includes(type)) return res.status(400).json({ error: '유효하지 않은 타입' });
  if (label !== undefined && (typeof label !== 'string' || label.length > 50)) return res.status(400).json({ error: '라벨은 최대 50자' });`;

apply('CCTV-VALID', cctvFrom, cctvTo);

// ─── Fix 4: isBannedName에 예약어 추가 ──────────────────────────────────────
const bannedFrom = raw.match(/function isBannedName[\s\S]*?(?=\n\n)/)?.[0];
if (bannedFrom && !bannedFrom.includes('admin')) {
  // 예약어 목록 확장
  const bannedFuncFrom = `function isBannedName(name) {`;
  const content2 = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
  const fnStart = content2.indexOf('function isBannedName(name)');
  if (fnStart !== -1) {
    const fnEnd = content2.indexOf('\n}', fnStart) + 2;
    const fnBody = content2.slice(fnStart, fnEnd);
    if (!fnBody.includes('admin') && !fnBody.includes('master')) {
      // BANNED_WORDS 배열에 추가
      const bannedWordsFrom = content2.match(/const BANNED_WORDS\s*=\s*\[[\s\S]*?\];/)?.[0];
      if (bannedWordsFrom && !bannedWordsFrom.includes('admin')) {
        const bannedWordsTo = bannedWordsFrom.replace(
          '];',
          `  // ✅ FIX-BANNED-RESERVE: 시스템 예약어 추가
  'admin', 'master', 'root', 'system', '운영자', '관리자', 'sunjulab', 'fishinggo',
];`
        );
        apply('BANNED-RESERVE', bannedWordsFrom, bannedWordsTo);
      } else {
        console.log('ℹ️  BANNED_WORDS 패턴 없음 또는 이미 admin 포함');
      }
    } else {
      console.log('ℹ️  isBannedName - admin/master 이미 포함됨');
    }
  }
}

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
console.log('FIX-PAYPLE-AMOUNT:', finalContent.includes('FIX-PAYPLE-AMOUNT'));
console.log('FIX-CCTV-VALID:', finalContent.includes('FIX-CCTV-VALID'));

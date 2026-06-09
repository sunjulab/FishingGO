/**
 * auto_audit.cjs v3 — 낚시GO 전수조사 자동화 스크립트
 * 인코딩 문제 해결: Buffer.toString() 대신 섹션별 라인 기반 탐지
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const ISSUES = [];
let issueId = 0;

function issue(severity, file, lineHint, desc, fix) {
  issueId++;
  ISSUES.push({ id: issueId, severity, file, lineHint, desc, fix });
}

function readLines(relPath) {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) return [];
  const buf = fs.readFileSync(abs);
  // Remove BOM if present
  const start = (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) ? 3 : 0;
  return buf.slice(start).toString('utf8').split(/\r?\n/);
}

function readBytes(relPath) {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs);
}

function hasBOM(bytes) {
  return bytes && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF;
}

function linesContain(lines, pattern) {
  return lines.some(l => l.includes(pattern));
}

function findLineRange(lines, fromMarker, count = 100) {
  const start = lines.findIndex(l => l.includes(fromMarker));
  if (start === -1) return [];
  return lines.slice(start, start + count);
}

// ════════════════════════════════════════════
// 1. BOM 검사
// ════════════════════════════════════════════
const ALL_FILES = [
  'server/index.js',
  'src/api/index.js',
  'src/store/useUserStore.js',
  'src/pages/VVIPSubscribe.jsx',
  'src/pages/CommunityTab.jsx',
  'src/pages/MyPage.jsx',
  'src/pages/MapHome.jsx',
  'src/components/SubscriptionFailBanner.jsx',
  'src/components/UpgradeModal.jsx',
  'src/components/AdUnit.jsx',
];

ALL_FILES.forEach(f => {
  const abs = path.join(ROOT, f);
  if (!fs.existsSync(abs)) return;
  const b = readBytes(f);
  if (hasBOM(b)) {
    issue('HIGH', f, 'L1', 'BOM(\\uFEFF) 있음', 'BOM 제거');
  }
});

// ════════════════════════════════════════════
// 2. server/index.js 점검
// ════════════════════════════════════════════
const sLines = readLines('server/index.js');
if (sLines.length > 0) {
  // 2-1. runIapExpiryCheck: subscriptionExpiresAt $or 조건
  const iapCheck = findLineRange(sLines, 'runIapExpiryCheck', 60);
  if (!iapCheck.some(l => l.includes('subscriptionExpiresAt') && l.includes('$ne') && l.includes('$lt'))) {
    issue('HIGH', 'server/index.js', 'runIapExpiryCheck',
      '웹 결제 유저 만료 처리 누락 — subscriptionExpiresAt $ne $lt 조건 없음', '$or 조건 추가');
  }

  // 2-2. runIapExpiryCheck $set: subscriptionExpiresAt null 포함
  const iapSet = findLineRange(sLines, 'runIapExpiryCheck', 100);
  const setLine = iapSet.find(l => l.includes('$set') && l.includes("tier: 'FREE'") && l.includes('iapExpiresAt'));
  if (!setLine || !setLine.includes('subscriptionExpiresAt')) {
    issue('HIGH', 'server/index.js', 'runIapExpiryCheck $set',
      '$set에 subscriptionExpiresAt: null 없음', 'subscriptionExpiresAt: null 추가');
  }

  // 2-3. VVIP harbors 만료 → User DB 초기화 (app.get 라우트에서 탐지)
  const harborsAppGetIdx = sLines.findIndex(l => l.includes("app.get('/api/vvip/harbors'"));
  const harborsRange = harborsAppGetIdx >= 0 ? sLines.slice(harborsAppGetIdx, harborsAppGetIdx + 40) : [];
  const hasExpiredUid = harborsRange.some(l => l.includes('_expiredUid') || (l.includes('slot.userId') && l.includes('findOneAndUpdate')));
  if (!hasExpiredUid) {
    issue('MEDIUM', 'server/index.js', '/api/vvip/harbors',
      'harbors 만료 시 User DB vvipHarborId 초기화 없음', 'User.findOneAndUpdate $unset 추가');
  }

  // 2-4. my-slot 만료 → User DB 초기화 (app.get 라우트에서 탐지)
  const mySlotAppGetIdx = sLines.findIndex(l => l.includes("app.get('/api/vvip/my-slot'"));
  const mySlotRange = mySlotAppGetIdx >= 0 ? sLines.slice(mySlotAppGetIdx, mySlotAppGetIdx + 60) : [];
  const hasMySlotDB = mySlotRange.some(l => l.includes('findOneAndUpdate') && (l.includes('slot.userId') || l.includes('$unset')));
  if (!hasMySlotDB) {
    issue('MEDIUM', 'server/index.js', '/api/vvip/my-slot',
      'my-slot 만료 시 User DB 초기화 없음', 'User.findOneAndUpdate $unset 추가');
  }

  // 2-5. GET /api/pro/status 만료 → User DB tier FREE
  const proStatusRange = findLineRange(sLines, '/api/pro/status', 80);
  const hasProStatusDB = proStatusRange.some(l =>
    l.includes('findOneAndUpdate') && l.includes("'FREE'"));
  if (!hasProStatusDB) {
    issue('MEDIUM', 'server/index.js', '/api/pro/status',
      'PRO 만료 시 User DB tier FREE 초기화 없음', 'User.findOneAndUpdate $set 추가');
  }

  // 2-6. DELETE /api/pro/cancel userId 가드 + User DB 초기화
  const cancelAppIdx = sLines.findIndex(l => l.includes("app.delete('/api/pro/cancel'"));
  const cancelRange = cancelAppIdx >= 0 ? sLines.slice(cancelAppIdx, cancelAppIdx + 30) : [];
  if (!cancelRange.some(l => l.includes('if (!userId)'))) {
    issue('LOW', 'server/index.js', '/api/pro/cancel', 'userId 가드 없음', "if (!userId) return 400");
  }
  if (!cancelRange.some(l => l.includes('findOneAndUpdate') && l.includes("'FREE'"))) {
    issue('MEDIUM', 'server/index.js', '/api/pro/cancel',
      'User DB tier FREE 초기화 없음', 'findOneAndUpdate $set 추가');
  }

  // 2-7. PRO cron User DB 초기화 (_cleanedUserId)
  const cronIdx = sLines.findIndex(l => l.includes('24') && l.includes('PRO') && (l.includes('setInterval') || l.includes('cron') || l.includes('자동 정리')));
  const cronRange = cronIdx >= 0 ? sLines.slice(cronIdx, cronIdx + 30) : [];
  if (!cronRange.some(l => l.includes('findOneAndUpdate') || l.includes('_cleanedUserId'))) {
    issue('MEDIUM', 'server/index.js', 'PRO cron',
      'PRO 만료 cron에서 User DB 초기화 없음', 'findOneAndUpdate 추가');
  }

  // 2-8. admin/vvip/revoke User DB $unset
  const revokeAppIdx = sLines.findIndex(l => l.includes("app.delete('/api/admin/vvip/revoke'"));
  const revokeRange = revokeAppIdx >= 0 ? sLines.slice(revokeAppIdx, revokeAppIdx + 50) : [];
  if (!revokeRange.some(l => l.includes('$unset') || (l.includes('findOneAndUpdate') && l.includes('slotUserId')))) {
    issue('MEDIUM', 'server/index.js', '/api/admin/vvip/revoke',
      'VVIP 강제 해제 시 User DB $unset 없음', '$unset vvipHarborId 추가');
  }

  // 2-9. loadVvipSlotsFromDB 만료 필터
  const loadRange = findLineRange(sLines, 'loadVvipSlotsFromDB', 60);
  if (!loadRange.some(l => l.includes('$gt') && l.includes('now'))) {
    issue('HIGH', 'server/index.js', 'loadVvipSlotsFromDB',
      '만료 슬롯 재복원 방지 필터 없음', '$gt: now 조건 추가');
  }

  // 2-10. VVIP purchase JWT 검증
  const purchaseRange = findLineRange(sLines, '/api/vvip/purchase', 60);
  if (!purchaseRange.some(l => l.includes('isAdmin') || l.includes('tp.email') || l.includes('tp.id'))) {
    issue('HIGH', 'server/index.js', '/api/vvip/purchase',
      'VVIP purchase JWT 검증 없음', 'JWT 검증 추가');
  }
}

// ════════════════════════════════════════════
// 3. src/api/index.js 점검
// ════════════════════════════════════════════
const apiLines = readLines('src/api/index.js');
if (apiLines.length > 0) {
  // 3-1. SUBSCRIPTION_EXPIRED 처리: setUserTier 단독 호출 제거됐는지
  const subExpRange = findLineRange(apiLines, 'SUBSCRIPTION_EXPIRED', 20);
  if (subExpRange.some(l => l.includes("setUserTier('FREE')"))) {
    issue('MEDIUM', 'src/api/index.js', 'SUBSCRIPTION_EXPIRED',
      'setUserTier + updateUser 이중 호출 원자성 결여', 'setUserTier 제거');
  }

  // 3-2. GUEST 판별: Zustand store 사용 여부
  const guestRange = findLineRange(apiLines, 'GUEST', 20);
  const hasLocalStorageGUEST = guestRange.some(l => l.includes("localStorage.getItem('user')"));
  const hasZustandGUEST = guestRange.some(l => l.includes('useUserStore') || l.includes('getState'));
  if (hasLocalStorageGUEST && !hasZustandGUEST) {
    issue('HIGH', 'src/api/index.js', 'GUEST 판별',
      'localStorage 직접 파싱 — XSS 취약', 'Zustand store 참조');
  }

  // 3-3. refresh finally isRefreshing = false
  if (!apiLines.some(l => l.includes('isRefreshing = false'))) {
    issue('HIGH', 'src/api/index.js', 'refresh', 'isRefreshing 미해제', 'finally 추가');
  }

  // 3-4. MAX_QUEUE
  if (!apiLines.some(l => l.includes('MAX_QUEUE'))) {
    issue('LOW', 'src/api/index.js', 'queue', '큐 크기 제한 없음', 'MAX_QUEUE 추가');
  }
}

// ════════════════════════════════════════════
// 4. src/store/useUserStore.js 점검
// ════════════════════════════════════════════
const storeLines = readLines('src/store/useUserStore.js');
if (storeLines.length > 0) {
  // 4-1. updateUser userTier 동시 갱신
  const updateRange = findLineRange(storeLines, 'updateUser', 20);
  if (!updateRange.some(l => l.includes('userTier') && (l.includes('newData.tier') || l.includes('newState.userTier')))) {
    issue('MEDIUM', 'src/store/useUserStore.js', 'updateUser',
      'updateUser에서 userTier 동시 갱신 없음', 'newState.userTier = newData.tier 추가');
  }

  // 4-2. logout 토큰 정리
  const logoutRange = findLineRange(storeLines, 'logout', 20);
  if (!logoutRange.some(l => l.includes('access_token'))) {
    issue('HIGH', 'src/store/useUserStore.js', 'logout', 'logout 토큰 미정리', 'removeItem 추가');
  }
}

// ════════════════════════════════════════════
// 5. SubscriptionFailBanner.jsx
// ════════════════════════════════════════════
const sfbLines = readLines('src/components/SubscriptionFailBanner.jsx');
if (sfbLines.length > 0) {
  if (!sfbLines.some(l => l.includes('isMountedRef'))) {
    issue('HIGH', 'src/components/SubscriptionFailBanner.jsx', 'useEffect',
      'isMountedRef 없음', 'useRef + cleanup 추가');
  }
  if (sfbLines.some(l => l.includes('isMountedRef')) &&
      !sfbLines.some(l => l.includes('isMountedRef.current'))) {
    issue('HIGH', 'src/components/SubscriptionFailBanner.jsx', 'then()',
      'isMountedRef 선언됐지만 체크 없음', 'if (!isMountedRef.current) return 추가');
  }
}

// ════════════════════════════════════════════
// 6. UpgradeModal.jsx
// ════════════════════════════════════════════
const umLines = readLines('src/components/UpgradeModal.jsx');
if (umLines.length > 0) {
  if (!umLines.some(l => l.includes('onClose') && l.includes('= (') && l.includes(')'))) {
    issue('MEDIUM', 'src/components/UpgradeModal.jsx', 'props',
      'onClose 기본값 없음', "onClose = () => {} 추가");
  }
}

// ════════════════════════════════════════════
// 7. VVIPSubscribe.jsx
// ════════════════════════════════════════════
const vvipLines = readLines('src/pages/VVIPSubscribe.jsx');
if (vvipLines.length > 0) {
  const hasRestore = vvipLines.some(l => l.includes('handleRestore') || l.includes('Restore'));
  const hasRef = vvipLines.some(l => l.includes('isMountedRef'));
  if (hasRestore && !hasRef) {
    issue('HIGH', 'src/pages/VVIPSubscribe.jsx', 'handleRestore',
      'handleRestore isMountedRef 없음 — 언마운트 방어 미적용', 'useRef 추가');
  }
}

// ════════════════════════════════════════════
// 8. MyPage.jsx
// ════════════════════════════════════════════
const mypageLines = readLines('src/pages/MyPage.jsx');
if (mypageLines.length > 0) {
  if (!mypageLines.some(l => l.includes('isMountedRef'))) {
    issue('HIGH', 'src/pages/MyPage.jsx', 'useEffect', 'isMountedRef 없음', 'useRef 추가');
  }
  if (mypageLines.some(l => l.includes("setUserTier('FREE')")) &&
      mypageLines.some(l => l.includes('updateUser('))) {
    issue('MEDIUM', 'src/pages/MyPage.jsx', 'tier 갱신',
      'setUserTier + updateUser 이중호출', 'updateUser 단일 통합');
  }
}

// ════════════════════════════════════════════
// 9. CommunityTab.jsx
// ════════════════════════════════════════════
const commLines = readLines('src/pages/CommunityTab.jsx');
if (commLines.length > 0) {
  if (!commLines.some(l => l.includes('isMountedRef'))) {
    issue('HIGH', 'src/pages/CommunityTab.jsx', 'useEffect', 'isMountedRef 없음', 'useRef 추가');
  }
}

// ════════════════════════════════════════════
// 10. MapHome.jsx 언마운트 방어 점검
// ════════════════════════════════════════════
const mapHomeLines = readLines('src/pages/MapHome.jsx');
if (mapHomeLines.length > 0) {
  // secret-point-overrides useEffect 내 cancelled 패턴
  const secretRange = findLineRange(mapHomeLines, 'secret-point-overrides', 25);
  if (!secretRange.some(l => l.includes('cancelled'))) {
    issue('HIGH', 'src/pages/MapHome.jsx', 'secret-point-overrides useEffect',
      'cancelled 언마운트 방어 없음 — 언마운트 후 setEffectiveSecretPoints 호출 위험',
      'let cancelled = false; + if(cancelled) return; + return () => { cancelled = true; }');
  }
  // spot-location-overrides useEffect 내 cancelled 패턴
  const spotRange = findLineRange(mapHomeLines, 'spot-location-overrides', 25);
  if (!spotRange.some(l => l.includes('cancelled'))) {
    issue('HIGH', 'src/pages/MapHome.jsx', 'spot-location-overrides useEffect',
      'cancelled 언마운트 방어 없음 — 언마운트 후 setState 호출 위험',
      'cancelled 패턴 추가');
  }
  // custom-points useEffect 내 cancelled 패턴
  const customPtsRange = findLineRange(mapHomeLines, 'custom-points', 15);
  if (!customPtsRange.some(l => l.includes('cancelled'))) {
    issue('HIGH', 'src/pages/MapHome.jsx', 'custom-points useEffect',
      'cancelled 언마운트 방어 없음 — setCustomPoints 호출 위험',
      'cancelled 패턴 추가');
  }
}

// ════════════════════════════════════════════
// 11. 빌드 문법 검사
// ════════════════════════════════════════════
try {
  execSync('node --check server/index.js', { cwd: ROOT, stdio: 'pipe' });
} catch (e) {
  issue('HIGH', 'server/index.js', '전체', 'Node.js 문법 오류', e.stderr?.toString() || '');
}

// ════════════════════════════════════════════
// 결과 출력
// ════════════════════════════════════════════
console.log('\n' + '═'.repeat(65));
console.log('  낚시GO 자동 전수조사 v3 결과');
console.log('═'.repeat(65));

if (ISSUES.length === 0) {
  console.log('✅ 발견된 오류 없음 — CLEAN (100점)');
} else {
  console.log(`❌ 총 ${ISSUES.length}개 오류 발견\n`);
  const byLevel = { HIGH: [], MEDIUM: [], LOW: [] };
  ISSUES.forEach(i => byLevel[i.severity].push(i));
  ['HIGH', 'MEDIUM', 'LOW'].forEach(level => {
    if (byLevel[level].length === 0) return;
    const icon = level === 'HIGH' ? '🔴' : level === 'MEDIUM' ? '🟡' : '🟢';
    byLevel[level].forEach(i => {
      console.log(`${icon} [${level}] #${i.id} ${i.file} @ ${i.lineHint}`);
      console.log(`   문제: ${i.desc}`);
      console.log(`   수정: ${i.fix}`);
    });
  });
}

console.log('═'.repeat(65));
process.exit(ISSUES.length > 0 ? 1 : 0);

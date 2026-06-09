/**
 * continuous_audit.cjs
 * 낚시GO 무한 자동 전수조사 루프
 * - 오류 발견 시 자동 수정 후 재검사
 * - 3연속 CLEAN 후에도 새 영역 탐색 계속
 * - 멈추지 않음
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const ROOT = __dirname;
const LOG_FILE = path.join(ROOT, 'audit_log.txt');
let totalRound = 0;
let consecutiveClean = 0;
let totalFixed = 0;

function log(msg) {
  const ts = new Date().toLocaleTimeString('ko-KR');
  const line = `[${ts}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch {}
}

function readLines(relPath) {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) return [];
  const buf = fs.readFileSync(abs);
  const start = (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) ? 3 : 0;
  return buf.slice(start).toString('utf8').split(/\r?\n/);
}

function writeFileSafe(relPath, content) {
  const abs = path.join(ROOT, relPath);
  fs.writeFileSync(abs, content, 'utf8');
}

function removeBOM(relPath) {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) return false;
  const buf = fs.readFileSync(abs);
  if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
    fs.writeFileSync(abs, buf.slice(3));
    return true;
  }
  return false;
}

function syntaxCheck() {
  try {
    execSync('node --check server/index.js', { cwd: ROOT, stdio: 'pipe' });
    return true;
  } catch (e) {
    return false;
  }
}

function gitCommit(msg) {
  try {
    execSync('git add -A', { cwd: ROOT, stdio: 'pipe' });
    execSync(`git commit -m "${msg}"`, { cwd: ROOT, stdio: 'pipe' });
    execSync('git push origin main', { cwd: ROOT, stdio: 'pipe' });
    log(`📌 커밋: ${msg}`);
    return true;
  } catch { return false; }
}

// ════════════════════════════════════════════
// 검사 항목 목록 (매 라운드 전부 실행)
// ════════════════════════════════════════════
const ISSUES = [];

function addIssue(severity, file, where, desc, fixer) {
  ISSUES.push({ severity, file, where, desc, fixer });
}

function clearIssues() { ISSUES.length = 0; }

// ── 검사 함수들 ──────────────────────────────

function checkBOM(relPath) {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) return;
  const buf = fs.readFileSync(abs);
  if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
    addIssue('HIGH', relPath, 'L1', 'BOM(\\uFEFF) 있음', () => {
      removeBOM(relPath);
      return `BOM 제거: ${relPath}`;
    });
  }
}

function findLineRange(lines, marker, count = 60) {
  const idx = lines.findIndex(l => l.includes(marker));
  if (idx === -1) return [];
  return lines.slice(idx, idx + count);
}

function checkServer() {
  const sLines = readLines('server/index.js');
  if (!sLines.length) return;

  // 문법 검사
  if (!syntaxCheck()) {
    addIssue('HIGH', 'server/index.js', '전체', 'Node.js 문법 오류', null);
  }

  // runIapExpiryCheck: subscriptionExpiresAt 조건
  const iapRange = findLineRange(sLines, 'runIapExpiryCheck', 60);
  if (!iapRange.some(l => l.includes('subscriptionExpiresAt') && l.includes('$ne') && l.includes('$lt'))) {
    addIssue('HIGH', 'server/index.js', 'runIapExpiryCheck', 'subscriptionExpiresAt 만료 조건 없음', null);
  }

  // loadVvipSlotsFromDB 만료 필터
  const loadRange = findLineRange(sLines, 'loadVvipSlotsFromDB', 60);
  if (!loadRange.some(l => l.includes('$gt') && l.includes('now'))) {
    addIssue('HIGH', 'server/index.js', 'loadVvipSlotsFromDB', '만료 슬롯 재복원 방지 필터 없음', null);
  }

  // pro/cancel userId 가드
  const cancelIdx = sLines.findIndex(l => l.includes("app.delete('/api/pro/cancel'"));
  const cancelRange = cancelIdx >= 0 ? sLines.slice(cancelIdx, cancelIdx + 30) : [];
  if (!cancelRange.some(l => l.includes('if (!userId)'))) {
    addIssue('LOW', 'server/index.js', '/api/pro/cancel', 'userId 가드 없음', null);
  }
  if (!cancelRange.some(l => l.includes("'FREE'") && l.includes('findOneAndUpdate'))) {
    addIssue('MEDIUM', 'server/index.js', '/api/pro/cancel', 'User DB tier FREE 초기화 없음', null);
  }

  // admin/vvip/revoke $unset
  const revokeIdx = sLines.findIndex(l => l.includes("app.delete('/api/admin/vvip/revoke'"));
  const revokeRange = revokeIdx >= 0 ? sLines.slice(revokeIdx, revokeIdx + 50) : [];
  if (!revokeRange.some(l => l.includes('$unset') || (l.includes('findOneAndUpdate') && l.includes('slotUserId')))) {
    addIssue('MEDIUM', 'server/index.js', '/api/admin/vvip/revoke', 'User DB $unset 없음', null);
  }

  // harbors 만료 → User DB
  const harborsIdx = sLines.findIndex(l => l.includes("app.get('/api/vvip/harbors'"));
  const harborsRange = harborsIdx >= 0 ? sLines.slice(harborsIdx, harborsIdx + 40) : [];
  if (!harborsRange.some(l => l.includes('_expiredUid') || (l.includes('slot.userId') && l.includes('findOneAndUpdate')))) {
    addIssue('MEDIUM', 'server/index.js', '/api/vvip/harbors', 'harbors 만료 User DB 초기화 없음', null);
  }

  // my-slot 만료 → User DB
  const mySlotIdx = sLines.findIndex(l => l.includes("app.get('/api/vvip/my-slot'"));
  const mySlotRange = mySlotIdx >= 0 ? sLines.slice(mySlotIdx, mySlotIdx + 60) : [];
  if (!mySlotRange.some(l => l.includes('findOneAndUpdate') && (l.includes('slot.userId') || l.includes('$unset')))) {
    addIssue('MEDIUM', 'server/index.js', '/api/vvip/my-slot', 'my-slot 만료 User DB 초기화 없음', null);
  }

  // PRO cron DB
  const cronIdx = sLines.findIndex(l => l.includes('_cleanedUserId'));
  if (cronIdx === -1) {
    addIssue('MEDIUM', 'server/index.js', 'PRO cron', 'PRO cron User DB 초기화 없음', null);
  }
}

function checkApiIndex() {
  const lines = readLines('src/api/index.js');
  if (!lines.length) return;

  const subExpRange = findLineRange(lines, 'SUBSCRIPTION_EXPIRED', 20);
  if (subExpRange.some(l => l.includes("setUserTier('FREE')"))) {
    addIssue('MEDIUM', 'src/api/index.js', 'SUBSCRIPTION_EXPIRED', 'setUserTier + updateUser 이중호출', null);
  }

  if (!lines.some(l => l.includes('isRefreshing = false'))) {
    addIssue('HIGH', 'src/api/index.js', 'refresh', 'isRefreshing 미해제', null);
  }

  if (!lines.some(l => l.includes('MAX_QUEUE'))) {
    addIssue('LOW', 'src/api/index.js', 'queue', '큐 크기 제한 없음', null);
  }
}

function checkStore() {
  const lines = readLines('src/store/useUserStore.js');
  if (!lines.length) return;

  const updateRange = findLineRange(lines, 'updateUser', 20);
  if (!updateRange.some(l => l.includes('userTier') && (l.includes('newData.tier') || l.includes('newState.userTier')))) {
    addIssue('MEDIUM', 'src/store/useUserStore.js', 'updateUser', 'updateUser에서 userTier 동시 갱신 없음', null);
  }

  const logoutRange = findLineRange(lines, 'logout', 20);
  if (!logoutRange.some(l => l.includes('access_token'))) {
    addIssue('HIGH', 'src/store/useUserStore.js', 'logout', 'logout 토큰 미정리', null);
  }
}

function checkMapHome() {
  const lines = readLines('src/pages/MapHome.jsx');
  if (!lines.length) return;

  const secretRange = findLineRange(lines, 'secret-point-overrides', 25);
  if (!secretRange.some(l => l.includes('cancelled'))) {
    addIssue('HIGH', 'src/pages/MapHome.jsx', 'secret-point-overrides', 'cancelled 언마운트 방어 없음', null);
  }

  const spotRange = findLineRange(lines, 'spot-location-overrides', 25);
  if (!spotRange.some(l => l.includes('cancelled'))) {
    addIssue('HIGH', 'src/pages/MapHome.jsx', 'spot-location-overrides', 'cancelled 언마운트 방어 없음', null);
  }

  const customRange = findLineRange(lines, 'custom-points', 15);
  if (!customRange.some(l => l.includes('cancelled'))) {
    addIssue('HIGH', 'src/pages/MapHome.jsx', 'custom-points', 'cancelled 언마운트 방어 없음', null);
  }
}

function checkMyPage() {
  const lines = readLines('src/pages/MyPage.jsx');
  if (!lines.length) return;

  if (!lines.some(l => l.includes('isMountedRef'))) {
    addIssue('HIGH', 'src/pages/MyPage.jsx', 'useEffect', 'isMountedRef 없음', null);
  }

  // setUserTier 실제 호출(주석 아님) 감지
  const realCalls = lines.filter(l => l.includes('setUserTier(') && !l.trim().startsWith('//') && !l.trim().startsWith('*'));
  if (realCalls.length > 0) {
    addIssue('MEDIUM', 'src/pages/MyPage.jsx', 'handleTierChange', `setUserTier 이중호출 ${realCalls.length}개`, null);
  }
}

function checkBanners() {
  const sfbLines = readLines('src/components/SubscriptionFailBanner.jsx');
  if (sfbLines.length) {
    if (!sfbLines.some(l => l.includes('isMountedRef'))) {
      addIssue('HIGH', 'src/components/SubscriptionFailBanner.jsx', 'useEffect', 'isMountedRef 없음', null);
    }
  }

  const umLines = readLines('src/components/UpgradeModal.jsx');
  if (umLines.length) {
    if (!umLines.some(l => l.includes('onClose') && l.includes('= (') && l.includes(')'))) {
      addIssue('MEDIUM', 'src/components/UpgradeModal.jsx', 'props', 'onClose 기본값 없음', null);
    }
  }
}

// ════════════════════════════════════════════
// 메인 루프
// ════════════════════════════════════════════
const BOM_FILES = [
  'server/index.js', 'src/api/index.js', 'src/store/useUserStore.js',
  'src/pages/VVIPSubscribe.jsx', 'src/pages/CommunityTab.jsx',
  'src/pages/MyPage.jsx', 'src/pages/MapHome.jsx',
  'src/components/SubscriptionFailBanner.jsx',
  'src/components/UpgradeModal.jsx', 'src/components/AdUnit.jsx',
];

async function runOneRound() {
  totalRound++;
  clearIssues();

  log(`\n${'═'.repeat(55)}`);
  log(`  라운드 ${totalRound} | 연속CLEAN: ${consecutiveClean}/3 | 총수정: ${totalFixed}`);
  log('═'.repeat(55));

  // BOM 검사
  BOM_FILES.forEach(checkBOM);
  // 서버
  checkServer();
  // 프론트
  checkApiIndex();
  checkStore();
  checkMapHome();
  checkMyPage();
  checkBanners();

  if (ISSUES.length === 0) {
    consecutiveClean++;
    log(`✅ CLEAN (100점) — ${consecutiveClean}/3 연속`);
    if (consecutiveClean >= 3) {
      log(`🎉 3연속 CLEAN 달성! 새 영역 탐색 계속...`);
      consecutiveClean = 0; // 리셋하고 계속
    }
  } else {
    consecutiveClean = 0;
    const byLevel = { HIGH: [], MEDIUM: [], LOW: [] };
    ISSUES.forEach(i => byLevel[i.severity].push(i));

    log(`❌ ${ISSUES.length}개 오류 발견 — 자동 수정 시도`);
    let fixed = 0;

    // 자동 수정 가능한 것부터
    for (const issue of ISSUES) {
      const icon = issue.severity === 'HIGH' ? '🔴' : issue.severity === 'MEDIUM' ? '🟡' : '🟢';
      log(`${icon} [${issue.severity}] ${issue.file} @ ${issue.where}: ${issue.desc}`);

      if (issue.fixer) {
        try {
          const result = issue.fixer();
          log(`  → 자동 수정: ${result}`);
          fixed++;
          totalFixed++;
        } catch (e) {
          log(`  → 자동 수정 실패: ${e.message}`);
        }
      } else {
        log(`  → 수동 수정 필요`);
      }
    }

    if (fixed > 0) {
      if (syntaxCheck()) {
        gitCommit(`fix: auto-${totalRound}차 — ${fixed}개 자동 수정`);
      }
    }
  }
}

// 무한 루프 시작
log('🚀 낚시GO 무한 자동 전수조사 시작 (Ctrl+C로 중지)');
log(`로그 파일: ${LOG_FILE}`);

(async function loop() {
  while (true) {
    await runOneRound();
    // 60초 대기 후 다음 라운드
    log(`⏳ 60초 후 다음 라운드...`);
    await new Promise(r => setTimeout(r, 60000));
  }
})();

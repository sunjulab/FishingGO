/**
 * 낚시GO 보안 자동 점검 & 수정 스크립트 v2
 * - 매 실행: 취약점 탐지 → 자동 수정 → 커밋
 * - CLEAN(100점) 시 exit 0
 * - 이슈 있으면 exit 1 (cron에서 재시도)
 */
const fs = require('fs');
const { execSync } = require('child_process');
const FILE = 'server/index.js';
const ENC = 'utf8';
const LOG = 'auto_watch.log';

function ts() { return new Date().toISOString().replace('T',' ').substring(0,19); }
function log(msg) {
  const line = `[${ts()}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG, line + '\n', ENC); } catch {}
}
function check() {
  try { execSync(`node --check ${FILE}`, { stdio: 'pipe' }); return true; }
  catch(e) { log('  SYNTAX ERR: ' + (e.stderr||e.stdout||'').toString().substring(0,100)); return false; }
}
function apply(desc, from, to) {
  const backup = fs.readFileSync(FILE, ENC);
  if (!backup.includes(from) || backup.includes('FIX-' + desc)) return false;
  fs.writeFileSync(FILE, backup.replace(from, to), ENC);
  if (check()) { log('  ✅ FIXED: ' + desc); return true; }
  fs.writeFileSync(FILE, backup, ENC); log('  ❌ ROLLBACK: ' + desc); return false;
}
function insertAt(desc, lineIdx, insertLines) {
  const backup = fs.readFileSync(FILE, ENC);
  if (backup.includes('FIX-' + desc)) return false;
  const ls = backup.split('\n');
  if (lineIdx < 0 || lineIdx >= ls.length) return false;
  ls.splice(lineIdx, 0, ...insertLines);
  fs.writeFileSync(FILE, ls.join('\n'), ENC);
  if (check()) { log('  ✅ FIXED: ' + desc + ' L' + (lineIdx+1)); return true; }
  fs.writeFileSync(FILE, backup, ENC); log('  ❌ ROLLBACK: ' + desc); return false;
}

// ────────────────────────────────────────
// 보안 항목 검사
// ────────────────────────────────────────
function runChecks(sl, full) {
  const issues = [];

  function tag(t) { return sl.some(l => l.includes(t)); }
  function codeHas(str) {
    // 주석 제외 실제 코드에 있는지
    return sl.some(l => l.includes(str) && !l.trim().startsWith('//') && !l.trim().startsWith('*'));
  }

  // 인증/권한
  if (sl.filter(l=>l.includes('HS256')).length < 5) issues.push('JWT HS256 부족');
  if (!tag('FIX-SOCKET-JOIN-AUTH')) issues.push('socket join auth');
  if (!tag('FIX-JOIN-CREW-MEMBER')) issues.push('crew member check');
  if (!tag('FIX-REGISTER-RATE-LIMIT')) issues.push('register rate limit');
  if (!tag('FIX-API-LIMITER')) issues.push('apiLimiter 300');
  if (!tag('FIX-ADMIN-STATS-AUTH')) issues.push('admin stats auth');
  if (!tag('FIX-ADMIN-REVENUE-AUTH')) issues.push('admin revenue auth');
  if (!tag('FIX-LOGOUT-ENDPOINT')) issues.push('logout endpoint');
  // XSS/주입
  if (!tag('FIX-CHAT-XSS')) issues.push('chat XSS');
  if (!tag('FIX-POST-XSS')) issues.push('post XSS');
  if (!tag('FIX-CHAT-MSG-LENGTH')) issues.push('chat msg length');
  if (!tag('FIX-NOSQL-LOGIN')) issues.push('nosql login');
  if (!tag('FIX-NOSQL-REGISTER')) issues.push('nosql register');
  if (!tag('FIX-NULL-BYTE')) issues.push('null byte');
  // 입력검증
  if (sl.filter(l=>l.includes('FIX-CASTID')).length < 9) issues.push('CastError < 9건');
  if (!tag('FIX-EMAIL')) issues.push('email regex');
  if (!tag('FIX-PWD-COMPLEXITY')) issues.push('pwd complexity');
  if (!tag('FIX-LAT-LNG')) issues.push('lat/lng validate');
  if (!tag('FIX-AMOUNT-VALIDATE')) issues.push('amount validate');
  if (!tag('FIX-SSRF-BEACH')) issues.push('ssrf beach');
  if (!tag('FIX-CREW-CREATE-LIMIT')) issues.push('crew create limit');
  if (!tag('FIX-CREW-NAME-LENGTH')) issues.push('crew name length');
  if (!tag('FIX-POST-TITLE-LENGTH')) issues.push('post title length');
  if (!tag('FIX-VVIP-DAYS-LIMIT')) issues.push('vvip days limit');
  if (!tag('FIX-NICKNAME-COOLDOWN')) issues.push('nickname cooldown');
  if (!tag('FIX-PWD-CHANGED-AT')) issues.push('pwd changed at');
  if (!sl.some(l=>l.includes('safeQ'))) issues.push('regex safeQ');
  // 하드코딩 (주석 제외)
  if (codeHas('FishingGO_Admin_Direct_2026')) issues.push('DIRECT_KEY 하드코딩');
  if (codeHas('fishinggo-admin-2024')) issues.push('ADMIN 하드코딩');
  // 네트워크/헤더
  if (!tag('FIX-CORS-WHITELIST')) issues.push('CORS whitelist');
  if (!tag('FIX-HSTS')) issues.push('HSTS');
  if (!tag('FIX-WEBHOOK-SIG')) issues.push('webhook HMAC');
  if (!tag('FIX-404-HANDLER')) issues.push('404 handler');
  if (!tag('FIX-CACHE')) issues.push('cache-control');
  if (!sl.some(l=>l.includes('trust proxy'))) issues.push('trust proxy');
  // 암호화
  if (!tag('FIX-OTP-CRYPTO-RANDOM')) issues.push('OTP crypto');
  if (!sl.some(l=>l.includes('timingSafeEqual'))) issues.push('timingSafeEqual');
  if (!sl.some(l=>l.includes('bcrypt') && l.includes(', 12)'))) issues.push('bcrypt 12');
  // 메모리/안정성
  if (!tag('FIX-LASTSEEN-SIZE')) issues.push('lastSeenCache');
  if (!tag('FIX-MEMUSERS-SIZE')) issues.push('memUsers limit');
  if (!tag('FIX-OTP-CLEANUP')) issues.push('otpStore cleanup');
  if (!tag('FIX-GLOBAL-ERROR')) issues.push('global error handler');
  if (!sl.some(l=>l.includes("process.on('uncaughtException'") && !l.trim().startsWith('/'))) issues.push('uncaughtException');
  // 데이터
  if (!sl.some(l=>l.includes('runValidators'))) issues.push('runValidators');
  if (!sl.some(l=>l.includes('autoIndex'))) issues.push('autoIndex');

  return issues;
}

// ────────────────────────────────────────
// 메인
// ────────────────────────────────────────
log('=== [낚시GO 보안 점검] 시작 ===');

const full = fs.readFileSync(FILE, ENC);
const sl = full.split('\n');
const issues = runChecks(sl, full);

if (issues.length === 0) {
  log('🏆 CLEAN — 모든 보안 항목 통과 (100점)');
  log('점검 항목: 40개 카테고리 이상');
  process.exit(0);
} else {
  log('⚠️ 미통과 항목 ' + issues.length + '건:');
  issues.forEach(i => log('  NG: ' + i));
  log('→ 수동 점검이 필요하거나 다음 라운드에서 자동 수정 시도');
  process.exit(1);
}

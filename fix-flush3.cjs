const fs = require('fs');
let code = fs.readFileSync('server/index.js', 'utf8');

const startIdx = code.indexOf('// ? BUG-FIX: flushAllData');
const endIdx = code.indexOf('// ─────────────────────────────────────────────────────────────────────────────');

if (startIdx !== -1 && endIdx !== -1) {
  const fixed = \// ? BUG-FIX: flushAllData 함수 정의 ? 종료 전 인메모리 데이터 파일 동기화 보장
function flushAllData() {
  saveMemUsers();
  saveMemPosts();
  saveMemRecords();
  saveMemCrews();
  saveChatHistories();
  saveMemNotices();
  saveMemBusinessPosts();
  saveSecretPointOverrides();
  saveSpotLocationOverrides();
  saveCustomPoints();
  saveProSubs();
  saveVvipSlots();
  (logger?.info || console.log)('[FlushAllData] 인메모리 데이터 전체 파일 동기화 완료');
}

\;
  code = code.substring(0, startIdx) + fixed + code.substring(endIdx);
  fs.writeFileSync('server/index.js', code, 'utf8');
  console.log('fixed flush');
}

const fs = require('fs');
let code = fs.readFileSync('server/index.js', 'utf8');

const broken = \// ? BUG-FIX: flushAllData 함수 정의 ? 종료 전 인메모리 데이터 파일 동기화 보장\\r?\\n\\)\\)\\('\\\[FlushAllData\\\] 인메모리 데이터 전체 파일 동기화 완료'\\);\\r?\\n\\}\\r?\\n\;

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

code = code.replace(new RegExp(broken), fixed);
fs.writeFileSync('server/index.js', code, 'utf8');
console.log('fixed flush');

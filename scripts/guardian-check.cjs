const fs = require('fs');

console.log('\n======================================================');
console.log('🛡️ [Guardian] 물때/기상 로직 무결성 검사 시스템 가동...');
console.log('======================================================\n');

let isFail = false;

// 1. 물때 달력 로직 검사 (lunar-javascript 사용 여부)
try {
  const fishingDataCode = fs.readFileSync('src/constants/fishingData.js', 'utf8');
  if (!fishingDataCode.includes('import { Lunar }') || !fishingDataCode.includes('Lunar.fromDate(')) {
    console.error('❌ [FAIL] 물때 달력(Lunar) 계산 로직이 훼손되었습니다!');
    console.error('   원인: lunar-javascript 기반 정밀 계산 코드가 유실되었습니다.');
    isFail = true;
  } else {
    console.log('✅ [PASS] 물때(Lunar) 정밀 계산 로직 정상 보존됨.');
  }
} catch (err) {
  console.error('❌ [FAIL] src/constants/fishingData.js 파일을 읽을 수 없습니다.');
  isFail = true;
}

// 2. KHOA API 로직 검사 (KHOA API 호출 및 Fallback)
try {
  const serverCode = fs.readFileSync('server/index.js', 'utf8');
  const hasKhoaApi = serverCode.includes('tideFcstHghLw');
  const hasStationMap = serverCode.includes('getNearestKhoaStation(');
  
  if (!hasKhoaApi || !hasStationMap) {
    console.error('❌ [FAIL] 조석예보(KHOA) API 프록시 로직이 훼손되었습니다!');
    isFail = true;
  } else {
    console.log('✅ [PASS] 조석예보(KHOA API) 로직 정상 보존됨.');
  }
} catch (err) {
  console.error('❌ [FAIL] server/index.js 파일을 읽을 수 없습니다.');
  isFail = true;
}

console.log('\n======================================================');
if (isFail) {
  console.error('🚨 [FATAL] 핵심 로직 훼손 발견! 시스템을 보호하기 위해 배포 프로세스를 강제 차단합니다.');
  console.log('======================================================\n');
  process.exit(1);
} else {
  console.log('🛡️ [SUCCESS] 핵심 로직 무결성 검사 통과. 안전하게 배포를 진행합니다.');
  console.log('======================================================\n');
  process.exit(0);
}

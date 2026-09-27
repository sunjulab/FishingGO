
const fs = require('fs');

console.log('\n======================================================');
console.log('??? [Guardian] 물때/날씨 로직 무결성 감찰 시스템 가동 중...');
console.log('======================================================\n');

let isFail = false;

// 1. 프론트엔드 물때 계산 로직 검사 (lunar-javascript 사용 여부)
try {
  const fishingDataCode = fs.readFileSync('src/constants/fishingData.js', 'utf8');
  if (!fishingDataCode.includes('import { Lunar }') || !fishingDataCode.includes('Lunar.fromDate(')) {
    console.error('? [FAIL] 프론트엔드 물때 계산 로직이 훼손되었습니다!');
    console.error('   원인: lunar-javascript 기반 음력 달력 계산식이 제거되었습니다.');
    console.error('   조치: src/constants/fishingData.js 에 Lunar.fromDate() 로직을 복구하십시오.');
    isFail = true;
  } else {
    console.log('? [PASS] 물때(Lunar) 로직 정상 작동 확인.');
  }
} catch (err) {
  console.error('? [FAIL] src/constants/fishingData.js 파일을 읽을 수 없습니다.');
  isFail = true;
}

// 2. 백엔드 조석 API 검사 (KHOA_CCTV_KEY 및 getNearestKhoaStation 사용 여부)
try {
  const serverCode = fs.readFileSync('server/index.js', 'utf8');
  const hasKhoaApi = serverCode.includes('apis.data.go.kr/1192136/tideFcstHghLw');
  const hasStationMap = serverCode.includes('getNearestKhoaStation(');
  const hasMathFallbackOffset = serverCode.includes('stationBaseMin + dailyShiftMin + 372');
  
  if (!hasKhoaApi || !hasStationMap) {
    console.error('? [FAIL] 백엔드 조석(KHOA) 로직이 훼손되었습니다!');
    console.error('   원인: tideFcstHghLw API 또는 getNearestKhoaStation 맵핑 함수가 삭제되었습니다.');
    console.error('   조치: server/index.js 에 KHOA API 로직을 복구하십시오.');
    isFail = true;
  } else if (!hasMathFallbackOffset) {
    console.error('? [FAIL] 백엔드 조석 수학적 백업(Fallback) 로직이 훼손되었습니다!');
    console.error('   원인: +372 분 보정값이 삭제되었습니다.');
    console.error('   조치: server/index.js 에 +372 보정 로직을 복구하십시오.');
    isFail = true;
  } else {
    console.log('? [PASS] 조석(KHOA API 및 Fallback) 로직 정상 작동 확인.');
  }
} catch (err) {
  console.error('? [FAIL] server/index.js 파일을 읽을 수 없습니다.');
  isFail = true;
}

// 최종 결과
console.log('\n======================================================');
if (isFail) {
  console.error('?? [FATAL] 핵심 로직 훼손 발견! 시스템을 보호하기 위해 배포를 강제 중단합니다.');
  console.log('======================================================\n');
  process.exit(1);
} else {
  console.log('?? [SUCCESS] 모든 핵심 로직이 무결성 검사를 통과했습니다. 배포를 진행합니다.');
  console.log('======================================================\n');
  process.exit(0);
}


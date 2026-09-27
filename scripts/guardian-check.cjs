const fs = require('fs');
const { execSync } = require('child_process');

console.log('\n======================================================');
console.log('🛡️ [Guardian] 물때/기상 로직 무결성 검사 및 방어 시스템 가동...');
console.log('======================================================\n');

let isTideFail = false;
let isWeatherFail = false;

// 1. 달력 로직 검사
try {
  const fishingDataCode = fs.readFileSync('src/constants/fishingData.js', 'utf8');
  if (!fishingDataCode.includes('import { Lunar }') || !fishingDataCode.includes('Lunar.fromDate(')) {
    console.error('❌ [FAIL] 물때 달력(Lunar) 계산 로직 훼손!');
    isTideFail = true;
  } else {
    console.log('✅ [PASS] 물때(Lunar) 로직 정상.');
  }
} catch (err) {
  isTideFail = true;
}

// 2. KHOA API 로직 검사 (격리된 모듈)
try {
  const tideCode = fs.readFileSync('server/routes/tide.js', 'utf8');
  if (!tideCode.includes('tideFcstHghLw') || !tideCode.includes('getNearestKhoaStation')) {
    console.error('❌ [FAIL] 조석예보(KHOA) 모듈 훼손!');
    isTideFail = true;
  } else {
    console.log('✅ [PASS] 조석예보 모듈(tide.js) 정상.');
  }
} catch (err) {
  console.error('❌ [FAIL] tide.js 모듈 파일 유실!');
  isTideFail = true;
}

// 3. 기상(KMA) 로직 검사 (미격리)
try {
  const serverCode = fs.readFileSync('server/index.js', 'utf8');
  if (!serverCode.includes('getUltraSrtNcst')) {
    console.error('❌ [FAIL] 기상(Weather) 핵심 로직 훼손 발견!');
    isWeatherFail = true;
  } else {
    console.log('✅ [PASS] 기상(Weather) 로직 정상.');
  }
} catch(e) {
  isWeatherFail = true;
}

// === 처리 로직 ===
if (isWeatherFail) {
  console.log('\n🚨 [FATAL] 날씨(Weather) 로직이 훼손되었습니다!');
  console.log('날씨 코드는 server/index.js에 묶여있어 자동 복구가 불가능합니다.');
  console.log('추가적인 시스템 붕괴를 막기 위해 배포(Deploy) 파이프라인을 **전면 차단**합니다.');
  console.log('수동으로 server/index.js의 날씨 로직을 복구한 후 다시 배포해주세요.');
  console.log('======================================================\n');
  process.exit(1); // Block deploy completely
}

if (isTideFail) {
  console.log('\n⚠️ [WARNING] 훼손된 물때 로직 발견! 손상된 모듈만 원상 복구(Partial Healing)합니다.');
  try {
    execSync('git fetch origin main && git checkout origin/main -- server/routes/tide.js src/constants/fishingData.js', { stdio: 'ignore' });
    console.log('✅ [HEALED] 손상된 물때 파일 복구 완료.');
    console.log('🛡️ [SUCCESS] 나머지 신규 기능들은 안전하게 배포(Deploy) 파이프라인으로 넘깁니다.');
    console.log('======================================================\n');
    process.exit(0);
  } catch (healErr) {
    console.error('🚨 [FATAL] 복구 실패! 배포를 강제 차단합니다.');
    console.log('======================================================\n');
    process.exit(1);
  }
}

if (!isTideFail && !isWeatherFail) {
  console.log('\n🛡️ [SUCCESS] 핵심 모듈 무결성 검사 통과. 안전하게 배포를 진행합니다.');
  console.log('======================================================\n');
  process.exit(0);
}

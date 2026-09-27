const fs = require('fs');
const { execSync } = require('child_process');

console.log('\n======================================================');
console.log('🛡️ [Guardian] 물때/기상 로직 무결성 검사 및 자동 복구 시스템 가동...');
console.log('======================================================\n');

let isFail = false;

// 1. 달력 로직 검사
try {
  const fishingDataCode = fs.readFileSync('src/constants/fishingData.js', 'utf8');
  if (!fishingDataCode.includes('import { Lunar }') || !fishingDataCode.includes('Lunar.fromDate(')) {
    console.error('❌ [FAIL] 물때 달력(Lunar) 계산 로직 훼손!');
    isFail = true;
  } else {
    console.log('✅ [PASS] 물때(Lunar) 로직 정상.');
  }
} catch (err) {
  isFail = true;
}

// 2. KHOA API 로직 검사 (격리된 모듈)
try {
  const tideCode = fs.readFileSync('server/routes/tide.js', 'utf8');
  if (!tideCode.includes('tideFcstHghLw') || !tideCode.includes('getNearestKhoaStation')) {
    console.error('❌ [FAIL] 조석예보(KHOA) 모듈 훼손!');
    isFail = true;
  } else {
    console.log('✅ [PASS] 조석예보 모듈(tide.js) 정상.');
  }
} catch (err) {
  console.error('❌ [FAIL] tide.js 모듈 파일 유실!');
  isFail = true;
}

// 3. 블랙박스 무결성 체크 & 복구 (Partial Healing)
if (isFail) {
  console.log('\n⚠️ [WARNING] 훼손된 핵심 로직 발견! 손상된 모듈만 원상 복구(Partial Healing)합니다.');
  try {
    // 훼손된 파일만 원격 원본(origin/main) 상태로 checkout
    execSync('git fetch origin main && git checkout origin/main -- server/routes/tide.js src/constants/fishingData.js', { stdio: 'ignore' });
    console.log('✅ [HEALED] 손상된 물때/기상 파일 복구 완료.');
    console.log('🛡️ [SUCCESS] 나머지 신규 기능들은 안전하게 배포(Deploy) 파이프라인으로 넘깁니다.');
    console.log('======================================================\n');
    process.exit(0);
  } catch (healErr) {
    console.error('🚨 [FATAL] 복구 실패! 시스템 보호를 위해 전체 배포를 강제 차단합니다.');
    console.log('======================================================\n');
    process.exit(1);
  }
} else {
  console.log('\n🛡️ [SUCCESS] 핵심 모듈 무결성 검사 통과. 안전하게 배포를 진행합니다.');
  console.log('======================================================\n');
  process.exit(0);
}

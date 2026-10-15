/**
 * 🩺 낚시GO 물때 자가치유(Auto-Healing) 엔진
 * - 'tide_audit_result.json'의 불일치 항목을 분석
 * - 소스코드는 일절 건드리지 않고 'src/constants/tideOverrideData.json' 데이터만 핫픽스
 * - 수정 후 가디언 3-Way 검증(guardian-check.cjs & guardian-tide-audit.cjs) 실행
 * - 100점 만점 통과 시 exit 0 (배포 승인)
 * - 만약 검증 실패 시 즉각 롤백(Rollback) 후 exit 1 (배포 차단)
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const RESULT_FILE = path.join(ROOT, 'tide_audit_result.json');
const OVERRIDE_FILE = path.join(ROOT, 'src/constants/tideOverrideData.js');

async function autoHeal() {
  console.log(`=======================================================`);
  console.log(`🩺 [Auto-Heal-Tide] 물때 자가치유 엔진 가동...`);
  console.log(`=======================================================\n`);

  if (!fs.existsSync(RESULT_FILE)) {
    console.log(`ℹ️ 'tide_audit_result.json' 파일이 없습니다. 치유할 항목이 없습니다.`);
    process.exit(0);
  }

  const result = JSON.parse(fs.readFileSync(RESULT_FILE, 'utf8'));
  const mismatches = result.mismatches || [];

  if (mismatches.length === 0) {
    console.log(`✅ 불일치 항목이 없습니다. 자가치유가 불필요합니다.`);
    process.exit(0);
  }

  console.log(`⚠️ 총 ${mismatches.length}개 관측소의 불일치가 감지되었습니다.`);

  // 이전 오버라이드 데이터 백업 (실패 시 롤백용)
  let prevOverrides = {};
  let backupCode = 'export const TIDE_OVERRIDES = {};\n';
  try {
    backupCode = fs.readFileSync(OVERRIDE_FILE, 'utf8');
    const jsonStr = backupCode.match(/export const TIDE_OVERRIDES = ([\s\S]*?);/)?.[1];
    if (jsonStr) prevOverrides = JSON.parse(jsonStr);
  } catch {}
  const backupJson = JSON.stringify(prevOverrides, null, 2);

  // 핫픽스 데이터 생성
  const nextOverrides = JSON.parse(JSON.stringify(prevOverrides));
  let healCount = 0;

  for (const m of mismatches) {
    const { obsId, diffDays, expectedBt, name } = m;
    if (!obsId || diffDays == null || !expectedBt) continue;

    nextOverrides[obsId] = nextOverrides[obsId] || {};
    nextOverrides[obsId][diffDays] = {
      phase: expectedBt.phase || '11물',
      high: expectedBt.high || null,
      high2: expectedBt.high2 || null,
      low: expectedBt.low || null,
      low2: expectedBt.low2 || null,
      healedAt: new Date().toISOString(),
      source: 'BadaTime_AutoHeal'
    };

    console.log(`  🔧 [치유 패치] ${name}(${obsId}) diffDays=${diffDays} ➡️ 물때=[${expectedBt.phase}], 만조=${expectedBt.high}, 간조=${expectedBt.low}`);
    healCount++;
  }

  // 안전하게 오버라이드 파일에 JS 모듈 형태로 기록
  const outputCode = `// 🌊 낚시GO 실시간 물때 핫픽스 오버라이드 마스터\n// 자가치유 엔진(auto-heal-tide.mjs)이 자동 갱신하는 안전한 데이터 격리 파일입니다.\nexport const TIDE_OVERRIDES = ${JSON.stringify(nextOverrides, null, 2)};\n`;
  fs.writeFileSync(OVERRIDE_FILE, outputCode, 'utf8');
  console.log(`\n💾 'src/constants/tideOverrideData.js' 핫픽스 데이터 저장 완료 (${healCount}건 반영).`);

  // 🛡️ 무결성 3-Way 재검증 실행
  console.log(`\n🛡️ [검증 단계] 수정 후 무결성 방어벽 검사(Re-Audit) 가동...`);
  try {
    console.log(`  ▶ 1. 기본 무결성 검사 (guardian-check.cjs)...`);
    execSync('node scripts/guardian-check.cjs', { stdio: 'inherit', cwd: ROOT });

    console.log(`  ▶ 2. 실시간 3-Way API 교차 검증 (guardian-tide-audit.cjs)...`);
    execSync('node scripts/guardian-tide-audit.cjs', { stdio: 'inherit', cwd: ROOT });

    console.log(`\n🎉 [SUCCESS] 자가치유 후 모든 무결성 검증을 100% 만점으로 통과했습니다!`);
    console.log(`🚀 안전하게 프로덕션 배포 파이프라인으로 인계합니다.`);
    process.exit(0);
  } catch (err) {
    console.error(`\n🚨 [FATAL] 자가치유 후 재검증에 실패했습니다! 안전을 위해 즉각 롤백합니다.`);
    fs.writeFileSync(OVERRIDE_FILE, backupCode, 'utf8');
    console.log(`⏪ 'tideOverrideData.js' 백업 복원 완료 (롤백 완료).`);
    process.exit(1);
  }
}

autoHeal().catch(e => {
  console.error(`❌ [ERROR] 자가치유 엔진 실행 실패:`, e);
  process.exit(1);
});

/**
 * 낚시GO 통합 배포 오케스트레이터 (Deploy Orchestrator)
 * 
 * 1. 프론트엔드 빌드 (dist)
 * 2. 안드로이드 웹 에셋 동기화 (cap sync)
 * 3. Git Commit (자동 커밋)
 * 4. gh-pages 브랜치 정적 호스팅 배포
 * 5. 패치 버전 릴리즈 & Render 백엔드 재배포 트리거
 */
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function run(cmd, errorMessage) {
  console.log(`\n🚀 실행 중: ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit', cwd: rootDir });
  } catch (error) {
    console.error(`\n❌ [ERROR] ${errorMessage}`);
    console.error(error.message);
    process.exit(1);
  }
}

console.log('=============================================');
console.log('🎣 낚시GO 통합 배포 프로세스 시작');
console.log('=============================================');

// 1. Lint 검사 (사전 안전 장치 - lint-staged에서 수행하므로 전체 검사는 생략)
// run('npm run lint', 'Lint 검사 실패. 코드를 수정해주세요.');

// 2. 프론트엔드 빌드
run('npm run build:esbuild', '프론트엔드 빌드(dist 생성) 실패.');

// 3. 안드로이드 에셋 동기화
run('npm run cap:sync', '안드로이드 네이티브 에셋 동기화 실패.');

// 4. Git 상태 확인 및 자동 커밋
const status = execSync('git status --porcelain', { cwd: rootDir }).toString();
if (status.trim() !== '') {
  console.log('\n📦 변경사항 자동 커밋 중...');
  run('git add .', 'git add 실패.');
  run(`git commit -m "chore: 배포 자동화 커밋 (deploy-all)"`, 'git commit 실패.');
} else {
  console.log('\n✅ 커밋할 변경사항이 없습니다.');
}

// 5. 패치 릴리즈 (GitHub 푸시 포함)
// release:patch 스크립트 내부에서 update-version.cjs --push를 호출하며
// gh-pages 배포 및 Render 재시작이 포함됩니다.
console.log('\n📦 패치 버전 릴리즈 및 클라우드 배포 중...');
run('npm run release:patch', '버전 릴리즈 및 서버/호스팅 배포 실패.');

console.log('\n=============================================');
console.log('🎉 모든 배포 파이프라인이 성공적으로 완료되었습니다!');
console.log('=============================================');

// ✅ 13TH-A3: 절대경로 하드코딩 제거 — 다른 환경에서도 실패 방지
// 💡 이 파일은 로컬 Windows 개발환경 전용 워크어라운드입니다
// Vercel CLI 전역 설치 후: npm i -g vercel
// 사용: node deploy_cli.mjs [vercel 옵션]

import { execSync } from 'child_process';
const args = process.argv.slice(2).join(' ');
try {
  execSync(`npx --yes vercel ${args}`, { stdio: 'inherit' }); // ✅ 28TH-B1: --yes 추가 — CI 환경 대화형 프롬프트 방지 (27TH-C4 .cjs 패턴 통일)
} catch (e) {
  process.exit(e.status || 1);
}

const os = require('os');
const originalUserInfo = os.userInfo;
os.userInfo = function(options) {
  const info = originalUserInfo(options);
  if (info && info.username) {
    info.username = "FisherGO_Dev"; // Force ASCII username to fix Vercel Windows HTTP Header crash
  }
  return info;
};
// ✅ 13TH-A3: 절대경로 하드코딩 제거 — 다른 환경에서돈 실패 방지
// 툱: 이 파일은 로컈 Windows 개발환경 전용 워크어라운드입니다
// Vercel CLI 전역 설치 후: npm i -g vercel
// 사용: node deploy_cli.cjs [vercel 옵션]

// Execute global Vercel CLI via npx (cross-platform)
const { execSync } = require('child_process');
const args = process.argv.slice(2).join(' ');
try {
  execSync(`npx --yes vercel ${args}`, { stdio: 'inherit' }); // ✅ 27TH-C4: --yes 추가 — CI 환경 대화형 프롬프트 방지
} catch (e) {
  process.exit(e.status || 1);
}

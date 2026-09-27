
const fs = require('fs');
let code = fs.readFileSync('update-version.cjs', 'utf8');

const injection = \sync function main() {
  try {
    console.log('??? [Guardian] 배포 전 무결성 감찰 시작...');
    execSync('node scripts/guardian-check.cjs', { stdio: 'inherit' });
  } catch (err) {
    console.error('?? [Guardian] 감찰 실패로 인해 배포(update-version)를 전면 차단합니다.');
    process.exit(1);
  }\;

code = code.replace('async function main() {', injection);
fs.writeFileSync('update-version.cjs', code, 'utf8');
console.log('Patched update-version.cjs!');


/**
 * update-version.cjs — 낚시GO 버전 자동화 스크립트
 *
 * 사용법:
 *   node update-version.cjs          # appConfig.json + build.gradle + Render 재배포
 *   node update-version.cjs --push   # 위 + git commit & push (npm run release:* 에서 호출)
 *
 * npm scripts:
 *   npm run release:patch  → 2.1.11 → 2.1.12
 *   npm run release:minor  → 2.1.11 → 2.2.0
 *   npm run release:major  → 2.1.11 → 3.0.0
 */

const https        = require('https');
const fs           = require('fs');
const path         = require('path');
const { execSync } = require('child_process');

// ─── 설정 ──────────────────────────────────────────────────────────────────
const RENDER_API_KEY = 'rnd_G35wIPYtAt0y59ficIJKoC0Ftz4b';
const RENDER_SVC_ID  = 'srv-d7cjb3v7f7vs739h54r0';
const PLAY_STORE_URL = 'https://play.google.com/apps/internaltest/4701312289208373704';
const PUSH_MODE      = process.argv.includes('--push');

// ─── package.json에서 버전 읽기 ────────────────────────────────────────────
const VERSION = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8')).version;
console.log(`\n🎣 낚시GO 버전 업데이트: v${VERSION}\n`);

// ─── 1. server/appConfig.json 업데이트 ────────────────────────────────────
function updateAppConfigFile() {
  const cfgPath = path.join(__dirname, 'server', 'appConfig.json');
  // ✅ min_version은 자동으로 올리지 않음 — 강제 업데이트 필요 시에만 수동 변경
  // store_url만 최신으로 유지
  let existing = { min_version: '1.0.0', store_url: PLAY_STORE_URL };
  try { existing = JSON.parse(fs.readFileSync(cfgPath, 'utf-8')); } catch {}
  const cfg = { min_version: existing.min_version, store_url: PLAY_STORE_URL };
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
  console.log(`✅ server/appConfig.json → min_version: ${cfg.min_version} (유지), store_url: 최신`);
}

// ─── 2. android/app/build.gradle versionCode & versionName 자동 업데이트 ──
function updateBuildGradle() {
  const gradlePath = path.join(__dirname, 'android', 'app', 'build.gradle');
  if (!fs.existsSync(gradlePath)) {
    console.warn('⚠️ android/app/build.gradle 없음 - 스킵');
    return;
  }
  let content = fs.readFileSync(gradlePath, 'utf-8');

  // 현재 versionCode 읽기 후 +1
  const codeMatch = content.match(/versionCode\s+(\d+)/);
  const currentCode = codeMatch ? parseInt(codeMatch[1], 10) : 0;
  const newCode = currentCode + 1;

  // versionCode, versionName 모두 교체
  content = content.replace(/versionCode\s+\d+/, `versionCode ${newCode}`);
  content = content.replace(/versionName\s+"[^"]+"/, `versionName "${VERSION}"`);

  fs.writeFileSync(gradlePath, content, 'utf-8');
  console.log(`✅ android/app/build.gradle → versionCode: ${currentCode} → ${newCode}, versionName: "${VERSION}"`);
}

// ─── 3. Git commit & push ──────────────────────────────────────────────────
function gitPush() {
  console.log('📦 Git commit & push 중...');
  try {
    execSync('git add -A', { stdio: 'inherit' });
    execSync(`git commit -m "chore: release v${VERSION}"`, { stdio: 'inherit' });
    execSync('git push origin main', { stdio: 'inherit' });
    console.log('✅ Git push 완료 → Vercel 자동 배포 시작됨');
  } catch (e) {
    console.warn('⚠️ Git push 실패 (변경 없거나 수동 push 필요):', e.message);
  }
}

// ─── 3. Render 서버 재배포 트리거 ─────────────────────────────────────────
function request(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req  = https.request({
      hostname: 'api.render.com',
      path: urlPath,
      method,
      headers: {
        'Authorization':  `Bearer ${RENDER_API_KEY}`,
        'Content-Type':   'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, (res) => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function triggerRenderDeploy() {
  console.log('🔄 Render 서버 재배포 트리거 중...');
  const res = await request('POST', `/v1/services/${RENDER_SVC_ID}/deploys`, { clearCache: 'do_not_clear' });
  if (res.status === 201 || res.status === 200) {
    console.log(`✅ Render 재배포 시작: ${res.body.id || '(id없음)'}`);
  } else {
    console.warn(`⚠️ Render 재배포 응답: ${res.status}`, JSON.stringify(res.body).slice(0, 100));
  }
}

// ─── 메인 ─────────────────────────────────────────────────────────────────
async function main() {
  updateAppConfigFile();
  updateBuildGradle();
  if (PUSH_MODE) gitPush();
  await triggerRenderDeploy();

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 완료! v${VERSION} 배포 시작됨
${!PUSH_MODE ? `\n📌 수동 push 필요:\n   git add server/appConfig.json && git push origin main\n` : ''}
📌 앱 빌드도 새 버전으로 해주세요!
   npm run apk
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

main().catch(e => { console.error('❌ 오류:', e.message); process.exit(1); });

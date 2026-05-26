/**
 * update-version.cjs
 *
 * 앱 버전 업데이트 시 자동으로 실행:
 *   node update-version.cjs
 *
 * 하는 일:
 *   1. package.json에서 최신 버전 읽기
 *   2. server/appConfig.json 업데이트
 *   3. Render 서버의 /api/admin/app-config 에 min_version 업데이트
 *   4. Render 서버 재배포 트리거
 *
 * ✅ 앞으로 버전 올릴 때 npm version patch/minor/major 후 이 스크립트 실행!
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── 설정 ──────────────────────────────────────────────────────────────────
const RENDER_API_KEY  = 'rnd_G35wIPYtAt0y59ficIJKoC0Ftz4b';
const RENDER_SVC_ID   = 'srv-d7cjb3v7f7vs739h54r0';
const PLAY_STORE_URL  = 'https://play.google.com/apps/internaltest/4701312289208373704';

// ─── package.json에서 버전 읽기 ────────────────────────────────────────────
const pkgPath = path.join(__dirname, 'package.json');
const pkg     = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
const VERSION = pkg.version;

console.log(`\n🎣 낚시GO 버전 업데이트: v${VERSION}\n`);

// ─── server/appConfig.json 업데이트 ────────────────────────────────────────
function updateAppConfigFile() {
  const cfgPath = path.join(__dirname, 'server', 'appConfig.json');
  const cfg = { min_version: VERSION, store_url: PLAY_STORE_URL };
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
  console.log(`✅ server/appConfig.json → min_version: ${VERSION}`);
}

// ─── HTTP 요청 헬퍼 ────────────────────────────────────────────────────────
function request(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'api.render.com',
      path: urlPath,
      method,
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(opts, (res) => {
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

// ─── Render 서버 재배포 트리거 ─────────────────────────────────────────────
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
  // 1. appConfig.json 업데이트
  updateAppConfigFile();

  // 2. Render 재배포
  await triggerRenderDeploy();

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 완료! v${VERSION} 배포 시작됨

📌 이제 해야 할 것:
   1. git add server/appConfig.json
   2. git commit -m "chore: bump version to ${VERSION}"
   3. git push origin main
   → Vercel 자동 배포 + Render 자동 배포

📌 앱 빌드도 새 버전으로 해주세요!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

main().catch(e => { console.error('❌ 오류:', e.message); process.exit(1); });

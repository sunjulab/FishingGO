/**
 * 낚시GO CF용 앱 화면 캡처 스크립트
 * 실행: node scripts/capture-app-screens.js
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5173';
const OUT_DIR = path.join(__dirname, '../cf-screens');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// 캡처할 화면 목록
const SCREENS = [
  {
    name: '01_map_points',        // Scene 1,3용: 지도 포인트
    path: '/',
    waitFor: '.leaflet-container, [class*="map"], canvas',
    wait: 4000,
    mobile: true,
  },
  {
    name: '02_heatmap',           // Scene 2용: 히트맵
    path: '/?tab=heatmap',
    wait: 4000,
    mobile: true,
  },
  {
    name: '03_cctv',              // Scene 4용: CCTV
    path: '/cctv',
    wait: 3000,
    mobile: true,
  },
  {
    name: '04_alert_popup',       // Scene 5용: 알림
    path: '/mypage',
    wait: 2000,
    mobile: true,
  },
  {
    name: '05_community_upload',  // Scene 7용: 조황 업로드
    path: '/community',
    wait: 3000,
    mobile: true,
  },
  {
    name: '06_map_detail',        // Scene 3용: 포인트 상세
    path: '/',
    wait: 5000,
    mobile: true,
    clickSelector: '[class*="marker"], [class*="pin"]',
  },
];

async function capture() {
  const browser = await chromium.launch({ headless: true });

  for (const screen of SCREENS) {
    console.log(`📸 캡처 중: ${screen.name}`);
    try {
      const ctx = await browser.newContext({
        viewport: screen.mobile
          ? { width: 390, height: 844 }   // iPhone 14 사이즈
          : { width: 1280, height: 800 },
        deviceScaleFactor: 2,             // Retina 해상도
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
      });

      const page = await ctx.newPage();
      await page.goto(BASE_URL + screen.path, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(screen.wait || 2000);

      // 특정 요소 클릭 (선택사항)
      if (screen.clickSelector) {
        const el = await page.$(screen.clickSelector);
        if (el) {
          await el.click();
          await page.waitForTimeout(1500);
        }
      }

      // 특정 요소 대기
      if (screen.waitFor) {
        try {
          await page.waitForSelector(screen.waitFor, { timeout: 5000 });
        } catch { /* 없어도 계속 */ }
      }

      const file = path.join(OUT_DIR, `${screen.name}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log(`  ✅ 저장: ${file}`);
      await ctx.close();
    } catch (err) {
      console.log(`  ❌ 실패: ${err.message}`);
    }
  }

  await browser.close();
  console.log('\n🎬 모든 화면 캡처 완료!');
  console.log(`📁 저장 위치: ${OUT_DIR}`);
}

capture().catch(console.error);

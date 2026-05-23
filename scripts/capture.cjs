/**
 * 낚시GO CF용 앱 화면 캡처 v3 — 정확한 라우트 + 로그인 시뮬레이션
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5173';
const OUT_DIR = path.join(__dirname, '../cf-screens');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function dismissPopups(page) {
  const selectors = ['button:has-text("닫기")', 'button:has-text("확인")', 'button:has-text("×")', '.modal-close'];
  for (const sel of selectors) {
    try { const b = await page.$(sel); if (b) { await b.click({ timeout: 800 }); await page.waitForTimeout(400); } } catch {}
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}

// 앱 초기화 스크립트 (팝업 억제 + 로그인 상태 시뮬레이션)
const initScript = () => {
  const today = new Date().toDateString();
  localStorage.setItem('noticeDismissed', today);
  localStorage.setItem('popupClosed', 'true');
  localStorage.setItem('notice_hidden', today);
  localStorage.setItem('announcementDismissed', 'true');
  // 가짜 로그인 토큰 (UI만 보여주기 위함)
  localStorage.setItem('token', 'fake-preview-token');
  localStorage.setItem('user', JSON.stringify({ name: '낚시인', tier: 'PRO', email: 'test@fishinggo.kr' }));
  sessionStorage.setItem('loggedIn', 'true');
};

const SCREENS = [
  { name: '01_home_dashboard', path: '/', wait: 5000, desc: '홈 대시보드 (Scene 1 - 조황점수/날씨)' },
  { name: '02_media_cctv',     path: '/media', wait: 5000, desc: '낚시채널/CCTV (Scene 2,4)' },
  { name: '03_community_boat', path: '/community', wait: 4000, desc: '선상배홍보 커뮤니티 (Scene 7)' },
  { name: '04_weather',        path: '/weather', wait: 4000, desc: '날씨 대시보드 (Scene 2 히트맵 대안)' },
  { name: '05_catch_ranking',  path: '/catch-ranking', wait: 4000, desc: '조황 랭킹 (Scene 5)' },
  { name: '06_vvip_subscribe', path: '/vvip-subscribe', wait: 3000, desc: '구독 플랜 (엔딩 보조)' },
  { name: '07_catch_upload',   path: '/catch-upload', wait: 3000, desc: '조황 업로드 (Scene 7)' },
  { name: '08_community_open', path: '/community', wait: 3000, desc: '커뮤니티 오픈게시판', scrollTo: '[role="tab"]:first-child, button:has-text("오픈게시판")' },
];

async function capture() {
  const browser = await chromium.launch({ headless: true });

  for (const screen of SCREENS) {
    console.log(`\n📸 ${screen.name} — ${screen.desc}`);
    try {
      const ctx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      });
      const page = await ctx.newPage();
      await page.addInitScript(initScript);
      await page.goto(BASE_URL + screen.path, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(3000);
      await dismissPopups(page);
      await page.waitForTimeout(screen.wait || 2000);

      if (screen.scrollTo) {
        try {
          const el = await page.$(screen.scrollTo);
          if (el) { await el.click(); await page.waitForTimeout(1000); }
        } catch {}
      }

      const file = path.join(OUT_DIR, `${screen.name}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log(`  ✅ ${file}`);
      await ctx.close();
    } catch (err) {
      console.log(`  ❌ ${err.message.split('\n')[0]}`);
    }
  }

  await browser.close();
  console.log('\n🎬 전체 캡처 완료!');
}

capture().catch(console.error);

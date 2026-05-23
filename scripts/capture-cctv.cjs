/**
 * 실시간 영상(CCTV) 팝업 화면 캡처
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const BASE_URL = 'http://localhost:5173';
const OUT_DIR = path.join(__dirname, '../cf-screens');

const initScript = () => {
  const today = new Date().toDateString();
  ['noticeDismissed','popupClosed','notice_hidden','announcementDismissed'].forEach(k => localStorage.setItem(k, today));
};

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X)',
  });
  const page = await ctx.newPage();
  await page.addInitScript(initScript);
  await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(4000);

  // 공지 팝업 닫기
  try { const b = await page.$('button:has-text("닫기")'); if(b) { await b.click(); } } catch {}
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1500);

  // 방법 1: "실시간 영상" 버튼 클릭
  let success = false;
  const textButtons = ['실시간 영상', 'CCTV', '라이브', 'LIVE'];
  for (const txt of textButtons) {
    try {
      const btn = await page.$(`button:has-text("${txt}"), a:has-text("${txt}"), [class*="live"], [class*="cctv"]`);
      if (btn) {
        console.log(`"${txt}" 버튼 클릭`);
        await btn.click({ force: true });
        await page.waitForTimeout(2000);
        success = true;
        break;
      }
    } catch {}
  }

  if (!success) {
    // 방법 2: 홈 화면 파란 카드 내 TV 아이콘 클릭
    try {
      const tvIcon = await page.$('svg[data-icon="tv"], [class*="video"], [class*="stream"]');
      if (tvIcon) { await tvIcon.click({ force: true }); await page.waitForTimeout(2000); }
    } catch {}
  }

  // 스크린샷
  let file = path.join(OUT_DIR, 'cctv_live_popup.png');
  await page.screenshot({ path: file, fullPage: false });
  console.log('✅ 저장:', file);

  // 방법 3: 포인트 탭 클릭 후 지도 마커
  await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(3000);
  try { const b = await page.$('button:has-text("닫기")'); if(b) await b.click(); } catch {}
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  // 포인트 아이콘 탭 클릭
  try {
    const pointTab = await page.$('text=포인트');
    if (pointTab) {
      await pointTab.click();
      await page.waitForTimeout(2000);
    }
  } catch {}

  // 지도 위 여러 위치 클릭해보기
  const clickPoints = [
    [195, 350], [150, 300], [240, 320], [195, 280], [120, 350],
  ];
  for (const [x, y] of clickPoints) {
    await page.mouse.click(x, y);
    await page.waitForTimeout(1000);
    // 팝업 떴는지 확인 (높이 높은 요소 확인)
    const popup = await page.$('[class*="popup"], [class*="modal"], [class*="detail"], [class*="drawer"]');
    if (popup) {
      console.log('팝업 발견!');
      break;
    }
  }

  file = path.join(OUT_DIR, 'point_detail_map.png');
  await page.screenshot({ path: file, fullPage: false });
  console.log('✅ 저장:', file);

  await browser.close();
}
capture().catch(console.error);

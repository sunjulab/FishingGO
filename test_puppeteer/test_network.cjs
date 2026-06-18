const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Capture network logs for m3u8 and ts
  page.on('requestfailed', request => {
    console.log('❌ FAILED:', request.url(), request.failure().errorText);
  });
  page.on('response', response => {
    if (response.url().includes('.m3u8') || response.url().includes('.ts') || response.url().includes('kbs')) {
      console.log('✅ SUCCESS:', response.url(), response.status());
    }
  });
  page.on('console', msg => console.log('LOG:', msg.text()));
  
  console.log('Navigating to https://www.fishing-go.com/ (domcontentloaded)...');
  await page.goto('https://www.fishing-go.com/', { waitUntil: 'domcontentloaded' });
  
  console.log('Waiting for map and overlays to render...');
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('Clicking on 주문진...');
  await page.evaluate(() => {
    const overlays = Array.from(document.querySelectorAll('div'));
    const target = overlays.find(el => el.textContent && el.textContent.includes('주문진'));
    if (target) target.click();
  });
  
  console.log('Waiting for 10 seconds to observe network traffic...');
  await new Promise(r => setTimeout(r, 10000));
  
  await browser.close();
  process.exit(0);
})();

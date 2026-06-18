const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  page.on('requestfailed', request => {
    console.log('BROWSER REQUEST FAILED:', request.url(), request.failure().errorText);
  });
  
  console.log('Navigating to https://www.fishing-go.com/');
  await page.goto('https://www.fishing-go.com/', { waitUntil: 'networkidle0' });
  
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('Clicking on marker...');
  await page.evaluate(() => {
    const overlays = Array.from(document.querySelectorAll('div'));
    const target = overlays.find(el => el.textContent && el.textContent.includes('주문진'));
    if (target) target.click();
  });
  
  console.log('Waiting for video...');
  await new Promise(r => setTimeout(r, 5000));
  
  await browser.close();
  process.exit(0);
})();

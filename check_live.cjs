const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => logs.push(`[CONSOLE] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', error => logs.push(`[ERROR] ${error.message}`));
  page.on('requestfailed', request => {
    logs.push(`[FAILED] ${request.url()} - ${request.failure()?.errorText}`);
  });
  page.on('response', response => {
    logs.push(`[RESPONSE] ${response.url()} - Status: ${response.status()}`);
  });

  console.log('Navigating to fishing-go.com...');
  await page.goto('https://fishing-go.com/?v=1781800447777', { waitUntil: 'networkidle' });
  
  // Wait a bit to see if any cctv proxy requests are made
  await page.waitForTimeout(10000);

  fs.writeFileSync('puppeteer_logs.txt', logs.join('\n'));
  console.log('Logs saved to puppeteer_logs.txt');
  
  await browser.close();
})();

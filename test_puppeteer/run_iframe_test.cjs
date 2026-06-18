const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto('http://localhost:8080/iframe_test.html');
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: 'iframe_screenshot.png' });
  await browser.close();
  process.exit(0);
})();

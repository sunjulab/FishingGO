const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto('file://C:/Users/palin/Desktop/낚시GO/test_puppeteer/iframe_popup_test.html');
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: 'iframe_popup_test.png' });
  await browser.close();
  process.exit(0);
})();

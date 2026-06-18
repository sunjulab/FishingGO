const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--disable-web-security'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  await page.goto('file://C:/Users/palin/Desktop/낚시GO/test_puppeteer/test_hls_live.html');
  await new Promise(r => setTimeout(r, 10000));
  await browser.close();
  process.exit(0);
})();

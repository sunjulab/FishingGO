const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  await page.goto('file:///' + __dirname.replace(/\\/g, '/') + '/test_hls2.html');
  
  // Wait for 10 seconds to let HLS do its thing
  await new Promise(r => setTimeout(r, 10000));
  
  const logContent = await page.$eval('#log', el => el.textContent);
  console.log('--- LOG CONTENT ---');
  console.log(logContent);
  
  await browser.close();
})();

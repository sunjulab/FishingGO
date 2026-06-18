const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  await page.goto('http://localhost:8080/test_hls2.html');
  
  // Wait for 10 seconds to let HLS do its thing
  await new Promise(r => setTimeout(r, 10000));
  
  const logContent = await page.$eval('#log', el => el.textContent);
  console.log('--- LOG CONTENT ---');
  console.log(logContent);
  
  await browser.close();
  process.exit(0);
})();

const puppeteer = require('puppeteer');
const path = require('path');

async function test() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto(`file:${path.join(__dirname, 'test_hls.html')}`);
  await new Promise(r => setTimeout(r, 10000));
  await browser.close();
}

test().catch(console.error);

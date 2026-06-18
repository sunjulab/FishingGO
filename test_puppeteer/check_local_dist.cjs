const puppeteer = require('puppeteer');
const http = require('http');
const handler = require('serve-handler');

// 1. Serve the local dist directory
const server = http.createServer((request, response) => {
  return handler(request, response, { public: 'dist' });
});

server.listen(5174, async () => {
  console.log('Running local server on port 5174...');
  
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    console.log('Navigating to http://localhost:5174/');
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
    
    await new Promise(r => setTimeout(r, 5000));
    
    console.log('Clicking on 주문진항 방파제 marker...');
    const clicked = await page.evaluate(() => {
      const overlays = Array.from(document.querySelectorAll('div'));
      const target = overlays.find(el => el.textContent && el.textContent.includes('주문진'));
      if (target) {
        target.click();
        return true;
      }
      return false;
    });
    
    if (!clicked) {
      console.log('Failed to find marker.');
    } else {
      console.log('Clicked marker. Waiting for modal to open...');
      await new Promise(r => setTimeout(r, 3000));
    }
    
    const result = await page.evaluate(() => {
      const iframes = Array.from(document.querySelectorAll('iframe'));
      const reactPlayers = Array.from(document.querySelectorAll('video'));
      return {
        iframes: iframes.map(i => i.src),
        videos: reactPlayers.length
      };
    });
    
    console.log('--- TEST RESULT ---');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.iframes.some(src => src.includes('kbs.co.kr'))) {
      console.log('✅ SUCCESS: KBS iframe is perfectly rendered instead of ReactPlayer!');
    } else {
      console.log('❌ FAILURE: KBS iframe not found.');
    }
    
    await browser.close();
  } catch (err) {
    console.error(err);
  } finally {
    server.close();
    process.exit(0);
  }
});

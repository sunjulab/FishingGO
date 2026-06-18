const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  console.log('Navigating to https://www.fishing-go.com/');
  await page.goto('https://www.fishing-go.com/', { waitUntil: 'networkidle0' });
  
  // Wait for map to load
  await new Promise(r => setTimeout(r, 5000));
  
  // Find the marker for 주문진항 방파제 (point_4)
  // The marker text might be inside a custom overlay
  console.log('Clicking on marker...');
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
    console.log('Failed to find marker. We will just check the page DOM.');
  } else {
    console.log('Clicked marker. Waiting for modal...');
    await new Promise(r => setTimeout(r, 3000));
  }
  
  // Check what is rendered in the video container
  console.log('Evaluating DOM...');
  const result = await page.evaluate(() => {
    const iframes = Array.from(document.querySelectorAll('iframe'));
    const videos = Array.from(document.querySelectorAll('video'));
    
    return {
      iframes: iframes.map(i => i.src),
      videos: videos.map(v => v.src),
      html: document.body.innerHTML.substring(0, 500)
    };
  });
  
  console.log(JSON.stringify(result, null, 2));
  
  await browser.close();
  process.exit(0);
})();

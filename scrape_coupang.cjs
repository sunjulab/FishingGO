const { chromium } = require('playwright');

const links = [
  'https://link.coupang.com/a/fj9wDlMOE8',
  'https://link.coupang.com/a/fj9zrP7SLc',
  'https://link.coupang.com/a/fj9AYN5hRs',
  'https://link.coupang.com/a/fj9CJoRBTg',
  'https://link.coupang.com/a/fj9DqyOfCK',
  'https://link.coupang.com/a/fj9EBJ79iM',
  'https://link.coupang.com/a/fj9FbS4zoy',
  'https://link.coupang.com/a/fj9F0Z0nwO',
  'https://link.coupang.com/a/fj9Hj42o7o',
  'https://link.coupang.com/a/fj9JpybAho',
  'https://link.coupang.com/a/fj9Kdmo7R6',
  'https://link.coupang.com/a/fj9LqlC3kO',
  'https://link.coupang.com/a/fj9MdF1ySq',
  'https://link.coupang.com/a/fj9MXF6Xjo',
  'https://link.coupang.com/a/fj9NMkiBtA',
  'https://link.coupang.com/a/fj9OxlBLG0',
  'https://link.coupang.com/a/fj9PfJyPKu',
  'https://link.coupang.com/a/fj9P5bIt6i',
  'https://link.coupang.com/a/fj9Q7q1spE',
  'https://link.coupang.com/a/fj9RJMMxcy',
  'https://link.coupang.com/a/fj9SrsJL52',
  'https://link.coupang.com/a/fj9SWJr4uG'
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];

  for (const link of links) {
    try {
      await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 15000 });
      // Wait for Coupang redirect
      await page.waitForTimeout(1500); 
      const ogImage = await page.getAttribute('meta[property="og:image"]', 'content', { timeout: 3000 }).catch(() => null);
      const titleRaw = await page.title().catch(() => null);
      let title = titleRaw ? titleRaw.replace(' - 쿠팡', '').replace('쿠팡!', '').trim() : '';
      if (!title || title.includes('Access Denied')) {
         title = '선상/갯바위 낚시 필수템!'; // fallback
      }
      
      console.log(`Link: ${link} -> Img: ${ogImage}, Title: ${title}`);
      results.push({ link, ogImage, title });
    } catch (e) {
      console.log(`Failed: ${link} - ${e.message}`);
    }
  }
  await browser.close();
  const fs = require('fs');
  fs.writeFileSync('coupang_data.json', JSON.stringify(results, null, 2));
})();

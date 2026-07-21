const fetch = require('node-fetch'); // wait, native fetch is in node 18+

async function test() {
  const res = await fetch('https://www.fishing-go.com/');
  const html = await res.text();
  const match = html.match(/src="(\/assets\/index-[a-f0-9]+\.js)"/);
  if (!match) return console.log('No JS bundle found in HTML:', html.substring(0, 500));
  
  const jsUrl = 'https://www.fishing-go.com' + match[1];
  console.log('Fetching JS:', jsUrl);
  
  const jsRes = await fetch(jsUrl);
  const js = await jsRes.text();
  
  console.log('JS length:', js.length);
  console.log('Contains 14물(무시) literal?', js.includes('14물(무시)'));
  console.log('Contains 14\\uBB3C escaped?', js.includes('14\\uBB3C'));
  console.log('Contains 7물(사리) literal?', js.includes('7물(사리)'));
  console.log('Contains 7\\uBB3C escaped?', js.includes('7\\uBB3C'));
  
  // also check marineApi.js PROD fetch url
  console.log('Contains /data-go-api?', js.includes('/data-go-api'));
  console.log('Contains apis.data.go.kr?', js.includes('apis.data.go.kr'));
}
test();

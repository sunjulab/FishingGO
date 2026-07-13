const axios = require('axios');
const fs = require('fs');

async function run() {
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

  const results = [];
  for (let i = 0; i < links.length; i++) {
    try {
      const res1 = await axios.get(links[i], { maxRedirects: 0, validateStatus: null });
      const loc = res1.headers.location;
      if (!loc) {
        console.log(`Failed redirect for ${links[i]}`);
        continue;
      }
      
      const res2 = await axios.get(loc, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        timeout: 10000
      });
      const html = res2.data;
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
      const imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
      
      let name = titleMatch ? titleMatch[1] : '쿠팡 낚시용품 특가';
      let img = imgMatch ? imgMatch[1] : '';
      if (img.startsWith('//')) img = 'https:' + img;
      
      results.push({ link: links[i], name, img });
      console.log(`Success ${i}: ${name}`);
    } catch (e) {
      console.log(`Error ${i}: ${e.message}`);
      results.push({ link: links[i], name: '쿠팡 낚시용품 특가', img: '' });
    }
    await new Promise(r => setTimeout(r, 500)); // Rate limit
  }

  fs.writeFileSync('coupang_results.json', JSON.stringify(results, null, 2));
  console.log('Done');
}

run();

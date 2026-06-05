// ali_extract.cjs — AliExpress 어필리에이트 링크에서 상품 정보 추출
const axios = require('axios');

const urls = [
  'https://s.click.aliexpress.com/e/_c3qIG2jJ',
  'https://s.click.aliexpress.com/e/_c4LawJkd',
  'https://s.click.aliexpress.com/e/_c2zOjtNX',
  'https://s.click.aliexpress.com/e/_c3rjzwEz',
  'https://s.click.aliexpress.com/e/_c4d0rg5x',
  'https://s.click.aliexpress.com/e/_c3L8z0wH',
];

const headers = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  'Accept': 'text/html,application/xhtml+xml',
};

async function main() {
  for (let i = 0; i < urls.length; i++) {
    try {
      const r = await axios.get(urls[i], { headers, maxRedirects: 10, timeout: 15000 });
      const finalUrl = r.request && r.request.res && r.request.res.responseUrl ? r.request.res.responseUrl : urls[i];
      const idMatch = finalUrl.match(/\/item\/(\d+)/);
      const d = typeof r.data === 'string' ? r.data : '';
      
      // og:image 추출
      const imgMatch = d.match(/og:image[^>]*content="([^"]+)"/);
      const imgMatch2 = d.match(/content="(https:\/\/ae0\d\.alicdn\.com[^"]+)"/);
      
      // og:title 추출
      const titleMatch = d.match(/og:title[^>]*content="([^"]+)"/);
      
      const productId = idMatch ? idMatch[1] : 'NO_ID';
      const img = imgMatch ? imgMatch[1].split('?')[0] : (imgMatch2 ? imgMatch2[1].split('?')[0] : 'NO_IMG');
      const title = titleMatch ? titleMatch[1].slice(0, 80) : 'NO_TITLE';
      
      console.log('[' + (i+1) + '] ID: ' + productId);
      console.log('    IMG: ' + img.slice(0, 100));
      console.log('    TITLE: ' + title);
      console.log('    FINAL_URL: ' + finalUrl.slice(0, 100));
      console.log('');
    } catch(e) {
      console.log('[' + (i+1) + '] ERROR: ' + e.message.slice(0, 100));
      console.log('');
    }
  }
}

main();

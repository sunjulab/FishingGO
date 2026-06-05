// get_product.cjs
const axios = require('axios');

const pid = '1005008092502989';
const url = 'https://www.aliexpress.com/item/' + pid + '.html';

axios.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'ko-KR,ko;q=0.9',
    'Accept': 'text/html,application/xhtml+xml',
  },
  maxRedirects: 5,
  timeout: 15000,
}).then(function(r) {
  const d = r.data;
  const imgMatch = (d + '').match(/property="og:image" content="([^"]+)"/);
  const titleMatch = (d + '').match(/property="og:title" content="([^"]+)"/);
  const priceMatch = (d + '').match(/"minAmount":\{"value":"([^"]+)"/);
  console.log('ID:', pid);
  console.log('URL:', url);
  console.log('IMG:', imgMatch ? imgMatch[1].split('?')[0] : 'NONE');
  console.log('TITLE:', titleMatch ? titleMatch[1].slice(0, 100) : 'NONE');
  console.log('PRICE:', priceMatch ? priceMatch[1] : 'NONE');
}).catch(function(e) {
  console.log('ERROR:', e.message);
});

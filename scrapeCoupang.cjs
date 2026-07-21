const https = require('https');
const http = require('http');
const fs = require('fs');

const links = [
  'https://link.coupang.com/a/fzkqidOl9E',
  'https://link.coupang.com/a/fzkr8zesw0',
  'https://link.coupang.com/a/fzktirHN4m',
  'https://link.coupang.com/a/fzkugYVWQS',
  'https://link.coupang.com/a/fzkuVvufT2',
  'https://link.coupang.com/a/fzkwnnS2Gy',
  'https://link.coupang.com/a/fzkw4fvXeC',
  'https://link.coupang.com/a/fzkyiOnTrw',
  'https://link.coupang.com/a/fzkzIANYGq',
  'https://link.coupang.com/a/fzkAkIZo1Q',
  'https://link.coupang.com/a/fzkA0LBQui',
  'https://link.coupang.com/a/fzkCDqzYtg',
  'https://link.coupang.com/a/fzkDMG8h64',
  'https://link.coupang.com/a/fzkFmOpiJE',
  'https://link.coupang.com/a/fzkFWrdR0e'
];

async function fetchMeta(url) {
  return new Promise((resolve) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
           resolve({ link: url, img: null, name: null });
           return;
        }
        
        const client = redirectUrl.startsWith('https') ? https : http;
        client.get(redirectUrl, {
           headers: { 'User-Agent': 'Mozilla/5.0' }
        }, res2 => {
           let data = '';
           res2.on('data', c => data += c);
           res2.on('end', () => {
              const imgMatch = data.match(/<meta\\s+property=['"]og:image['"]\\s+content=['"]([^'"]+)['"]/i);
              const titleMatch = data.match(/<meta\\s+property=['"]og:title['"]\\s+content=['"]([^'"]+)['"]/i);
              
              resolve({
                 link: url,
                 img: imgMatch ? imgMatch[1] : null,
                 name: titleMatch ? titleMatch[1] : null
              });
           });
        }).on('error', () => resolve({ link: url, img: null, name: null }));
      } else {
        resolve({ link: url, img: null, name: null });
      }
    }).on('error', () => resolve({ link: url, img: null, name: null }));
  });
}

(async () => {
  const results = [];
  for (const link of links) {
    console.log('Fetching', link);
    const m = await fetchMeta(link);
    results.push(m);
  }
  fs.writeFileSync('coupang_data.json', JSON.stringify(results, null, 2));
  console.log('Done');
})();

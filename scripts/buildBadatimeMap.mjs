import https from 'https';
import fs from 'fs';
import iconv from 'iconv-lite';

const fetchUrl = (url) => new Promise((resolve) => {
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
    const chunks = [];
    res.on('data', c => chunks.push(c));
    res.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const decoded = iconv.decode(buffer, 'euc-kr');
      resolve(decoded);
    });
  }).on('error', () => resolve(''));
});

async function buildMap() {
  const map = {};
  for (let i = 1; i <= 200; i++) {
    const url = `https://www.badatime.com/${i}-2026-07.html`;
    const html = await fetchUrl(url);
    if (!html) continue;
    
    const match = html.match(/<TITLE>[^<]*?([가-힣a-zA-Z0-9]+)\s*물때표/);
    if (match) {
      console.log(`${i}: ${match[1]}`);
      map[i] = match[1];
    }
  }
  fs.writeFileSync('badatime_map.json', JSON.stringify(map, null, 2));
}
buildMap();

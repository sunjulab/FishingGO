import https from 'https';
import iconv from 'iconv-lite';

const ports = ['묵호', '속초', '강릉', '후포', '포항', '임원', '방어진', '동해항', '감포', '부산', '가덕도', '통영', '삼천포', '여수', '완도', '거문도', '고흥', '인천'];

async function run() {
  for (const p of ports) {
    const encoded = iconv.encode(p, 'euc-kr');
    let escaped = '';
    for (let i = 0; i < encoded.length; i++) {
      escaped += '%' + encoded[i].toString(16).toUpperCase();
    }
    const url = 'https://www.badatime.com/search.jsp?a=' + escaped;
    
    await new Promise(resolve => {
      https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const html = iconv.decode(Buffer.concat(chunks), 'euc-kr');
          const match = html.match(/<a href="\/([0-9]+)\.html">/);
          console.log(`${p}: ${match ? match[1] : 'Not found'}`);
          resolve();
        });
      }).on('error', () => resolve());
    });
  }
}
run();

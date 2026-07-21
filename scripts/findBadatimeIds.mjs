import https from 'https';

const ports = ['묵호', '속초', '강릉', '후포', '포항', '임원', '방어진', '동해', '감포', '부산', '가덕도', '통영', '삼천포', '여수', '완도', '거문도', '고흥'];

const fetchUrl = (url) => new Promise((resolve) => {
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => resolve(data));
  }).on('error', () => resolve(''));
});

async function run() {
  for (const p of ports) {
    const url = 'https://www.badatime.com/search.jsp?a=' + encodeURIComponent(p);
    const html = await fetchUrl(url);
    const match = html.match(/<a href="\/([0-9]+)\.html">/);
    console.log(`${p}: ${match ? match[1] : 'Not found'}`);
  }
}
run();

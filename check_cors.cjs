const axios = require('axios');
async function test() {
  const r = await axios.get('https://d.kbs.co.kr/special/cctv/cctvPopup?type=LIVE&cctvId=9995');
  const u = r.data.match(/<input type="hidden" id="url" value="([^"]+)"/)[1];
  const a = await axios.get(u, { headers: { Referer: 'https://d.kbs.co.kr/' } });
  const m = a.data.trim();
  const h = await axios.head(m).catch(e => e.response);
  console.log('CORS:', h.headers['access-control-allow-origin'] || 'NONE');
}
test().catch(console.error);

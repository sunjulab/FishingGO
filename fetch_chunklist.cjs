const axios = require('axios');
async function test() {
  const r = await axios.get('https://d.kbs.co.kr/special/cctv/cctvPopup?type=LIVE&cctvId=9995');
  const u = r.data.match(/<input type="hidden" id="url" value="([^"]+)"/)[1];
  const a = await axios.get(u, { headers: { Referer: 'https://d.kbs.co.kr/' } });
  const m = a.data.trim();
  const m3u8Req = await axios.get(m);
  
  const chunklistLine = m3u8Req.data.split('\n').find(l => l.includes('chunklist'));
  if (chunklistLine) {
    const chunklistUrl = new URL(chunklistLine, m).href;
    console.log('Fetching chunklist:', chunklistUrl);
    const cReq = await axios.get(chunklistUrl);
    console.log('CHUNKLIST CONTENT:');
    console.log(cReq.data);
  }
}
test().catch(console.error);

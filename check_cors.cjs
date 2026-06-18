const axios = require('axios');

async function test() {
  const cctvId = '9995';
  const popupRes = await axios.get(`https://d.kbs.co.kr/special/cctv/cctvPopup?type=LIVE&cctvId=${cctvId}`);
  const urlMatch = popupRes.data.match(/<input type="hidden" id="url" value="([^"]+)"/);
  const apiUrl = urlMatch[1];

  const apiRes = await axios.get(apiUrl, {
    headers: { Referer: 'https://d.kbs.co.kr/' }
  });
  let m3u8Url = apiRes.data.trim();

  const m3u8Res = await axios.get(m3u8Url);
  let m3u8Content = m3u8Res.data;

  const baseUrl = new URL('.', m3u8Url).href;
  const chunklistLine = m3u8Content.split('\n').find(l => l && !l.startsWith('#'));
  const chunklistUrl = new URL(chunklistLine, baseUrl).href;
  
  console.log('CHUNKLIST URL:', chunklistUrl);
  const chunklistHead = await axios.head(chunklistUrl).catch(e => e.response);
  console.log('CHUNKLIST CORS:', chunklistHead.headers['access-control-allow-origin']);
  
  const chunklistRes = await axios.get(chunklistUrl);
  const tsLine = chunklistRes.data.split('\n').find(l => l && !l.startsWith('#'));
  const tsUrl = new URL(tsLine, chunklistUrl).href;
  
  console.log('TS URL:', tsUrl);
  const tsHead = await axios.head(tsUrl).catch(e => e.response);
  console.log('TS CORS:', tsHead.headers['access-control-allow-origin']);
}

test().catch(console.error);

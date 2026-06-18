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
  console.log('FINAL URL:', m3u8Url);

  const m3u8Res = await axios.get(m3u8Url);
  let m3u8Content = m3u8Res.data;

  // Rewrite relative chunklists
  const baseUrl = new URL('.', m3u8Url).href; 
  console.log('BASE URL:', baseUrl);
  m3u8Content = m3u8Content.split('\n').map(line => {
    if (line && !line.startsWith('#')) {
      return new URL(line, baseUrl).href;
    }
    return line;
  }).join('\n');

  console.log('REWRITTEN M3U8:');
  console.log(m3u8Content);
}

test().catch(console.error);

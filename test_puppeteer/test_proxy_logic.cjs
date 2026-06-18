const axios = require('axios');
async function testProxy() {
  const cctvId = '9995';
  const popupUrl = `https://d.kbs.co.kr/special/cctv/cctvPopup?type=LIVE&cctvId=${cctvId}`;
  const popupRes = await axios.get(popupUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const urlMatch = popupRes.data.match(/<input type="hidden" id="url" value="([^"]+)"/);
  const apiUrl = urlMatch[1];
  console.log('apiUrl:', apiUrl);
  
  const apiRes = await axios.get(apiUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://d.kbs.co.kr/' }
  });
  let m3u8Url = apiRes.data.toString().trim();
  console.log('m3u8Url:', m3u8Url);
  
  const m3u8Res = await axios.get(m3u8Url);
  console.log('m3u8Res length:', m3u8Res.data.length);
}
testProxy().catch(console.error);

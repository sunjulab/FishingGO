const axios = require('axios');
require('dotenv').config();

const BUOY_MAP = {
  // 동해권
  'DT_0001':'22101', // 덕적도 -> 속초 22101
  'DT_0002':'22102', // 동해 22102
  'DT_0003':'22103', // 포항 22103
  'DT_0018':'22104', // 울진 22104
  // 남해권
  'DT_0004':'22105', // 부산 22105
  'DT_0005':'22106', // 거문도 22106
  'DT_0006':'22108', // 통영 22108
  'DT_0016':'22106', // 여수 → 거문도
  'DT_0014':'22107', // 광양만 → 22107
  // 서해권
  'DT_0007':'22298', // 인천 → 서해부이 22298
  'DT_0030':'22297', // 태안 → 22297
  'DT_0008':'22302', // 보령 → 22302
  'DT_0009':'22303', // 군산 → 22303
  // 제주권
  'DT_0010':'22515', // 제주한림 → 22515
};

async function check() {
  const key = process.env.KMA_KEY;
  if (!key) return console.log('No KMA_KEY in .env');

  const now = new Date(Date.now() + 9 * 3600 * 1000);
  const prev = new Date(now.getTime() - 70 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const tm2 = `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}00`;
  const tm1 = `${prev.getUTCFullYear()}${pad(prev.getUTCMonth()+1)}${pad(prev.getUTCDate())}${pad(prev.getUTCHours())}00`;

  for (const [sid, buoyNum] of Object.entries(BUOY_MAP)) {
    try {
      const url = `https://apihub.kma.go.kr/api/typ01/url/kma_buoy2.php?tm1=${tm1}&tm2=${tm2}&stn=${buoyNum}&help=1&authKey=${key}`;
      const res = await axios.get(url, { timeout: 8000 });
      const text = typeof res.data === 'string' ? res.data : '';
      if (!text.includes('START7777')) {
         console.log(`${sid} (${buoyNum}): Failed or no data`);
         continue;
      }
      const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.startsWith(' #') && l.includes(buoyNum));
      if (!lines.length) {
         console.log(`${sid} (${buoyNum}): No recent line`);
         continue;
      }
      const cols = lines[lines.length - 1].trim().split(',').map(s => s.trim());
      const ws = parseFloat(cols[3]);
      const wh = parseFloat(cols[13]);
      console.log(`${sid} (${buoyNum}): Wind=${ws}m/s, Wave=${wh}m`);
    } catch(e) {
      console.log(`${sid} (${buoyNum}): Error ${e.message}`);
    }
  }
}
check();

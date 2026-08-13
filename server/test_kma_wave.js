const axios = require('axios');
require('dotenv').config();

async function test() {
  const k = process.env.KMA_KEY;
  const now = new Date(Date.now() + 9 * 3600 * 1000);
  const pad = n => String(n).padStart(2, '0');
  const tm2 = '' + now.getUTCFullYear() + pad(now.getUTCMonth()+1) + pad(now.getUTCDate()) + pad(now.getUTCHours()) + '00';
  const buoys = ['22101','22102','22104','22105','22106'];
  for(let b of buoys) {
    try {
      const url = `https://apihub.kma.go.kr/api/typ01/url/sea_obs.php?tm2=${tm2}&stn=${b}&help=0&authKey=${k}`;
      const r = await axios.get(url, {timeout: 20000});
      const line = r.data.split('\n').filter(l => l.startsWith('B,')).pop();
      console.log(b, line ? line.split(',').map(s=>s.trim()).slice(6,9) : 'no data');
    } catch(e) {
      console.log(b, e.message);
    }
  }
}
test();

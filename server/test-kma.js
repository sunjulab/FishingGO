const axios = require('axios');
require('dotenv').config();

async function getKma(buoyNum) {
  const KMA_KEY = process.env.KMA_KEY;
  const now = new Date(Date.now() + 9 * 3600 * 1000);
  const pad = n => String(n).padStart(2, '0');
  const tm2 = `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}00`;
  const url = `https://apihub.kma.go.kr/api/typ01/url/sea_obs.php?tm2=${tm2}&stn=${buoyNum}&help=0&authKey=${KMA_KEY}`;
  try {
    const r = await axios.get(url);
    console.log(`=== Buoy ${buoyNum} ===`);
    console.log(r.data.split('\n').filter(l => l.trim() && l.startsWith('B,')).pop());
  } catch(e) {
    console.log(`=== Buoy ${buoyNum} ERROR ===`);
  }
}

async function run() {
  const buoys = ['22101', '22102', '22103', '22104', '22105', '22106', '22107', '22108', '22183', '22184', '22188', '22189', '22190', '22109'];
  for (const b of buoys) {
    await getKma(b);
  }
}
run();

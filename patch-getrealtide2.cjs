
const fs = require('fs');
let code = fs.readFileSync('server/index.js', 'utf8');

const regex = /async function getRealTide\\(sid\\) \\{[\\s\\S]*?return \\{ phase, high: highTime, low: lowTime \\};\\r?\\n\\s*\\} catch \\(e\\) \\{ return null; \\}\\r?\\n\\s*\\}\\);\\r?\\n\\}/m;
const match = code.match(regex);
if (match) {
  const replacement = \sync function getRealTide(sid) {
  const KEY = process.env.KHOA_CCTV_KEY || process.env.KHOA_KEY;
  if (!KEY) return null;
  
  const coords = STATION_COORDS[sid] || OBS_COORDS[sid];
  let tideSid = sid;
  if (coords) {
    tideSid = getNearestKhoaStation(coords.lat, coords.lng);
  }

  return getDeduplicatedPromise('tide_' + tideSid, async () => {
    try {
      const kst = new Date(Date.now() + 9 * 3600 * 1000);
      const today = '' + kst.getUTCFullYear() + String(kst.getUTCMonth()+1).padStart(2,'0') + String(kst.getUTCDate()).padStart(2,'0');
      const url = 'https://apis.data.go.kr/1192136/tideFcstHghLw/GetTideFcstHghLwApiService?serviceKey=' + encodeURIComponent(KEY) + '&obsCode=' + tideSid + '&reqDate=' + today + '&type=json&numOfRows=20&pageNo=1';
      const res = await axios.get(url, { timeout: 6000, headers: { Accept: 'application/json' } });
      const items = res.data?.body?.items?.item || res.data?.response?.body?.items?.item;
      if (!items) return null;
      const list = Array.isArray(items) ? items : [items];
      
      const highs = list.filter(t => t.extrSe === '1' || t.extrSe === '3' || t.hl_code === 'H');
      const lows  = list.filter(t => t.extrSe === '2' || t.extrSe === '4' || t.hl_code === 'L');
      
      const highTime = (highs[0]?.predcDt || highs[0]?.hl_time || '').slice(11,16) || null;
      const lowTime  = (lows[0]?.predcDt  || lows[0]?.hl_time  || '').slice(11,16) || null;
      const nextLow  = (lows[1]?.predcDt  || lows[1]?.hl_time  || '').slice(11,16) || null;
      const lunarDay = getLunarDay();
      const station = observationData[sid] || { region: 'Àü±¹' };
      const phase = getTidePhase(lunarDay, station.region);
      return { phase, high: highTime, low: lowTime, next_low: nextLow };
    } catch (e) {
      return null;
    }
  });
}\;
  code = code.replace(regex, replacement);
  fs.writeFileSync('server/index.js', code, 'utf8');
  console.log('Patched getRealTide safely!');
} else {
  console.log('Regex did not match.');
}


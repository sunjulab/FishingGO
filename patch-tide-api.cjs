
const fs = require('fs');
let code = fs.readFileSync('server/index.js', 'utf8');

const regex = /\/\*\*[\s\S]*?app\.get\('\/api\/tide\/obs'[\s\S]*?\}\);\n/m;
const match = code.match(regex);
if (match) {
  const newRoute = \/**
 * GET /api/tide/obs?obsCode=DT_0011&date=20260909
 * KHOA 조석예보 API 프록시 ? 만조/간조 시간 정확도 개선
 */
app.get('/api/tide/obs', async (req, res) => {
  const obsCode = (req.query.obsCode || '').trim();
  const date    = (req.query.date || '').trim() ||
    new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' }).replace(/\\./g, '').replace(/ /g, '').padStart(8, '0');

  if (!obsCode) return res.status(400).json({ error: 'obsCode 필수' });

  // Convert KMA DT_xxxx code to KHOA code using nearest station
  let tideSid = obsCode;
  if (tideSid.startsWith('DT_')) {
    const coords = STATION_COORDS[tideSid] || OBS_COORDS[tideSid];
    if (coords) tideSid = getNearestKhoaStation(coords.lat, coords.lng);
  }

  const cacheKey = \\\\_\\\\;
  const cached = _tideCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < TIDE_CACHE_TTL) {
    return res.json(cached.data);
  }

  // Use KHOA_CCTV_KEY since it is registered for GetTideFcstHghLwApiService
  const KEY = process.env.KHOA_CCTV_KEY || process.env.KHOA_KEY;
  if (!KEY) {
    return res.status(503).json({ error: 'KHOA_KEY 미설정', fallback: true });
  }

  try {
    const url = \\\https://apis.data.go.kr/1192136/tideFcstHghLw/GetTideFcstHghLwApiService?serviceKey=\&obsCode=\&reqDate=\&type=json&numOfRows=20&pageNo=1\\\;
    const resp = await axios.get(url, { timeout: 8000 });
    
    const items = resp.data?.body?.items?.item || resp.data?.response?.body?.items?.item || [];
    const list = Array.isArray(items) ? items : [items];
    if (list.length === 0 || !list[0]) {
       return res.status(502).json({ error: 'KHOA 데이터 없음', fallback: true });
    }

    const highs = list.filter(t => t.extrSe === '1' || t.extrSe === '3' || t.hl_code === 'H').map(t => t.predcDt?.slice(11, 16) || t.hl_time?.slice(11,16)).filter(Boolean);
    const lows = list.filter(t => t.extrSe === '2' || t.extrSe === '4' || t.hl_code === 'L').map(t => t.predcDt?.slice(11, 16) || t.hl_time?.slice(11,16)).filter(Boolean);

    const result = { obsCode, date, tideSid, high: highs[0] || null, high2: highs[1] || null, low: lows[0] || null, low2: lows[1] || null, source: 'khoa', rawData: list.map(t => ({ hl_code: t.extrSe === '1' || t.extrSe === '3' ? 'H' : 'L', tph_time: t.predcDt, tph_level: t.predcTdlvVl })) };
    _tideCache.set(cacheKey, { data: result, ts: Date.now() });
    res.json(result);
  } catch (err) {
    logger.warn(\\\[KHOA Tide] \ \ 오류: \\\\);
    res.status(502).json({ error: 'KHOA API 오류', fallback: true });
  }
});
\;
  code = code.replace(match[0], newRoute);
  fs.writeFileSync('server/index.js', code, 'utf8');
  console.log('Patched /api/tide/obs successfully!');
} else {
  console.log('Could not find /api/tide/obs block');
}


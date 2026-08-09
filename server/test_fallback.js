/**
 * 3단계 폴백 아키텍처 통합 테스트
 * 1. OpenMeteo 단독 호출 → 실시간 데이터 수신 여부 확인 (기상청 장애 가정)
 * 2. 캐시 재사용 로직 확인
 * 3. KMA→Cache→OpenMeteo 순서 전환 확인
 */
const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

// ─── applyCoastalTransform 로직 복사 (서버와 동일) ───
function applyCoastalTransform(sid, wh, ws, wdDeg) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  const wd   = isNaN(wdDeg) ? 'N' : dirs[Math.round(wdDeg / 22.5) % 16];
  let reductionFactor    = 1.0;
  let windReductionFactor = 0.75;
  const isEastCoast  = ['DT_0001','DT_0002','DT_0003','DT_0021','DT_0033','DT_0036','DT_0099'].includes(sid);
  const isWestCoast  = ['DT_0007','DT_0008','DT_0009','DT_0030'].includes(sid);
  const isSouthCoast = !isEastCoast && !isWestCoast;
  if (isEastCoast)       { if (wd.includes('W')) { reductionFactor = 0.8; windReductionFactor *= 0.5; } }
  else if (isWestCoast)  { if (wd.includes('E')) { reductionFactor = 0.3; windReductionFactor *= 0.5; } }
  else if (isSouthCoast) { if (wd.includes('N')) { reductionFactor = 0.5; windReductionFactor *= 0.5; } }
  return {
    wind: { speed: parseFloat(Math.max(0, ws * windReductionFactor).toFixed(1)), dir: wd },
    wave: { coastal: parseFloat(Math.max(0.1, wh * reductionFactor).toFixed(1)) },
  };
}

// ─── 캐시 시뮬레이션 ───
const marineWeatherCache = {};
const MARINE_CACHE_TTL = 3 * 60 * 60 * 1000;

// ─── 테스트 대상 관측소 ───
const TEST_STATIONS = [
  { sid: 'DT_0001', name: '강릉 안목항', coast: 'East',  lat: 37.7734, lng: 128.9406 },
  { sid: 'DT_0004', name: '부산 해운대', coast: 'South', lat: 35.1586, lng: 129.1603 },
  { sid: 'DT_0007', name: '인천 연안부두', coast: 'West', lat: 37.4643, lng: 126.6188 },
  { sid: 'DT_0011', name: '서귀포',       coast: 'South', lat: 33.2527, lng: 126.5600 },
];

async function testOpenMeteo(sid, lat, lng) {
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}` +
    `&hourly=wave_height,wave_direction&wind_speed_unit=ms&timezone=Asia%2FSeoul&forecast_days=1`;
  const wurl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&hourly=wind_speed_10m,wind_direction_10m&wind_speed_unit=ms&timezone=Asia%2FSeoul&forecast_days=1`;
  const [mRes, wRes] = await Promise.all([
    axios.get(url,  { timeout: 8000 }),
    axios.get(wurl, { timeout: 8000 }),
  ]);
  const nowHr   = new Date().getHours();
  const wh      = parseFloat(mRes.data?.hourly?.wave_height?.[nowHr]);
  const wdDeg   = parseFloat(mRes.data?.hourly?.wave_direction?.[nowHr]);
  const ws      = parseFloat(wRes.data?.hourly?.wind_speed_10m?.[nowHr]);
  const windDeg = parseFloat(wRes.data?.hourly?.wind_direction_10m?.[nowHr]);
  if (isNaN(wh) || isNaN(ws)) return null;
  return applyCoastalTransform(sid, wh, ws, windDeg);
}

async function testKMA(buoyNum) {
  const KMA_KEY = process.env.KMA_KEY;
  if (!KMA_KEY || !buoyNum) return null;
  const now = new Date(Date.now() + 9 * 3600 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const tm2 = `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}00`;
  const url = `https://apihub.kma.go.kr/api/typ01/url/sea_obs.php?tm2=${tm2}&stn=${buoyNum}&help=0&authKey=${KMA_KEY}`;
  const res = await axios.get(url, { timeout: 8000 });
  const text = typeof res.data === 'string' ? res.data : '';
  if (!text || !text.includes('START7777')) return null;
  const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('#') && l.startsWith('B,'));
  const matched = lines.filter(l => l.includes(buoyNum));
  const targetLine = matched.length ? matched[matched.length - 1] : lines[lines.length - 1];
  if (!targetLine) return null;
  const cols  = targetLine.trim().split(',').map(s => s.trim());
  const wh    = parseFloat(cols[6]);
  const wdDeg = parseFloat(cols[7]);
  const ws    = parseFloat(cols[8]);
  if (isNaN(ws) || ws <= -90 || isNaN(wh) || wh <= -90) return null;
  return { wh, ws, wdDeg };
}

const BUOY_MAP = {
  'DT_0001':'22102', 'DT_0004':'22104', 'DT_0007':'22298', 'DT_0011':'22515',
};

async function run() {
  console.log('='.repeat(60));
  console.log(' 3단계 폴백 아키텍처 통합 테스트');
  console.log('='.repeat(60));

  for (const st of TEST_STATIONS) {
    const { sid, name, coast, lat, lng } = st;
    console.log(`\n[${name} / ${coast}Coast / ${sid}]`);

    // ── 1순위: KMA API ──
    let kmaStatus = '❌ FAIL';
    let kmaData = null;
    try {
      const raw = await testKMA(BUOY_MAP[sid]);
      if (raw) {
        kmaData = applyCoastalTransform(sid, raw.wh, raw.ws, raw.wdDeg);
        kmaStatus = `✅ OK  → 파고:${kmaData.wave.coastal}m 풍속:${kmaData.wind.speed}m/s 풍향:${kmaData.wind.dir}`;
        // 캐시에 저장
        marineWeatherCache[sid] = { data: kmaData, fetchedAt: Date.now(), source: 'KMA' };
      } else {
        kmaStatus = '⚠️  TIMEOUT/EMPTY';
      }
    } catch(e) {
      kmaStatus = `⚠️  ERROR: ${e.message.substring(0,50)}`;
    }
    console.log(`  [1순위 KMA]      ${kmaStatus}`);

    // ── 2순위: 캐시 재사용 시뮬레이션 (KMA 성공했으면 바로 확인) ──
    const cached = marineWeatherCache[sid];
    if (cached && (Date.now() - cached.fetchedAt) < MARINE_CACHE_TTL) {
      const ageMin = Math.floor((Date.now() - cached.fetchedAt) / 60000);
      console.log(`  [2순위 Cache]    ✅ OK  → ${ageMin}분 전 캐시 유효 (source: ${cached.source})`);
    } else {
      console.log(`  [2순위 Cache]    ⚠️  캐시 없음 or 만료`);
    }

    // ── 3순위: OpenMeteo ──
    let omStatus = '❌ FAIL';
    try {
      const omData = await testOpenMeteo(sid, lat, lng);
      if (omData) {
        omStatus = `✅ OK  → 파고:${omData.wave.coastal}m 풍속:${omData.wind.speed}m/s 풍향:${omData.wind.dir}`;
      } else {
        omStatus = '⚠️  데이터 없음';
      }
    } catch(e) {
      omStatus = `❌ ERROR: ${e.message.substring(0,50)}`;
    }
    console.log(`  [3순위 OpenMeteo] ${omStatus}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log(' 테스트 완료');
  console.log('='.repeat(60));
}

run().catch(console.error);

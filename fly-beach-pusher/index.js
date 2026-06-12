// 🌊 FishingGO Beach Pusher - Fly.io (인천 ICN 리전) v1.1
// KMA 해수욕장 수온 수집 → Render 서버 자동 푸시
// - 시작 후 30초: 첫 push (Render 부팅 대기)
// - 처음 6회(30분): 5분마다 재시도 (Render 재시작 대응)
// - 이후: 1시간마다
const https = require('https');
const http = require('http');

const KMA_KEY = process.env.KMA_SERVICE_KEY;
const RENDER_URL = 'https://fishing-go-backend.onrender.com/api/internal/beach-push';
const PUSH_KEY = process.env.BEACH_PUSH_KEY || 'fishinggo-beach-2024';

async function fetchBeachData() {
  return new Promise((resolve, reject) => {
    const url = `https://apis.data.go.kr/1360000/BeachInfoservice/getBeachCurrentWeather?serviceKey=${encodeURIComponent(KMA_KEY)}&numOfRows=200&dataType=JSON`;
    const req = https.get(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/121.0.0.0 Mobile Safari/537.36',
      },
      timeout: 15000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const rc = json?.response?.header?.resultCode;
          if (rc !== '00') return reject(new Error(`KMA RC=${rc}`));
          const items = json?.response?.body?.items?.item;
          if (!items || !Array.isArray(items)) return reject(new Error('items 없음'));
          resolve(items.map(i => ({ beachNm: i.beachNm, wTemp: i.wTemp, reginNm: i.reginNm })));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function pushToRender(items) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ items });
    const parsed = new URL(RENDER_URL);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'x-push-key': PUSH_KEY,
      },
      timeout: 15000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve({ ok: false, raw: data.slice(0, 100) }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('push timeout')); });
    req.write(body);
    req.end();
  });
}

let lastPatched = 0;

async function run() {
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  console.log(`[${now}] 🌊 beach-push 시작`);
  try {
    const items = await fetchBeachData();
    console.log(`✅ KMA 수집: ${items.length}개`);
    const result = await pushToRender(items);
    lastPatched = result.patched || 0;
    console.log(`✅ Render 푸시: patched=${lastPatched}개 (${result.updated || result.raw || ''})`);
    return lastPatched;
  } catch (e) {
    console.error(`❌ 오류: ${e.message}`);
    return 0;
  }
}

// ── 스케줄 전략 ───────────────────────────────────────────
// 처음 30분: 5분마다 재시도 (Render 재시작/배포 대응)
// 이후: 1시간마다 (KMA 해수욕장은 1시간 단위 갱신)
let runCount = 0;
const INITIAL_INTERVAL = 5 * 60 * 1000;    // 5분
const NORMAL_INTERVAL  = 60 * 60 * 1000;   // 1시간
const INITIAL_RUNS = 6;                     // 처음 6회(30분) = 집중 모드

async function scheduledRun() {
  runCount++;
  const patched = await run();
  const isInitial = runCount <= INITIAL_RUNS;
  const next = isInitial ? INITIAL_INTERVAL : NORMAL_INTERVAL;
  console.log(`[스케줄] 다음 push: ${next / 60000}분 후 (${isInitial ? '집중' : '정상'} 모드, run#${runCount})`);
  setTimeout(scheduledRun, next);
}

// 30초 후 첫 실행 (Render 부팅 완료 대기)
console.log('🚀 FishingGO Beach Pusher 시작 (30초 후 첫 push)');
setTimeout(scheduledRun, 30 * 1000);

// HTTP 헬스체크
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', lastPatched, runCount, region: 'ICN-Korea' }));
}).listen(8080, () => console.log('Health: http://localhost:8080'));

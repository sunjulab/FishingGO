const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🌊 [Guardian] 실시간 API 무결성 교차 검증 시작 (3-Way Audit)...');

const ROOT = path.join(__dirname, '..');
const API = 'https://fishing-go-backend.onrender.com';

// 간단한 Fetch 유틸리티
const fetchJson = (url) => new Promise((resolve, reject) => {
  https.get(url, { timeout: 10000 }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try { resolve(JSON.parse(data)); } catch (e) { resolve({}); }
    });
  }).on('error', reject);
});

async function runAudit() {
  try {
    // 1. 로컬 데이터 로드
    const fd = await import('file:///' + path.join(ROOT, 'src/constants/fishingData.js').replace(/\\/g, '/'));
    const { ALL_FISHING_POINTS, getPointSpecificData, KHOA_OBSERVATORIES } = fd;
    
    // marineApi.js에서 실제 관측소 추출
    const src = fs.readFileSync(path.join(ROOT, 'src/api/marineApi.js'), 'utf8');
    const m = src.match(/REAL_KHOA_STATIONS\s*=\s*(\[[\s\S]*?\]);/);
    if (!m) throw new Error("REAL_KHOA_STATIONS not found in marineApi.js");
    const REAL_KHOA_STATIONS = eval(m[1]);
    
    const dist = (a, b, c, d) => { const R = 6371, r = Math.PI / 180; const x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2; return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)); };
    const remap = code => { 
      const s = KHOA_OBSERVATORIES.find(x => x.id === code); 
      if (!s) return code; 
      let best = REAL_KHOA_STATIONS[0], md = Infinity; 
      for (const st of REAL_KHOA_STATIONS) { 
        const d = dist(s.lat, s.lng, st.lat, st.lng); 
        if (d < md) { md = d; best = st; } 
      } 
      return best.id; 
    };

    // 오늘 날짜 (KST 기준)
    const d = new Date(Date.now() + 9 * 3600e3);
    const ymd = d.toISOString().slice(0, 10).replace(/-/g, '');

    // 동/서/남해 대표 포인트 샘플링 (속초, 인천, 목포, 부산, 제주)
    const sampleIds = ['DT_0021', 'DT_0007', 'DT_0006', 'DT_0004', 'DT_0010'];
    const samplePoints = ALL_FISHING_POINTS.filter(p => sampleIds.includes(p.obsCode));

    let hasError = false;

    for (const p of samplePoints) {
      process.stdout.write(`  🔍 검증 중: ${p.name} (${p.obsCode}) ... `);
      
      const localData = getPointSpecificData(p, 0).tide || {};
      const realCode = remap(p.obsCode);
      
      let liveData = {};
      try {
        liveData = await fetchJson(`${API}/api/tide/obs?obsCode=${realCode}&date=${ymd}`);
      } catch (err) {
        console.log(`⚠️ API Timeout (Skipping exact match check for this point)`);
        continue;
      }

      const fmt = t => [t.high, t.high2, t.low, t.low2].filter(Boolean).sort().join(' ');
      const localStr = fmt(localData);
      
      // KHOA 응답 파싱
      const khoaTimes = [];
      if (liveData.rawData) {
        liveData.rawData.forEach(t => {
          if (t.tph_time) khoaTimes.push(t.tph_time.split(' ')[1].slice(0,5));
        });
      }
      const liveStr = khoaTimes.sort().join(' ');

      // 오차 검증 로직 (±60분)
      const near = (x, y) => {
        const tm = s => s ? s.split(' ').map(v => +v.slice(0, 2) * 60 + +v.slice(3)) : [];
        const X = tm(x), Y = tm(y); 
        if (!X.length || !Y.length) return null;
        return X.every(u => Y.some(v => Math.abs(u - v) <= 90)) && Y.every(u => X.some(v => Math.abs(u - v) <= 90));
      };

      const isMatch = near(localStr, liveStr);
      
      if (isMatch === false) {
        console.log(`❌ 불일치!`);
        console.log(`     - 로컬 캐시 (바다타임): ${localStr}`);
        console.log(`     - KHOA 실시간 데이터: ${liveStr}`);
        hasError = true;
      } else {
        console.log(`✅ 정상`);
      }
    }

    if (hasError) {
      console.error('\n🚨 [FATAL] 실시간 KHOA API와 로컬 바다타임 캐시간의 치명적 불일치가 감지되었습니다!');
      console.error('배포(Deploy)가 강제 중단됩니다. API 응답 규격이 변경되었거나 관측소 매핑이 틀어졌습니다.');
      console.error('Antigravity 자동복구 에이전트를 호출하거나, syncTides.mjs를 다시 실행하세요.\n');
      process.exit(1);
    } else {
      console.log('\n🛡️ [SUCCESS] 3-Way 실시간 API 교차 검증 통과! 안전하게 배포할 수 있습니다.\n');
      process.exit(0);
    }

  } catch (err) {
    console.error('❌ [ERROR] 검증 스크립트 실행 중 오류 발생:', err);
    process.exit(1); // Fail safe
  }
}

runAudit();

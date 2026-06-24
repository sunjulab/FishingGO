const jwt = require('jsonwebtoken');
require('dotenv').config();
const token = jwt.sign({ id: 1, email: 'sunjulab.k', tier: 'MASTER' }, 'FishingGO_2024_Pr0d_S3cr3t!@#$xK9mQ');

const ALL_SIDS = [
  'DT_0001','DT_0002','DT_0003','DT_0033','DT_0036','DT_0021', // 동해
  'DT_0004','DT_0005','DT_0006','DT_0014','DT_0016','DT_0018','DT_0034', // 남해
  'DT_0007','DT_0008','DT_0009','DT_0030', // 서해
  'DT_0010','DT_0011','DT_0045' // 제주
];

async function run() {
  const scoreRes = await fetch('http://localhost:5000/api/fishing-scores').then(r=>r.json());
  const scores = scoreRes.scores;

  console.log('\n====== 전국 관측소 전수조사 ======');
  console.log('지점코드 | 이름 | 점수 | 수온 | 풍속 | 파고 | 물때 | 수온출처 | 풍속출처 | 조석출처');
  console.log('─'.repeat(110));

  for(const sid of ALL_SIDS) {
    try {
      const w = await fetch(`http://localhost:5000/api/weather/precision?stationId=${sid}`, {
        headers:{Authorization:'Bearer '+token}
      }).then(r=>r.json());
      const score = scores[sid] || '?';
      const sstSrc = w._sources?.sst || 'N/A';
      const windSrc = w._sources?.wind || 'N/A';
      const tideSrc = w._sources?.tide || 'N/A';
      const flag = (sstSrc === 'fallback' || windSrc === 'fallback') ? ' ⚠️' : ' ✅';
      console.log(`${sid} | ${(w.name||'?').padEnd(14)} | ${String(score).padStart(3)}점 | ${String(w.sst||'?').padStart(5)}℃ | ${String(w.wind?.speed||'?').padStart(4)}m/s | ${String(w.wave?.coastal||'?').padStart(4)}m | ${(w.tide?.phase||'?').padEnd(8)} | ${sstSrc.padEnd(10)} | ${windSrc.padEnd(10)} | ${tideSrc}${flag}`);
    } catch(e) {
      console.log(`${sid} | ERROR: ${e.message}`);
    }
  }

  // 통계 요약
  const vals = Object.values(scores).map(Number);
  console.log('\n====== 통계 요약 ======');
  console.log(`총 관측소: ${vals.length}개`);
  console.log(`평균 점수: ${(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1)}점`);
  console.log(`최고 점수: ${Math.max(...vals)}점`);
  console.log(`최저 점수: ${Math.min(...vals)}점`);
  console.log(`5점(위험): ${vals.filter(v=>v===5).length}개`);
  console.log(`30점 미만: ${vals.filter(v=>v<30).length}개`);
  console.log(`60점 이상: ${vals.filter(v=>v>=60).length}개`);
}

run().catch(console.error);

const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 1, email: 'sunjulab.k', tier: 'MASTER' }, 'FishingGO_2024_Pr0d_S3cr3t!@#$xK9mQ');

async function checkAll() {
  const scoresRes = await fetch('http://localhost:5000/api/fishing-scores').then(r=>r.json());
  const scores = scoresRes.scores;

  const results = {
    '동해': [],
    '남해': [],
    '서해': [],
    '제주': []
  };

  for (const sid of Object.keys(scores)) {
    try {
      const wRes = await fetch(`http://localhost:5000/api/weather/precision?stationId=${sid}`, {
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await wRes.json();
      if (data.region && results[data.region]) {
        results[data.region].push({
           sid,
           name: data.name,
           score: scores[sid],
           sst: parseFloat(data.sst),
           wind: data.wind?.speed,
           wave: data.wave?.coastal,
           tidePhase: data.tide?.phase,
           sources: data._sources
        });
      }
    } catch(e) { }
  }

  // Print Summary
  for (const [region, list] of Object.entries(results)) {
    if (list.length === 0) continue;
    const avgScore = (list.reduce((a,b)=>a+b.score,0)/list.length).toFixed(1);
    const avgSst = (list.reduce((a,b)=>a+b.sst,0)/list.length).toFixed(1);
    const avgWind = (list.reduce((a,b)=>a+b.wind,0)/list.length).toFixed(1);
    const avgWave = (list.reduce((a,b)=>a+b.wave,0)/list.length).toFixed(1);

    console.log(`\n[${region}] 관측소: ${list.length}곳`);
    console.log(`평균 점수: ${avgScore}점 | 수온: ${avgSst}℃ | 풍속: ${avgWind}m/s | 파고: ${avgWave}m`);
    
    // Check fallback usage
    let windFallback = 0, waveFallback = 0, tideFallback = 0;
    list.forEach(x => {
        if (x.sources.wind === 'fallback') windFallback++;
        if (x.sources.tide === 'fallback') tideFallback++;
    });
    console.log(`풍속/파고 Fallback 의존: ${windFallback}/${list.length} 곳`);
    console.log(`조석 Fallback 의존: ${tideFallback}/${list.length} 곳`);
    console.log('--- 지점별 상세 ---');
    list.slice(0, 3).forEach(x => {
        console.log(`- ${x.name} (${x.sid}): ${x.score}점 (수온:${x.sst}℃, 파고:${x.wave}m, 바람:${x.wind}m/s, 물때:${x.tidePhase})`);
    });
  }
}

checkAll();

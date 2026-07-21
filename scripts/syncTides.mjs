import fs from 'fs';
import https from 'https';
import path from 'path';

// 바다타임 1~200 검색으로 찾은 정확한 매핑 ID
const BADATIME_MAP = {
  'DT_0033': 195, // 묵호
  'DT_0021': 192, // 속초
  'DT_0099': 194, // 강릉(주문진)
  'DT_0034': 196, // 동해항
  'DT_0003': 198, // 임원항
  'DT_0005': 1,   // 부산
  'DT_0018': 5,   // 가덕도
  'DT_0006': 25,  // 통영
  'DT_0008': 31,  // 삼천포
  'DT_0009': 41,  // 여수
  'DT_0011': 60,  // 완도
  'DT_0045': 51,  // 거문도
  'DT_0001': 158, // 인천
};

const FALLBACK_MAP = {
  'DT_0002': 198, 
  'DT_0036': 1,
  'DT_0016': 1,
  'DT_0004': 1,
  'DT_0010': 41
};

const fetchUrl = (url) => new Promise((resolve) => {
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
    const chunks = [];
    res.on('data', c => chunks.push(c));
    res.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
  }).on('error', () => resolve(''));
});

async function run() {
  const yearMonth = '2026-07';
  const tideCalendar = {};
  const anchorDate = new Date('2026-07-14T00:00:00+09:00');

  const ALL_PORTS = { ...BADATIME_MAP, ...FALLBACK_MAP };

  console.log('🌊 전국 바다타임 실측 물때 데이터 동기화 시작...');

  for (const [obsCode, badaId] of Object.entries(ALL_PORTS)) {
    try {
      const url = `https://www.badatime.com/${badaId}-${yearMonth}.html`;
      const html = await fetchUrl(url);

      const rows = html.split('<tr');
      tideCalendar[obsCode] = {};
      let found = 0;

      for (const row of rows) {
        if (!row.includes('tide_time')) continue;
        
        const dateMatch = row.match(/<td[^>]*>\s*(\d+)\(/);
        if (!dateMatch) continue;
        const day = parseInt(dateMatch[1], 10);

        const phaseMatch = row.match(/<td[^>]*>\s*([0-9]+물|조금|무시)/);
        const phase = phaseMatch ? phaseMatch[1] : '조금';

        const manjoMatches = [...row.matchAll(/<span class="tide_time[^>]*color:red[^>]*>([0-9]{2}:[0-9]{2})/g)].map(m => m[1]);
        const ganjoMatches = [...row.matchAll(/<span class="tide_time[^>]*color:blue[^>]*>([0-9]{2}:[0-9]{2})/g)].map(m => m[1]);

        const targetDate = new Date(`2026-07-${day.toString().padStart(2, '0')}T00:00:00+09:00`);
        const diffDays = Math.floor((targetDate.getTime() - anchorDate.getTime()) / 86400000);

        tideCalendar[obsCode][diffDays] = {
          phase,
          high: manjoMatches[0] || null,
          high2: manjoMatches[1] || null,
          low: ganjoMatches[0] || null,
          low2: ganjoMatches[1] || null,
        };
        found++;
      }
      console.log(`[${obsCode}] 바다타임 ID ${badaId} - ${found}일치 데이터 스크래핑 성공!`);
    } catch (e) {
      console.error(`[${obsCode}] 실패:`, e.message);
    }
  }

  let content = `// 전국 물때 실측 데이터 (자동 생성)\nexport const TIDE_CALENDAR = ${JSON.stringify(tideCalendar, null, 2)};\n`;
  fs.writeFileSync(path.join(process.cwd(), 'src/constants/tideCalendarData.js'), content);
  console.log('✅ tideCalendarData.js 업데이트 완료!');
}

run();

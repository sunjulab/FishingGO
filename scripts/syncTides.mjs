import fs from 'fs';
import https from 'https';
import path from 'path';

// ✅ 올바른 바다타임 ID 매핑 (2026-10-03 전수조사 검증 완료)
const BADATIME_MAP = {
  // ── 동해권 ──
  'DT_0099': 191,  // 고성 가진항 → 거진
  'DT_0021': 192,  // 속초 영금정 → 속초
  'DT_0001': 195,  // 강릉 안목항 → 묵호(동해 최근접 관측소)
  'DT_0033': 195,  // 동해 묵호 → 묵호
  'DT_0003': 197,  // 삼척항 → 삼척항
  'DT_0002': 203,  // 울진 후포 → 후포
  'DT_0036': 211,  // 경주 감포 → 감포
  // ── 남해권 ──
  'DT_0004': 1,    // 부산 해운대 → 부산
  'DT_0034': 20,   // 거제 지세포 → 지세포항
  'DT_0016': 25,   // 통영 도남 → 통영
  'DT_0014': 39,   // 광양만 → 광양
  'DT_0005': 41,   // 여수 국동항 → 여수
  'DT_0018': 60,   // 완도항 → 완도
  // ── 서해권 ──
  'DT_0006': 105,  // 목포항 → 목포
  'DT_0030': 136,  // 태안 마도 → 학암포(태안 마도 최근접, 만조 6분 오차)
  'DT_0008': 126,  // 보령 대천항 → 대천항
  'DT_0009': 118,  // 군산 비응항 → 비응항
  'DT_0007': 158,  // 인천 연안부두 → 인천
  // ── 제주권 ──
  'DT_0045': 71,   // 성산포항 → 성산포
  'DT_0011': 72,   // 서귀포 외돌개 → 서귀포
  'DT_0010': 77,   // 제주 한림 → 한림항
};

// 물때 번호 → 물때 이름 (바다타임 표기 기준)
function buildPhase(num) {
  if (num === 15 || num === 0) return '조금';
  if (num === 8) return '7물(사리)'; // 사리 전날 = 7물
  if (num === 9) return '8물(사리)'; // 사리 = 8물
  return `${num}물`;
}

const fetchUrl = (url) => new Promise((resolve) => {
  https.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html',
      'Accept-Language': 'ko-KR,ko;q=0.9',
    },
    timeout: 15000
  }, res => {
    const chunks = [];
    res.on('data', c => chunks.push(c));
    res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  }).on('error', () => resolve(''));
});

/**
 * 바다타임 HTML 파서
 * - <tr> 블록 단위로 날짜별 데이터 추출
 * - 만조: color="#FF0000", 간조: color="#0000FF"
 * - 물때: 숫자 물 / 조금 / 무시 (HTML 엔티티 &nbsp; 뒤에 위치)
 */
function parseBadatimeHtml(html, yearMonth, anchorDate) {
  const result = {};
  const [year, month] = yearMonth.split('-').map(Number);

  // <tr> 단위로 분리
  const trBlocks = html.split(/<tr\b/i).slice(1);

  for (const block of trBlocks) {
    // 날짜 추출
    const dayMatch = block.match(/<b>\s*(\d{1,2})\s*<\/b>/i);
    if (!dayMatch) continue;
    const day = parseInt(dayMatch[1], 10);
    if (day < 1 || day > 31) continue;

    // 물때 추출 - "NN 물 &nbsp;" 또는 "조금" / "무시" 형태
    // 실제 HTML: <td align="right">13 물 &nbsp; </td> 또는 조금이 다른 블록에 있음
    // 더 넓은 패턴으로 물때 번호 또는 이름 찾기
    const phaseMatch = 
      block.match(/align="right">\s*(\d+)\s*물\s*&nbsp;/i) ||
      block.match(/>\s*(\d+)물\s*&nbsp;/i) ||
      block.match(/>\s*(조금|무시)\s*&nbsp;/i) ||
      block.match(/>\s*(\d+)\s*물\s*<\//i) ||
      block.match(/>\s*(조금|무시)\s*<\//i);

    let phase = null;
    if (phaseMatch) {
      const raw = phaseMatch[1];
      const num = parseInt(raw);
      if (!isNaN(num)) {
        // 사리 표기 처리
        if (num === 7) phase = '7물(사리)';
        else if (num === 8) phase = '8물(사리)';
        else phase = `${num}물`;
      } else {
        phase = raw; // '조금' or '무시'
      }
    }

    // phase가 없어도 시간 데이터는 저장 (phase를 음력으로 보완 가능)
    // 만조 시간 (FF0000) - 조위 자릿수에 따라 &nbsp;가 0~2개, 음수 조위(-3 등)도 존재 → 모두 허용
    const manjoMatches = [...block.matchAll(/(\d{2}:\d{2})\s*\((?:&nbsp;|\s)*-?\d+\)\s*<font[^>]*color="#FF0000"/gi)]
      .map(m => m[1])
      .filter(t => /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(t));

    // 간조 시간 (0000FF) - 한 자리/음수 조위(예: "(&nbsp;&nbsp;9)", "(-3)")가 누락되던 버그 수정
    const ganjoMatches = [...block.matchAll(/(\d{2}:\d{2})\s*\((?:&nbsp;|\s)*-?\d+\)\s*<font[^>]*color="#0000FF"/gi)]
      .map(m => m[1])
      .filter(t => /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(t));

    // 시간이 하나라도 있으면 저장
    if (manjoMatches.length === 0 && ganjoMatches.length === 0 && !phase) continue;

    const targetDate = new Date(`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}T00:00:00+09:00`);
    const diffDays = Math.round((targetDate.getTime() - anchorDate.getTime()) / 86400000);

    // phase가 null이면 음력 계산으로 보완 (Lunar.fromDate 없이 단순 계산)
    // 앱 코드와 동일: tideNum = ((lunarDay + 6) % 15) + 1
    // 여기서는 바다타임 HTML에서 직접 가져오므로 null 허용

    result[diffDays] = {
      phase: phase || '?',
      high:  manjoMatches[0] || null,
      high2: manjoMatches[1] || null,
      low:   ganjoMatches[0] || null,
      low2:  ganjoMatches[1] || null,
    };
  }

  return result;
}

async function run() {
  const anchorDate = new Date('2026-07-14T00:00:00+09:00');

  // 2026-08 ~ 2027-03 커버
  const months = [
    '2026-08', '2026-09', '2026-10', '2026-11', '2026-12',
    '2027-01', '2027-02', '2027-03'
  ];

  const tideCalendar = {};
  let grandTotal = 0;

  console.log('🌊 전국 바다타임 물때 데이터 동기화 시작...');
  console.log(`대상 관측소: ${Object.keys(BADATIME_MAP).length}개`);
  console.log(`대상 기간: ${months[0]} ~ ${months[months.length-1]}\n`);

  for (const [obsCode, badaId] of Object.entries(BADATIME_MAP)) {
    tideCalendar[obsCode] = {};
    let stationTotal = 0;

    for (const yearMonth of months) {
      const url = `https://www.badatime.com/${badaId}-${yearMonth}.html`;

      const html = await fetchUrl(url);
      if (!html || html.length < 1000) {
        console.warn(`  ⚠️  [${obsCode}] ${yearMonth} 빈/짧은 응답 (${html.length}자)`);
        continue;
      }

      const monthData = parseBadatimeHtml(html, yearMonth, anchorDate);
      const count = Object.keys(monthData).length;
      Object.assign(tideCalendar[obsCode], monthData);
      stationTotal += count;

      const status = count >= 25 ? '✅' : count > 0 ? '⚠️' : '❌';
      process.stdout.write(`  ${status} [${obsCode}] ID=${badaId} ${yearMonth}: ${count}일\n`);

      await new Promise(r => setTimeout(r, 200));
    }

    grandTotal += stationTotal;
    console.log(`  → 소계: ${stationTotal}일\n`);
  }

  // 결과 저장
  const content = [
    `// 전국 물때 실측 데이터 (바다타임 기준, 자동 생성 ${new Date().toISOString().slice(0,10)})`,
    `// anchor: 2026-07-14T00:00:00+09:00 (음력 6월 1일)`,
    `// 바다타임 ID 매핑: ${JSON.stringify(BADATIME_MAP)}`,
    `export const TIDE_CALENDAR = ${JSON.stringify(tideCalendar, null, 2)};`,
  ].join('\n') + '\n';

  const outPath = path.join(process.cwd(), 'src/constants/tideCalendarData.js');
  fs.writeFileSync(outPath, content);

  console.log(`\n✅ tideCalendarData.js 업데이트 완료!`);
  console.log(`   관측소: ${Object.keys(tideCalendar).length}개`);
  console.log(`   날짜 항목: ${grandTotal}개`);
  console.log(`   파일 크기: ${(fs.statSync(outPath).size/1024).toFixed(1)}KB`);
}

run().catch(console.error);

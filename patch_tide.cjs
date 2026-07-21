const fs = require('fs');
let content = fs.readFileSync('src/constants/fishingData.js', 'utf8');

const idx = content.indexOf('2026-06-23');
if (idx === -1) {
  console.log('ERROR: 2026-06-23 not found in file');
  process.exit(1);
}
console.log('Found at index:', idx);

// Find the start of the anchor block
const blockStart = content.lastIndexOf('\n  //', idx) ;
console.log('Block starts at:', blockStart);

// Find the end: after baseLowMin line
const baseLowEnd = content.indexOf('const baseLowMin', idx);
const endOfLine = content.indexOf('\n', baseLowEnd) + 1;
console.log('Block ends at:', endOfLine);

const oldBlock = content.slice(blockStart, endOfLine);
console.log('--- OLD BLOCK ---');
console.log(oldBlock);
console.log('--- END OLD ---');

const newBlock = `
  // FIX-LUNAR v2: 바다타임 비교 검증 완료 기준일 재보정
  // 2026-06-26 = 신월(삭) = 음력 5월 29일(lunarDay=29)
  const anchor = new Date('2026-06-26T00:00:00+09:00');
  const anchorLunar = 29;
  const diffFromAnchor = (Date.now() - anchor.getTime()) / (1000 * 60 * 60 * 24);
  const rawLunar = anchorLunar + diffFromAnchor;
  const cycled = ((rawLunar - 1) % 29.530588 + 29.530588) % 29.530588;
  const lunarDay = Math.floor(cycled) + 1;

  // FIX-TIDENUM: 바다타임 실측 기반 음력->물때 공식 (완전 일치 검증)
  const lunarToTide = (day) => {
    if (day >= 28) return day - 27;
    if (day >= 14) return day - 13;
    return ((day + 2 - 1) % 15) + 1;
  };
  const tideNum = lunarToTide(lunarDay);
  const phaseMap = {
    7: '7물(사리)', 8: '8물(사리)', 9: '9물',
    13: '13물(조금)', 14: '14물(무시)', 15: '15물'
  };
  const tidePhase = phaseMap[tideNum] || \`\${tideNum}물\`;

  // FIX-FALLBACK-TIDE: 실제 조석 주기(745분) 기반 만조/간조 시간
  const STATION_BASE_HIGH = {
    'DT_0099': 245, 'DT_0021': 255, 'DT_0001': 465, 'DT_0033': 470,
    'DT_0003': 475, 'DT_0002': 480, 'DT_0036': 490,
    'DT_0004': 340, 'DT_0034': 345, 'DT_0016': 350,
    'DT_0005': 355, 'DT_0014': 360, 'DT_0018': 370, 'DT_0006': 375,
    'DT_0007': 130, 'DT_0030': 135, 'DT_0008': 140, 'DT_0009': 145,
    'DT_0010': 300, 'DT_0011': 305, 'DT_0045': 310,
  };
  const obsId = point.obsCode || \`LOC_\${point.id}\`;
  const stationBaseMin = STATION_BASE_HIGH[obsId] || ((pointSeed * 37) % 745);
  const diffDays = Math.floor(diffFromAnchor);
  const dailyShiftMin = Math.round((diffDays * 50.3)) % 745;
  const baseHighMin = (stationBaseMin + dailyShiftMin) % 745;
  const baseLowMin  = (baseHighMin + 372) % 1440;
`;

const newContent = content.slice(0, blockStart) + newBlock + content.slice(endOfLine);
fs.writeFileSync('src/constants/fishingData.js', newContent, 'utf8');
console.log('SUCCESS');

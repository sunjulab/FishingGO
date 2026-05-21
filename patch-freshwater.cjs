const fs = require('fs');
let c = fs.readFileSync('src/pages/MapHome.jsx', 'utf8');
const hasCRLF = c.includes('\r\n');
let text = c.replace(/\r\n/g, '\n');

const OLD = `    const base = filter === '전체'
      ? [...ALL_FISHING_POINTS]
      : ALL_FISHING_POINTS.filter(p => p.type === filter);`;

const NEW = `    const base = filter === '전체'
      ? ALL_FISHING_POINTS.filter(p => p.type !== '민물') // ✅ 민물 포인트 제외 (날씨·물때 점수 미지원)
      : ALL_FISHING_POINTS.filter(p => p.type === filter);`;

if (!text.includes(OLD)) {
  console.error('NOT FOUND');
  process.exit(1);
}
text = text.replace(OLD, NEW);
if (hasCRLF) text = text.replace(/\n/g, '\r\n');
fs.writeFileSync('src/pages/MapHome.jsx', text, 'utf8');
console.log('✅ 민물 포인트 우수포인트 목록 제외 완료');

const fs = require('fs');
const c = fs.readFileSync('src/constants/fishingData.js', 'utf8');
const lines = c.split('\n');
lines.slice(0, 5).forEach((l, i) => console.log((i+1)+':', l.slice(0,100)));

// 포인트 타입 확인
const typeMatches = [];
c.replace(/type:\s*['"]([^'"]+)['"]/g, (_, t) => { typeMatches.push(t); });
const types = [...new Set(typeMatches)];
console.log('포인트 타입들:', types);

// ALL_FISHING_POINTS 포함 여부
console.log('ALL_FISHING_POINTS 포함:', c.includes('ALL_FISHING_POINTS'));
console.log('freshwater 포함:', c.includes('freshwater') || c.includes('민물'));

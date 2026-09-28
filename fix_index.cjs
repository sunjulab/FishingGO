const fs = require('fs');
let code = fs.readFileSync('server/index.js', 'utf8');
let lines = code.split('\n');
// Find getRealTide and the bad block
let startIdx = lines.findIndex(l => l.includes('const coords = STATION_COORDS[sid];') && !l.includes('spotLocation'));
let endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('tideSid = getNearestKhoaStation(coords.lat, coords.lng)'));
let closingIdx = lines.findIndex((l, i) => i > endIdx && l.trim() === '}');
if (startIdx !== -1 && endIdx !== -1 && closingIdx !== -1) {
    // Check it is the right block (should be inside getRealTide)
    console.log('Block found from', startIdx, 'to', closingIdx);
    console.log('Lines:', lines.slice(startIdx, closingIdx+1).join('\n'));
    lines.splice(startIdx, closingIdx - startIdx + 1, '  let tideSid = sid; // use the passed-in code directly');
    fs.writeFileSync('server/index.js', lines.join('\n'), 'utf8');
    console.log('Fixed getRealTide in server/index.js');
} else {
    console.log('Block not found. startIdx:', startIdx, 'endIdx:', endIdx);
}

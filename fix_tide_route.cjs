const fs = require('fs');
let code = fs.readFileSync('server/routes/tide.js', 'utf8');
// Find the block by line index
let lines = code.split('\n');
let startIdx = lines.findIndex(l => l.includes('let tideSid = obsCode;'));
let endIdx = lines.findIndex((l, i) => i > startIdx && (l.includes('if (coords) tideSid = getNearestKhoaStation')));
if (startIdx !== -1 && endIdx !== -1) {
    // Remove lines startIdx-1 through endIdx+1 (the if block)
    lines.splice(startIdx + 1, endIdx - startIdx + 1);
    fs.writeFileSync('server/routes/tide.js', lines.join('\n'), 'utf8');
    console.log('Fixed: removed getNearestKhoaStation remap block from tide.js. Start:', startIdx, 'End:', endIdx);
} else {
    console.log('Block not found. startIdx:', startIdx, 'endIdx:', endIdx);
    const i = lines.findIndex(l => l.includes('tideSid'));
    console.log('tideSid lines:', lines.slice(i, i+6).join('\n'));
}

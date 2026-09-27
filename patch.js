const fs = require('fs');
const path = 'server/index.js';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// 1. Fix getMarineWeatherOpenMeteoPoint (Line 2348)
lines[2347] = '    const nowHr = new Date(Date.now() + 9 * 3600000).getUTCHours();';

// 2. Fix getKmaUltraSrtNcst (Line 2654 - 2661)
const newKmaLogic =     const d = new Date(Date.now() + 9 * 3600000);
    let h = d.getUTCHours();
    if (d.getUTCMinutes() < 40) d.setUTCHours(h - 1);
    const dStr = [d.getUTCFullYear(), String(d.getUTCMonth()+1).padStart(2,'0'), String(d.getUTCDate()).padStart(2,'0')].join('');
    h = d.getUTCHours();
    const tStr = String(h).padStart(2,'0') + '00';;

lines.splice(2653, 9, newKmaLogic);

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('patched successfully');

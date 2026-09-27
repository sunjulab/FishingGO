
const fs = require('fs');
let code = fs.readFileSync('server/index.js', 'utf8');
code = code.replace(/wind:\s*marine\s*\?\s*'KMA_BUOY'\s*:\s*'fallback',/, 'wind: (rainSnow && rainSnow.wsd !== null) ? \u0027KMA_ULTRASRT_PRECISION\u0027 : (marine ? \u0027KMA_BUOY\u0027 : \u0027fallback\u0027),');
fs.writeFileSync('server/index.js', code, 'utf8');


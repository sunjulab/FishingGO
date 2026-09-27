const fs = require('fs');
let code = fs.readFileSync('server/index.js', 'utf8');

// fix OpenMeteo
code = code.replace(
  'const nowHr = new Date().getHours();',
  'const nowHr = new Date(Date.now() + 9 * 3600000).getUTCHours();'
);

// fix KMA UltraSrtNcst
code = code.replace(
  /const d = new Date\(\);\s*const dStr = \[d\.getFullYear\(\), String\(d\.getMonth\(\)\+1\)\.padStart\(2,'0'\), String\(d\.getDate\(\)\)\.padStart\(2,'0'\)\]\.join\(''\);\s*let h = d\.getHours\(\);\s*if \(d\.getMinutes\(\) < 40\) h -= 1;/g,
  const d = new Date(Date.now() + 9 * 3600000);
      if (d.getUTCMinutes() < 40) d.setUTCHours(d.getUTCHours() - 1);
      const dStr = [d.getUTCFullYear(), String(d.getUTCMonth()+1).padStart(2,'0'), String(d.getUTCDate()).padStart(2,'0')].join('');
      let h = d.getUTCHours();
);

fs.writeFileSync('server/index.js', code, 'utf8');
console.log('patched');

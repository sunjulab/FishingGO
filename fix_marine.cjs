const fs = require('fs');
let code = fs.readFileSync('src/api/marineApi.js', 'utf8');

code = code.replace(/function getKhoaObsCode\(kmaCode\) \{[\s\S]*?return nearest\.id;\n\}/m, "function getKhoaObsCode(kmaCode) { return kmaCode.replace('KHOA_', ''); }");

fs.writeFileSync('src/api/marineApi.js', code, 'utf8');
console.log('Fixed getKhoaObsCode');

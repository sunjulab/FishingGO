const fs = require('fs');
let code = fs.readFileSync('server/index.js', 'utf8');

const regex = /\/\/[^\n]*KHOA[^\n]*\nconst KHOA_STATIONS = \[[\s\S]*?\];\n\nfunction getNearestKhoaStation\(lat, lng\) \{[\s\S]*?return nearest\.id;\n\}\n/m;
if (regex.test(code)) {
    code = code.replace(regex, '');
    fs.writeFileSync('server/index.js', code, 'utf8');
    console.log('Successfully removed KHOA_STATIONS');
} else {
    console.log('Regex did not match.');
}

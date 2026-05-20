const fs = require('fs');
let c = fs.readFileSync('android/app/build.gradle', 'utf8');
c = c.replace('versionCode 59', 'versionCode 60');
c = c.replace('versionName "2.0.0"', 'versionName "2.0.1"');
fs.writeFileSync('android/app/build.gradle', c);
console.log('v2.0.1 (60) 버전 업 완료');

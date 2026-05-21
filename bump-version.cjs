const fs = require('fs');
let c = fs.readFileSync('android/app/build.gradle', 'utf8');
c = c.replace('versionCode 60', 'versionCode 61');
c = c.replace('versionName "2.0.1"', 'versionName "2.0.2"');
fs.writeFileSync('android/app/build.gradle', c);
console.log('v2.0.2 (61) 버전 업 완료');

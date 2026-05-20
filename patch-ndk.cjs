const fs = require('fs');
let c = fs.readFileSync('android/app/build.gradle', 'utf8');
const hasCRLF = c.includes('\r\n');
let text = c.replace(/\r\n/g, '\n');

// proguardFiles 줄 바로 뒤에 ndk 블록 삽입
const TARGET = "            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'\n        }";
const REPLACEMENT = "            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'\n            // \u2705 Play Store \ub514\ubc84\uadf8 \uc2ec\ubcfc \uacbd\uace0 \uc81c\uac70 \u2014 \ub124\uc774\ud2f0\ube0c \uc2ec\ubcfc AAB\uc5d0 \uc790\ub3d9 \ud3ec\ud568\n            ndk { debugSymbolLevel 'FULL' }\n        }";

if (!text.includes(TARGET)) {
  console.error('NOT FOUND');
  console.log('Context:', JSON.stringify(text.slice(text.indexOf('buildTypes'), text.indexOf('buildTypes') + 400)));
  process.exit(1);
}
text = text.replace(TARGET, REPLACEMENT);
if (hasCRLF) text = text.replace(/\n/g, '\r\n');
fs.writeFileSync('android/app/build.gradle', text, 'utf8');
console.log('OK - ndk debugSymbolLevel FULL 추가 완료');

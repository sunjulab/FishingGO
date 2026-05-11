/**
 * 앱 아이콘 자동 생성 스크립트
 * 사용법: node scripts/generate-icons.js
 * 필요: npm install jimp  (또는 sharp)
 */

const path = require('path');
const fs   = require('fs');

// ── Android mipmap density 별 사이즈 ───────────────────────────────────────
// 표준 launcher icon (ic_launcher, ic_launcher_round)
const DENSITIES = [
  { dir: 'mipmap-ldpi',    size: 36  },
  { dir: 'mipmap-mdpi',    size: 48  },
  { dir: 'mipmap-hdpi',    size: 72  },
  { dir: 'mipmap-xhdpi',   size: 96  },
  { dir: 'mipmap-xxhdpi',  size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

// adaptive icon foreground (108dp 기준, content는 center 66dp)
const FOREGROUND_DENSITIES = [
  { dir: 'mipmap-ldpi',    size: 81  },
  { dir: 'mipmap-mdpi',    size: 108 },
  { dir: 'mipmap-hdpi',    size: 162 },
  { dir: 'mipmap-xhdpi',   size: 216 },
  { dir: 'mipmap-xxhdpi',  size: 324 },
  { dir: 'mipmap-xxxhdpi', size: 432 },
];

const RES_DIR   = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const SRC_ICON  = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', 'icon-source.png');

async function main() {
  let Jimp;
  try {
    Jimp = require('jimp');
  } catch (e) {
    console.error('❌ jimp not found. Run: npm install jimp --save-dev');
    process.exit(1);
  }

  if (!fs.existsSync(SRC_ICON)) {
    console.error(`❌ Source icon not found: ${SRC_ICON}`);
    console.error('   icon-source.png (1024x1024) 파일을 android/app/src/main/res/ 에 넣어주세요.');
    process.exit(1);
  }

  console.log('📱 아이콘 생성 시작...\n');
  const img = await Jimp.read(SRC_ICON);

  // ── 일반 launcher 아이콘 ───────────────────────────────────────────────
  for (const { dir, size } of DENSITIES) {
    const outDir = path.join(RES_DIR, dir);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const resized = img.clone().resize(size, size, Jimp.RESIZE_LANCZOS3);

    // ic_launcher (rounded square by Android system)
    await resized.clone().writeAsync(path.join(outDir, 'ic_launcher.png'));
    // ic_launcher_round
    await resized.clone().writeAsync(path.join(outDir, 'ic_launcher_round.png'));

    console.log(`  ✅ ${dir.padEnd(20)} ${size}×${size}px  → ic_launcher.png + ic_launcher_round.png`);
  }

  // ── Adaptive foreground 아이콘 ─────────────────────────────────────────
  console.log('');
  for (const { dir, size } of FOREGROUND_DENSITIES) {
    const outDir = path.join(RES_DIR, dir);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const resized = img.clone().resize(size, size, Jimp.RESIZE_LANCZOS3);
    await resized.writeAsync(path.join(outDir, 'ic_launcher_foreground.png'));

    console.log(`  ✅ ${dir.padEnd(20)} ${size}×${size}px  → ic_launcher_foreground.png`);
  }

  console.log('\n🎉 완료! npx cap sync android 후 AAB 빌드하세요.');
}

main().catch(err => { console.error(err); process.exit(1); });

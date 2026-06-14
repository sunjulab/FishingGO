#!/usr/bin/env node
// build-esbuild.mjs — esbuild 직접 빌드 (Rollup WASM 오류 회피)
// ✅ CACHE-BUST: 콘텐츠 해시 파일명 적용 — index-HASH8.js → CDN/브라우저 캐시 자동 갱신
import * as esbuild from 'esbuild';
import {
  readFileSync, writeFileSync, existsSync,
  mkdirSync, readdirSync, statSync, copyFileSync, unlinkSync,
} from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ✅ 일관된 빌드 타임스탬프 (define과 version.json 간의 불일치 방지)
const GLOBAL_BUILD_TIMESTAMP = Date.now().toString();

// ── 환경변수 파싱 (CRLF 안전, BOM 제거) ─────────────────────────────────────
function parseEnvFile(p) {
  if (!existsSync(p)) return {};
  const obj = {};
  const content = readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) obj[m[1].trim()] = m[2].trim();
  }
  return obj;
}

// ✅ 콘텐츠 해시 계산 (SHA256 앞 8자리)
function contentHash(buf) {
  return createHash('sha256').update(buf).digest('hex').slice(0, 8);
}

// ✅ 이전 해시 파일 정리 (index-*.js, index-*.css)
function cleanOldHashedFiles(dir, pattern) {
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir)) {
    if (pattern.test(f)) {
      try { unlinkSync(join(dir, f)); } catch {}
    }
  }
}

// ✅ 프로덕션 빌드: .env.production 우선
const envBase = parseEnvFile('.env');
const envProd = parseEnvFile('.env.production');
const e = process.env; // ✅ CI 환경(GitHub Actions 등) fallback

const kakaoAppKey      = e.VITE_KAKAO_APP_KEY          || envProd.VITE_KAKAO_APP_KEY          || envBase.VITE_KAKAO_APP_KEY          || '';
const siteUrl          = e.VITE_SITE_URL               || envProd.VITE_SITE_URL               || envBase.VITE_SITE_URL               || 'https://www.fishing-go.com';
const apiUrl           = e.VITE_API_URL                || envProd.VITE_API_URL                || envBase.VITE_API_URL                || 'https://fishing-go-backend.onrender.com';
const tideKey          = e.VITE_TIDE_API_KEY           || envProd.VITE_TIDE_API_KEY           || envBase.VITE_TIDE_API_KEY           || '';
const admobTesting     = e.VITE_ADMOB_TESTING          || envProd.VITE_ADMOB_TESTING          || envBase.VITE_ADMOB_TESTING          || 'false';
const portoneId        = e.VITE_PORTONE_MERCHANT_ID    || envProd.VITE_PORTONE_MERCHANT_ID    || envBase.VITE_PORTONE_MERCHANT_ID    || '';
const portoneKey       = e.VITE_PORTONE_CHANNEL_KEY    || envProd.VITE_PORTONE_CHANNEL_KEY    || envBase.VITE_PORTONE_CHANNEL_KEY    || '';
const adsenseDisplay   = e.VITE_ADSENSE_SLOT_DISPLAY   || envProd.VITE_ADSENSE_SLOT_DISPLAY   || envBase.VITE_ADSENSE_SLOT_DISPLAY   || '';
const adsenseInfeed    = e.VITE_ADSENSE_SLOT_INFEED    || envProd.VITE_ADSENSE_SLOT_INFEED    || envBase.VITE_ADSENSE_SLOT_INFEED    || '';
const coupangPartnersId = e.VITE_COUPANG_PARTNERS_ID   || envProd.VITE_COUPANG_PARTNERS_ID    || envBase.VITE_COUPANG_PARTNERS_ID    || '';

// ✅ AUTO-VERSION
const appVersion = JSON.parse(readFileSync('package.json', 'utf8')).version;

// ── dist 초기화 ──────────────────────────────────────────────────────────────
mkdirSync('dist/assets', { recursive: true });

// ✅ 이전 해시 파일 정리
cleanOldHashedFiles('dist/assets', /^index-[0-9a-f]{8}\.(js|css)$/);

console.log('🚀 esbuild 빌드 시작 (API:', apiUrl, ')');

// ── JS 번들 (임시 파일로 먼저 빌드) ─────────────────────────────────────────
console.log('▶ JS 번들링...');
await esbuild.build({
  entryPoints: ['src/main.jsx'],
  bundle: true,
  outfile: 'dist/assets/index.js',   // 임시 파일
  platform: 'browser',
  format: 'esm',
  target: ['es2020', 'chrome80'],
  jsx: 'automatic',
  jsxImportSource: 'react',
  loader: {
    '.jsx': 'jsx', '.js': 'js', '.ts': 'ts', '.tsx': 'tsx',
    '.css': 'empty',
    '.png': 'dataurl', '.jpg': 'dataurl', '.jpeg': 'dataurl',
    '.gif': 'dataurl', '.webp': 'dataurl', '.ico': 'dataurl',
    '.svg': 'dataurl',
    '.woff': 'dataurl', '.woff2': 'dataurl', '.ttf': 'dataurl',
  },
  define: {
    '__BUILD_TIMESTAMP__': JSON.stringify(GLOBAL_BUILD_TIMESTAMP),
    'process.env.NODE_ENV':  '"production"',
    'import.meta.env': JSON.stringify({
      PROD: true, DEV: false, SSR: false, MODE: 'production', BASE_URL: '/',
      VITE_API_URL:               apiUrl,
      VITE_KAKAO_APP_KEY:         kakaoAppKey,
      VITE_TIDE_API_KEY:          tideKey,
      VITE_SITE_URL:              siteUrl,
      VITE_ADMOB_TESTING:         admobTesting,
      VITE_PORTONE_MERCHANT_ID:   portoneId,
      VITE_PORTONE_CHANNEL_KEY:   portoneKey,
      VITE_ADSENSE_SLOT_DISPLAY:  adsenseDisplay,
      VITE_ADSENSE_SLOT_INFEED:   adsenseInfeed,
      VITE_COUPANG_PARTNERS_ID:   coupangPartnersId,
      VITE_DISABLE_PWA:           'true',
    }),
    '__APP_VERSION__': JSON.stringify(appVersion),
  },
  minify: true,
  treeShaking: true,
  logLevel: 'warning',
  mainFields: ['browser', 'module', 'main'],
  conditions: ['browser', 'import', 'module', 'default'],
});

// ✅ 콘텐츠 해시로 파일명 변경
const jsBuf  = readFileSync('dist/assets/index.js');
const jsHash = contentHash(jsBuf);
const jsHashedName = `index-${jsHash}.js`;
writeFileSync(`dist/assets/${jsHashedName}`, jsBuf);
// index.js는 Capacitor Android용으로 유지 (WebView 로컬 로드)
console.log(`✅ JS: ${jsHashedName} (${(jsBuf.length / 1024 / 1024).toFixed(2)} MB)`);

// ── CSS 번들 ─────────────────────────────────────────────────────────────────
console.log('▶ CSS 복사...');
let cssHashedName = 'index.css';
if (existsSync('src/index.css')) {
  const cssBuf = readFileSync('src/index.css');
  const cssHash = contentHash(cssBuf);
  cssHashedName = `index-${cssHash}.css`;
  writeFileSync(`dist/assets/${cssHashedName}`, cssBuf);
  copyFileSync('src/index.css', 'dist/assets/index.css'); // Android용 유지
  console.log(`✅ CSS: ${cssHashedName} (${(cssBuf.length / 1024).toFixed(1)} KB)`);
}

// ── Public 복사 ───────────────────────────────────────────────────────────────
function copyDir(src, dst) {
  if (!existsSync(src)) return;
  mkdirSync(dst, { recursive: true });
  for (const item of readdirSync(src)) {
    const s = join(src, item), d = join(dst, item);
    statSync(s).isDirectory() ? copyDir(s, d) : copyFileSync(s, d);
  }
}
copyDir('public', 'dist');
console.log('✅ Public 복사 완료');

// ── index.html 처리 — 해시 파일명 참조 ─────────────────────────────────────
let html = readFileSync('index.html', 'utf8');
html = html.replace(/__VITE_KAKAO_APP_KEY__/g, JSON.stringify(kakaoAppKey));
html = html.replace(/__VITE_SITE_URL__/g, siteUrl);
// ✅ CACHE-BUST: 콘텐츠 해시 파일명으로 교체 — CDN/브라우저 캐시 자동 무효화
html = html.replace(
  /<script type="module" src="\/src\/main\.jsx"><\/script>/,
  `<link rel="stylesheet" href="/assets/${cssHashedName}" />\n    <script type="module" src="/assets/${jsHashedName}"></script>`
);
writeFileSync('dist/index.html', html, 'utf8');
console.log('✅ index.html →', jsHashedName);

// ── 요약 ─────────────────────────────────────────────────────────────────────
console.log(`\n🎉 빌드 성공! (v${appVersion})`);
console.log(`   JS : dist/assets/${jsHashedName}  (${(jsBuf.length / 1024 / 1024).toFixed(2)} MB)`);
console.log(`   CSS: dist/assets/${cssHashedName}`);
console.log(`   HTML: dist/index.html`);

// ✅ CACHE-BUST: 모바일 캐시 회피용 version.json 생성
const versionJsonData = JSON.stringify({
  version: appVersion,
  timestamp: GLOBAL_BUILD_TIMESTAMP
});
writeFileSync('dist/version.json', versionJsonData, 'utf8');
console.log(`✅ version.json 생성 완료`);

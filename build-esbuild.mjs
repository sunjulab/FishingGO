#!/usr/bin/env node
// build-esbuild.mjs — esbuild 직접 빌드 (Rollup WASM 오류 회피)
// 핵심: rmSync 없이 파일 덮어쓰기, 상대경로 사용
import * as esbuild from 'esbuild';
import {
  readFileSync, writeFileSync, existsSync,
  mkdirSync, readdirSync, statSync, copyFileSync,
} from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── 환경변수 파싱 (CRLF 안전, BOM 제거) ─────────────────────────────────────
function parseEnvFile(p) {
  if (!existsSync(p)) return {};
  const obj = {};
  // BOM 제거 후 CRLF/LF 모두 처리
  const content = readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) obj[m[1].trim()] = m[2].trim();
  }
  return obj;
}

// ✅ 프로덕션 빌드: .env.local 완전 제외 (로컬 개발 설정이 배포에 혼입되는 버그 방지)
// .env.production이 최우선, .env는 기본값
const envBase = parseEnvFile('.env');
const envProd = parseEnvFile('.env.production');

// .env.production 값이 있으면 무조건 우선, 없으면 .env 기본값, 없으면 하드코딩 기본값
const kakaoAppKey = envProd.VITE_KAKAO_APP_KEY || envBase.VITE_KAKAO_APP_KEY || '';
const siteUrl     = envProd.VITE_SITE_URL       || envBase.VITE_SITE_URL      || 'https://www.fishing-go.com';
const apiUrl      = envProd.VITE_API_URL         || envBase.VITE_API_URL       || 'https://fishing-go-backend.onrender.com';
const tideKey     = envProd.VITE_TIDE_API_KEY    || envBase.VITE_TIDE_API_KEY  || '';

// ✅ AUTO-VERSION: package.json에서 버전 읽기 → ForceUpdateChecker.__APP_VERSION__ 치환
const appVersion  = JSON.parse(readFileSync('package.json', 'utf8')).version;

// ── dist 초기화 (rmSync 없이, 덮어쓰기) ──────────────────────────────────────
mkdirSync('dist/assets', { recursive: true });
console.log('🚀 esbuild 빌드 시작 (API:', apiUrl, ' / SITE:', siteUrl, ')');

// ── JS 번들 ──────────────────────────────────────────────────────────────────
console.log('▶ JS 번들링...');
await esbuild.build({
  entryPoints: ['src/main.jsx'],
  bundle: true,
  outfile: 'dist/assets/index.js',
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
    'process.env.NODE_ENV':               '"production"',
    'import.meta.env.PROD':               'true',
    'import.meta.env.DEV':                'false',
    'import.meta.env.SSR':                'false',
    'import.meta.env.MODE':               '"production"',
    'import.meta.env.BASE_URL':           '"/"',
    'import.meta.env.VITE_API_URL':       JSON.stringify(apiUrl),
    'import.meta.env.VITE_KAKAO_APP_KEY': JSON.stringify(kakaoAppKey),
    'import.meta.env.VITE_TIDE_API_KEY':  JSON.stringify(tideKey),
    'import.meta.env.VITE_SITE_URL':      JSON.stringify(siteUrl),
    // ✅ AUTO-VERSION: ForceUpdateChecker에서 사용하는 빌드타임 버전 상수
    '__APP_VERSION__':                    JSON.stringify(appVersion),
  },
  minify: true,
  treeShaking: true,
  logLevel: 'warning',
  mainFields: ['browser', 'module', 'main'],
  conditions: ['browser', 'import', 'module', 'default'],
});
console.log('✅ JS 완료:', (statSync('dist/assets/index.js').size / 1024 / 1024).toFixed(2), 'MB');

// ── CSS 번들 ──────────────────────────────────────────────────────────────────
console.log('▶ CSS 복사...');
if (existsSync('src/index.css')) {
  copyFileSync('src/index.css', 'dist/assets/index.css');
}
console.log('✅ CSS 완료');

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

// ── index.html 처리 ───────────────────────────────────────────────────────────
let html = readFileSync('index.html', 'utf8');
html = html.replace(/__VITE_KAKAO_APP_KEY__/g, JSON.stringify(kakaoAppKey));
html = html.replace(/__VITE_SITE_URL__/g, siteUrl);
// ✅ CACHE-BUST: 빌드 타임스탬프 쿼리로 WebView 캐시 강제 갱신
const buildTs = Date.now();
html = html.replace(
  /<script type="module" src="\/src\/main\.jsx"><\/script>/,
  `<link rel="stylesheet" href="/assets/index.css?v=${buildTs}" />\n    <script type="module" src="/assets/index.js?v=${buildTs}"></script>`
);
writeFileSync('dist/index.html', html, 'utf8');
console.log('✅ index.html 완료');

// ── 요약 ──────────────────────────────────────────────────────────────────────
const jsMB  = (statSync('dist/assets/index.js').size  / 1024 / 1024).toFixed(2);
const cssKB = existsSync('dist/assets/index.css')
  ? (statSync('dist/assets/index.css').size / 1024).toFixed(1) + ' KB'
  : '(없음)';
console.log(`\n🎉 빌드 성공!`);
console.log(`   JS : dist/assets/index.js  (${jsMB} MB)`);
console.log(`   CSS: dist/assets/index.css (${cssKB})`);
console.log(`   HTML: dist/index.html`);

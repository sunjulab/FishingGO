#!/usr/bin/env node
// build-esbuild.mjs — esbuild 직접 빌드 (Rollup WASM 크래시 우회)
// 핵심: rmSync 대신 파일 덮어쓰기, 상대경로 사용
import * as esbuild from 'esbuild';
import {
  readFileSync, writeFileSync, existsSync,
  mkdirSync, readdirSync, statSync, copyFileSync,
} from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── 환경 변수 ────────────────────────────────────────────
function parseEnvFile(p) {
  if (!existsSync(p)) return {};
  const obj = {};
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) obj[m[1].trim()] = m[2].trim();
  }
  return obj;
}
// ✅ APK 빌드 시 .env.local(dev 전용)이 .env.production을 덮어쓰지 않도록
// .env → .env.local → .env.production 순으로 읽어 production이 최종 우선
const env = {
  ...parseEnvFile('.env'),
  ...parseEnvFile('.env.local'),      // dev 기본값
  ...parseEnvFile('.env.production'), // 프로덕션이 최종 우선 (APK 빌드 핵심)
};
const kakaoAppKey = process.env.VITE_KAKAO_APP_KEY || env.VITE_KAKAO_APP_KEY || '';
const siteUrl     = process.env.VITE_SITE_URL      || env.VITE_SITE_URL      || 'https://fishing-go.vercel.app';
const apiUrl      = process.env.VITE_API_URL        || env.VITE_API_URL       || 'https://fishing-go-backend.onrender.com';
const tideKey     = process.env.VITE_TIDE_API_KEY   || env.VITE_TIDE_API_KEY  || '';
// ✅ AUTO-VERSION: package.json에서 버전 읽기 — ForceUpdateChecker.__APP_VERSION__ 치환
const appVersion  = JSON.parse(readFileSync('package.json', 'utf8')).version;

// ─── dist 초기화 (rmSync 없이, 덮어쓰기) ─────────────────
mkdirSync('dist/assets', { recursive: true });
console.log('🔧 esbuild 빌드 시작 (API:', apiUrl, ')');

// ─── JS 번들 ─────────────────────────────────────────────
console.log('📦 JS 번들링...');
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
    'process.env.NODE_ENV':              '"production"',
    'import.meta.env.PROD':              'true',
    'import.meta.env.DEV':               'false',
    'import.meta.env.SSR':               'false',
    'import.meta.env.MODE':              '"production"',
    'import.meta.env.VITE_API_URL':      JSON.stringify(apiUrl),
    'import.meta.env.VITE_KAKAO_APP_KEY':JSON.stringify(kakaoAppKey),
    'import.meta.env.VITE_TIDE_API_KEY': JSON.stringify(tideKey),
    'import.meta.env.VITE_SITE_URL':     JSON.stringify(siteUrl),
    // ✅ AUTO-VERSION: ForceUpdateChecker에서 사용하는 빌드타임 버전 상수
    '__APP_VERSION__':                   JSON.stringify(appVersion),
  },
  minify: false,
  treeShaking: true,
  logLevel: 'warning',
  mainFields: ['browser', 'module', 'main'],
  conditions: ['browser', 'import', 'module', 'default'],
});
console.log('✅ JS 완료:', (statSync('dist/assets/index.js').size / 1024 / 1024).toFixed(2), 'MB');

// ─── CSS 번들 ─────────────────────────────────────────────
console.log('🎨 CSS 복사...');
if (existsSync('src/index.css')) {
  copyFileSync('src/index.css', 'dist/assets/index.css');
}
console.log('✅ CSS 완료');

// ─── Public 복사 ──────────────────────────────────────────
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

// ─── index.html ───────────────────────────────────────────
let html = readFileSync('index.html', 'utf8');
html = html.replace(/__VITE_KAKAO_APP_KEY__/g, JSON.stringify(kakaoAppKey));
html = html.replace(/__VITE_SITE_URL__/g, siteUrl);
html = html.replace(
  /<script type="module" src="\/src\/main\.jsx"><\/script>/,
  `<link rel="stylesheet" href="/assets/index.css" />\n    <script type="module" src="/assets/index.js"></script>`
);
writeFileSync('dist/index.html', html, 'utf8');
console.log('✅ index.html 완료');

// ─── 요약 ────────────────────────────────────────────────
const jsMB  = (statSync('dist/assets/index.js').size  / 1024 / 1024).toFixed(2);
const cssKB = existsSync('dist/assets/index.css')
  ? (statSync('dist/assets/index.css').size / 1024).toFixed(1) + ' KB'
  : '(없음)';
console.log(`\n🎉 빌드 성공!`);
console.log(`   JS : dist/assets/index.js  (${jsMB} MB)`);
console.log(`   CSS: dist/assets/index.css (${cssKB})`);
console.log(`   HTML: dist/index.html`);

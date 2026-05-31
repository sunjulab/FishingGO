#!/usr/bin/env node
// build-esbuild.mjs ??esbuild 吏곸젒 鍮뚮뱶 (Rollup WASM ?щ옒???고쉶)
// ?듭떖: rmSync ????뚯씪 ??뼱?곌린, ?곷?寃쎈줈 ?ъ슜
import * as esbuild from 'esbuild';
import {
  readFileSync, writeFileSync, existsSync,
  mkdirSync, readdirSync, statSync, copyFileSync,
} from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ??? ?섍꼍 蹂??????????????????????????????????????????????
function parseEnvFile(p) {
  if (!existsSync(p)) return {};
  const obj = {};
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) obj[m[1].trim()] = m[2].trim();
  }
  return obj;
}
// ??APK 鍮뚮뱶 ??.env.local(dev ?꾩슜)??.env.production????뼱?곗? ?딅룄濡?
// .env ??.env.local ??.env.production ?쒖쑝濡??쎌뼱 production??理쒖쥌 ?곗꽑
const env = {
  ...parseEnvFile('.env'),
  ...parseEnvFile('.env.local'),      // dev 湲곕낯媛?
  ...parseEnvFile('.env.production'), // ?꾨줈?뺤뀡??理쒖쥌 ?곗꽑 (APK 鍮뚮뱶 ?듭떖)
};
const kakaoAppKey = process.env.VITE_KAKAO_APP_KEY || env.VITE_KAKAO_APP_KEY || '';
const siteUrl     = process.env.VITE_SITE_URL      || env.VITE_SITE_URL      || 'https://www.fishing-go.com';
const apiUrl      = process.env.VITE_API_URL        || env.VITE_API_URL       || 'https://fishing-go-backend.onrender.com';
const tideKey     = process.env.VITE_TIDE_API_KEY   || env.VITE_TIDE_API_KEY  || '';
// ??AUTO-VERSION: package.json?먯꽌 踰꾩쟾 ?쎄린 ??ForceUpdateChecker.__APP_VERSION__ 移섑솚
const appVersion  = JSON.parse(readFileSync('package.json', 'utf8')).version;

// ??? dist 珥덇린??(rmSync ?놁씠, ??뼱?곌린) ?????????????????
mkdirSync('dist/assets', { recursive: true });
console.log('?뵩 esbuild 鍮뚮뱶 ?쒖옉 (API:', apiUrl, ')');

// ??? JS 踰덈뱾 ?????????????????????????????????????????????
console.log('?벀 JS 踰덈뱾留?..');
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
    // ??AUTO-VERSION: ForceUpdateChecker?먯꽌 ?ъ슜?섎뒗 鍮뚮뱶???踰꾩쟾 ?곸닔
    '__APP_VERSION__':                   JSON.stringify(appVersion),
  },
  minify: false,
  treeShaking: true,
  logLevel: 'warning',
  mainFields: ['browser', 'module', 'main'],
  conditions: ['browser', 'import', 'module', 'default'],
});
console.log('??JS ?꾨즺:', (statSync('dist/assets/index.js').size / 1024 / 1024).toFixed(2), 'MB');

// ??? CSS 踰덈뱾 ?????????????????????????????????????????????
console.log('?렓 CSS 蹂듭궗...');
if (existsSync('src/index.css')) {
  copyFileSync('src/index.css', 'dist/assets/index.css');
}
console.log('??CSS ?꾨즺');

// ??? Public 蹂듭궗 ??????????????????????????????????????????
function copyDir(src, dst) {
  if (!existsSync(src)) return;
  mkdirSync(dst, { recursive: true });
  for (const item of readdirSync(src)) {
    const s = join(src, item), d = join(dst, item);
    statSync(s).isDirectory() ? copyDir(s, d) : copyFileSync(s, d);
  }
}
copyDir('public', 'dist');
console.log('??Public 蹂듭궗 ?꾨즺');

// ??? index.html ???????????????????????????????????????????
let html = readFileSync('index.html', 'utf8');
html = html.replace(/__VITE_KAKAO_APP_KEY__/g, JSON.stringify(kakaoAppKey));
html = html.replace(/__VITE_SITE_URL__/g, siteUrl);
// ??CACHE-BUST: 鍮뚮뱶 ??꾩뒪?ы봽 荑쇰━濡?WebView 罹먯떆 媛뺤젣 媛깆떊
const buildTs = Date.now();
html = html.replace(
  /<script type="module" src="\/src\/main\.jsx"><\/script>/,
  `<link rel="stylesheet" href="/assets/index.css?v=${buildTs}" />\n    <script type="module" src="/assets/index.js?v=${buildTs}"></script>`
);
writeFileSync('dist/index.html', html, 'utf8');
console.log('??index.html ?꾨즺');

// ??? ?붿빟 ????????????????????????????????????????????????
const jsMB  = (statSync('dist/assets/index.js').size  / 1024 / 1024).toFixed(2);
const cssKB = existsSync('dist/assets/index.css')
  ? (statSync('dist/assets/index.css').size / 1024).toFixed(1) + ' KB'
  : '(?놁쓬)';
console.log(`\n?럦 鍮뚮뱶 ?깃났!`);
console.log(`   JS : dist/assets/index.js  (${jsMB} MB)`);
console.log(`   CSS: dist/assets/index.css (${cssKB})`);
console.log(`   HTML: dist/index.html`);


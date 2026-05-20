// test-build.mjs — 경로 문제 진단용 (절대경로 vs 상대경로)
import * as esbuild from 'esbuild';
import { mkdirSync, existsSync } from 'fs';

// dist 폴더 생성 (없으면)
mkdirSync('dist/assets', { recursive: true });
console.log('mkdirSync OK');

// 상대경로로 빌드 (기존에 성공한 방식)
const r = await esbuild.build({
  entryPoints: ['src/main.jsx'],
  bundle: true,
  outfile: 'dist/assets/index.js',
  platform: 'browser',
  format: 'esm',
  jsx: 'automatic',
  jsxImportSource: 'react',
  loader: {
    '.jsx': 'jsx', '.js': 'js', '.css': 'empty',
    '.png': 'dataurl', '.svg': 'dataurl', '.woff2': 'dataurl',
    '.woff': 'dataurl', '.ttf': 'dataurl',
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    'import.meta.env.PROD': 'true',
    'import.meta.env.DEV': 'false',
    'import.meta.env.SSR': 'false',
    'import.meta.env.MODE': '"production"',
    'import.meta.env.VITE_API_URL': '"https://api.fishinggo.kr"',
    'import.meta.env.VITE_KAKAO_APP_KEY': '"testkey"',
    'import.meta.env.VITE_TIDE_API_KEY': '"testkey"',
    'import.meta.env.VITE_SITE_URL': '"https://fishinggo.kr"',
  },
  minify: false,
  logLevel: 'warning',
  mainFields: ['browser', 'module', 'main'],
  conditions: ['browser', 'import', 'module', 'default'],
});
console.log('esbuild OK, errors:', r.errors.length);

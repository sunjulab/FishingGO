// vercel-force-rebuild: 2026-05-27 17:26:23
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'fs'

// ??AUTO-VERSION: package.json?먯꽌 踰꾩쟾 ?먮룞 ?쎄린 ????鍮뚮뱶 ???먮룞 諛섏쁺
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const APP_VERSION = pkg.version;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
  define: {
    // SEC-05: index.html ?몃씪???ㅽ겕由쏀듃???뚮젅?댁뒪??붾? 鍮뚮뱶 ??꾩뿉 移섑솚
    // loadEnv濡?.env.local ?ы븿 VITE_* 蹂?섎? ?뺥솗???쎌쓬 (process.env??VITE_ 蹂??誘명룷??
    '__VITE_KAKAO_APP_KEY__': JSON.stringify(env.VITE_KAKAO_APP_KEY || ''),
    // ??20TH-A1: OG/Twitter URL ?뚮젅?댁뒪???移섑솚 ??.env??VITE_SITE_URL=https://your-domain.com ?ㅼ젙
    '__VITE_SITE_URL__': JSON.stringify(env.VITE_SITE_URL || 'https://fishing-go.vercel.app'),
    // ??AUTO-VERSION: 鍮뚮뱶 ??꾩뿉 package.json 踰꾩쟾 ?먮룞 二쇱엯 ??ForceUpdateChecker?먯꽌 ?ъ슜
    '__APP_VERSION__': JSON.stringify(APP_VERSION),
  },
  plugins: [
    react(),
    // ??HTML-REPLACE: Vite??define? JS留?移섑솚????HTML ?뚮젅?댁뒪??붾뒗 ???뚮윭洹몄씤?쇰줈 吏곸젒 移섑솚
    // Vercel(vite build)怨?濡쒖뺄(build-esbuild.mjs) 紐⑤몢 ?숈씪?섍쾶 ?곸슜??    {
      name: 'html-placeholder-replace',
      transformIndexHtml(html) {
        const siteUrl   = env.VITE_SITE_URL      || 'https://fishing-go.vercel.app';
        const kakaoKey  = env.VITE_KAKAO_APP_KEY || '';
        return html
          .replace(/__VITE_SITE_URL__/g,      siteUrl)
          .replace(/__VITE_KAKAO_APP_KEY__/g,  kakaoKey);
      },
    },
    // ??APK 鍮뚮뱶 ??VITE_DISABLE_PWA=true ?섍꼍蹂?섎줈 PWA 鍮꾪솢?깊솕 媛??    // ??DEV-FIX: 媛쒕컻 紐⑤뱶?먯꽌??PWA ?쒕퉬?ㅼ썙而??꾩쟾 鍮꾪솢?깊솕 (API ?붿껌 李⑤떒 諛⑹?)
    ...(env.VITE_DISABLE_PWA === 'true' || mode !== 'production' ? [] : [VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'], // ??FIX-PWA: png 異붽? ??icon-192.png/icon-512.png ?ㅽ봽?쇱씤 ?꾨━罹먯떆 蹂댁옣
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB (5MB ??3MB 媛뺥솕)
        skipWaiting: true,
        clientsClaim: true,
        // ??? ?ㅽ봽?쇱씤 罹먯떆 ?꾨왂 ???????????????????????????????
        runtimeCaching: [
          {
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 },
            },
          },
          {
            urlPattern: /dapi\.kakao\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'kakao-map-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            urlPattern: /cdn\.jsdelivr\.net/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      manifest: {
        name: '?싳떆GO Premium',
        short_name: '?싳떆GO',
        description: '援?궡 理쒓퀬 ?꾨━誘몄뾼 ?댁뼇 ?싳떆 ?명뀛由ъ쟾?????ㅼ떆媛?臾쇰븣쨌?좎뵪쨌?ъ씤?맞룹빱裕ㅻ땲??,
        theme_color: '#0B1F3A',
        background_color: '#0B1F3A',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    })]),  // ??conditional VitePWA end
  ],
  build: {
    // ??ROLLUP-FIX: Windows 濡쒖뺄 鍮뚮뱶??npm run build:esbuild ?ъ슜
    // Vercel(Linux)?먯꽌???쒖? vite build ?ъ슜 (@rollup/wasm-node)
    target: 'esnext',
    minify: false,
    rollupOptions: {
      treeshake: false,
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-store': ['zustand'],
          'vendor-socket': ['socket.io-client'],
          'vendor-icons': ['lucide-react'],
          'vendor-http': ['axios'],
        },
      },
    },
    chunkSizeWarningLimit: 2000,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/data-go-api': {
        target: 'https://apis.data.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/data-go-api/, ''),
        secure: false,
        // ??FIX-PROXY: 怨듦났?곗씠?고룷??URL ?댁쨷 ?몄퐫??諛⑹?
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // decodeURIComponent ?놁씠 洹몃?濡??꾨떖 (?댁쨷 ?몄퐫??諛⑹?)
          });
        },
      }
    }
  }
  };
})

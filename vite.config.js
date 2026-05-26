import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'fs'

// ✅ AUTO-VERSION: package.json에서 버전 자동 읽기 — 앱 빌드 시 자동 반영
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const APP_VERSION = pkg.version;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
  define: {
    // SEC-05: index.html 인라인 스크립트의 플레이스홀더를 빌드 타임에 치환
    // loadEnv로 .env.local 포함 VITE_* 변수를 정확히 읽음 (process.env는 VITE_ 변수 미포함)
    '__VITE_KAKAO_APP_KEY__': JSON.stringify(env.VITE_KAKAO_APP_KEY || ''),
    // ✅ 20TH-A1: OG/Twitter URL 플레이스홀더 치환 — .env에 VITE_SITE_URL=https://your-domain.com 설정
    '__VITE_SITE_URL__': JSON.stringify(env.VITE_SITE_URL || 'https://fishing-go.vercel.app'),
    // ✅ AUTO-VERSION: 빌드 타임에 package.json 버전 자동 주입 → ForceUpdateChecker에서 사용
    '__APP_VERSION__': JSON.stringify(APP_VERSION),
  },
  plugins: [
    react(),
    // ✅ APK 빌드 시 VITE_DISABLE_PWA=true 환경변수로 PWA 비활성화 가능
    // ✅ DEV-FIX: 개발 모드에서는 PWA 서비스워커 완전 비활성화 (API 요청 차단 방지)
    ...(env.VITE_DISABLE_PWA === 'true' || mode !== 'production' ? [] : [VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'], // ✅ FIX-PWA: png 추가 — icon-192.png/icon-512.png 오프라인 프리캐시 보장
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB (5MB → 3MB 강화)
        skipWaiting: true,
        clientsClaim: true,
        // ─── 오프라인 캐시 전략 ───────────────────────────────
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
        name: '낚시GO Premium',
        short_name: '낚시GO',
        description: '국내 최고 프리미엄 해양 낚시 인텔리전스 — 실시간 물때·날씨·포인트·커뮤니티',
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
    })]),  // ← conditional VitePWA end
  ],
  build: {
    // ✅ ROLLUP-FIX: Windows 로컬 빌드는 npm run build:esbuild 사용
    // Vercel(Linux)에서는 표준 vite build 사용 (@rollup/wasm-node)
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
        // ✅ FIX-PROXY: 공공데이터포털 URL 이중 인코딩 방지
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // decodeURIComponent 없이 그대로 전달 (이중 인코딩 방지)
          });
        },
      }
    }
  }
  };
})

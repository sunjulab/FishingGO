import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

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
  },
  plugins: [
    react(),
    // ✅ APK 빌드 시 VITE_DISABLE_PWA=true 환경변수로 PWA 비활성화 가능
    ...(env.VITE_DISABLE_PWA === 'true' ? [] : [VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'], // webp 제거 — 대용량 파일 캐시 방지
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
    // ✅ ROLLUP-FIX: @rollup/wasm-node 오버라이드는 package.json overrides에서 처리
    rollupOptions: {
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
    chunkSizeWarningLimit: 1000,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/khoa-api': {
        target: 'https://www.khoa.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/khoa-api/, '/api'),
        secure: false,
      }
    }
  }
  };
})

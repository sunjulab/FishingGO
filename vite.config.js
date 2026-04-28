import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // ─── 오프라인 캐시 전략 ───────────────────────────────
        runtimeCaching: [
          {
            // API 요청: NetworkFirst (온라인이면 서버 데이터, 오프라인이면 캐시)
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 }, // 1시간
            },
          },
          {
            // 카카오맵 타일: CacheFirst (자주 바뀌지 않음)
            urlPattern: /dapi\.kakao\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'kakao-map-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7일
            },
          },
          {
            // 외부 이미지 (Unsplash 등): StaleWhileRevalidate
            urlPattern: /images\.unsplash\.com|cdn\.jsdelivr\.net/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'external-assets',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30일
            },
          },
        ],
      },
      manifest: {
        name: '낚시GO Premium',
        short_name: '낚시GO',
        description: '국내 최고 프리미엄 해양 낚시 인텔리전스 — 실시간 물때·날씨·포인트·커뮤니티',
        theme_color: '#0056D2',
        background_color: '#F4F6FA',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  build: {
    // ─── 청크 스플리팅 최적화 ────────────────────────────────
    rollupOptions: {
      output: {
        manualChunks: {
          // React 코어 분리
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // 상태 관리
          'vendor-store': ['zustand'],
          // 소켓
          'vendor-socket': ['socket.io-client'],
          // lucide 아이콘 (크기가 큼)
          'vendor-icons': ['lucide-react'],
          // axios
          'vendor-http': ['axios'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // 1MB 이상만 경고
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
})

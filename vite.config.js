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
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webp}'], // ENH-C2: webp 확장자 사전캐시 추가
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
            // ✅ 15TH-C1: unsplash 대신 picsum.photos로 대체 완료 — 향후 자체 서버 이미지 API 연동 시 업데이트
            urlPattern: /picsum\.photos/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'external-assets',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30일
            },
          },
          {
            // ✅ 9TH-B5: Pretendard CDN 폰트 전용 CacheFirst — 폰트는 거의 변경되지 않으므로 StaleWhileRevalidate 불필요
            urlPattern: /cdn\.jsdelivr\.net/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }, // 1년
            },
          },
          {
            // ENH-B5: YouTube 썬네일 오프라인 캐시 — MediaTab 오프라인 시 깨집 방지
            urlPattern: /i\.ytimg\.com|img\.youtube\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'youtube-thumbnails',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 3 }, // 3일
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
          // ✅ 28TH-C2: maskable 아이콘 활성화 — icon-512.png 겸용 등록 (Lighthouse installability 경고 해소)
          // 전용 maskable 이미지(icon-512-maskable.png) 생성 시 아래 src 경로 교체 권장
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
          // ✅ 15TH-A2: recharts 패키지 제거(12TH-B1) 이후 dead chunk 선언 제거 — 빌드 시 모듈 없음 오류 방지
          // 'vendor-charts': ['recharts'], // recharts uninstalled
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
  };
})

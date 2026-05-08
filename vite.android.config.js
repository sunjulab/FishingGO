// Android APK 전용 Vite 빌드 설정 — PWA/청크분할 없는 단순 번들
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    define: {
      '__VITE_KAKAO_APP_KEY__': JSON.stringify(env.VITE_KAKAO_APP_KEY || ''),
      '__VITE_SITE_URL__': JSON.stringify(env.VITE_SITE_URL || 'https://fishing-go-backend.onrender.com'),
    },
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      // 청크 분할 최소화 — Rollup 스택 오버플로우 방지
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
        maxParallelFileOps: 2,
      },
      chunkSizeWarningLimit: 99999,
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      }
    }
  }
})

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
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
      manifest: {
        name: '낚시GO Premium',
        short_name: '낚시GO',
        description: '국내 최고 프리미엄 해양 낚시 인텔리전스',
        theme_color: '#1565C0',
        background_color: '#F4F6FA',
        display: 'standalone'
      }
    })
  ],
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

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    open: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  // Global değişken tanımları (SockJS global hatası için)
  define: {
    global: 'globalThis',
    'process.env': {}
  },
  // Optimizasyon ayarları
  optimizeDeps: {
    include: [
      'sockjs-client',
      '@stomp/stompjs',
      'element-plus',
      'vue',
      'vue-router',
      'pinia',
      'axios'
    ],
    exclude: []
  },
  // Build konfigürasyonu
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) {
            return 'vue-vendor'
          }
          if (id.includes('element-plus')) {
            return 'element-plus'
          }
          if (id.includes('sockjs-client') || id.includes('@stomp/stompjs')) {
            return 'websocket'
          }
          if (id.includes('axios') || id.includes('dayjs')) {
            return 'utils'
          }
        }
      }
    }
  }
})

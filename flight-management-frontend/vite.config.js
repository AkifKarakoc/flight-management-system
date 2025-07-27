import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        charset: false,
      },
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Reference Manager Service (8081)
      '/api/v1/auth': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      '/api/v1/airlines': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      '/api/v1/airports': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      '/api/v1/routes': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      '/api/v1/crew-members': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      '/api/v1/aircrafts': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      // Flight Service (8082)
      '/api/v1/flights': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
      },
      // Archive Service (8083)
      '/api/v1/archive': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        secure: false,
      },
      '/api/v1/kpi': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        secure: false,
      },
      // WebSocket
      '/ws': {
        target: 'ws://localhost:8082',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          element: ['element-plus', '@element-plus/icons-vue'],
          charts: ['echarts', 'vue-echarts'],
        },
      },
    },
  },
  define: {
    global: 'window'
  }
})

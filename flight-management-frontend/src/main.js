import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// Router
import router from './router'

// Styles
import './assets/styles/main.scss'

// App
import App from './App.vue'

// ECharts
import ECharts from 'vue-echarts'
import 'echarts'

// Day.js
import dayjs from 'dayjs'
import 'dayjs/locale/tr'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

// Day.js configuration
dayjs.locale('tr')
dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.extend(timezone)

// Debug utility (development only)
import '@/utils/debug.js'

const app = createApp(App)

// Pinia store
const pinia = createPinia()
app.use(pinia)

// Router
app.use(router)

// Element Plus
app.use(ElementPlus, {
  locale: {
    name: 'tr',
    // Element Plus Türkçe locale buraya eklenecek
  }
})

// Element Plus Icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// ECharts global component
app.component('VChart', ECharts)

// Global properties
app.config.globalProperties.$dayjs = dayjs

// Enhanced global error handler
app.config.errorHandler = (err, vm, info) => {
  console.error('🚨 Global error:', {
    error: err,
    component: vm?.$options?.name || vm?.$options?.__file || 'Unknown',
    info,
    stack: err.stack,
    timestamp: new Date().toISOString()
  })

  // Prevent infinite error loops
  if (err.message && err.message.includes('Maximum call stack size exceeded')) {
    console.error('🔄 Infinite loop detected, preventing further errors')
    return
  }

  // Handle specific error types
  if (err.name === 'ChunkLoadError') {
    console.error('📦 Chunk loading failed, reloading page...')
    window.location.reload()
    return
  }

  if (err.message && err.message.includes('Failed to fetch dynamically imported module')) {
    console.error('📥 Dynamic import failed, this might be a temporary network issue')
    return
  }

  // Log to external service in production
  if (import.meta.env.PROD) {
    // TODO: Add error tracking service (Sentry, etc.)
    console.error('📊 Error should be logged to external service in production')
  }
}

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', {
    reason: event.reason,
    promise: event.promise,
    timestamp: new Date().toISOString()
  })
  
  // Prevent default browser behavior
  event.preventDefault()
})

// Global error event handler
window.addEventListener('error', (event) => {
  console.error('🚨 Global error event:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
    timestamp: new Date().toISOString()
  })
})

app.mount('#app')

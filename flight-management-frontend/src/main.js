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

// Global error handler
app.config.errorHandler = (err, vm, info) => {
  console.error('Global error:', err, info)
  // Buraya error tracking servisi eklenebilir (Sentry vs.)
}

app.mount('#app')

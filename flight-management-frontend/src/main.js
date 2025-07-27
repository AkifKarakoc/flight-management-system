import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

import App from './App.vue'
import router from './router'

// Utilities
import { initializeStorage } from '@/utils/helpers'

// Global styles
import './assets/styles/main.scss'

// Font Awesome Icons (if used)
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { fas } from '@fortawesome/free-solid-svg-icons'

// Add icons to library
library.add(fas)

// Create Vue app
const app = createApp(App)

// Initialize storage and clear invalid tokens BEFORE app mount
console.log('Initializing application...')
initializeStorage()

// Use plugins
app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// Global components
app.component('font-awesome-icon', FontAwesomeIcon)

// Global error handler
app.config.errorHandler = (error, instance, info) => {
  console.error('Global error handler:', error, info)

  // Token ile ilgili hatalar için özel handling
  if (error.message && error.message.includes('token')) {
    console.log('Token related error detected, clearing storage')
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    // Login sayfasına yönlendir
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }
}

// Mount app
app.mount('#app')

console.log('Application mounted successfully')

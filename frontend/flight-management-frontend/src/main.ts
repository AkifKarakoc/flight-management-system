import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import tr from 'element-plus/es/locale/lang/tr'

import App from './App.vue'
import router from './router/index.js'
import { useAuthStore } from './stores/auth'
import authService from './services/authService'

const app = createApp(App)
const pinia = createPinia()

// Register all Element Plus icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
app.use(router)
app.use(ElementPlus, {
  locale: tr,
})

// Session management setup
const setupSessionSecurity = () => {
  // Browser kapatıldığında localStorage temizle
  window.addEventListener('beforeunload', (event) => {
    const authStore = useAuthStore()
    authStore.cleanup()

    // Önemli: Sadece browser tamamen kapatılıyorsa temizle
    // Sayfa yenileme durumunda temizlemeyelim
    if (event.type === 'beforeunload') {
      // Session storage kullan ki tab kapatıldığında temizlensin
      sessionStorage.setItem('app_session_active', 'false')
    }
  })

  // Page hide olduğunda (mobil uyumlu)
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) {
      // Page cache'e alınıyor, localStorage'ı koruyabiliriz
      return
    }

    // Page tamamen kapanıyor
    const authStore = useAuthStore()
    authStore.cleanup()
  })

  // Visibility change - tab inactive olduğunda
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Tab aktif oldu, auth durumunu kontrol et
      const authStore = useAuthStore()

      // Eğer token expire olduysa logout yap
      if (!authService.isAuthenticated() && authStore.isAuthenticated) {
        authStore.forceLogout('Oturumunuz sona erdi')
      }
    }
  })

  // Focus eventi - window'a geri dönüldüğünde
  window.addEventListener('focus', () => {
    const authStore = useAuthStore()

    // Auth durumunu kontrol et
    if (!authService.isAuthenticated() && authStore.isAuthenticated) {
      authStore.forceLogout('Oturumunuz sona erdi')
    }
  })

  // Idle timeout (opsiyonel - 30 dakika hareketsizlik)
  let idleTimer: number | null = null
  const IDLE_TIME = 30 * 60 * 1000 // 30 dakika

  const resetIdleTimer = () => {
    if (idleTimer) {
      clearTimeout(idleTimer)
    }

    idleTimer = setTimeout(() => {
      const authStore = useAuthStore()
      if (authStore.isAuthenticated) {
        authStore.forceLogout('Hareketsizlik nedeniyle oturumunuz sonlandırıldı')
      }
    }, IDLE_TIME)
  }

  // User aktivitelerini dinle
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
  activityEvents.forEach(event => {
    document.addEventListener(event, resetIdleTimer, true)
  })

  // İlk timer'ı başlat
  resetIdleTimer()
}

// Multiple tab support
const setupMultiTabSync = () => {
  // Diğer tab'lerden logout event'ini dinle
  window.addEventListener('storage', (event) => {
    if (event.key === 'auth_token' && event.newValue === null) {
      // Başka bir tab'de logout yapıldı
      const authStore = useAuthStore()
      authStore.forceLogout('Başka bir sekmede çıkış yapıldı')
    }

    if (event.key === 'auth_force_logout') {
      // Force logout event
      const authStore = useAuthStore()
      authStore.forceLogout('Güvenlik nedeniyle oturumunuz sonlandırıldı')
    }
  })
}

// Initialize app
const initializeApp = async () => {
  try {
    // Session security setup
    setupSessionSecurity()
    setupMultiTabSync()

    // Check authentication before mounting
    const authStore = useAuthStore()
    await authStore.initializeAuth()

    // Mount app
    app.mount('#app')

    console.log('✅ Flight Management System initialized successfully')
  } catch (error) {
    console.error('❌ Error initializing app:', error)

    // Clear any corrupted auth data
    authService.clearAuth()

    // Mount app anyway
    app.mount('#app')
  }
}

// Start the application
initializeApp()

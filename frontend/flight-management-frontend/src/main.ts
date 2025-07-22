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

// Check authentication before mounting
const authStore = useAuthStore()
authStore.initializeAuth()

app.mount('#app')

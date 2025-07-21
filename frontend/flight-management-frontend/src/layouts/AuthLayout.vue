<template>
  <div class="auth-layout">
    <!-- Background with animated elements -->
    <div class="auth-background">
      <div class="background-pattern"></div>
      <div class="floating-elements">
        <div class="floating-element" v-for="i in 6" :key="i" :style="getFloatingStyle(i)">
          <el-icon><component :is="getRandomIcon(i)" /></el-icon>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="auth-container">
      <!-- Left Side - Branding -->
      <div class="auth-branding">
        <div class="brand-content">
          <div class="brand-logo">
            <img src="/src/assets/images/logo.png" alt="Logo" class="logo-image" />
            <div class="logo-text">
              <h1 class="brand-title">Uçuş Yönetim Sistemi</h1>
              <p class="brand-subtitle">Modern havacılık operasyonları için gelişmiş yönetim platformu</p>
            </div>
          </div>

          <div class="features-list">
            <div class="feature-item" v-for="feature in features" :key="feature.id">
              <el-icon class="feature-icon" :style="{ color: feature.color }">
                <component :is="feature.icon" />
              </el-icon>
              <div class="feature-content">
                <h3 class="feature-title">{{ feature.title }}</h3>
                <p class="feature-description">{{ feature.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side - Auth Form -->
      <div class="auth-form-container">
        <div class="auth-form-wrapper">
          <!-- Language Selector -->
          <div class="language-selector">
            <el-dropdown @command="handleLanguageChange" placement="bottom-end">
              <el-button type="text" size="small" class="language-button">
                <el-icon><Globe /></el-icon>
                <span>{{ currentLanguage.label }}</span>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="lang in languages"
                    :key="lang.code"
                    :command="lang.code"
                    :class="{ active: currentLanguage.code === lang.code }"
                  >
                    <span class="language-flag">{{ lang.flag }}</span>
                    {{ lang.label }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <!-- Auth Form Content -->
          <div class="auth-form-content">
            <router-view v-slot="{ Component }">
              <transition name="auth-form" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
          </div>

          <!-- Footer -->
          <div class="auth-footer">
            <p class="copyright">
              © {{ currentYear }} Uçuş Yönetim Sistemi. Tüm hakları saklıdır.
            </p>
            <div class="footer-links">
              <el-link type="primary" @click="showPrivacyPolicy">Gizlilik Politikası</el-link>
              <el-divider direction="vertical" />
              <el-link type="primary" @click="showTermsOfService">Kullanım Şartları</el-link>
              <el-divider direction="vertical" />
              <el-link type="primary" @click="showSupport">Destek</el-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="auth-loading">
      <el-loading
        text="Yükleniyor..."
        background="rgba(255, 255, 255, 0.9)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import {
  Globe, Position, Shield, TrendCharts, Clock, CheckCircle,
  Ship, MapLocation, Promotion
} from '@element-plus/icons-vue'

const appStore = useAppStore()

// Reactive state
const loading = ref(false)

// Computed properties
const currentYear = computed(() => new Date().getFullYear())

const currentLanguage = computed(() => {
  return languages.value.find(lang => lang.code === appStore.language) || languages.value[0]
})

// Data
const languages = ref([
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' }
])

const features = ref([
  {
    id: 1,
    icon: Position,
    title: 'Gerçek Zamanlı Takip',
    description: 'Uçuşları anlık olarak takip edin ve yönetin',
    color: '#409eff'
  },
  {
    id: 2,
    icon: Shield,
    title: 'Güvenli Sistem',
    description: 'Bank seviyesinde güvenlik ile verilerinizi koruyun',
    color: '#67c23a'
  },
  {
    id: 3,
    icon: TrendCharts,
    title: 'Detaylı Raporlama',
    description: 'Kapsamlı analitik ve raporlama araçları',
    color: '#e6a23c'
  },
  {
    id: 4,
    icon: Clock,
    title: '7/24 Operasyon',
    description: 'Kesintisiz hizmet ve 7/24 sistem desteği',
    color: '#f56c6c'
  }
])

const floatingIcons = [Position, Ship, MapLocation, Promotion, Globe, CheckCircle]

// Methods
const handleLanguageChange = (language) => {
  appStore.setLanguage(language)
}

const getFloatingStyle = (index) => {
  const positions = [
    { top: '10%', left: '15%', animationDelay: '0s' },
    { top: '20%', right: '20%', animationDelay: '2s' },
    { top: '60%', left: '10%', animationDelay: '4s' },
    { top: '70%', right: '15%', animationDelay: '1s' },
    { top: '40%', left: '5%', animationDelay: '3s' },
    { top: '80%', right: '10%', animationDelay: '5s' }
  ]

  return {
    ...positions[index - 1],
    animationDelay: positions[index - 1].animationDelay
  }
}

const getRandomIcon = (index) => {
  return floatingIcons[index - 1] || Position
}

const showPrivacyPolicy = () => {
  console.log('Show privacy policy')
}

const showTermsOfService = () => {
  console.log('Show terms of service')
}

const showSupport = () => {
  console.log('Show support')
}

onMounted(() => {
  // Any initialization logic
})
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.auth-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 1;
}

.background-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 2px, transparent 2px),
    radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 2px, transparent 2px);
  background-size: 50px 50px;
  animation: backgroundMove 20s linear infinite;
}

.floating-elements {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.floating-element {
  position: absolute;
  font-size: 24px;
  color: rgba(255, 255, 255, 0.2);
  animation: float 6s ease-in-out infinite;
}

.auth-container {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  display: flex;
}

.auth-branding {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: white;
}

.brand-content {
  max-width: 500px;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 60px;
}

.logo-image {
  height: 60px;
  width: auto;
}

.brand-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
  line-height: 1.5;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.feature-icon {
  font-size: 24px;
  margin-top: 4px;
  flex-shrink: 0;
}

.feature-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.feature-description {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
  line-height: 1.4;
}

.auth-form-container {
  width: 480px;
  background: white;
  display: flex;
  flex-direction: column;
  position: relative;
}

.auth-form-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 40px;
}

.language-selector {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.language-button {
  color: #606266;
}

.language-flag {
  margin-right: 8px;
}

.auth-form-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-footer {
  margin-top: auto;
  text-align: center;
}

.copyright {
  font-size: 12px;
  color: #909399;
  margin: 0 0 8px 0;
}

.footer-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.auth-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
}

/* Animations */
@keyframes backgroundMove {
  0% { background-position: 0 0; }
  100% { background-position: 50px 50px; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

.auth-form-enter-active,
.auth-form-leave-active {
  transition: all 0.3s ease;
}

.auth-form-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.auth-form-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Responsive */
@media (max-width: 768px) {
  .auth-container {
    flex-direction: column;
  }

  .auth-branding {
    display: none;
  }

  .auth-form-container {
    width: 100%;
  }

  .auth-form-wrapper {
    padding: 20px;
  }
}
</style>

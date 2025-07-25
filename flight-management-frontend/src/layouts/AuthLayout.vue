<template>
  <div class="auth-layout">
    <!-- Background decoration -->
    <div class="auth-background">
      <div class="auth-background-pattern" />
      <div class="auth-background-gradient" />
    </div>

    <!-- Main content -->
    <div class="auth-container">
      <!-- Logo section -->
      <div class="auth-logo-section">
        <div class="auth-logo">
          <img
            src="/logo.svg"
            alt="Uçuş Yönetim Sistemi"
            class="logo-image"
            @error="handleLogoError"
          />
          <h1 class="logo-text">
            Uçuş Yönetim Sistemi
          </h1>
        </div>

        <!-- Welcome text -->
        <div class="auth-welcome">
          <h2 class="welcome-title">{{ welcomeTitle }}</h2>
          <p class="welcome-subtitle">{{ welcomeSubtitle }}</p>
        </div>
      </div>

      <!-- Form section -->
      <div class="auth-form-section">
        <BaseCard
          class="auth-card"
          shadow="always"
          :padding="cardPadding"
        >
          <router-view v-slot="{ Component, route }">
            <transition name="auth-slide" mode="out-in">
              <component :is="Component" :key="route.path" />
            </transition>
          </router-view>
        </BaseCard>

        <!-- Footer links -->
        <div class="auth-footer">
          <div class="auth-links">
            <router-link
              v-if="showForgotPassword"
              to="/forgot-password"
              class="auth-link"
            >
              Şifremi Unuttum
            </router-link>
            <router-link
              v-if="showRegister"
              to="/register"
              class="auth-link"
            >
              Kayıt Ol
            </router-link>
            <router-link
              v-if="showLogin"
              to="/login"
              class="auth-link"
            >
              Giriş Yap
            </router-link>
          </div>

          <!-- Language selector -->
          <div v-if="showLanguageSelector" class="auth-language">
            <BaseSelect
              v-model="selectedLanguage"
              :options="languageOptions"
              placeholder="Dil Seçin"
              size="small"
              style="width: 120px"
              @change="handleLanguageChange"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Version info -->
    <div class="auth-version">
      <span class="version-text">
        v{{ appVersion }} - {{ buildDate }}
      </span>
    </div>

    <!-- Particles or decorative elements -->
    <div v-if="showDecorations" class="auth-decorations">
      <div class="decoration decoration-1" />
      <div class="decoration decoration-2" />
      <div class="decoration decoration-3" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'

// Props
const props = defineProps({
  showDecorations: {
    type: Boolean,
    default: true
  },
  showLanguageSelector: {
    type: Boolean,
    default: false
  },
  cardPadding: {
    type: String,
    default: 'large'
  }
})

// Reactive state
const route = useRoute()
const selectedLanguage = ref('tr')
const logoError = ref(false)

// App info
const appVersion = ref('1.0.0')
const buildDate = ref(new Date().toLocaleDateString('tr-TR'))

// Language options
const languageOptions = ref([
  { value: 'tr', label: 'Türkçe' },
  { value: 'en', label: 'English' }
])

// Computed properties
const welcomeTitle = computed(() => {
  const routeName = route.name
  const titleMap = {
    'Login': 'Hoş Geldiniz',
    'Register': 'Hesap Oluşturun',
    'ForgotPassword': 'Şifre Sıfırlama',
    'ResetPassword': 'Yeni Şifre Belirleyin'
  }

  return titleMap[routeName] || 'Hoş Geldiniz'
})

const welcomeSubtitle = computed(() => {
  const routeName = route.name
  const subtitleMap = {
    'Login': 'Hesabınıza giriş yaparak devam edin',
    'Register': 'Hemen ücretsiz hesap oluşturun',
    'ForgotPassword': 'E-posta adresinizi girin',
    'ResetPassword': 'Güvenli bir şifre oluşturun'
  }

  return subtitleMap[routeName] || 'Lütfen giriş yapın'
})

const showForgotPassword = computed(() => {
  return route.name === 'Login'
})

const showRegister = computed(() => {
  return route.name === 'Login'
})

const showLogin = computed(() => {
  return ['Register', 'ForgotPassword', 'ResetPassword'].includes(route.name)
})

// Methods
const handleLogoError = () => {
  logoError.value = true
}

const handleLanguageChange = (language) => {
  // Implement language change logic
  console.log('Language changed to:', language)
  // You can integrate with i18n here
}

// Lifecycle
onMounted(() => {
  // Get app version from package.json or environment
  if (import.meta.env.VITE_APP_VERSION) {
    appVersion.value = import.meta.env.VITE_APP_VERSION
  }

  if (import.meta.env.VITE_BUILD_DATE) {
    buildDate.value = import.meta.env.VITE_BUILD_DATE
  }
})
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* Background */
.auth-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.auth-background-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 25% 25%, var(--el-color-primary-light-8) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, var(--el-color-info-light-8) 0%, transparent 50%);
  opacity: 0.6;
}

.auth-background-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9) 0%,
    var(--el-bg-color-page) 50%,
    var(--el-color-info-light-9) 100%
  );
}

/* Main container */
.auth-container {
  display: flex;
  max-width: 1200px;
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  overflow: hidden;
  z-index: 1;
}

/* Logo section */
.auth-logo-section {
  flex: 1;
  padding: 60px 40px;
  background: linear-gradient(
    135deg,
    var(--el-color-primary) 0%,
    var(--el-color-primary-dark-2) 100%
  );
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}

.auth-logo {
  text-align: center;
  margin-bottom: 40px;
}

.logo-image {
  width: 80px;
  height: 80px;
  margin-bottom: 20px;
  filter: brightness(0) invert(1);
}

.logo-text {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  line-height: 1.3;
}

.auth-welcome {
  text-align: center;
}

.welcome-title {
  font-size: 36px;
  font-weight: 600;
  margin: 0 0 16px 0;
  line-height: 1.2;
}

.welcome-subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin: 0;
  line-height: 1.5;
}

/* Form section */
.auth-form-section {
  flex: 1;
  padding: 60px 40px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.auth-card {
  margin-bottom: 32px;
  border: none;
  box-shadow: none;
  background: transparent;
}

/* Footer */
.auth-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.auth-links {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.auth-link {
  color: var(--el-color-primary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s ease;
}

.auth-link:hover {
  color: var(--el-color-primary-dark-2);
  text-decoration: underline;
}

.auth-language {
  flex-shrink: 0;
}

/* Version info */
.auth-version {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 2;
}

.version-text {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  background: rgba(255, 255, 255, 0.8);
  padding: 4px 8px;
  border-radius: 4px;
}

/* Decorative elements */
.auth-decorations {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
}

.decoration {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.decoration-1 {
  width: 100px;
  height: 100px;
  top: 10%;
  right: 10%;
  animation-delay: 0s;
}

.decoration-2 {
  width: 60px;
  height: 60px;
  bottom: 20%;
  left: 15%;
  animation-delay: 2s;
}

.decoration-3 {
  width: 80px;
  height: 80px;
  top: 60%;
  right: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* Transitions */
.auth-slide-enter-active,
.auth-slide-leave-active {
  transition: all 0.3s ease;
}

.auth-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.auth-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Responsive design */
@media (max-width: 1024px) {
  .auth-container {
    flex-direction: column;
    max-width: 500px;
  }

  .auth-logo-section {
    flex: none;
    padding: 40px 40px 20px;
    text-align: center;
  }

  .welcome-title {
    font-size: 28px;
  }

  .welcome-subtitle {
    font-size: 16px;
  }

  .auth-form-section {
    padding: 20px 40px 40px;
  }
}

@media (max-width: 768px) {
  .auth-layout {
    padding: 12px;
  }

  .auth-container {
    border-radius: 12px;
  }

  .auth-logo-section {
    padding: 32px 24px 16px;
  }

  .logo-text {
    font-size: 24px;
  }

  .welcome-title {
    font-size: 24px;
  }

  .welcome-subtitle {
    font-size: 14px;
  }

  .auth-form-section {
    padding: 16px 24px 32px;
  }

  .auth-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .auth-links {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .auth-links {
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .auth-container {
    border: 2px solid var(--el-border-color);
  }

  .auth-link {
    font-weight: 600;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .auth-slide-enter-active,
  .auth-slide-leave-active,
  .decoration {
    transition: none;
    animation: none;
  }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .auth-container {
    background: rgba(30, 30, 30, 0.95);
  }

  .auth-form-section {
    color: var(--el-text-color-primary);
  }

  .version-text {
    background: rgba(30, 30, 30, 0.8);
  }
}

/* Print styles */
@media print {
  .auth-decorations,
  .auth-background {
    display: none;
  }

  .auth-container {
    box-shadow: none;
    background: white;
  }
}
</style>

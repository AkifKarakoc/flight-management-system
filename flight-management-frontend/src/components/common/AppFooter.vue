<template>
  <footer :class="footerClass">
    <div class="footer-content">
      <!-- Left section -->
      <div class="footer-left">
        <div class="footer-logo">
          <img
            v-if="!logoError"
            src="/logo.svg"
            alt="Logo"
            class="logo-image"
            @error="logoError = true"
          />
          <span class="logo-text">{{ appName }}</span>
        </div>

        <div v-if="showCopyright" class="footer-copyright">
          © {{ currentYear }} {{ companyName }}. {{ copyrightText }}
        </div>
      </div>

      <!-- Center section -->
      <div v-if="showLinks" class="footer-center">
        <div class="footer-links">
          <div
            v-for="linkGroup in linkGroups"
            :key="linkGroup.title"
            class="link-group"
          >
            <h4 class="link-group-title">{{ linkGroup.title }}</h4>
            <ul class="link-list">
              <li
                v-for="link in linkGroup.links"
                :key="link.key"
                class="link-item"
              >
                <router-link
                  v-if="link.to"
                  :to="link.to"
                  class="footer-link"
                >
                  {{ link.label }}
                </router-link>

                v-else-if="link.href"
                :href="link.href"
                :target="link.external ? '_blank' : '_self'"
                :rel="link.external ? 'noopener noreferrer' : ''"
                class="footer-link"
                >
                {{ link.label }}
                <el-icon v-if="link.external" class="external-icon">
                  <TopRight />
                </el-icon>

                <span v-else class="footer-text">{{ link.label }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Right section -->
      <div class="footer-right">
        <!-- System info -->
        <div v-if="showSystemInfo" class="footer-system-info">
          <div class="system-info-item">
            <span class="info-label">Versiyon:</span>
            <span class="info-value">{{ appVersion }}</span>
          </div>
          <div class="system-info-item">
            <span class="info-label">Build:</span>
            <span class="info-value">{{ buildDate }}</span>
          </div>
          <div v-if="showServerStatus" class="system-info-item">
            <span class="info-label">Durum:</span>
            <el-tag
              :type="serverStatus.type"
              size="small"
              class="status-tag"
            >
              {{ serverStatus.text }}
            </el-tag>
          </div>
        </div>

        <!-- Social links -->
        <div v-if="socialLinks.length > 0" class="footer-social">

          v-for="social in socialLinks"
          :key="social.name"
          :href="social.url"
          :title="social.name"
          target="_blank"
          rel="noopener noreferrer"
          class="social-link"
          >
          <component :is="social.icon" class="social-icon" />
        </div>

        <!-- Language selector -->
        <div v-if="showLanguageSelector" class="footer-language">
          <BaseSelect
            v-model="selectedLanguage"
            :options="languageOptions"
            size="small"
            placeholder="Dil"
            style="width: 100px"
            @change="handleLanguageChange"
          />
        </div>
      </div>
    </div>

    <!-- Compact mode content -->
    <div v-if="compact" class="footer-compact">
      <span class="compact-text">
        © {{ currentYear }} {{ companyName }} | v{{ appVersion }}
      </span>
      <div class="compact-actions">
        <BaseButton
          v-if="showThemeToggle"
          type="text"
          size="small"
          :icon="isDarkMode ? 'Sunny' : 'Moon'"
          @click="toggleTheme"
        />
        <BaseButton
          v-if="showBackToTop"
          type="text"
          size="small"
          icon="Top"
          @click="scrollToTop"
        />
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { TopRight } from '@element-plus/icons-vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  // Appearance
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'minimal', 'detailed'].includes(value)
  },
  compact: {
    type: Boolean,
    default: false
  },

  // Content toggles
  showCopyright: {
    type: Boolean,
    default: true
  },
  showLinks: {
    type: Boolean,
    default: true
  },
  showSystemInfo: {
    type: Boolean,
    default: true
  },
  showServerStatus: {
    type: Boolean,
    default: true
  },
  showLanguageSelector: {
    type: Boolean,
    default: false
  },
  showThemeToggle: {
    type: Boolean,
    default: false
  },
  showBackToTop: {
    type: Boolean,
    default: true
  },

  // Custom content
  appName: {
    type: String,
    default: 'Uçuş Yönetim Sistemi'
  },
  companyName: {
    type: String,
    default: 'Flight Management Inc.'
  },
  copyrightText: {
    type: String,
    default: 'Tüm hakları saklıdır.'
  },

  // Links
  customLinkGroups: {
    type: Array,
    default: () => []
  },
  customSocialLinks: {
    type: Array,
    default: () => []
  }
})

// Reactive state
const logoError = ref(false)
const selectedLanguage = ref('tr')
const isDarkMode = ref(false)

// App info
const appVersion = ref('1.0.0')
const buildDate = ref(new Date().toLocaleDateString('tr-TR'))
const currentYear = computed(() => new Date().getFullYear())

// Server status
const serverStatus = ref({
  type: 'success',
  text: 'Çevrimiçi'
})

// Language options
const languageOptions = ref([
  { value: 'tr', label: 'TR' },
  { value: 'en', label: 'EN' }
])

// Default link groups
const defaultLinkGroups = [
  {
    title: 'Yönetim',
    links: [
      { key: 'flights', label: 'Uçuşlar', to: { name: 'FlightManagement' } },
      { key: 'airlines', label: 'Havayolları', to: { name: 'AirlineManagement' } },
      { key: 'airports', label: 'Havalimanları', to: { name: 'AirportManagement' } }
    ]
  },
  {
    title: 'Raporlar',
    links: [
      { key: 'flight-reports', label: 'Uçuş Raporları', to: { name: 'FlightReports' } },
      { key: 'archive-reports', label: 'Arşiv Raporları', to: { name: 'ArchiveReports' } },
      { key: 'kpi-reports', label: 'KPI Raporları', to: { name: 'KpiReports' } }
    ]
  },
  {
    title: 'Destek',
    links: [
      { key: 'help', label: 'Yardım', href: '/help', external: false },
      { key: 'contact', label: 'İletişim', href: '/contact', external: false },
      { key: 'api-docs', label: 'API Dokümantasyonu', href: '/api-docs', external: true }
    ]
  }
]

// Default social links
const defaultSocialLinks = [
  {
    name: 'GitHub',
    url: 'https://github.com',
    icon: 'Brand GitHub' // Would need proper icon component
  },
  {
    name: 'LinkedIn',
    url: 'https://linkedin.com',
    icon: 'Brand LinkedIn'
  }
]

// Computed properties
const footerClass = computed(() => {
  const classes = ['app-footer']

  if (props.variant !== 'default') {
    classes.push(`footer-${props.variant}`)
  }

  if (props.compact) {
    classes.push('footer-compact-mode')
  }

  return classes.join(' ')
})

const linkGroups = computed(() => {
  return props.customLinkGroups.length > 0
    ? props.customLinkGroups
    : (props.variant === 'minimal' ? [] : defaultLinkGroups)
})

const socialLinks = computed(() => {
  return props.customSocialLinks.length > 0
    ? props.customSocialLinks
    : (props.variant === 'detailed' ? defaultSocialLinks : [])
})

// Methods
const handleLanguageChange = (language) => {
  console.log('Language changed to:', language)
  // Implement language change logic
}

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.classList.toggle('dark', isDarkMode.value)
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const checkServerStatus = async () => {
  try {
    // Mock server status check
    // In real app, this would ping a health endpoint
    const response = await fetch('/api/health', {
      method: 'HEAD',
      timeout: 5000
    }).catch(() => null)

    if (response?.ok) {
      serverStatus.value = { type: 'success', text: 'Çevrimiçi' }
    } else {
      serverStatus.value = { type: 'warning', text: 'Yavaş' }
    }
  } catch (error) {
    serverStatus.value = { type: 'danger', text: 'Çevrimdışı' }
  }
}

// Lifecycle
onMounted(() => {
  // Get app version from environment
  if (import.meta.env.VITE_APP_VERSION) {
    appVersion.value = import.meta.env.VITE_APP_VERSION
  }

  if (import.meta.env.VITE_BUILD_DATE) {
    buildDate.value = import.meta.env.VITE_BUILD_DATE
  }

  // Initialize theme
  const savedTheme = localStorage.getItem('theme')
  isDarkMode.value = savedTheme === 'dark'

  // Check server status periodically
  if (props.showServerStatus) {
    checkServerStatus()
    setInterval(checkServerStatus, 60000) // Check every minute
  }
})
</script>

<style scoped>
.app-footer {
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-light);
  margin-top: auto;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 32px 24px;
  max-width: 1200px;
  margin: 0 auto;
  gap: 32px;
}

/* Compact mode */
.footer-compact-mode .footer-content {
  display: none;
}

.footer-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: var(--el-fill-color-light);
  border-top: 1px solid var(--el-border-color-lighter);
}

.compact-text {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.compact-actions {
  display: flex;
  gap: 8px;
}

/* Left section */
.footer-left {
  flex: 1;
  min-width: 0;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.logo-image {
  width: 32px;
  height: 32px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.footer-copyright {
  font-size: 14px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
}

/* Center section */
.footer-center {
  flex: 2;
  min-width: 0;
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 32px;
}

.link-group-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 16px 0;
}

.link-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.link-item {
  margin-bottom: 8px;
}

.footer-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--el-text-color-regular);
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: var(--el-color-primary);
}

.footer-text {
  font-size: 14px;
  color: var(--el-text-color-placeholder);
}

.external-icon {
  width: 12px;
  height: 12px;
}

/* Right section */
.footer-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 16px;
}

/* System info */
.footer-system-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: right;
}

.system-info-item {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  font-size: 12px;
}

.info-label {
  color: var(--el-text-color-regular);
  font-weight: 500;
}

.info-value {
  color: var(--el-text-color-primary);
  font-family: monospace;
}

.status-tag {
  font-size: 10px;
  padding: 2px 6px;
}

/* Social links */
.footer-social {
  display: flex;
  gap: 12px;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  text-decoration: none;
  transition: all 0.2s ease;
}

.social-link:hover {
  background: var(--el-color-primary);
  color: white;
  transform: translateY(-2px);
}

.social-icon {
  width: 18px;
  height: 18px;
}

/* Language selector */
.footer-language {
  width: 100px;
}

/* Variants */
.footer-minimal .footer-content {
  padding: 16px 24px;
}

.footer-minimal .footer-links {
  display: none;
}

.footer-detailed .footer-content {
  padding: 48px 24px;
}

.footer-detailed .footer-links {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 48px;
}

/* Responsive design */
@media (max-width: 1024px) {
  .footer-content {
    flex-direction: column;
    align-items: stretch;
    gap: 24px;
  }

  .footer-right {
    align-items: flex-start;
    flex-direction: row;
    justify-content: space-between;
  }

  .footer-system-info {
    text-align: left;
  }

  .system-info-item {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .footer-content {
    padding: 24px 16px;
  }

  .footer-compact {
    padding: 12px 16px;
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }

  .footer-links {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }

  .footer-right {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .footer-social {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .footer-links {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .footer-logo {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }

  .logo-text {
    font-size: 16px;
  }
}

/* High contrast mode */
@media (prefers-contrast: more) {
  .footer-link {
    font-weight: 500;
  }

  .social-link {
    border: 1px solid var(--el-border-color);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .footer-link,
  .social-link {
    transition: none;
  }

  .social-link:hover {
    transform: none;
  }
}

/* Dark mode */
.dark .footer-compact {
  background: var(--el-fill-color-darker);
}

.dark .social-link {
  background: var(--el-fill-color-darker);
}

.dark .social-link:hover {
  background: var(--el-color-primary);
}

/* Print styles */
@media print {
  .app-footer {
    border-top: 1px solid #000;
    background: white;
  }

  .footer-social,
  .compact-actions {
    display: none;
  }

  .footer-link {
    color: #000;
  }
}
</style>

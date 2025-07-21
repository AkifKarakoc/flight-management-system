<template>
  <div class="app-header">
    <!-- Left Section -->
    <div class="header-left">
      <el-button
        type="text"
        :icon="collapsed ? Expand : Fold"
        @click="$emit('toggle-sidebar')"
        class="sidebar-toggle"
      />

      <div class="logo-section">
        <img src="/src/assets/images/logo.png" alt="Logo" class="logo" />
        <span class="app-title">Uçuş Yönetim Sistemi</span>
      </div>
    </div>

    <!-- Center Section -->
    <div class="header-center">
      <el-input
        v-model="searchQuery"
        placeholder="Uçuş ara... (Ctrl+K)"
        :prefix-icon="Search"
        class="global-search"
        @keyup.enter="handleSearch"
        @focus="showSearchResults = true"
        @blur="hideSearchResults"
      >
        <template #suffix>
          <el-tag size="small" type="info">Ctrl+K</el-tag>
        </template>
      </el-input>

      <!-- Search Results -->
      <div v-if="showSearchResults && searchQuery" class="search-results">
        <div v-if="searchResults.length === 0" class="search-empty">
          <el-empty description="Sonuç bulunamadı" :image-size="60" />
        </div>
        <div v-else>
          <div
            v-for="result in searchResults"
            :key="result.id"
            class="search-item"
            @click="selectSearchResult(result)"
          >
            <el-icon><component :is="result.icon" /></el-icon>
            <div class="search-content">
              <div class="search-title">{{ result.title }}</div>
              <div class="search-subtitle">{{ result.subtitle }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Section -->
    <div class="header-right">
      <!-- Notifications -->
      <el-badge :value="notificationCount" :hidden="notificationCount === 0" class="notification-badge">
        <el-button
          type="text"
          :icon="Bell"
          @click="showNotifications = true"
          class="header-button"
        />
      </el-badge>

      <!-- Language Selector -->
      <el-dropdown @command="handleLanguageChange" placement="bottom-end">
        <el-button type="text" class="header-button">
          <el-icon><Globe /></el-icon>
          <span class="language-text">{{ currentLanguage.label }}</span>
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

      <!-- Theme Toggle -->
      <el-button
        type="text"
        :icon="isDarkMode ? Sunny : Moon"
        @click="toggleTheme"
        class="header-button"
      />

      <!-- User Menu -->
      <el-dropdown @command="handleUserMenuCommand" placement="bottom-end">
        <div class="user-info">
          <el-avatar
            :src="user.avatar"
            :size="32"
            class="user-avatar"
          >
            {{ user.name?.charAt(0)?.toUpperCase() }}
          </el-avatar>
          <span class="user-name">{{ user.name }}</span>
          <el-icon class="user-arrow"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              Profil
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              <el-icon><Setting /></el-icon>
              Ayarlar
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              Çıkış Yap
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- Notifications Drawer -->
    <el-drawer
      v-model="showNotifications"
      title="Bildirimler"
      direction="rtl"
      size="350px"
    >
      <div class="notifications-container">
        <div v-if="notifications.length === 0" class="notifications-empty">
          <el-empty description="Yeni bildirim yok" :image-size="80" />
        </div>
        <div v-else>
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="notification-item"
            :class="{ unread: !notification.read }"
            @click="markAsRead(notification)"
          >
            <div class="notification-icon" :class="notification.type">
              <el-icon><component :is="getNotificationIcon(notification.type)" /></el-icon>
            </div>
            <div class="notification-content">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-message">{{ notification.message }}</div>
              <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { formatRelativeTime } from '@/utils/formatters'
import {
  Fold, Expand, Search, Bell, Globe, Sunny, Moon, User, Setting, SwitchButton,
  ArrowDown, Position, InfoFilled, WarningFilled, SuccessFilled
} from '@element-plus/icons-vue'

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle-sidebar', 'logout'])

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

// Reactive state
const searchQuery = ref('')
const showSearchResults = ref(false)
const showNotifications = ref(false)
const searchResults = ref([])

// Computed properties
const user = computed(() => authStore.user || {
  name: 'John Doe',
  email: 'john@example.com',
  avatar: ''
})

const isDarkMode = computed(() => appStore.theme === 'dark')

const notificationCount = computed(() => {
  return notifications.value.filter(n => !n.read).length
})

const currentLanguage = computed(() => {
  return languages.value.find(lang => lang.code === appStore.language) || languages.value[0]
})

// Data
const languages = ref([
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' }
])

const notifications = ref([
  {
    id: 1,
    type: 'info',
    title: 'Yeni Uçuş Eklendi',
    message: 'TK1234 numaralı uçuş başarıyla eklendi.',
    createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    read: false
  },
  {
    id: 2,
    type: 'warning',
    title: 'Uçuş Gecikmesi',
    message: 'PC2105 numaralı uçuş 30 dakika gecikecek.',
    createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    read: false
  },
  {
    id: 3,
    type: 'success',
    title: 'Rapor Hazır',
    message: 'Aylık uçuş raporu oluşturuldu.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    read: true
  }
])

// Methods
const handleSearch = () => {
  if (!searchQuery.value.trim()) return

  // Mock search results
  searchResults.value = [
    {
      id: 1,
      title: 'TK1234',
      subtitle: 'İstanbul → Ankara',
      icon: 'Position',
      type: 'flight',
      path: '/flights/1'
    },
    {
      id: 2,
      title: 'Turkish Airlines',
      subtitle: 'Havayolu Yönetimi',
      icon: 'Ship',
      type: 'airline',
      path: '/airlines'
    }
  ].filter(item =>
    item.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
}

const selectSearchResult = (result) => {
  router.push(result.path)
  searchQuery.value = ''
  showSearchResults.value = false
}

const hideSearchResults = () => {
  setTimeout(() => {
    showSearchResults.value = false
  }, 200)
}

const handleLanguageChange = (language) => {
  appStore.setLanguage(language)
}

const toggleTheme = () => {
  appStore.toggleTheme()
}

const handleUserMenuCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      emit('logout')
      break
  }
}

const markAsRead = (notification) => {
  notification.read = true
}

const getNotificationIcon = (type) => {
  const iconMap = {
    info: InfoFilled,
    warning: WarningFilled,
    success: SuccessFilled,
    error: WarningFilled
  }
  return iconMap[type] || InfoFilled
}

const formatTime = (date) => {
  return formatRelativeTime(date)
}

// Global search shortcut
const handleKeydown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    document.querySelector('.global-search input')?.focus()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 24px;
  background: #fff;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sidebar-toggle {
  font-size: 18px;
  color: #606266;
  padding: 8px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  height: 32px;
  width: auto;
}

.app-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
}

.header-center {
  flex: 1;
  max-width: 400px;
  margin: 0 24px;
  position: relative;
}

.global-search {
  width: 100%;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
}

.search-empty {
  padding: 20px;
}

.search-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f7fa;
  cursor: pointer;
  transition: background-color 0.2s;
}

.search-item:hover {
  background-color: #f5f7fa;
}

.search-item:last-child {
  border-bottom: none;
}

.search-content {
  margin-left: 12px;
  flex: 1;
}

.search-title {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.search-subtitle {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-button {
  padding: 8px;
  font-size: 16px;
  color: #606266;
}

.notification-badge {
  margin-right: 8px;
}

.language-text {
  margin-left: 6px;
  font-size: 14px;
}

.language-flag {
  margin-right: 8px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-avatar {
  flex-shrink: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-arrow {
  font-size: 12px;
  color: #909399;
}

.notifications-container {
  height: 100%;
}

.notifications-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.notification-item {
  display: flex;
  padding: 16px;
  border-bottom: 1px solid #f5f7fa;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.unread {
  background-color: #f0f9ff;
  border-left: 3px solid #409eff;
}

.notification-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.notification-icon.info {
  background-color: #e1f3ff;
  color: #409eff;
}

.notification-icon.warning {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.notification-icon.success {
  background-color: #f0f9ff;
  color: #67c23a;
}

.notification-icon.error {
  background-color: #fef0f0;
  color: #f56c6c;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
  margin-bottom: 4px;
}

.notification-message {
  color: #606266;
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.notification-time {
  color: #909399;
  font-size: 12px;
}

/* Responsive design */
@media (max-width: 768px) {
  .app-header {
    padding: 0 16px;
  }

  .header-center {
    margin: 0 16px;
    max-width: 200px;
  }

  .app-title {
    display: none;
  }

  .language-text {
    display: none;
  }

  .user-name {
    display: none;
  }
}

@media (max-width: 480px) {
  .header-center {
    display: none;
  }
}
</style>

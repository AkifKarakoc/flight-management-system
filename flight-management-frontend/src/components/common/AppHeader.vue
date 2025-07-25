<template>
  <header class="app-header">
    <div class="header-left">
      <!-- Sidebar toggle button -->
      <BaseButton
        type="text"
        :icon="sidebarCollapsed ? 'Menu' : 'MenuFold'"
        class="sidebar-toggle"
        @click="handleSidebarToggle"
      />

      <!-- Mobile sidebar toggle -->
      <BaseButton
        type="text"
        icon="Menu"
        class="mobile-sidebar-toggle"
        @click="handleMobileSidebarToggle"
      />

      <!-- Breadcrumb (hidden on mobile) -->
      <div class="header-breadcrumb">
        <BreadcrumbNav compact />
      </div>
    </div>

    <div class="header-center">
      <!-- Global search -->
      <div v-if="showGlobalSearch" class="global-search">
        <BaseInput
          v-model="searchQuery"
          placeholder="Ara..."
          prefix-icon="Search"
          clearable
          size="small"
          class="search-input"
          @input="handleSearch"
          @keydown.enter="handleSearchSubmit"
        />

        <!-- Search suggestions dropdown -->
        <div v-if="searchSuggestions.length > 0" class="search-suggestions">
          <div
            v-for="suggestion in searchSuggestions"
            :key="suggestion.id"
            class="search-suggestion"
            @click="handleSuggestionClick(suggestion)"
          >
            <component :is="suggestion.icon" class="suggestion-icon" />
            <div class="suggestion-content">
              <div class="suggestion-title">{{ suggestion.title }}</div>
              <div class="suggestion-type">{{ suggestion.type }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="header-right">
      <!-- Quick actions -->
      <div class="header-actions">
        <!-- Theme toggle -->
        <BaseButton
          v-if="showThemeToggle"
          type="text"
          :icon="isDarkMode ? 'Sunny' : 'Moon'"
          :title="isDarkMode ? 'Açık tema' : 'Koyu tema'"
          @click="toggleTheme"
        />

        <!-- Fullscreen toggle -->
        <BaseButton
          v-if="showFullscreenToggle"
          type="text"
          :icon="isFullscreen ? 'FullscreenExit' : 'Fullscreen'"
          :title="isFullscreen ? 'Tam ekrandan çık' : 'Tam ekran'"
          @click="toggleFullscreen"
        />

        <!-- Notifications -->
        <div class="notification-dropdown">
          <el-dropdown
            trigger="click"
            placement="bottom-end"
            @visible-change="handleNotificationDropdown"
          >
            <BaseButton
              type="text"
              icon="Bell"
              :title="`${unreadNotifications} okunmamış bildirim`"
            >
              <el-badge
                v-if="unreadNotifications > 0"
                :value="unreadNotifications"
                :max="99"
                class="notification-badge"
              />
            </BaseButton>

            <template #dropdown>
              <el-dropdown-menu class="notification-menu">
                <div class="notification-header">
                  <span class="notification-title">Bildirimler</span>
                  <BaseButton
                    v-if="unreadNotifications > 0"
                    type="text"
                    size="small"
                    @click="markAllAsRead"
                  >
                    Tümünü okundu işaretle
                  </BaseButton>
                </div>

                <div class="notification-list">
                  <div
                    v-for="notification in recentNotifications"
                    :key="notification.id"
                    :class="['notification-item', { 'unread': !notification.read }]"
                    @click="handleNotificationClick(notification)"
                  >
                    <div class="notification-icon">
                      <component :is="notification.icon" />
                    </div>
                    <div class="notification-content">
                      <div class="notification-message">{{ notification.message }}</div>
                      <div class="notification-time">{{ formatNotificationTime(notification.time) }}</div>
                    </div>
                  </div>
                </div>

                <div class="notification-footer">
                  <BaseButton
                    type="text"
                    size="small"
                    @click="viewAllNotifications"
                  >
                    Tüm bildirimleri görüntüle
                  </BaseButton>
                </div>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- User menu -->
      <div class="user-menu">
        <el-dropdown trigger="click" placement="bottom-end">
          <div class="user-profile">
            <el-avatar
              :src="user?.avatar"
              :size="32"
              class="user-avatar"
            >
              {{ userInitials }}
            </el-avatar>
            <div class="user-info">
              <div class="user-name">{{ user?.name || 'Kullanıcı' }}</div>
              <div class="user-role">{{ formatUserRole(user?.role) }}</div>
            </div>
            <el-icon class="user-dropdown-icon">
              <ArrowDown />
            </el-icon>
          </div>

          <template #dropdown>
            <el-dropdown-menu class="user-dropdown">
              <el-dropdown-item @click="viewProfile">
                <el-icon><User /></el-icon>
                Profil
              </el-dropdown-item>
              <el-dropdown-item @click="viewSettings">
                <el-icon><Setting /></el-icon>
                Ayarlar
              </el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">
                <el-icon><SwitchButton /></el-icon>
                Çıkış Yap
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowDown,
  User,
  Setting,
  SwitchButton,
  Bell,
  Search,
  Menu,
  MenuFold,
  Sunny,
  Moon,
  Fullscreen,
  FullscreenExit
} from '@element-plus/icons-vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BreadcrumbNav from './BreadcrumbNav.vue'
import { useAuthStore } from '@/stores/auth'
import { formatRelativeTime } from '@/utils/formatters'
import { debounce } from '@/utils/helpers'

// Props
const props = defineProps({
  sidebarCollapsed: {
    type: Boolean,
    default: false
  },
  showGlobalSearch: {
    type: Boolean,
    default: true
  },
  showThemeToggle: {
    type: Boolean,
    default: true
  },
  showFullscreenToggle: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'toggle-sidebar',
  'toggle-mobile-sidebar'
])

// Composables
const router = useRouter()
const authStore = useAuthStore()

// Reactive state
const searchQuery = ref('')
const searchSuggestions = ref([])
const isDarkMode = ref(false)
const isFullscreen = ref(false)
const unreadNotifications = ref(3)
const recentNotifications = ref([
  {
    id: 1,
    icon: 'InfoFilled',
    message: 'Yeni uçuş TK123 eklendi',
    time: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
    type: 'info'
  },
  {
    id: 2,
    icon: 'WarningFilled',
    message: 'Uçuş TK456 gecikti',
    time: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    type: 'warning'
  },
  {
    id: 3,
    icon: 'SuccessFilled',
    message: 'CSV yükleme tamamlandı',
    time: new Date(Date.now() - 30 * 60 * 1000),
    read: true,
    type: 'success'
  }
])

// Computed properties
const user = computed(() => authStore.user)

const userInitials = computed(() => {
  if (!user.value?.name) return 'U'
  return user.value.name
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

// Debounced search
const debouncedSearch = debounce(async (query) => {
  if (!query.trim()) {
    searchSuggestions.value = []
    return
  }

  // Mock search suggestions
  const mockSuggestions = [
    { id: 1, title: 'TK123', type: 'Uçuş', icon: 'Airplane' },
    { id: 2, title: 'Turkish Airlines', type: 'Havayolu', icon: 'OfficeBuilding' },
    { id: 3, title: 'İstanbul Havalimanı', type: 'Havalimanı', icon: 'Location' }
  ].filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase())
  )

  searchSuggestions.value = mockSuggestions
}, 300)

// Methods
const handleSidebarToggle = () => {
  emit('toggle-sidebar')
}

const handleMobileSidebarToggle = () => {
  emit('toggle-mobile-sidebar')
}

const handleSearch = (query) => {
  debouncedSearch(query)
}

const handleSearchSubmit = () => {
  if (searchQuery.value.trim()) {
    router.push({
      name: 'Search',
      query: { q: searchQuery.value }
    })
    searchSuggestions.value = []
  }
}

const handleSuggestionClick = (suggestion) => {
  searchQuery.value = suggestion.title
  searchSuggestions.value = []

  // Navigate based on suggestion type
  switch (suggestion.type) {
    case 'Uçuş':
      router.push({ name: 'FlightView', params: { id: suggestion.id } })
      break
    case 'Havayolu':
      router.push({ name: 'AirlineManagement' })
      break
    case 'Havalimanı':
      router.push({ name: 'AirportManagement' })
      break
  }
}

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.classList.toggle('dark', isDarkMode.value)
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

const handleNotificationDropdown = (visible) => {
  if (visible) {
    // Mark notifications as viewed (not read)
    console.log('Notifications viewed')
  }
}

const handleNotificationClick = (notification) => {
  if (!notification.read) {
    notification.read = true
    unreadNotifications.value = Math.max(0, unreadNotifications.value - 1)
  }

  // Navigate to relevant page based on notification
  switch (notification.type) {
    case 'info':
      router.push({ name: 'FlightManagement' })
      break
    case 'warning':
      router.push({ name: 'FlightManagement' })
      break
    case 'success':
      router.push({ name: 'FlightUpload' })
      break
  }
}

const markAllAsRead = () => {
  recentNotifications.value.forEach(notification => {
    notification.read = true
  })
  unreadNotifications.value = 0
  ElMessage.success('Tüm bildirimler okundu olarak işaretlendi')
}

const viewAllNotifications = () => {
  router.push({ name: 'Notifications' })
}

const formatNotificationTime = (time) => {
  return formatRelativeTime(time)
}

const formatUserRole = (role) => {
  const roleMap = {
    'ADMIN': 'Yönetici',
    'USER': 'Kullanıcı',
    'MANAGER': 'Müdür',
    'OPERATOR': 'Operatör'
  }
  return roleMap[role] || role
}

const viewProfile = () => {
  router.push({ name: 'Profile' })
}

const viewSettings = () => {
  router.push({ name: 'Settings' })
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      'Çıkış yapmak istediğinizden emin misiniz?',
      'Çıkış Onayı',
      {
        type: 'warning',
        confirmButtonText: 'Evet',
        cancelButtonText: 'Hayır'
      }
    )

    await authStore.logout()
    router.push({ name: 'Login' })
    ElMessage.success('Başarıyla çıkış yapıldı')
  } catch (error) {
    // User cancelled or error occurred
    if (error !== 'cancel') {
      ElMessage.error('Çıkış yapılırken hata oluştu')
    }
  }
}

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

const handleClickOutside = (event) => {
  // Close search suggestions when clicking outside
  if (!event.target.closest('.global-search')) {
    searchSuggestions.value = []
  }
}

// Lifecycle
onMounted(() => {
  // Initialize theme
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDarkMode.value = true
    document.documentElement.classList.add('dark')
  }

  // Listen for fullscreen changes
  document.addEventListener('fullscreenchange', handleFullscreenChange)

  // Listen for clicks outside
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  position: sticky;
  top: 0;
  z-index: 1000;
}

/* Header sections */
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.header-center {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 2;
  max-width: 600px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  justify-content: flex-end;
}

/* Sidebar toggles */
.sidebar-toggle {
  display: none;
}

.mobile-sidebar-toggle {
  display: block;
}

.header-breadcrumb {
  min-width: 0;
  flex: 1;
}

/* Global search */
.global-search {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.search-input {
  width: 100%;
}

.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
}

.search-suggestion {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.search-suggestion:hover {
  background-color: var(--el-fill-color-light);
}

.suggestion-icon {
  width: 20px;
  height: 20px;
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.suggestion-content {
  flex: 1;
  min-width: 0;
}

.suggestion-title {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.suggestion-type {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

/* Header actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Notifications */
.notification-dropdown {
  position: relative;
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
}

.notification-menu {
  width: 320px;
  max-height: 400px;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.notification-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.notification-list {
  max-height: 280px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-left: 3px solid transparent;
}

.notification-item:hover {
  background-color: var(--el-fill-color-light);
}

.notification-item.unread {
  background-color: var(--el-color-primary-light-9);
  border-left-color: var(--el-color-primary);
}

.notification-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-message {
  font-size: 14px;
  color: var(--el-text-color-primary);
  line-height: 1.4;
  margin-bottom: 4px;
}

.notification-time {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.notification-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--el-border-color-light);
  text-align: center;
}

/* User menu */
.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.user-profile:hover {
  background-color: var(--el-fill-color-light);
}

.user-avatar {
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}

.user-role {
  font-size: 12px;
  color: var(--el-text-color-regular);
  line-height: 1.2;
}

.user-dropdown-icon {
  color: var(--el-text-color-placeholder);
  transition: transform 0.2s ease;
}

.user-dropdown {
  min-width: 160px;
}

/* Responsive design */
@media (min-width: 1024px) {
  .sidebar-toggle {
    display: block;
  }

  .mobile-sidebar-toggle {
    display: none;
  }

  .header-breadcrumb {
    display: block;
  }
}

@media (max-width: 1024px) {
  .header-breadcrumb {
    display: none;
  }

  .header-center {
    flex: 1;
  }
}

@media (max-width: 768px) {
  .app-header {
    padding: 0 16px;
  }

  .header-center {
    display: none;
  }

  .header-right {
    gap: 8px;
  }

  .user-info {
    display: none;
  }

  .header-actions {
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 0 12px;
  }

  .header-actions {
    gap: 2px;
  }
}

/* Dark mode */
.dark .search-suggestions {
  background: var(--el-bg-color-overlay);
  border-color: var(--el-border-color);
}

.dark .notification-menu {
  background: var(--el-bg-color-overlay);
}

.dark .user-dropdown {
  background: var(--el-bg-color-overlay);
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .app-header {
    border-bottom-width: 2px;
  }

  .notification-item.unread {
    border-left-width: 4px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .search-suggestion,
  .notification-item,
  .user-profile,
  .user-dropdown-icon {
    transition: none;
  }
}
</style>

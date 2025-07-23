<template>
  <div class="app-header">
    <div class="header-left">
      <!-- Sidebar Toggle -->
      <el-button
        :icon="collapsed ? Expand : Fold"
        size="large"
        text
        @click="handleToggleSidebar"
        class="sidebar-toggle"
      />

      <!-- Logo & Title -->
      <div class="header-logo">
        <el-icon size="28" color="#409EFF">
          <Position />
        </el-icon>
        <span class="header-title">Flight Management</span>
      </div>
    </div>

    <div class="header-center">
      <!-- Search Bar -->
      <el-input
        v-model="searchQuery"
        :prefix-icon="Search"
        placeholder="Uçuş ara... (Örn: TK101)"
        class="header-search"
        clearable
        @keyup.enter="handleSearch"
        @clear="handleSearchClear"
      >
        <template #append>
          <el-button :icon="Search" @click="handleSearch" />
        </template>
      </el-input>
    </div>

    <div class="header-right">
      <!-- System Status -->
      <el-tooltip content="Sistem Durumu" placement="bottom">
        <el-badge :value="systemIssues" :hidden="systemIssues === 0" type="danger">
          <el-button
            :icon="Monitor"
            size="large"
            text
            @click="showSystemStatus"
            :class="{ 'status-warning': systemIssues > 0 }"
          />
        </el-badge>
      </el-tooltip>

      <!-- Notifications -->
      <el-tooltip content="Bildirimler" placement="bottom">
        <el-badge :value="unreadNotifications" :hidden="unreadNotifications === 0" class="notification-badge">
          <el-button :icon="Bell" size="large" text @click="showNotifications" />
        </el-badge>
      </el-tooltip>

      <!-- Full Screen Toggle -->
      <el-tooltip :content="isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'" placement="bottom">
        <el-button
          :icon="isFullscreen ? OfficeBuilding : FullScreen"
          size="large"
          text
          @click="toggleFullscreen"
        />
      </el-tooltip>

      <!-- Theme Toggle -->
      <el-tooltip :content="isDark ? 'Açık Tema' : 'Koyu Tema'" placement="bottom">
        <el-button
          :icon="isDark ? Sunny : Moon"
          size="large"
          text
          @click="toggleTheme"
        />
      </el-tooltip>

      <!-- User Dropdown -->
      <el-dropdown @command="handleUserCommand" class="user-dropdown">
        <div class="user-info">
          <el-avatar :src="userAvatar" :icon="UserFilled" size="default" />
          <div class="user-details" v-if="!isMobile">
            <span class="user-name">{{ userDisplayName }}</span>
            <span class="user-role">{{ userRole }}</span>
          </div>
          <el-icon class="dropdown-arrow">
            <ArrowDown />
          </el-icon>
        </div>

        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile" :icon="User">
              Profil
            </el-dropdown-item>
            <el-dropdown-item command="settings" :icon="Setting">
              Ayarlar
            </el-dropdown-item>
            <el-dropdown-item divided />
            <el-dropdown-item command="about" :icon="InfoFilled">
              Hakkında
            </el-dropdown-item>
            <el-dropdown-item command="logout" :icon="SwitchButton" class="logout-item">
              Çıkış Yap
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- Notifications Drawer -->
    <el-drawer
      v-model="notificationsVisible"
      title="Bildirimler"
      direction="rtl"
      size="400px"
    >
      <div class="notifications-content">
        <div class="notifications-header">
          <div class="notifications-stats">
            <span>{{ unreadNotifications }} okunmamış</span>
            <el-button
              type="primary"
              text
              size="small"
              @click="markAllAsRead"
              :disabled="unreadNotifications === 0"
            >
              Tümünü Okundu İşaretle
            </el-button>
          </div>
        </div>

        <div v-if="notifications.length === 0" class="no-notifications">
          <el-empty description="Henüz bildirim yok" />
        </div>

        <div v-else class="notifications-list">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="notification-item"
            :class="{ 'unread': !notification.read }"
            @click="markAsRead(notification.id)"
          >
            <el-icon
              :size="20"
              :color="getNotificationColor(notification.type)"
              class="notification-icon"
            >
              <component :is="getNotificationIcon(notification.type)" />
            </el-icon>

            <div class="notification-content">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-message">{{ notification.message }}</div>
              <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
            </div>

            <el-button
              v-if="!notification.read"
              :icon="CircleCheck"
              text
              size="small"
              @click.stop="markAsRead(notification.id)"
            />
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- System Status Drawer -->
    <el-drawer
      v-model="systemStatusVisible"
      title="Sistem Durumu"
      direction="rtl"
      size="350px"
    >
      <div class="system-status-content">
        <div class="status-overview">
          <el-card shadow="never" class="status-card">
            <div class="status-summary">
              <el-icon size="48" :color="systemHealthColor">
                <component :is="systemHealthIcon" />
              </el-icon>
              <div class="status-text">
                <h3>{{ systemHealthText }}</h3>
                <p>Sistem Durumu</p>
              </div>
            </div>
          </el-card>
        </div>

        <div class="services-status">
          <h4>Servis Durumları</h4>
          <div class="service-list">
            <div
              v-for="service in services"
              :key="service.name"
              class="service-item"
            >
              <div class="service-info">
                <span class="service-name">{{ service.displayName }}</span>
                <span class="service-url">{{ service.url }}</span>
              </div>
              <el-tag
                :type="getServiceTagType(service.status)"
                size="small"
              >
                {{ getServiceStatusText(service.status) }}
              </el-tag>
            </div>
          </div>
        </div>

        <div class="status-actions">
          <el-button @click="refreshSystemStatus" :loading="statusLoading">
            <el-icon><Refresh /></el-icon>
            Yenile
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/tr'

// Import icons
import {
  Expand, Fold, Position, Search, Monitor, Bell, FullScreen, OfficeBuilding,
  Sunny, Moon, UserFilled, User, Setting, InfoFilled, SwitchButton, ArrowDown,
  CircleCheck, Refresh, WarningFilled, SuccessFilled, CircleCloseFilled,
  CircleCheckFilled
} from '@element-plus/icons-vue'

// Setup dayjs
dayjs.extend(relativeTime)
dayjs.locale('tr')

// Props
const props = defineProps<{
  collapsed?: boolean
}>()

// Emits
const emit = defineEmits<{
  'toggle-sidebar': []
  'logout': []
}>()

// Stores
const authStore = useAuthStore()
const router = useRouter()

// Reactive state
const searchQuery = ref('')
const notificationsVisible = ref(false)
const systemStatusVisible = ref(false)
const isFullscreen = ref(false)
const isDark = ref(false)
const isMobile = ref(false)
const statusLoading = ref(false)

// Mock notifications
const notifications = ref([
  {
    id: 1,
    type: 'info',
    title: 'Sistem Bildirimi',
    message: 'Uçuş planlaması güncellendi. Yeni rotalar eklendi.',
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
    read: false
  },
  {
    id: 2,
    type: 'warning',
    title: 'Gecikme Uyarısı',
    message: 'TK101 nolu uçuşta 15 dakika gecikme bekleniyor.',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    read: false
  },
  {
    id: 3,
    type: 'success',
    title: 'Uçuş Tamamlandı',
    message: 'TK200 nolu uçuş başarıyla İstanbul\'a indi.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true
  },
  {
    id: 4,
    type: 'error',
    title: 'Sistem Hatası',
    message: 'Kafka bağlantısında geçici sorun yaşandı.',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    read: false
  }
])

// Mock services status
const services = ref([
  {
    name: 'reference-manager',
    displayName: 'Reference Manager',
    url: 'http://localhost:8081',
    status: 'UP'
  },
  {
    name: 'flight-service',
    displayName: 'Flight Service',
    url: 'http://localhost:8082',
    status: 'UP'
  },
  {
    name: 'archive-manager',
    displayName: 'Archive Manager',
    url: 'http://localhost:8083',
    status: 'UP'
  },
  {
    name: 'kafka',
    displayName: 'Apache Kafka',
    url: 'localhost:9092',
    status: 'DOWN'
  },
  {
    name: 'redis',
    displayName: 'Redis Cache',
    url: 'localhost:6379',
    status: 'UP'
  }
])

// Computed properties
const userDisplayName = computed(() => {
  return authStore.userInfo?.fullName || authStore.userInfo?.username || 'Kullanıcı'
})

const userRole = computed(() => {
  const roles = authStore.userRoles
  if (roles.includes('ADMIN') || roles.includes('ROLE_ADMIN')) return 'Yönetici'
  if (roles.includes('USER') || roles.includes('ROLE_USER')) return 'Kullanıcı'
  return 'Misafir'
})

const userAvatar = computed(() => {
  return authStore.userInfo?.avatar || null
})

const unreadNotifications = computed(() => {
  return notifications.value.filter(n => !n.read).length
})

const systemIssues = computed(() => {
  return services.value.filter(s => s.status !== 'UP').length
})

const systemHealthColor = computed(() => {
  if (systemIssues.value === 0) return '#67C23A'
  if (systemIssues.value <= 2) return '#E6A23C'
  return '#F56C6C'
})

const systemHealthIcon = computed(() => {
  if (systemIssues.value === 0) return CircleCheckFilled
  if (systemIssues.value <= 2) return WarningFilled
  return CircleCloseFilled
})

const systemHealthText = computed(() => {
  if (systemIssues.value === 0) return 'Sistem Sağlıklı'
  if (systemIssues.value <= 2) return 'Uyarılar Var'
  return 'Kritik Sorunlar'
})

// Methods
function handleToggleSidebar() {
  emit('toggle-sidebar')
}

function handleSearch() {
  if (!searchQuery.value.trim()) return

  // Navigate to flights with search query
  router.push({
    name: 'Flights',
    query: { search: searchQuery.value }
  })

  // Clear search after navigation
  searchQuery.value = ''
  ElMessage.success(`"${searchQuery.value}" için arama yapılıyor...`)
}

function handleSearchClear() {
  searchQuery.value = ''
}

function showNotifications() {
  notificationsVisible.value = true
}

function showSystemStatus() {
  systemStatusVisible.value = true
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  ElMessage.success(`${isDark.value ? 'Koyu' : 'Açık'} tema aktif`)
}

async function handleUserCommand(command: string) {
  switch (command) {
    case 'profile':
      ElMessage.info('Profil sayfası henüz hazır değil')
      break
    case 'settings':
      ElMessage.info('Ayarlar sayfası henüz hazır değil')
      break
    case 'about':
      ElMessageBox.alert(
        'Flight Management System v1.0.0\n\nGeliştirici: Flight Team\nBuild: 2025.1.23',
        'Hakkında',
        {
          confirmButtonText: 'Tamam'
        }
      )
      break
    case 'logout':
      try {
        await ElMessageBox.confirm(
          'Çıkış yapmak istediğinizden emin misiniz?',
          'Çıkış Onayı',
          {
            confirmButtonText: 'Evet, Çıkış Yap',
            cancelButtonText: 'İptal',
            type: 'warning',
          }
        )
        await authStore.logout()
        emit('logout')
      } catch {
        // User cancelled
      }
      break
  }
}

function getNotificationIcon(type: string) {
  const icons = {
    info: InfoFilled,
    warning: WarningFilled,
    success: SuccessFilled,
    error: CircleCloseFilled
  }
  return icons[type as keyof typeof icons] || InfoFilled
}

function getNotificationColor(type: string) {
  const colors = {
    info: '#409EFF',
    warning: '#E6A23C',
    success: '#67C23A',
    error: '#F56C6C'
  }
  return colors[type as keyof typeof colors] || '#409EFF'
}

function formatTime(date: Date) {
  return dayjs(date).fromNow()
}

function markAsRead(notificationId: number) {
  const notification = notifications.value.find(n => n.id === notificationId)
  if (notification && !notification.read) {
    notification.read = true
    ElMessage.success('Bildirim okundu olarak işaretlendi')
  }
}

function markAllAsRead() {
  const unreadCount = unreadNotifications.value
  notifications.value.forEach(notification => {
    notification.read = true
  })
  if (unreadCount > 0) {
    ElMessage.success(`${unreadCount} bildirim okundu olarak işaretlendi`)
  }
}

function getServiceTagType(status: string) {
  return status === 'UP' ? 'success' : 'danger'
}

function getServiceStatusText(status: string) {
  return status === 'UP' ? 'Aktif' : 'Offline'
}

async function refreshSystemStatus() {
  statusLoading.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mock random status updates
    services.value.forEach(service => {
      if (service.name === 'kafka') {
        service.status = Math.random() > 0.5 ? 'UP' : 'DOWN'
      }
    })

    ElMessage.success('Sistem durumu güncellendi')
  } catch (error) {
    ElMessage.error('Sistem durumu güncellenirken hata oluştu')
  } finally {
    statusLoading.value = false
  }
}

// Check mobile screen
function checkMobile() {
  isMobile.value = window.innerWidth < 768
}

// Fullscreen event listeners
function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

function handleResize() {
  checkMobile()
}

// Lifecycle
onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  window.addEventListener('resize', handleResize)
  checkMobile()
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 1rem;
  background: white;
  border-bottom: 1px solid #ebeef5;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;

  .sidebar-toggle {
    &:hover {
      background-color: #f5f7fa;
    }
  }

  .header-logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .header-title {
      font-size: 1.2rem;
      font-weight: 600;
      color: #303133;
      white-space: nowrap;
    }
  }
}

.header-center {
  flex: 1;
  max-width: 400px;
  margin: 0 2rem;

  .header-search {
    width: 100%;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .notification-badge {
    :deep(.el-badge__content) {
      border: 2px solid white;
    }
  }

  .status-warning {
    color: #E6A23C !important;
  }

  .user-dropdown {
    margin-left: 1rem;

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.3s ease;

      &:hover {
        background-color: #f5f7fa;
      }

      .user-details {
        display: flex;
        flex-direction: column;
        align-items: flex-start;

        .user-name {
          font-size: 0.9rem;
          font-weight: 500;
          color: #303133;
          line-height: 1;
        }

        .user-role {
          font-size: 0.75rem;
          color: #909399;
          line-height: 1;
          margin-top: 2px;
        }
      }

      .dropdown-arrow {
        color: #909399;
        transition: transform 0.3s ease;
      }

      &:hover .dropdown-arrow {
        transform: rotate(180deg);
      }
    }
  }
}

.notifications-content {
  height: 100%;
  display: flex;
  flex-direction: column;

  .notifications-header {
    padding: 0 0 1rem 0;
    border-bottom: 1px solid #f0f0f0;

    .notifications-stats {
      display: flex;
      justify-content: space-between;
      align-items: center;

      span {
        color: #909399;
        font-size: 0.9rem;
      }
    }
  }

  .no-notifications {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .notifications-list {
    flex: 1;
    overflow-y: auto;
    margin-top: 1rem;

    .notification-item {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background-color 0.3s ease;

      &:hover {
        background-color: #f8f9fa;
      }

      &.unread {
        background-color: #f0f9ff;
        border-left: 3px solid #409EFF;
      }

      .notification-icon {
        flex-shrink: 0;
        margin-top: 0.25rem;
      }

      .notification-content {
        flex: 1;

        .notification-title {
          font-weight: 500;
          color: #303133;
          margin-bottom: 0.25rem;
        }

        .notification-message {
          color: #606266;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }

        .notification-time {
          color: #909399;
          font-size: 0.8rem;
        }
      }
    }
  }
}

.system-status-content {
  .status-overview {
    margin-bottom: 1.5rem;

    .status-card {
      border: none;

      .status-summary {
        display: flex;
        align-items: center;
        gap: 1rem;

        .status-text {
          h3 {
            margin: 0 0 0.25rem 0;
            color: #303133;
          }

          p {
            margin: 0;
            color: #909399;
            font-size: 0.9rem;
          }
        }
      }
    }
  }

  .services-status {
    h4 {
      margin: 0 0 1rem 0;
      color: #303133;
    }

    .service-list {
      .service-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 0;
        border-bottom: 1px solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .service-info {
          .service-name {
            display: block;
            font-weight: 500;
            color: #303133;
          }

          .service-url {
            display: block;
            font-size: 0.8rem;
            color: #909399;
            margin-top: 0.25rem;
          }
        }
      }
    }
  }

  .status-actions {
    margin-top: 1.5rem;
    text-align: center;
  }
}

:deep(.logout-item) {
  color: #F56C6C !important;
}

// Responsive
@media (max-width: 768px) {
  .header-center {
    display: none;
  }

  .header-right {
    gap: 0.25rem;

    .user-dropdown .user-info .user-details {
      display: none;
    }
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 0 0.5rem;
  }

  .header-left {
    gap: 0.5rem;

    .header-logo .header-title {
      display: none;
    }
  }

  .header-right {
    gap: 0.25rem;
  }
}
</style>

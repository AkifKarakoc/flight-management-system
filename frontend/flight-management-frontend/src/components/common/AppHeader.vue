<template>
  <div class="app-header">
    <div class="header-left">
      <!-- Sidebar Toggle -->
      <el-button
        :icon="collapsed ? Expand : Fold"
        size="large"
        text
        @click="handleToggleSidebar"
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
        placeholder="Uçuş ara..."
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
      <!-- Notifications -->
      <el-badge :value="unreadNotifications" :hidden="unreadNotifications === 0" class="notification-badge">
        <el-button :icon="Bell" size="large" text @click="showNotifications" />
      </el-badge>

      <!-- Full Screen Toggle -->
      <el-button
        :icon="isFullscreen ? OfficeBuilding : FullScreen"
        size="large"
        text
        @click="toggleFullscreen"
      />

      <!-- User Dropdown -->
      <el-dropdown @command="handleUserCommand" class="user-dropdown">
        <div class="user-info">
          <el-avatar :src="userAvatar" :icon="UserFilled" size="default" />
          <div class="user-details">
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
            <el-dropdown-item divided command="logout" :icon="SwitchButton">
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
        <div v-if="notifications.length === 0" class="no-notifications">
          <el-empty description="Yeni bildirim yok" />
        </div>

        <div v-else class="notifications-list">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="notification-item"
            :class="{ 'unread': !notification.read }"
            @click="markAsRead(notification.id)"
          >
            <div class="notification-icon">
              <el-icon :color="getNotificationColor(notification.type)">
                <component :is="getNotificationIcon(notification.type)" />
              </el-icon>
            </div>
            <div class="notification-content">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-message">{{ notification.message }}</div>
              <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
            </div>
          </div>
        </div>

        <div class="notifications-actions">
          <el-button type="primary" text @click="markAllAsRead">
            Tümünü Okundu İşaretle
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Fold,
  Expand,
  Search,
  Bell,
  FullScreen,
  OfficeBuilding,
  UserFilled,
  User,
  Setting,
  SwitchButton,
  ArrowDown,
  Position,
  InfoFilled,
  WarningFilled,
  SuccessFilled,
  CircleCloseFilled
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth.js'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/tr'

dayjs.extend(relativeTime)
dayjs.locale('tr')

// Props
const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['toggle-sidebar', 'logout'])

// Stores
const authStore = useAuthStore()
const router = useRouter()

// Reactive state
const searchQuery = ref('')
const notificationsVisible = ref(false)
const isFullscreen = ref(false)
const notifications = ref([
  {
    id: 1,
    type: 'info',
    title: 'Sistem Bildirimi',
    message: 'Uçuş planlaması güncellendi',
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
    read: false
  },
  {
    id: 2,
    type: 'warning',
    title: 'Gecikme Uyarısı',
    message: 'TK101 uçuşunda 15 dakika gecikme',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    read: false
  },
  {
    id: 3,
    type: 'success',
    title: 'Uçuş Tamamlandı',
    message: 'TK200 uçuşu başarıyla tamamlandı',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true
  }
])

// Computed
const userDisplayName = computed(() => {
  return authStore.userInfo?.fullName || authStore.userInfo?.username || 'Kullanıcı'
})

const userRole = computed(() => {
  const roles = authStore.userRoles
  if (roles.includes('ADMIN')) return 'Yönetici'
  if (roles.includes('USER')) return 'Kullanıcı'
  return 'Misafir'
})

const userAvatar = computed(() => {
  return authStore.userInfo?.avatar || null
})

const unreadNotifications = computed(() => {
  return notifications.value.filter(n => !n.read).length
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
}

function handleSearchClear() {
  searchQuery.value = ''
}

function showNotifications() {
  notificationsVisible.value = true
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

function handleUserCommand(command) {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      authStore.logout()
      break
  }
}

function getNotificationIcon(type) {
  const icons = {
    info: InfoFilled,
    warning: WarningFilled,
    success: SuccessFilled,
    error: CircleCloseFilled
  }
  return icons[type] || InfoFilled
}

function getNotificationColor(type) {
  const colors = {
    info: '#409EFF',
    warning: '#E6A23C',
    success: '#67C23A',
    error: '#F56C6C'
  }
  return colors[type] || '#409EFF'
}

function formatTime(date) {
  return dayjs(date).fromNow()
}

function markAsRead(notificationId) {
  const notification = notifications.value.find(n => n.id === notificationId)
  if (notification) {
    notification.read = true
  }
}

function markAllAsRead() {
  notifications.value.forEach(notification => {
    notification.read = true
  })
  ElMessage.success('Tüm bildirimler okundu olarak işaretlendi')
}

// Fullscreen event listeners
function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

// Lifecycle
onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
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

  .header-logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .header-title {
      font-size: 1.2rem;
      font-weight: 600;
      color: #303133;
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

  .no-notifications {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .notifications-list {
    flex: 1;
    overflow-y: auto;

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

  .notifications-actions {
    padding: 1rem;
    border-top: 1px solid #f0f0f0;
    text-align: center;
  }
}

// Responsive
@media (max-width: 768px) {
  .header-center {
    display: none;
  }

  .header-right {
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

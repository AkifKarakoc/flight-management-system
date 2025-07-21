<template>
  <header class="app-header">
    <div class="header-left">
      <el-button
        :icon="Expand"
        circle
        size="small"
        @click="$emit('toggleSidebar')"
      />
    </div>

    <div class="header-right">
      <!-- Notifications -->
      <el-badge :value="notificationCount" class="notification-badge">
        <el-button :icon="Bell" circle size="small" @click="showNotifications" />
      </el-badge>

      <!-- User Menu -->
      <el-dropdown @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="32" :icon="UserFilled" />
          <span class="username">{{ authStore.userName || 'Kullanıcı' }}</span>
          <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
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
      v-model="notificationDrawer"
      title="Bildirimler"
      size="400px"
      direction="rtl"
    >
      <div class="notifications-list">
        <div v-if="notifications.length === 0" class="empty-notifications">
          <el-empty description="Henüz bildirim yok" />
        </div>
        <div
          v-else
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="{ unread: !notification.read }"
        >
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
          </div>
          <el-button v-if="!notification.read" text @click="markAsRead(notification.id)">
            Okundu olarak işaretle
          </el-button>
        </div>
      </div>
    </el-drawer>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Expand, Bell, ArrowDown, User, Setting, SwitchButton, UserFilled
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

defineProps({
  sidebarCollapsed: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggleSidebar'])

const router = useRouter()
const authStore = useAuthStore()

const notificationDrawer = ref(false)
const notifications = ref([
  {
    id: 1,
    title: 'Yeni Uçuş Eklendi',
    message: 'TK123 numaralı uçuş sisteme eklendi.',
    createdAt: new Date(),
    read: false
  },
  {
    id: 2,
    title: 'Sistem Güncellemesi',
    message: 'Sistem bakımı 22:00-06:00 arası yapılacak.',
    createdAt: new Date(Date.now() - 3600000),
    read: true
  }
])

const notificationCount = computed(() =>
  notifications.value.filter(n => !n.read).length
)

const showNotifications = () => {
  notificationDrawer.value = true
}

const markAsRead = (id) => {
  const notification = notifications.value.find(n => n.id === id)
  if (notification) {
    notification.read = true
  }
}

const formatTime = (date) => {
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} gün önce`
  if (hours > 0) return `${hours} saat önce`
  if (minutes > 0) return `${minutes} dakika önce`
  return 'Şimdi'
}

const handleCommand = async (command) => {
  switch (command) {
    case 'profile':
      ElMessage.info('Profil sayfası yakında eklenecek')
      break
    case 'settings':
      ElMessage.info('Ayarlar sayfası yakında eklenecek')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('Çıkış yapmak istediğinizden emin misiniz?', 'Onay', {
          confirmButtonText: 'Evet',
          cancelButtonText: 'Hayır',
          type: 'warning'
        })

        await authStore.logout()
        ElMessage.success('Başarıyla çıkış yapıldı')
        router.push('/login')
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('Çıkış yapılırken hata oluştu')
        }
      }
      break
  }
}
</script>

<style scoped>
.app-header {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  position: sticky;
  top: 0;
  z-index: 999;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.notification-badge {
  margin-right: 8px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.dropdown-icon {
  font-size: 12px;
  color: #909399;
}

.notifications-list {
  height: 100%;
  overflow-y: auto;
}

.notification-item {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f8f9fa;
}

.notification-item.unread {
  background-color: #f0f9ff;
  border-left: 3px solid #409eff;
}

.notification-content {
  margin-bottom: 8px;
}

.notification-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.notification-message {
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.empty-notifications {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

@media (max-width: 768px) {
  .app-header {
    padding: 0 16px;
  }

  .username {
    display: none;
  }
}
</style>

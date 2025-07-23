<template>
  <div class="header-wrapper">
    <!-- Left Side -->
    <div class="header-left">
      <!-- Sidebar Toggle -->
      <el-button
        type="text"
        class="sidebar-toggle"
        @click="$emit('toggle-sidebar')"
      >
        <el-icon :size="20">
          <Fold v-if="!sidebarCollapsed" />
          <Expand v-else />
        </el-icon>
      </el-button>

      <!-- Page Title -->
      <div class="page-title">
        <h2>{{ currentPageTitle }}</h2>
      </div>
    </div>

    <!-- Right Side -->
    <div class="header-right">
      <!-- Notifications -->
      <el-badge :value="notificationCount" :hidden="notificationCount === 0" class="notification-badge">
        <el-button type="text" class="header-icon-btn">
          <el-icon :size="18">
            <Bell />
          </el-icon>
        </el-button>
      </el-badge>

      <!-- Settings -->
      <el-button type="text" class="header-icon-btn">
        <el-icon :size="18">
          <Setting />
        </el-icon>
      </el-button>

      <!-- User Dropdown -->
      <el-dropdown trigger="click" @command="handleUserCommand">
        <div class="user-info">
          <el-avatar :size="32" class="user-avatar">
            <el-icon><User /></el-icon>
          </el-avatar>
          <span class="username">{{ authStore.userName }}</span>
          <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
        </div>

        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item disabled>
              <div class="user-role">
                <el-tag :type="authStore.isAdmin ? 'danger' : 'info'" size="small">
                  {{ authStore.isAdmin ? 'Yönetici' : 'Kullanıcı' }}
                </el-tag>
              </div>
            </el-dropdown-item>
            <el-dropdown-item divided command="profile">
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
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  Fold,
  Expand,
  Bell,
  Setting,
  User,
  ArrowDown,
  SwitchButton
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

// Props
defineProps({
  sidebarCollapsed: {
    type: Boolean,
    default: false
  }
})

// Emits
defineEmits(['toggle-sidebar'])

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// State
const notificationCount = ref(3) // Placeholder - gerçek bildirim sistemi eklenecek

// Computed
const currentPageTitle = computed(() => {
  return route.meta.title || 'Dashboard'
})

// Methods
const handleUserCommand = async (command) => {
  switch (command) {
    case 'profile':
      ElMessage.info('Profil sayfası yakında eklenecek')
      break

    case 'settings':
      ElMessage.info('Ayarlar sayfası yakında eklenecek')
      break

    case 'logout':
      try {
        await ElMessageBox.confirm(
          'Sistemden çıkış yapmak istediğinizden emin misiniz?',
          'Çıkış Yap',
          {
            confirmButtonText: 'Evet',
            cancelButtonText: 'İptal',
            type: 'warning'
          }
        )

        await authStore.logout()
        ElMessage.success('Başarıyla çıkış yaptınız')
        router.push('/login')
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Logout error:', error)
        }
      }
      break
  }
}
</script>

<style scoped>
.header-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sidebar-toggle {
  padding: 8px !important;
  margin: 0 !important;
  color: #606266;
  border: none !important;
}

.sidebar-toggle:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.page-title h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon-btn {
  padding: 8px !important;
  margin: 0 !important;
  color: #606266;
  border: none !important;
}

.header-icon-btn:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.notification-badge {
  line-height: 1;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-avatar {
  background-color: #409eff;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.dropdown-icon {
  font-size: 12px;
  color: #909399;
}

.user-role {
  text-align: center;
  padding: 4px 0;
}

/* Responsive */
@media (max-width: 768px) {
  .header-wrapper {
    padding: 0 16px;
  }

  .username {
    display: none;
  }

  .page-title h2 {
    font-size: 16px;
  }
}
</style>

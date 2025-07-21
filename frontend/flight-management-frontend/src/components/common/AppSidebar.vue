<template>
  <div class="app-sidebar">
    <el-menu
      :default-active="activeMenu"
      :collapse="collapsed"
      background-color="#001529"
      text-color="#fff"
      active-text-color="#1890ff"
      class="sidebar-menu"
      @select="handleMenuSelect"
    >
      <!-- Dashboard -->
      <el-menu-item index="/dashboard">
        <el-icon><Monitor /></el-icon>
        <template #title>Dashboard</template>
      </el-menu-item>

      <!-- Reference Management -->
      <el-sub-menu index="reference">
        <template #title>
          <el-icon><Setting /></el-icon>
          <span>Referans Yönetimi</span>
        </template>

        <el-menu-item index="/airlines">
          <el-icon><Ship /></el-icon>
          <template #title>Havayolları</template>
        </el-menu-item>

        <el-menu-item index="/airports">
          <el-icon><MapLocation /></el-icon>
          <template #title>Havaalanları</template>
        </el-menu-item>

        <el-menu-item index="/aircrafts">
          <el-icon><Promotion /></el-icon>
          <template #title>Uçaklar</template>
        </el-menu-item>

        <el-menu-item index="/routes">
          <el-icon><Connection /></el-icon>
          <template #title>Rotalar</template>
        </el-menu-item>

        <el-menu-item index="/crew-members">
          <el-icon><Avatar /></el-icon>
          <template #title>Mürettebat</template>
        </el-menu-item>
      </el-sub-menu>

      <!-- Flight Management -->
      <el-sub-menu index="flights">
        <template #title>
          <el-icon><Position /></el-icon>
          <span>Uçuş Yönetimi</span>
        </template>

        <el-menu-item index="/flights">
          <el-icon><List /></el-icon>
          <template #title>Uçuş Listesi</template>
        </el-menu-item>

        <el-menu-item index="/flights/create">
          <el-icon><Plus /></el-icon>
          <template #title>Yeni Uçuş</template>
        </el-menu-item>

        <el-menu-item index="/flights/upload">
          <el-icon><Upload /></el-icon>
          <template #title>Toplu Yükleme</template>
        </el-menu-item>
      </el-sub-menu>

      <!-- Reports & Analytics -->
      <el-sub-menu index="reports">
        <template #title>
          <el-icon><TrendCharts /></el-icon>
          <span>Raporlar</span>
        </template>

        <el-menu-item index="/reports/flights">
          <el-icon><DataLine /></el-icon>
          <template #title>Uçuş Raporları</template>
        </el-menu-item>

        <el-menu-item index="/reports/analytics">
          <el-icon><PieChart /></el-icon>
          <template #title>Analitik</template>
        </el-menu-item>

        <el-menu-item index="/reports/statistics">
          <el-icon><DataBoard /></el-icon>
          <template #title>İstatistikler</template>
        </el-menu-item>
      </el-sub-menu>

      <!-- Archive -->
      <el-menu-item index="/archive">
        <el-icon><Box /></el-icon>
        <template #title>Arşiv</template>
      </el-menu-item>

      <!-- System -->
      <el-sub-menu index="system">
        <template #title>
          <el-icon><Tools /></el-icon>
          <span>Sistem</span>
        </template>

        <el-menu-item index="/system/users">
          <el-icon><User /></el-icon>
          <template #title>Kullanıcılar</template>
        </el-menu-item>

        <el-menu-item index="/system/roles">
          <el-icon><Key /></el-icon>
          <template #title>Roller</template>
        </el-menu-item>

        <el-menu-item index="/system/logs">
          <el-icon><Document /></el-icon>
          <template #title>Loglar</template>
        </el-menu-item>

        <el-menu-item index="/system/settings">
          <el-icon><Setting /></el-icon>
          <template #title>Ayarlar</template>
        </el-menu-item>
      </el-sub-menu>

      <!-- Help & Support -->
      <el-menu-item index="/help">
        <el-icon><QuestionFilled /></el-icon>
        <template #title>Yardım</template>
      </el-menu-item>
    </el-menu>

    <!-- Sidebar Footer -->
    <div v-if="!collapsed" class="sidebar-footer">
      <div class="version-info">
        <span class="version-label">Versiyon</span>
        <span class="version-number">v{{ appVersion }}</span>
      </div>
      <div class="system-status">
        <el-icon class="status-icon" :class="systemStatus.class">
          <component :is="systemStatus.icon" />
        </el-icon>
        <span class="status-text">{{ systemStatus.text }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import {
  Monitor, Setting, Ship, MapLocation, Promotion, Connection, Avatar,
  Position, List, Plus, Upload, TrendCharts, DataLine, PieChart, DataBoard,
  Box, Tools, User, Key, Document, QuestionFilled, CircleCheckFilled,
  WarningFilled, CircleCloseFilled
} from '@element-plus/icons-vue'

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['menu-select'])

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

// Reactive state
const activeMenu = ref('')
const appVersion = ref('1.0.0')

// Computed properties
const systemStatus = computed(() => {
  // This could be connected to a real system health check
  const isHealthy = true // Replace with actual health check

  if (isHealthy) {
    return {
      class: 'status-online',
      icon: CircleCheckFilled,
      text: 'Sistem Normal'
    }
  } else {
    return {
      class: 'status-error',
      icon: CircleCloseFilled,
      text: 'Sistem Hatası'
    }
  }
})

// Methods
const handleMenuSelect = (index) => {
  activeMenu.value = index

  // Find menu item info
  const menuItem = findMenuItemByIndex(index)

  if (menuItem) {
    emit('menu-select', menuItem)

    // Navigate to route if not already there
    if (route.path !== index) {
      router.push(index)
    }
  }
}

const findMenuItemByIndex = (index) => {
  const menuItems = [
    { index: '/dashboard', title: 'Dashboard', icon: 'Monitor', path: '/dashboard' },
    { index: '/airlines', title: 'Havayolları', icon: 'Ship', path: '/airlines' },
    { index: '/airports', title: 'Havaalanları', icon: 'MapLocation', path: '/airports' },
    { index: '/aircrafts', title: 'Uçaklar', icon: 'Promotion', path: '/aircrafts' },
    { index: '/routes', title: 'Rotalar', icon: 'Connection', path: '/routes' },
    { index: '/crew-members', title: 'Mürettebat', icon: 'Avatar', path: '/crew-members' },
    { index: '/flights', title: 'Uçuş Listesi', icon: 'List', path: '/flights' },
    { index: '/flights/create', title: 'Yeni Uçuş', icon: 'Plus', path: '/flights/create' },
    { index: '/flights/upload', title: 'Toplu Yükleme', icon: 'Upload', path: '/flights/upload' },
    { index: '/reports/flights', title: 'Uçuş Raporları', icon: 'DataLine', path: '/reports/flights' },
    { index: '/reports/analytics', title: 'Analitik', icon: 'PieChart', path: '/reports/analytics' },
    { index: '/reports/statistics', title: 'İstatistikler', icon: 'DataBoard', path: '/reports/statistics' },
    { index: '/archive', title: 'Arşiv', icon: 'Box', path: '/archive' },
    { index: '/system/users', title: 'Kullanıcılar', icon: 'User', path: '/system/users' },
    { index: '/system/roles', title: 'Roller', icon: 'Key', path: '/system/roles' },
    { index: '/system/logs', title: 'Loglar', icon: 'Document', path: '/system/logs' },
    { index: '/system/settings', title: 'Ayarlar', icon: 'Setting', path: '/system/settings' },
    { index: '/help', title: 'Yardım', icon: 'QuestionFilled', path: '/help' }
  ]

  return menuItems.find(item => item.index === index)
}

const updateActiveMenu = () => {
  const path = route.path

  // Handle exact matches first
  if (path === '/dashboard') {
    activeMenu.value = '/dashboard'
  } else if (path.startsWith('/flights/')) {
    // Handle flight sub-routes
    if (path === '/flights/create') {
      activeMenu.value = '/flights/create'
    } else if (path === '/flights/upload') {
      activeMenu.value = '/flights/upload'
    } else {
      activeMenu.value = '/flights'
    }
  } else if (path.startsWith('/reports/')) {
    // Handle report sub-routes
    if (path === '/reports/analytics') {
      activeMenu.value = '/reports/analytics'
    } else if (path === '/reports/statistics') {
      activeMenu.value = '/reports/statistics'
    } else {
      activeMenu.value = '/reports/flights'
    }
  } else if (path.startsWith('/system/')) {
    // Handle system sub-routes
    if (path === '/system/users') {
      activeMenu.value = '/system/users'
    } else if (path === '/system/roles') {
      activeMenu.value = '/system/roles'
    } else if (path === '/system/logs') {
      activeMenu.value = '/system/logs'
    } else {
      activeMenu.value = '/system/settings'
    }
  } else {
    // Handle other routes
    activeMenu.value = path
  }
}

// Watchers
watch(() => route.path, () => {
  updateActiveMenu()
}, { immediate: true })

// Lifecycle
onMounted(() => {
  updateActiveMenu()
})
</script>

<style scoped>
.app-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #001529;
}

.sidebar-menu {
  flex: 1;
  border: none;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 240px;
}

/* Custom menu item styles */
.sidebar-menu :deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  padding: 0 20px !important;
  margin: 0 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: #1890ff !important;
  color: #fff !important;
}

.sidebar-menu :deep(.el-sub-menu > .el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
  padding: 0 20px !important;
  margin: 0 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.sidebar-menu :deep(.el-sub-menu > .el-sub-menu__title:hover) {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
}

.sidebar-menu :deep(.el-sub-menu .el-menu-item) {
  padding-left: 40px !important;
  margin: 0 8px;
  border-radius: 6px;
}

.sidebar-menu :deep(.el-sub-menu.is-opened > .el-sub-menu__title) {
  color: #1890ff !important;
}

/* Collapsed menu styles */
.sidebar-menu.el-menu--collapse :deep(.el-menu-item) {
  padding: 0 20px !important;
  margin: 0 4px;
}

.sidebar-menu.el-menu--collapse :deep(.el-sub-menu > .el-sub-menu__title) {
  padding: 0 20px !important;
  margin: 0 4px;
}

/* Icon spacing */
.sidebar-menu :deep(.el-icon) {
  margin-right: 8px;
  font-size: 16px;
}

.sidebar-menu.el-menu--collapse :deep(.el-icon) {
  margin-right: 0;
}

/* Submenu arrow */
.sidebar-menu :deep(.el-sub-menu__icon-arrow) {
  font-size: 12px;
  transition: transform 0.3s ease;
}

/* Scrollbar styles */
.sidebar-menu::-webkit-scrollbar {
  width: 4px;
}

.sidebar-menu::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.sidebar-menu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.sidebar-menu::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Sidebar Footer */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
}

.version-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.version-label {
  color: rgba(255, 255, 255, 0.5);
}

.version-number {
  font-weight: 500;
  color: #1890ff;
}

.system-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.status-icon {
  font-size: 14px;
}

.status-icon.status-online {
  color: #52c41a;
}

.status-icon.status-warning {
  color: #faad14;
}

.status-icon.status-error {
  color: #ff4d4f;
}

.status-text {
  color: rgba(255, 255, 255, 0.7);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .sidebar-menu :deep(.el-menu-item) {
    height: 44px;
    line-height: 44px;
  }

  .sidebar-menu :deep(.el-sub-menu > .el-sub-menu__title) {
    height: 44px;
    line-height: 44px;
  }
}

/* Animation for submenu */
.sidebar-menu :deep(.el-menu--inline) {
  background-color: rgba(0, 0, 0, 0.2) !important;
}

.sidebar-menu :deep(.el-menu--inline .el-menu-item) {
  background-color: transparent !important;
}

.sidebar-menu :deep(.el-menu--inline .el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.sidebar-menu :deep(.el-menu--inline .el-menu-item.is-active) {
  background-color: #1890ff !important;
}
</style>

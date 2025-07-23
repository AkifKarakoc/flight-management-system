<template>
  <div class="sidebar-wrapper">
    <!-- Logo -->
    <div class="sidebar-logo">
      <router-link to="/dashboard" class="logo-link">
        <el-icon :size="collapsed ? 24 : 32" color="#409eff">
          <Ship />
        </el-icon>
        <span v-show="!collapsed" class="logo-text">UYS</span>
      </router-link>
    </div>

    <!-- Navigation Menu -->
    <el-menu
      :default-active="activeMenu"
      :collapse="collapsed"
      :unique-opened="true"
      background-color="#001529"
      text-color="#ccc"
      active-text-color="#409eff"
      class="sidebar-menu"
      router
    >
      <!-- Dashboard -->
      <el-menu-item index="/dashboard">
        <el-icon><Odometer /></el-icon>
        <template #title>Dashboard</template>
      </el-menu-item>

      <!-- Uçuş Yönetimi -->
      <el-sub-menu index="flights">
        <template #title>
          <el-icon><Ship /></el-icon>
          <span>Uçuş Yönetimi</span>
        </template>
        <el-menu-item index="/flights">
          <el-icon><List /></el-icon>
          <template #title>Uçuş Listesi</template>
        </el-menu-item>
        <el-menu-item v-if="authStore.isAdmin" index="/flights/create">
          <el-icon><Plus /></el-icon>
          <template #title>Yeni Uçuş</template>
        </el-menu-item>
        <el-menu-item v-if="authStore.isAdmin" index="/flights/upload">
          <el-icon><Upload /></el-icon>
          <template #title>CSV Yükleme</template>
        </el-menu-item>
      </el-sub-menu>

      <!-- Referans Yönetimi -->
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
          <el-icon><Place /></el-icon>
          <template #title>Havalimanları</template>
        </el-menu-item>
        <el-menu-item index="/routes">
          <el-icon><MapLocation /></el-icon>
          <template #title>Rotalar</template>
        </el-menu-item>
        <el-menu-item index="/crew-members">
          <el-icon><User /></el-icon>
          <template #title>Mürettebat</template>
        </el-menu-item>
      </el-sub-menu>

      <!-- Raporlar -->
      <el-menu-item index="/reports">
        <el-icon><DocumentCopy /></el-icon>
        <template #title>Raporlar</template>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Ship,
  Odometer,
  List,
  Plus,
  Upload,
  Setting,
  Place,
  MapLocation,
  User,
  DocumentCopy
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

// Props
defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

const route = useRoute()
const authStore = useAuthStore()

// Computed
const activeMenu = computed(() => {
  return route.path
})
</script>

<style scoped>
.sidebar-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #1d2935;
  margin-bottom: 16px;
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: #fff;
  transition: all 0.3s;
}

.logo-link:hover {
  color: #409eff;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
}

.sidebar-menu {
  flex: 1;
  border: none !important;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 256px;
}

/* Menu item styles */
:deep(.el-menu-item) {
  margin: 0 12px 4px;
  border-radius: 6px;
  transition: all 0.3s;
}

:deep(.el-menu-item:hover) {
  background-color: rgba(64, 158, 255, 0.1) !important;
}

:deep(.el-menu-item.is-active) {
  background-color: #409eff !important;
  color: #fff !important;
}

:deep(.el-sub-menu) {
  margin: 0 12px 4px;
}

:deep(.el-sub-menu__title) {
  border-radius: 6px;
  transition: all 0.3s;
}

:deep(.el-sub-menu__title:hover) {
  background-color: rgba(64, 158, 255, 0.1) !important;
}

:deep(.el-sub-menu .el-menu-item) {
  margin: 0 0 4px;
  margin-left: 24px;
  width: calc(100% - 24px);
}

/* Collapsed state */
:deep(.el-menu--collapse .el-menu-item) {
  margin: 0 8px 4px;
}

:deep(.el-menu--collapse .el-sub-menu) {
  margin: 0 8px 4px;
}

/* Scrollbar */
.sidebar-wrapper::-webkit-scrollbar {
  width: 4px;
}

.sidebar-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-wrapper::-webkit-scrollbar-thumb {
  background: #3a4a5c;
  border-radius: 2px;
}
</style>

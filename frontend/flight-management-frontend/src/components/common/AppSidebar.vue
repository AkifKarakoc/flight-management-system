<template>
  <div class="app-sidebar" :class="{ collapsed }">
    <div class="sidebar-header">
      <div class="logo" v-if="!collapsed">
        <el-icon :size="24" color="#409eff">
          <Position />
        </el-icon>
        <span class="logo-text">Flight Mgmt</span>
      </div>
      <el-icon v-else :size="24" color="#409eff">
        <Position />
      </el-icon>
    </div>

    <div class="sidebar-menu">
      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :unique-opened="true"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
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
            <template #title>CSV Yükleme</template>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Position, Monitor, Setting, Ship, MapLocation,
  Promotion, Connection, Avatar, List, Plus, Upload
} from '@element-plus/icons-vue'

defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle'])

const route = useRoute()
const router = useRouter()

const activeMenu = computed(() => route.path)

const handleMenuSelect = (index) => {
  if (index !== route.path) {
    router.push(index)
  }
}
</script>

<style scoped>
.app-sidebar {
  width: 240px;
  height: 100vh;
  background-color: #304156;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
  transition: width 0.3s ease;
  overflow: hidden;
}

.app-sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #434a50;
  padding: 0 16px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-text {
  color: #bfcbd9;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}

.sidebar-menu {
  height: calc(100vh - 60px);
  overflow-y: auto;
}

.sidebar-menu::-webkit-scrollbar {
  width: 4px;
}

.sidebar-menu::-webkit-scrollbar-track {
  background: #434a50;
}

.sidebar-menu::-webkit-scrollbar-thumb {
  background: #565c64;
  border-radius: 2px;
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
}

:deep(.el-sub-menu .el-menu-item) {
  height: 44px;
  line-height: 44px;
  padding-left: 60px !important;
}

:deep(.el-menu-item.is-active) {
  background-color: #409eff !important;
  color: #fff !important;
}

@media (max-width: 768px) {
  .app-sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .app-sidebar.mobile-open {
    transform: translateX(0);
  }
}
</style>

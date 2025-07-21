<template>
  <div class="main-layout">
    <!-- Header -->
    <el-header class="layout-header" height="60px">
      <AppHeader
        :collapsed="sidebarCollapsed"
        @toggle-sidebar="handleToggleSidebar"
        @logout="handleLogout"
      />
    </el-header>

    <!-- Container -->
    <el-container class="layout-container">
      <!-- Sidebar -->
      <el-aside
        :width="sidebarWidth"
        class="layout-sidebar"
        :class="{ 'sidebar-collapsed': sidebarCollapsed }"
      >
        <AppSidebar
          :collapsed="sidebarCollapsed"
          @menu-select="handleMenuSelect"
        />
      </el-aside>

      <!-- Main Content -->
      <el-main class="layout-main">
        <!-- Breadcrumb -->
        <div class="main-breadcrumb">
          <BreadcrumbNav />
        </div>

        <!-- Page Content -->
        <div class="main-content">
          <router-view v-slot="{ Component, route }">
            <transition name="fade-transform" mode="out-in">
              <keep-alive :include="keepAliveRoutes">
                <component :is="Component" :key="route.path" />
              </keep-alive>
            </transition>
          </router-view>
        </div>
      </el-main>
    </el-container>

    <!-- Loading Overlay -->
    <div v-if="globalLoading" class="global-loading">
      <el-loading
        text="Yükleniyor..."
        background="rgba(0, 0, 0, 0.7)"
      />
    </div>

    <!-- Back to Top -->
    <el-backtop :right="40" :bottom="40" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import AppHeader from '@/components/common/AppHeader.vue'
import AppSidebar from '@/components/common/AppSidebar.vue'
import BreadcrumbNav from '@/components/common/BreadcrumbNav.vue'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

// Reactive state
const sidebarCollapsed = ref(false)
const globalLoading = ref(false)

// Computed properties
const sidebarWidth = computed(() => {
  return sidebarCollapsed.value ? '64px' : '240px'
})

const keepAliveRoutes = computed(() => {
  // Routes that should be cached
  return ['Dashboard', 'FlightManagement', 'AirlineManagement']
})

// Methods
const handleToggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  // Store sidebar state in localStorage
  localStorage.setItem('sidebar-collapsed', sidebarCollapsed.value.toString())
}

const handleMenuSelect = (menuItem) => {
  if (menuItem.path) {
    router.push(menuItem.path)
  }
}

const handleLogout = async () => {
  try {
    globalLoading.value = true
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    globalLoading.value = false
  }
}

const handleResize = () => {
  const width = window.innerWidth
  if (width < 768) {
    sidebarCollapsed.value = true
  } else {
    // Restore saved state for desktop
    const savedState = localStorage.getItem('sidebar-collapsed')
    if (savedState !== null) {
      sidebarCollapsed.value = savedState === 'true'
    }
  }
}

// Lifecycle hooks
onMounted(() => {
  // Initialize sidebar state
  handleResize()

  // Add resize listener
  window.addEventListener('resize', handleResize)

  // Check auth status
  if (!authStore.isAuthenticated) {
    router.push('/login')
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.main-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  z-index: 999;
  position: relative;
}

.layout-container {
  flex: 1;
  overflow: hidden;
}

.layout-sidebar {
  background: #001529;
  transition: width 0.2s ease;
  overflow: hidden;
  border-right: 1px solid #e4e7ed;
}

.sidebar-collapsed {
  width: 64px !important;
}

.layout-main {
  background: #f0f2f5;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.main-breadcrumb {
  background: #fff;
  padding: 12px 24px;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.main-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  overflow-x: hidden;
}

.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
}

/* Page transitions */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s ease;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Responsive design */
@media (max-width: 768px) {
  .main-content {
    padding: 16px;
  }

  .main-breadcrumb {
    padding: 8px 16px;
  }

  .layout-sidebar {
    position: fixed;
    top: 60px;
    left: 0;
    bottom: 0;
    z-index: 998;
    transform: translateX(-100%);
    transition: transform 0.3s ease, width 0.2s ease;
  }

  .layout-sidebar:not(.sidebar-collapsed) {
    transform: translateX(0);
    width: 240px !important;
  }

  .layout-main {
    margin-left: 0 !important;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 12px;
  }
}

/* Custom scrollbar for main content */
.main-content::-webkit-scrollbar {
  width: 6px;
}

.main-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.main-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>

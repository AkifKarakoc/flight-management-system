<template>
  <div class="main-layout">
    <el-container class="layout-container">
      <!-- Header -->
      <el-header class="layout-header" :height="headerHeight">
        <AppHeader
          :collapsed="sidebarCollapsed"
          @toggle-sidebar="handleToggleSidebar"
          @logout="handleLogout"
        />
      </el-header>

      <el-container class="layout-body">
        <!-- Sidebar -->
        <el-aside
          class="layout-sidebar"
          :width="sidebarWidth"
          :class="{ 'sidebar-collapsed': sidebarCollapsed }"
        >
          <AppSidebar
            :collapsed="sidebarCollapsed"
            @toggle-collapse="handleToggleSidebar"
            @menu-select="handleMenuSelect"
          />
        </el-aside>

        <!-- Main Content -->
        <el-main class="layout-main">
          <!-- Breadcrumb Navigation -->
          <div class="breadcrumb-container" v-if="showBreadcrumb">
            <BreadcrumbNav />
          </div>

          <!-- Page Content -->
          <div class="page-content">
            <router-view v-slot="{ Component, route }">
              <transition name="fade-slide" mode="out-in">
                <keep-alive :include="keepAliveRoutes">
                  <component :is="Component" :key="route.path" />
                </keep-alive>
              </transition>
            </router-view>
          </div>
        </el-main>
      </el-container>
    </el-container>

    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <el-loading-spinner size="large" />
      <p>Yükleniyor...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { ElMessage } from 'element-plus'

// Components
import AppHeader from '@/components/common/AppHeader.vue'
import AppSidebar from '@/components/common/AppSidebar.vue'
import BreadcrumbNav from '@/components/common/BreadcrumbNav.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()

// State
const loading = ref(false)
const sidebarCollapsed = ref(false)
const headerHeight = '60px'

// Computed properties
const sidebarWidth = computed(() => {
  return sidebarCollapsed.value ? '64px' : '250px'
})

const keepAliveRoutes = computed(() => {
  return ['Dashboard', 'Airlines', 'Airports', 'Aircrafts', 'Routes', 'CrewMembers', 'Flights']
})

const showBreadcrumb = computed(() => {
  // Hide breadcrumb on dashboard
  return route.name !== 'Dashboard'
})

// Methods
function handleToggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value

  // Save preference to localStorage
  localStorage.setItem('sidebar_collapsed', sidebarCollapsed.value.toString())

  // Optional: Show feedback
  ElMessage.success(
    sidebarCollapsed.value ? 'Sidebar gizlendi' : 'Sidebar gösterildi'
  )
}

function handleMenuSelect(index: string) {
  console.log('Menu selected:', index)

  // Navigate to selected route
  if (index && index !== route.path) {
    router.push(index)
  }
}

async function handleLogout() {
  try {
    loading.value = true
    await authStore.logout()
    ElMessage.success('Başarıyla çıkış yaptınız')
  } catch (error) {
    console.error('Logout error:', error)
    ElMessage.error('Çıkış yaparken hata oluştu')
  } finally {
    loading.value = false
  }
}

// Handle window resize for responsive sidebar
function handleResize() {
  const isMobile = window.innerWidth < 768

  if (isMobile) {
    sidebarCollapsed.value = true
  }
}

// Handle route changes
function handleRouteChange() {
  // Auto-collapse sidebar on mobile when navigating
  if (window.innerWidth < 768) {
    sidebarCollapsed.value = true
  }
}

// Initialize layout preferences
function initializeLayout() {
  // Restore sidebar state from localStorage
  const savedState = localStorage.getItem('sidebar_collapsed')
  if (savedState !== null) {
    sidebarCollapsed.value = savedState === 'true'
  }

  // Set initial mobile state
  handleResize()
}

// App initialization
async function initializeApp() {
  try {
    loading.value = true

    // Initialize layout
    initializeLayout()

    // Check authentication status
    if (!authStore.isAuthenticated) {
      console.warn('User not authenticated, redirecting to login')
      await router.push('/auth/login')
      return
    }

    // Initialize app store if needed
    if (appStore.initializeApp) {
      await appStore.initializeApp()
    }

    console.log('✅ Main layout initialized successfully')
  } catch (error) {
    console.error('❌ Error initializing main layout:', error)
    ElMessage.error('Uygulama başlatılırken hata oluştu')
  } finally {
    loading.value = false
  }
}

// Cleanup function
function cleanup() {
  // Save current sidebar state
  localStorage.setItem('sidebar_collapsed', sidebarCollapsed.value.toString())

  // App store cleanup
  if (appStore.cleanup) {
    appStore.cleanup()
  }
}

// Watch route changes
watch(route, handleRouteChange)

// Lifecycle hooks
onMounted(() => {
  // Add event listeners
  window.addEventListener('resize', handleResize)

  // Initialize app
  initializeApp()
})

onUnmounted(() => {
  // Remove event listeners
  window.removeEventListener('resize', handleResize)

  // Cleanup
  cleanup()
})
</script>

<style scoped lang="scss">
.main-layout {
  height: 100vh;
  overflow: hidden;
}

.layout-container {
  height: 100%;
}

.layout-header {
  background: white;
  border-bottom: 1px solid #ebeef5;
  padding: 0;
  z-index: 1000;
  position: relative;
}

.layout-body {
  height: calc(100vh - 60px);
}

.layout-sidebar {
  background: white;
  border-right: 1px solid #ebeef5;
  transition: width 0.3s ease;
  overflow: hidden;
  z-index: 999;

  &.sidebar-collapsed {
    width: 64px !important;
  }
}

.layout-main {
  background: #f5f7fa;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.breadcrumb-container {
  background: white;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.page-content {
  flex: 1;
  overflow: auto;
  padding: 1.5rem;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  gap: 1rem;

  p {
    margin: 0;
    font-size: 1rem;
    color: #606266;
  }
}

// Page transitions
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

// Responsive design
@media (max-width: 768px) {
  .layout-sidebar {
    position: absolute;
    height: 100%;
    z-index: 1001;

    &:not(.sidebar-collapsed) {
      width: 250px !important;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
    }
  }

  .page-content {
    padding: 1rem;
  }

  .breadcrumb-container {
    padding: 0.5rem 1rem;
  }
}

@media (max-width: 480px) {
  .page-content {
    padding: 0.75rem;
  }

  .breadcrumb-container {
    padding: 0.5rem 0.75rem;
  }
}

// Dark mode support (for future use)
:deep(.dark) {
  .layout-header,
  .layout-sidebar,
  .breadcrumb-container {
    background: #1f2937;
    border-color: #374151;
  }

  .layout-main {
    background: #111827;
  }
}

// Scrollbar styling
.page-content {
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;

    &:hover {
      background: #a8a8a8;
    }
  }
}

// Print styles
@media print {
  .layout-header,
  .layout-sidebar,
  .breadcrumb-container {
    display: none !important;
  }

  .layout-main {
    height: auto !important;
    overflow: visible !important;
  }

  .page-content {
    padding: 0 !important;
    overflow: visible !important;
  }
}
</style>

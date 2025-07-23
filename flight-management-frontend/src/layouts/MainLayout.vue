<template>
  <div class="app-container">
    <el-container class="layout-container">
      <!-- Sidebar -->
      <el-aside :width="sidebarWidth" class="sidebar-container">
        <AppSidebar :collapsed="sidebarCollapsed" @toggle="toggleSidebar" />
      </el-aside>

      <!-- Main Content -->
      <el-container direction="vertical" class="main-container">
        <!-- Header -->
        <el-header class="header-container">
          <AppHeader
            :sidebar-collapsed="sidebarCollapsed"
            @toggle-sidebar="toggleSidebar"
          />
        </el-header>

        <!-- Content -->
        <el-main class="content-container">
          <div class="page-content">
            <!-- Breadcrumb -->
            <BreadcrumbNav v-if="showBreadcrumb" />

            <!-- Router View -->
            <router-view v-slot="{ Component }">
              <transition name="fade-transform" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
          </div>
        </el-main>

        <!-- Footer -->
        <el-footer class="footer-container">
          <AppFooter />
        </el-footer>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/common/AppHeader.vue'
import AppSidebar from '@/components/common/AppSidebar.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import BreadcrumbNav from '@/components/common/BreadcrumbNav.vue'

const route = useRoute()

// Sidebar state
const sidebarCollapsed = ref(false)

// Computed
const sidebarWidth = computed(() => {
  return sidebarCollapsed.value ? '64px' : '256px'
})

const showBreadcrumb = computed(() => {
  return route.meta.breadcrumb && route.meta.breadcrumb.length > 0
})

// Methods
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// Handle window resize
const handleResize = () => {
  if (window.innerWidth < 768) {
    sidebarCollapsed.value = true
  } else {
    sidebarCollapsed.value = false
  }
}

// Lifecycle
onMounted(() => {
  // Initial responsive check
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.app-container {
  height: 100vh;
  overflow: hidden;
}

.layout-container {
  height: 100%;
}

.sidebar-container {
  background: #001529;
  transition: width 0.3s ease;
}

.main-container {
  flex: 1;
  overflow: hidden;
}

.header-container {
  background: #fff;
  border-bottom: 1px solid #e8eaec;
  padding: 0;
  height: 60px !important;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.content-container {
  padding: 0;
  background: #f5f7fa;
  overflow-y: auto;
  overflow-x: hidden;
}

.page-content {
  padding: 24px;
  min-height: calc(100vh - 60px - 50px); /* 60px header + 50px footer */
}

.footer-container {
  background: #fff;
  border-top: 1px solid #e8eaec;
  padding: 0;
  height: 50px !important;
  display: flex;
  align-items: center;
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

/* Responsive */
@media (max-width: 768px) {
  .page-content {
    padding: 16px;
  }
}
</style>

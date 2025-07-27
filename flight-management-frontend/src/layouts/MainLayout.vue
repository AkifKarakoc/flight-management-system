<template>
  <div class="main-layout" v-loading="globalLoading">
    <!-- Sidebar -->
    <AppSidebar
      v-model:collapsed="sidebarCollapsed"
      :mobile-open="mobileSidebarOpen"
      @mobile-close="mobileSidebarOpen = false"
    />

    <!-- Main content area -->
    <div :class="mainContentClass">
      <!-- Header -->
      <AppHeader
        :sidebar-collapsed="sidebarCollapsed"
        @toggle-sidebar="toggleSidebar"
        @toggle-mobile-sidebar="toggleMobileSidebar"
      />

      <!-- Breadcrumb -->
      <BreadcrumbNav v-if="showBreadcrumb" />

      <!-- Page content -->
      <main class="page-content">
        <router-view v-slot="{ Component, route }">
          <transition :name="pageTransition" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </main>

      <!-- Footer -->
      <AppFooter v-if="showFooter" />
    </div>

    <!-- Mobile overlay -->
    <div
      v-if="mobileSidebarOpen"
      class="mobile-overlay"
      @click="mobileSidebarOpen = false"
    />

    <!-- Global notifications -->
    <Teleport to="body">
      <div id="global-notifications" />
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/common/AppSidebar.vue'
import AppHeader from '@/components/common/AppHeader.vue'
import BreadcrumbNav from '@/components/common/BreadcrumbNav.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import { getStorageItem, setStorageItem } from '@/utils/helpers'

// Stores
const route = useRoute()

// Reactive state
const sidebarCollapsed = ref(getStorageItem('sidebar_collapsed', false))
const mobileSidebarOpen = ref(false)
const globalLoading = ref(false)

// Computed properties
const mainContentClass = computed(() => {
  const classes = ['main-content']

  if (sidebarCollapsed.value) {
    classes.push('sidebar-collapsed')
  }

  if (mobileSidebarOpen.value) {
    classes.push('mobile-sidebar-open')
  }

  return classes.join(' ')
})

const showBreadcrumb = computed(() => {
  return route.meta.showBreadcrumb !== false
})

const showFooter = computed(() => {
  return route.meta.showFooter !== false
})

const pageTransition = computed(() => {
  return route.meta.transition || 'fade'
})

// Methods
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  setStorageItem('sidebar_collapsed', sidebarCollapsed.value)
}

const toggleMobileSidebar = () => {
  mobileSidebarOpen.value = !mobileSidebarOpen.value
}

const handleResize = () => {
  // Auto-close mobile sidebar on desktop
  if (window.innerWidth >= 1024) {
    mobileSidebarOpen.value = false
  }

  // Auto-collapse sidebar on tablet
  if (window.innerWidth < 1024 && window.innerWidth >= 768) {
    sidebarCollapsed.value = true
  }
}

const handleKeydown = (event) => {
  // ESC key closes mobile sidebar
  if (event.key === 'Escape' && mobileSidebarOpen.value) {
    mobileSidebarOpen.value = false
  }

  // Ctrl/Cmd + B toggles sidebar
  if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
    event.preventDefault()
    toggleSidebar()
  }
}

// Lifecycle
onMounted(() => {
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeydown)

  // Initial resize check
  handleResize()

  // Initialize any global services
  // Example: WebSocket connection, global event listeners
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.main-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--el-bg-color-page);
}

/* Main content area */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 240px;
  transition: margin-left 0.3s ease;
  min-height: 100vh;
}

.main-content.sidebar-collapsed {
  margin-left: 64px;
}

/* Page content */
.page-content {
  flex: 1;
  padding: 24px;
  min-height: calc(100vh - 120px);
  overflow-x: auto;
}

/* Mobile overlay */
.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1500;
  display: none;
}

/* Page transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(30px);
}

.slide-left-leave-to {
  transform: translateX(-30px);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from {
  transform: translateY(30px);
}

.slide-up-leave-to {
  transform: translateY(-30px);
}

/* Responsive design */
@media (max-width: 1024px) {
  .main-content {
    margin-left: 0;
  }

  .main-content.sidebar-collapsed {
    margin-left: 0;
  }

  .mobile-overlay {
    display: block;
  }

  .page-content {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .page-content {
    padding: 12px;
  }
}

/* High contrast mode */
@media (prefers-contrast: more) {
  .main-layout {
    border: 2px solid var(--el-border-color);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .main-content,
  .fade-enter-active,
  .fade-leave-active,
  .slide-left-enter-active,
  .slide-left-leave-active,
  .slide-up-enter-active,
  .slide-up-leave-active {
    transition: none;
  }
}

/* Print styles */
@media print {
  .main-content {
    margin-left: 0;
  }

  .page-content {
    padding: 0;
  }
}
</style>

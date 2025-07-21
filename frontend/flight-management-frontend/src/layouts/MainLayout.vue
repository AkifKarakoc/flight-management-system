<template>
  <div class="main-layout">
    <!-- Sidebar -->
    <AppSidebar
      :collapsed="sidebarCollapsed"
      @toggle="toggleSidebar"
    />

    <!-- Main Content Area -->
    <div class="main-content" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <!-- Header -->
      <AppHeader
        :sidebar-collapsed="sidebarCollapsed"
        @toggle-sidebar="toggleSidebar"
      />

      <!-- Content -->
      <div class="content-wrapper">
        <!-- Breadcrumb -->
        <BreadcrumbNav />

        <!-- Page Content -->
        <main class="page-content">
          <router-view />
        </main>
      </div>

      <!-- Footer -->
      <AppFooter />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppSidebar from '@/components/common/AppSidebar.vue'
import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import BreadcrumbNav from '@/components/common/BreadcrumbNav.vue'

const sidebarCollapsed = ref(false)

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value)
}

onMounted(() => {
  // Restore sidebar state
  const saved = localStorage.getItem('sidebarCollapsed')
  if (saved !== null) {
    sidebarCollapsed.value = JSON.parse(saved)
  }
})
</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  background-color: #f5f7fa;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 240px;
  transition: margin-left 0.3s ease;
}

.main-content.sidebar-collapsed {
  margin-left: 64px;
}

.content-wrapper {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.page-content {
  min-height: calc(100vh - 140px);
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }

  .main-content.sidebar-collapsed {
    margin-left: 0;
  }
}
</style>

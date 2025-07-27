<template>
  <div id="app">
    <ErrorBoundary>
      <router-view />
    </ErrorBoundary>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'

const authStore = useAuthStore()

// Initialize auth state on app start
onMounted(() => {
  authStore.checkAuth()
})
</script>

<style>
/* Global styles are in src/assets/styles/main.scss */
#app {
  height: 100vh;
  overflow: hidden;
}
</style>

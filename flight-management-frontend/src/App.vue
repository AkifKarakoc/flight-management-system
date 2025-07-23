<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

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

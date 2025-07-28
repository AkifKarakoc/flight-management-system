<template>
  <el-container class="layout">
    <el-aside width="250px">
      <AppSidebar />
    </el-aside>
    <el-container>
      <el-header height="60px">
        <AppHeader />
      </el-header>
      <el-main>
        <slot />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
</script>

<style scoped>
.layout { height: 100vh; }
.el-aside { background: #001529; }
.el-header {
  background: #fff;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
}
.el-main { background: #f5f5f5; }
</style>

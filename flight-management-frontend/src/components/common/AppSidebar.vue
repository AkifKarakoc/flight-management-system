<template>
  <div class="sidebar">
    <div class="logo">UYS</div>
    <el-menu
      :default-active="$route.path"
      background-color="#001529"
      text-color="#fff"
      active-text-color="#1890ff"
      router
    >
      <el-menu-item index="/">
        <el-icon><House /></el-icon>
        <span>Dashboard</span>
      </el-menu-item>

      <el-menu-item index="/flights">
        <el-icon><Position /></el-icon>
        <span>Uçuşlar</span>
      </el-menu-item>

      <el-sub-menu index="reference">
        <template #title>
          <el-icon><Setting /></el-icon>
          <span>Referans Veriler</span>
        </template>
        <el-menu-item index="/airlines">Havayolları</el-menu-item>
        <el-menu-item index="/airports">Havaalanları</el-menu-item>
        <el-menu-item index="/aircraft">Uçaklar</el-menu-item>
        <el-menu-item index="/routes">Rotalar</el-menu-item>
      </el-sub-menu>

      <el-menu-item index="/reports">
        <el-icon><Document /></el-icon>
        <span>Raporlar</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup>
import { House, Position, Setting, Document } from '@element-plus/icons-vue'
</script>

<style scoped>
.sidebar { height: 100%; }
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  border-bottom: 1px solid #303030;
}
.el-menu { border: none; }
</style>

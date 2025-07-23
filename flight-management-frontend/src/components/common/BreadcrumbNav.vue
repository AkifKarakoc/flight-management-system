<template>
  <div class="breadcrumb-container">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/dashboard' }">
        <el-icon><HomeFilled /></el-icon>
        Dashboard
      </el-breadcrumb-item>

      <el-breadcrumb-item
        v-for="item in breadcrumbItems"
        :key="item.title"
        :to="item.to"
      >
        {{ item.title }}
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { HomeFilled } from '@element-plus/icons-vue'

const route = useRoute()

// Computed
const breadcrumbItems = computed(() => {
  return route.meta.breadcrumb || []
})
</script>

<style scoped>
.breadcrumb-container {
  margin-bottom: 16px;
  padding: 12px 0;
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #303133;
  font-weight: 500;
}

:deep(.el-breadcrumb__item .el-breadcrumb__inner) {
  color: #606266;
}

:deep(.el-breadcrumb__item .el-breadcrumb__inner:hover) {
  color: #409eff;
}
</style>

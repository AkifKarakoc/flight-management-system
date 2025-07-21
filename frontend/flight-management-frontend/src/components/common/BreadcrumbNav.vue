<template>
  <div class="breadcrumb-nav" v-if="breadcrumbs.length > 0">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item
        v-for="(item, index) in breadcrumbs"
        :key="index"
        :to="item.path"
      >
        <el-icon v-if="item.icon && index === 0">
          <component :is="item.icon" />
        </el-icon>
        {{ item.title }}
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  const crumbs = []

  // Always add home
  crumbs.push({
    title: 'Ana Sayfa',
    path: '/dashboard',
    icon: 'House'
  })

  // Add matched routes
  matched.forEach((match, index) => {
    if (match.path !== '/') {
      crumbs.push({
        title: match.meta.breadcrumb || match.meta.title,
        path: match.path,
        icon: index === 0 ? match.meta.icon : null
      })
    }
  })

  return crumbs
})
</script>

<style scoped>
.breadcrumb-nav {
  margin-bottom: 16px;
  padding: 12px 0;
}

:deep(.el-breadcrumb__item) {
  font-size: 14px;
}

:deep(.el-breadcrumb__inner) {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #606266;
}

:deep(.el-breadcrumb__inner:hover) {
  color: #409eff;
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #303133;
  font-weight: 500;
}
</style>

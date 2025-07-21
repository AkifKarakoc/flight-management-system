<template>
  <div class="breadcrumb-nav">
    <el-breadcrumb separator="/" class="breadcrumb">
      <el-breadcrumb-item
        v-for="(item, index) in breadcrumbItems"
        :key="index"
        :to="item.path && index < breadcrumbItems.length - 1 ? item.path : undefined"
        :class="{ 'is-active': index === breadcrumbItems.length - 1 }"
      >
        <el-icon v-if="item.icon" class="breadcrumb-icon">
          <component :is="item.icon" />
        </el-icon>
        <span>{{ item.title }}</span>
      </el-breadcrumb-item>
    </el-breadcrumb>

    <!-- Page Actions -->
    <div v-if="showActions" class="breadcrumb-actions">
      <slot name="actions">
        <!-- Default actions can go here -->
      </slot>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Monitor, Ship, MapLocation, Promotion, Connection, Avatar,
  Position, List, Plus, Upload, TrendCharts, DataLine, PieChart,
  DataBoard, Box, Tools, User, Key, Document, QuestionFilled,
  Setting, HomeFilled
} from '@element-plus/icons-vue'

const props = defineProps({
  showActions: {
    type: Boolean,
    default: true
  }
})

const route = useRoute()
const router = useRouter()

// Icon mapping for different routes
const iconMap = {
  dashboard: Monitor,
  airlines: Ship,
  airports: MapLocation,
  aircrafts: Promotion,
  routes: Connection,
  'crew-members': Avatar,
  flights: Position,
  create: Plus,
  upload: Upload,
  reports: TrendCharts,
  analytics: PieChart,
  statistics: DataBoard,
  archive: Box,
  system: Tools,
  users: User,
  roles: Key,
  logs: Document,
  settings: Setting,
  help: QuestionFilled
}

// Route title mapping
const titleMap = {
  // Main sections
  dashboard: 'Dashboard',
  airlines: 'Havayolu Yönetimi',
  airports: 'Havaalanı Yönetimi',
  aircrafts: 'Uçak Yönetimi',
  routes: 'Rota Yönetimi',
  'crew-members': 'Mürettebat Yönetimi',
  flights: 'Uçuş Yönetimi',
  reports: 'Raporlar',
  archive: 'Arşiv',
  system: 'Sistem Yönetimi',
  help: 'Yardım',

  // Sub-sections
  create: 'Yeni Oluştur',
  edit: 'Düzenle',
  upload: 'Toplu Yükleme',
  analytics: 'Analitik',
  statistics: 'İstatistikler',
  users: 'Kullanıcı Yönetimi',
  roles: 'Rol Yönetimi',
  logs: 'Sistem Logları',
  settings: 'Ayarlar',

  // Dynamic titles from route meta
  profile: 'Profil',
  'flight-create': 'Uçuş Oluştur',
  'flight-edit': 'Uçuş Düzenle',
  'flight-upload': 'CSV Uçuş Yükleme'
}

const breadcrumbItems = computed(() => {
  const pathSegments = route.path.split('/').filter(segment => segment !== '')
  const items = []

  // Always start with home
  items.push({
    title: 'Ana Sayfa',
    icon: HomeFilled,
    path: '/dashboard'
  })

  // Build breadcrumb from path segments
  let currentPath = ''

  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`

    // Skip if this is the root dashboard
    if (segment === 'dashboard' && index === 0) {
      return
    }

    let title = titleMap[segment] || segment
    let icon = iconMap[segment] || null
    let path = currentPath

    // Handle special cases
    if (segment === 'create' && pathSegments[index - 1] === 'flights') {
      title = 'Yeni Uçuş'
      icon = Plus
    } else if (segment === 'edit' && pathSegments[index - 1] === 'flights') {
      title = 'Uçuş Düzenle'
      icon = null
    } else if (segment === 'upload' && pathSegments[index - 1] === 'flights') {
      title = 'Toplu Yükleme'
      icon = Upload
    }

    // Check for route meta title
    if (route.meta && route.meta.title && index === pathSegments.length - 1) {
      title = route.meta.title
    }

    // Check for route meta breadcrumb
    if (route.meta && route.meta.breadcrumb && index === pathSegments.length - 1) {
      title = route.meta.breadcrumb
    }

    // Handle dynamic segments (like IDs)
    if (/^\d+$/.test(segment)) {
      // This is likely an ID, try to get a meaningful name
      const entityName = getEntityName(pathSegments[index - 1], segment)
      if (entityName) {
        title = entityName
        icon = null
      } else {
        title = `#${segment}`
        icon = null
      }
    }

    items.push({
      title,
      icon,
      path: index === pathSegments.length - 1 ? null : path // Last item shouldn't be clickable
    })
  })

  return items
})

const getEntityName = (entityType, id) => {
  // This could be enhanced to fetch actual entity names from stores
  // For now, return generic names
  const entityNames = {
    flights: `Uçuş #${id}`,
    airlines: `Havayolu #${id}`,
    airports: `Havaalanı #${id}`,
    aircrafts: `Uçak #${id}`,
    routes: `Rota #${id}`,
    'crew-members': `Mürettebat #${id}`
  }

  return entityNames[entityType] || null
}

// Watch route changes to update breadcrumb
watch(() => route.path, () => {
  // Breadcrumb will automatically update due to computed property
}, { immediate: true })
</script>

<style scoped>
.breadcrumb-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 32px;
}

.breadcrumb {
  flex: 1;
}

.breadcrumb :deep(.el-breadcrumb__item) {
  display: inline-flex;
  align-items: center;
}

.breadcrumb :deep(.el-breadcrumb__inner) {
  display: inline-flex;
  align-items: center;
  font-weight: 400;
  color: #606266;
  cursor: pointer;
  transition: color 0.2s ease;
}

.breadcrumb :deep(.el-breadcrumb__inner:hover) {
  color: #409eff;
}

.breadcrumb :deep(.el-breadcrumb__item.is-active .el-breadcrumb__inner) {
  font-weight: 500;
  color: #303133;
  cursor: default;
}

.breadcrumb :deep(.el-breadcrumb__item.is-active .el-breadcrumb__inner:hover) {
  color: #303133;
}

.breadcrumb-icon {
  margin-right: 4px;
  font-size: 14px;
}

.breadcrumb :deep(.el-breadcrumb__separator) {
  margin: 0 8px;
  color: #c0c4cc;
  font-weight: 500;
}

.breadcrumb-actions {
  margin-left: 16px;
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Responsive design */
@media (max-width: 768px) {
  .breadcrumb-nav {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .breadcrumb-actions {
    margin-left: 0;
    width: 100%;
    justify-content: flex-end;
  }

  .breadcrumb :deep(.el-breadcrumb__inner) {
    font-size: 13px;
  }

  .breadcrumb-icon {
    font-size: 13px;
    margin-right: 3px;
  }

  .breadcrumb :deep(.el-breadcrumb__separator) {
    margin: 0 6px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .breadcrumb :deep(.el-breadcrumb__inner) {
    font-size: 12px;
  }

  .breadcrumb-icon {
    font-size: 12px;
  }

  /* Hide icons on very small screens to save space */
  .breadcrumb-icon {
    display: none;
  }
}

/* Animation for breadcrumb changes */
.breadcrumb {
  transition: all 0.3s ease;
}

/* Custom styling for different breadcrumb levels */
.breadcrumb :deep(.el-breadcrumb__item:first-child .el-breadcrumb__inner) {
  color: #409eff;
  font-weight: 500;
}

.breadcrumb :deep(.el-breadcrumb__item:first-child .el-breadcrumb__inner:hover) {
  color: #66b1ff;
}

/* Loading state for dynamic breadcrumbs */
.breadcrumb.loading {
  opacity: 0.6;
}

.breadcrumb.loading :deep(.el-breadcrumb__inner) {
  cursor: wait;
}
</style>

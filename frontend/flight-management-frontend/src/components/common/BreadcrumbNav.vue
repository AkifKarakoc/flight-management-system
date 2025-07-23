<template>
  <div class="breadcrumb-nav">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/' }">
        <el-icon><House /></el-icon>
        <span>Ana Sayfa</span>
      </el-breadcrumb-item>

      <el-breadcrumb-item
        v-for="(item, index) in breadcrumbItems"
        :key="index"
        :to="item.path ? { path: item.path } : undefined"
      >
        <el-icon v-if="item.icon">
          <component :is="item.icon" />
        </el-icon>
        <span>{{ item.title }}</span>
      </el-breadcrumb-item>
    </el-breadcrumb>

    <!-- Page Actions (if any) -->
    <div class="page-actions" v-if="showActions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  House, Monitor, Setting, Ship, MapLocation, Promotion,
  Connection, Avatar, Position, List, Plus, Upload,
  Document, TrendCharts
} from '@element-plus/icons-vue'

interface BreadcrumbItem {
  title: string
  path?: string
  icon?: any
}

const props = defineProps<{
  showActions?: boolean
}>()

const route = useRoute()

// Route to breadcrumb mapping
const routeBreadcrumbs: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [
    { title: 'Dashboard', icon: Monitor }
  ],
  '/airlines': [
    { title: 'Referans Yönetimi', path: '/airlines', icon: Setting },
    { title: 'Havayolları', icon: Ship }
  ],
  '/airports': [
    { title: 'Referans Yönetimi', path: '/airlines', icon: Setting },
    { title: 'Havaalanları', icon: MapLocation }
  ],
  '/aircrafts': [
    { title: 'Referans Yönetimi', path: '/airlines', icon: Setting },
    { title: 'Uçaklar', icon: Promotion }
  ],
  '/routes': [
    { title: 'Referans Yönetimi', path: '/airlines', icon: Setting },
    { title: 'Rotalar', icon: Connection }
  ],
  '/crew': [
    { title: 'Referans Yönetimi', path: '/airlines', icon: Setting },
    { title: 'Mürettebat', icon: Avatar }
  ],
  '/flights': [
    { title: 'Uçuş Yönetimi', path: '/flights', icon: Position },
    { title: 'Uçuş Listesi', icon: List }
  ],
  '/flights/create': [
    { title: 'Uçuş Yönetimi', path: '/flights', icon: Position },
    { title: 'Uçuş Listesi', path: '/flights', icon: List },
    { title: 'Yeni Uçuş', icon: Plus }
  ],
  '/flights/upload': [
    { title: 'Uçuş Yönetimi', path: '/flights', icon: Position },
    { title: 'Uçuş Listesi', path: '/flights', icon: List },
    { title: 'Toplu Yükleme', icon: Upload }
  ],
  '/reports/flights': [
    { title: 'Raporlar', path: '/reports', icon: TrendCharts },
    { title: 'Uçuş Raporları', icon: Document }
  ],
  '/reports/kpi': [
    { title: 'Raporlar', path: '/reports', icon: TrendCharts },
    { title: 'KPI Raporları', icon: TrendCharts }
  ]
}

const breadcrumbItems = computed(() => {
  const currentPath = route.path

  // Check for exact match first
  if (routeBreadcrumbs[currentPath]) {
    return routeBreadcrumbs[currentPath]
  }

  // Check for dynamic routes (like /flights/edit/:id)
  if (currentPath.startsWith('/flights/edit/')) {
    return [
      { title: 'Uçuş Yönetimi', path: '/flights', icon: Position },
      { title: 'Uçuş Listesi', path: '/flights', icon: List },
      { title: 'Uçuş Düzenle', icon: Setting }
    ]
  }

  // Generate breadcrumbs from route meta or path segments
  const segments = currentPath.split('/').filter(Boolean)
  const items: BreadcrumbItem[] = []

  let currentSegmentPath = ''
  for (let i = 0; i < segments.length; i++) {
    currentSegmentPath += '/' + segments[i]

    // Get title from route meta or segment name
    const title = getSegmentTitle(segments[i], currentSegmentPath)
    const icon = getSegmentIcon(segments[i])

    items.push({
      title,
      path: i < segments.length - 1 ? currentSegmentPath : undefined,
      icon
    })
  }

  return items
})

function getSegmentTitle(segment: string, path: string): string {
  // Custom title mappings
  const titleMappings: Record<string, string> = {
    'airlines': 'Havayolları',
    'airports': 'Havaalanları',
    'aircrafts': 'Uçaklar',
    'routes': 'Rotalar',
    'crew': 'Mürettebat',
    'flights': 'Uçuşlar',
    'create': 'Yeni',
    'edit': 'Düzenle',
    'upload': 'Yükle',
    'reports': 'Raporlar',
    'dashboard': 'Dashboard'
  }

  // Check route meta title
  if (route.meta?.title) {
    return route.meta.title as string
  }

  return titleMappings[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
}

function getSegmentIcon(segment: string) {
  const iconMappings: Record<string, any> = {
    'airlines': Ship,
    'airports': MapLocation,
    'aircrafts': Promotion,
    'routes': Connection,
    'crew': Avatar,
    'flights': Position,
    'create': Plus,
    'edit': Setting,
    'upload': Upload,
    'reports': TrendCharts,
    'dashboard': Monitor
  }

  return iconMappings[segment]
}

// Watch route changes to update breadcrumbs
watch(route, (newRoute) => {
  console.log('Breadcrumb: Route changed to', newRoute.path)
}, { immediate: true })
</script>

<style scoped lang="scss">
.breadcrumb-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  :deep(.el-breadcrumb) {
    .el-breadcrumb__item {
      .el-breadcrumb__inner {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #606266;
        font-weight: 500;

        &:hover {
          color: #409EFF;
        }

        a {
          color: inherit;
          text-decoration: none;

          &:hover {
            color: #409EFF;
          }
        }
      }

      &:last-child {
        .el-breadcrumb__inner {
          color: #303133;
          font-weight: 600;

          a {
            color: inherit;
            cursor: default;
            pointer-events: none;
          }
        }
      }
    }

    .el-breadcrumb__separator {
      color: #C0C4CC;
      font-weight: bold;
    }
  }

  .page-actions {
    flex-shrink: 0;
    margin-left: 1rem;
  }
}

// Responsive
@media (max-width: 768px) {
  .breadcrumb-nav {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;

    .page-actions {
      margin-left: 0;
      width: 100%;
    }
  }

  :deep(.el-breadcrumb) {
    .el-breadcrumb__item {
      .el-breadcrumb__inner {
        font-size: 0.9rem;
      }
    }
  }
}

@media (max-width: 480px) {
  :deep(.el-breadcrumb) {
    .el-breadcrumb__item {
      .el-breadcrumb__inner {
        span {
          display: none;
        }

        // Show only icons on very small screens
        .el-icon {
          display: block;
        }
      }

      &:last-child {
        .el-breadcrumb__inner span {
          display: inline;
        }
      }
    }
  }
}
</style>

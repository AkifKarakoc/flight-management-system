<template>
  <div class="breadcrumb-nav">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item v-for="(item, index) in breadcrumbItems" :key="index">
        <router-link
          v-if="item.path && index < breadcrumbItems.length - 1"
          :to="item.path"
          class="breadcrumb-link"
        >
          <el-icon v-if="item.icon" class="breadcrumb-icon">
            <component :is="item.icon" />
          </el-icon>
          {{ item.title }}
        </router-link>

        <span v-else class="breadcrumb-current">
          <el-icon v-if="item.icon" class="breadcrumb-icon">
            <component :is="item.icon" />
          </el-icon>
          {{ item.title }}
        </span>
      </el-breadcrumb-item>
    </el-breadcrumb>

    <!-- Page Actions -->
    <div class="page-actions" v-if="pageActions.length > 0">
      <el-button
        v-for="action in pageActions"
        :key="action.key"
        :type="action.type || 'default'"
        :icon="action.icon"
        :size="action.size || 'default'"
        :loading="action.loading"
        :disabled="action.disabled"
        @click="handleAction(action)"
      >
        {{ action.label }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  HomeFilled,
  Monitor,
  Setting,
  Ship,
  MapLocation,
  Promotion,
  Connection,
  Avatar,
  Position,
  List,
  Plus,
  Upload,
  Edit,
  Document
} from '@element-plus/icons-vue'

// Router
const route = useRoute()
const router = useRouter()

// Icon mapping for routes
const routeIcons = {
  '/dashboard': Monitor,
  '/airlines': Ship,
  '/airports': MapLocation,
  '/aircrafts': Promotion,
  '/routes': Connection,
  '/crew-members': Avatar,
  '/flights': Position,
  '/flights/create': Plus,
  '/flights/upload': Upload,
  '/reports': Document
}

// Route title mapping
const routeTitles = {
  '/dashboard': 'Dashboard',
  '/airlines': 'Havayolları',
  '/airports': 'Havaalanları',
  '/aircrafts': 'Uçaklar',
  '/routes': 'Rotalar',
  '/crew-members': 'Mürettebat',
  '/flights': 'Uçuş Yönetimi',
  '/flights/create': 'Yeni Uçuş',
  '/flights/upload': 'Toplu Yükleme',
  '/reports': 'Raporlar'
}

// Computed breadcrumb items
const breadcrumbItems = computed(() => {
  const items = []
  const pathSegments = route.path.split('/').filter(segment => segment)

  // Always start with home
  items.push({
    title: 'Ana Sayfa',
    path: '/dashboard',
    icon: HomeFilled
  })

  // Build breadcrumb based on current route
  let currentPath = ''

  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`

    // Skip if it's a parameter (like :id)
    if (segment.match(/^\d+$/)) {
      return
    }

    // Handle special cases
    let title = routeTitles[currentPath] || segment
    let icon = routeIcons[currentPath]

    // Custom titles from route meta
    if (route.meta?.breadcrumb) {
      title = route.meta.breadcrumb
    } else if (route.meta?.title) {
      title = route.meta.title
    }

    // Handle dynamic segments
    if (route.params.id && currentPath.includes(':id')) {
      currentPath = currentPath.replace(':id', route.params.id)
    }

    items.push({
      title,
      path: currentPath,
      icon
    })
  })

  // Handle edit pages
  if (route.name?.includes('Edit')) {
    const lastItem = items[items.length - 1]
    lastItem.title = route.meta?.breadcrumb || 'Düzenle'
    lastItem.icon = Edit
  }

  return items
})

// Page actions based on current route
const pageActions = computed(() => {
  const actions = []

  switch (route.name) {
    case 'Dashboard':
      actions.push({
        key: 'refresh',
        label: 'Yenile',
        icon: 'Refresh',
        type: 'default'
      })
      break

    case 'Airlines':
    case 'Airports':
    case 'Aircrafts':
    case 'Routes':
    case 'CrewMembers':
      actions.push({
        key: 'create',
        label: 'Yeni Ekle',
        icon: Plus,
        type: 'primary'
      })
      break

    case 'Flights':
      actions.push(
        {
          key: 'create',
          label: 'Yeni Uçuş',
          icon: Plus,
          type: 'primary'
        },
        {
          key: 'upload',
          label: 'Toplu Yükle',
          icon: Upload,
          type: 'default'
        }
      )
      break

    case 'FlightCreate':
    case 'FlightEdit':
      actions.push({
        key: 'back',
        label: 'Geri Dön',
        icon: 'ArrowLeft',
        type: 'default'
      })
      break
  }

  return actions
})

// Methods
function handleAction(action) {
  switch (action.key) {
    case 'refresh':
      window.location.reload()
      break

    case 'create':
      handleCreateAction()
      break

    case 'upload':
      router.push('/flights/upload')
      break

    case 'back':
      router.go(-1)
      break
  }
}

function handleCreateAction() {
  const createRoutes = {
    'Airlines': '/airlines/create',
    'Airports': '/airports/create',
    'Aircrafts': '/aircrafts/create',
    'Routes': '/routes/create',
    'CrewMembers': '/crew-members/create',
    'Flights': '/flights/create'
  }

  const createRoute = createRoutes[route.name]
  if (createRoute) {
    router.push(createRoute)
  }
}
</script>

<style scoped lang="scss">
.breadcrumb-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 1rem;

  .el-breadcrumb {
    flex: 1;

    :deep(.el-breadcrumb__item) {
      .el-breadcrumb__inner {
        font-weight: 400;
        color: #606266;

        &.is-link {
          color: #409eff;

          &:hover {
            color: #337ecc;
          }
        }
      }

      &:last-child .el-breadcrumb__inner {
        color: #303133;
        font-weight: 500;
      }
    }
  }

  .breadcrumb-link {
    display: inline-flex;
    align-items: center;
    text-decoration: none;
    color: #409eff;
    transition: color 0.3s ease;

    &:hover {
      color: #337ecc;
    }

    .breadcrumb-icon {
      margin-right: 0.25rem;
      font-size: 0.875rem;
    }
  }

  .breadcrumb-current {
    display: inline-flex;
    align-items: center;
    color: #303133;
    font-weight: 500;

    .breadcrumb-icon {
      margin-right: 0.25rem;
      font-size: 0.875rem;
    }
  }

  .page-actions {
    display: flex;
    gap: 0.5rem;
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
      justify-content: flex-end;
    }
  }
}

@media (max-width: 480px) {
  .breadcrumb-nav {
    .el-breadcrumb {
      :deep(.el-breadcrumb__item) {
        .el-breadcrumb__inner {
          font-size: 0.875rem;
        }
      }
    }

    .page-actions {
      flex-wrap: wrap;
      gap: 0.25rem;

      .el-button {
        font-size: 0.875rem;
      }
    }
  }
}

// Animation for breadcrumb changes
.breadcrumb-nav {
  :deep(.el-breadcrumb__item) {
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-1px);
    }
  }
}
</style>

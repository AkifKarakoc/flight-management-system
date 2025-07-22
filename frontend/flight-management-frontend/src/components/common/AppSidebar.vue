<template>
  <div class="app-sidebar" :class="{ 'collapsed': collapsed }">
    <div class="sidebar-content">
      <!-- Logo Section -->
      <div class="sidebar-logo">
        <el-icon size="32" color="#409EFF">
          <Position />
        </el-icon>
        <transition name="fade">
          <span v-show="!collapsed" class="logo-text">Flight Mgmt</span>
        </transition>
      </div>

      <!-- Navigation Menu -->
      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :unique-opened="true"
        class="sidebar-menu"
        @select="handleMenuSelect"
      >
        <!-- Dashboard -->
        <el-menu-item index="/dashboard">
          <el-icon>
            <Monitor />
          </el-icon>
          <template #title>Dashboard</template>
        </el-menu-item>

        <!-- Reference Management -->
        <el-sub-menu index="reference">
          <template #title>
            <el-icon>
              <Setting />
            </el-icon>
            <span>Referans Yönetimi</span>
          </template>

          <el-menu-item index="/airlines">
            <el-icon>
              <Ship />
            </el-icon>
            <template #title>Havayolları</template>
          </el-menu-item>

          <el-menu-item index="/airports">
            <el-icon>
              <MapLocation />
            </el-icon>
            <template #title>Havaalanları</template>
          </el-menu-item>

          <el-menu-item index="/aircrafts">
            <el-icon>
              <Promotion />
            </el-icon>
            <template #title>Uçaklar</template>
          </el-menu-item>

          <el-menu-item index="/routes">
            <el-icon>
              <Connection />
            </el-icon>
            <template #title>Rotalar</template>
          </el-menu-item>

          <el-menu-item index="/crew-members">
            <el-icon>
              <Avatar />
            </el-icon>
            <template #title>Mürettebat</template>
          </el-menu-item>
        </el-sub-menu>

        <!-- Flight Management -->
        <el-sub-menu index="flights">
          <template #title>
            <el-icon>
              <Position />
            </el-icon>
            <span>Uçuş Yönetimi</span>
          </template>

          <el-menu-item index="/flights">
            <el-icon>
              <List />
            </el-icon>
            <template #title>Uçuş Listesi</template>
          </el-menu-item>

          <el-menu-item index="/flights/create">
            <el-icon>
              <Plus />
            </el-icon>
            <template #title>Yeni Uçuş</template>
          </el-menu-item>

          <el-menu-item index="/flights/upload">
            <el-icon>
              <Upload />
            </el-icon>
            <template #title>Toplu Yükleme</template>
          </el-menu-item>
        </el-sub-menu>

        <!-- Reports (Future) -->
        <el-sub-menu index="reports" v-if="showReports">
          <template #title>
            <el-icon>
              <DataAnalysis />
            </el-icon>
            <span>Raporlar</span>
          </template>

          <el-menu-item index="/reports/flights">
            <el-icon>
              <Document />
            </el-icon>
            <template #title>Uçuş Raporları</template>
          </el-menu-item>

          <el-menu-item index="/reports/kpi">
            <el-icon>
              <TrendCharts />
            </el-icon>
            <template #title>KPI Raporları</template>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>

      <!-- Quick Actions (when collapsed) -->
      <div v-if="collapsed" class="quick-actions">
        <el-tooltip content="Yeni Uçuş" placement="right">
          <el-button
            type="primary"
            :icon="Plus"
            circle
            size="large"
            @click="quickCreateFlight"
          />
        </el-tooltip>
      </div>
    </div>

    <!-- Sidebar Footer -->
    <div class="sidebar-footer">
      <div class="version-info">
        <transition name="fade">
          <div v-show="!collapsed" class="version-details">
            <div class="version-number">v1.0.0</div>
            <div class="build-info">Build 2025.1</div>
          </div>
        </transition>
      </div>

      <!-- Collapse Toggle -->
      <el-button
        :icon="collapsed ? Expand : Fold"
        text
        size="small"
        @click="toggleCollapse"
        class="collapse-btn"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
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
  DataAnalysis,
  Document,
  TrendCharts,
  Expand,
  Fold
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

// Props
const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['menu-select', 'toggle-collapse'])

// Router & Store
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Reactive state
const showReports = ref(false) // Will be enabled when reports are implemented

// Computed
const activeMenu = computed(() => {
  return route.path
})

// Methods
function handleMenuSelect(index) {
  if (index !== route.path) {
    router.push(index)
  }
  emit('menu-select', index)
}

function toggleCollapse() {
  emit('toggle-collapse')
}

function quickCreateFlight() {
  router.push('/flights/create')
}

// Watch for route changes to update active menu
watch(
  () => route.path,
  (newPath) => {
    // Handle sub-menu opening based on current route
    const menu = document.querySelector('.sidebar-menu')
    if (menu) {
      // Auto-open relevant sub-menus
      if (newPath.startsWith('/flights')) {
        menu.querySelector('[index="flights"]')?.click()
      } else if (['/airlines', '/airports', '/aircrafts', '/routes', '/crew-members'].some(path => newPath.startsWith(path))) {
        menu.querySelector('[index="reference"]')?.click()
      }
    }
  },
  { immediate: true }
)

// Lifecycle
onMounted(() => {
  // Set initial sub-menu state based on current route
  setTimeout(() => {
    const currentPath = route.path
    if (currentPath.startsWith('/flights')) {
      const flightsSubmenu = document.querySelector('[index="flights"]')
      if (flightsSubmenu && !flightsSubmenu.classList.contains('is-opened')) {
        flightsSubmenu.click()
      }
    } else if (['/airlines', '/airports', '/aircrafts', '/routes', '/crew-members'].some(path => currentPath.startsWith(path))) {
      const referenceSubmenu = document.querySelector('[index="reference"]')
      if (referenceSubmenu && !referenceSubmenu.classList.contains('is-opened')) {
        referenceSubmenu.click()
      }
    }
  }, 100)
})
</script>

<style scoped lang="scss">
.app-sidebar {
  height: 100%;
  background: white;
  border-right: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  overflow: hidden;

  &.collapsed {
    .sidebar-content {
      .sidebar-logo {
        justify-content: center;

        .logo-text {
          display: none;
        }
      }
    }
  }
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;

  .sidebar-logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-bottom: 1px solid #f0f0f0;
    transition: all 0.3s ease;

    .logo-text {
      font-size: 1.1rem;
      font-weight: 700;
      color: #303133;
      white-space: nowrap;
    }
  }

  .sidebar-menu {
    border: none;

    :deep(.el-menu-item) {
      padding-left: 1.5rem !important;
      height: 48px;
      line-height: 48px;
      border-radius: 0;
      margin: 0 0.5rem;
      transition: all 0.3s ease;

      &:hover {
        background-color: #ecf5ff;
        color: #409eff;
      }

      &.is-active {
        background-color: #409eff;
        color: white;
        border-radius: 6px;

        &::before {
          display: none;
        }
      }

      .el-icon {
        width: 20px;
        margin-right: 8px;
      }
    }

    :deep(.el-sub-menu) {
      .el-sub-menu__title {
        padding-left: 1.5rem !important;
        height: 48px;
        line-height: 48px;
        margin: 0 0.5rem;
        border-radius: 6px;
        transition: all 0.3s ease;

        &:hover {
          background-color: #f5f7fa;
          color: #409eff;
        }

        .el-icon {
          width: 20px;
          margin-right: 8px;
        }
      }

      &.is-opened .el-sub-menu__title {
        background-color: #f0f9ff;
        color: #409eff;
      }

      .el-menu-item {
        padding-left: 3rem !important;
        background-color: transparent;

        &.is-active {
          background-color: #409eff;
          color: white;
        }
      }
    }
  }

  .quick-actions {
    padding: 1rem;
    text-align: center;
    border-top: 1px solid #f0f0f0;
  }
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid #ebeef5;
  background-color: #fafafa;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .version-info {
    flex: 1;

    .version-details {
      .version-number {
        font-size: 0.85rem;
        font-weight: 600;
        color: #409eff;
        line-height: 1;
      }

      .build-info {
        font-size: 0.75rem;
        color: #909399;
        line-height: 1;
        margin-top: 2px;
      }
    }
  }

  .collapse-btn {
    margin-left: 0.5rem;

    &:hover {
      background-color: #ecf5ff;
      color: #409eff;
    }
  }
}

// Transitions
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// Scrollbar styling
.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;

  &:hover {
    background: #a8a8a8;
  }
}

// Responsive
@media (max-width: 768px) {
  .app-sidebar {
    position: fixed;
    left: 0;
    top: 60px;
    bottom: 0;
    z-index: 1000;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  }
}

// Dark mode support (future)
@media (prefers-color-scheme: dark) {
  .app-sidebar {
    background: #1f2937;
    border-right-color: #374151;

    .sidebar-content .sidebar-logo {
      border-bottom-color: #374151;

      .logo-text {
        color: #f9fafb;
      }
    }

    .sidebar-footer {
      background-color: #111827;
      border-top-color: #374151;
    }
  }
}
</style>

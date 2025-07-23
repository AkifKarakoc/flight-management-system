<template>
  <div class="app-sidebar" :class="{ 'collapsed': collapsed }">
    <div class="sidebar-content">
      <!-- Logo Section -->
      <div class="sidebar-logo" @click="goToDashboard">
        <el-icon size="32" color="#409EFF">
          <Position />
        </el-icon>
        <transition name="fade">
          <span v-show="!collapsed" class="logo-text">Flight Mgmt</span>
        </transition>
      </div>

      <!-- User Info (when not collapsed) -->
      <div v-if="!collapsed" class="user-info-sidebar">
        <div class="user-card">
          <el-avatar :src="userAvatar" :icon="UserFilled" size="small" />
          <div class="user-details">
            <span class="user-name">{{ userDisplayName }}</span>
            <span class="user-role">{{ userRole }}</span>
          </div>
          <el-badge
            v-if="userNotifications > 0"
            :value="userNotifications"
            :max="99"
            class="user-badge"
          />
        </div>
      </div>

      <!-- Navigation Menu -->
      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :unique-opened="false"
        class="sidebar-menu"
        @select="handleMenuSelect"
        :router="false"
      >
        <!-- Dashboard -->
        <el-menu-item index="/dashboard" class="menu-item-dashboard">
          <el-icon>
            <Monitor />
          </el-icon>
          <template #title>
            <span>Dashboard</span>
            <el-badge
              v-if="dashboardNotifications > 0"
              :value="dashboardNotifications"
              :max="99"
              size="small"
              class="menu-badge"
            />
          </template>
        </el-menu-item>

        <!-- Reference Management -->
        <el-sub-menu index="reference" class="reference-submenu">
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
            <template #title>
              <span>Havayolları</span>
              <el-tag v-if="referenceStats.airlines" size="small" class="count-tag">
                {{ referenceStats.airlines }}
              </el-tag>
            </template>
          </el-menu-item>

          <el-menu-item index="/airports">
            <el-icon>
              <MapLocation />
            </el-icon>
            <template #title>
              <span>Havaalanları</span>
              <el-tag v-if="referenceStats.airports" size="small" class="count-tag">
                {{ referenceStats.airports }}
              </el-tag>
            </template>
          </el-menu-item>

          <el-menu-item index="/aircrafts">
            <el-icon>
              <Promotion />
            </el-icon>
            <template #title>
              <span>Uçaklar</span>
              <el-tag v-if="referenceStats.aircrafts" size="small" class="count-tag">
                {{ referenceStats.aircrafts }}
              </el-tag>
            </template>
          </el-menu-item>

          <el-menu-item index="/routes">
            <el-icon>
              <Connection />
            </el-icon>
            <template #title>
              <span>Rotalar</span>
              <el-tag v-if="referenceStats.routes" size="small" class="count-tag">
                {{ referenceStats.routes }}
              </el-tag>
            </template>
          </el-menu-item>

          <el-menu-item index="/crew" v-if="hasAdminAccess">
            <el-icon>
              <Avatar />
            </el-icon>
            <template #title>
              <span>Mürettebat</span>
              <el-tag v-if="referenceStats.crew" size="small" class="count-tag">
                {{ referenceStats.crew }}
              </el-tag>
            </template>
          </el-menu-item>
        </el-sub-menu>

        <!-- Flight Management -->
        <el-sub-menu index="flights" class="flights-submenu">
          <template #title>
            <el-icon>
              <Position />
            </el-icon>
            <span>Uçuş Yönetimi</span>
            <el-badge
              v-if="flightAlerts > 0"
              :value="flightAlerts"
              :max="99"
              type="warning"
              size="small"
              class="submenu-badge"
            />
          </template>

          <el-menu-item index="/flights">
            <el-icon>
              <List />
            </el-icon>
            <template #title>
              <span>Uçuş Listesi</span>
              <el-tag v-if="flightStats.total" size="small" class="count-tag">
                {{ flightStats.total }}
              </el-tag>
            </template>
          </el-menu-item>

          <el-menu-item index="/flights/create" v-if="hasCreateAccess">
            <el-icon>
              <Plus />
            </el-icon>
            <template #title>Yeni Uçuş</template>
          </el-menu-item>

          <el-menu-item index="/flights/upload" v-if="hasAdminAccess">
            <el-icon>
              <Upload />
            </el-icon>
            <template #title>Toplu Yükleme</template>
          </el-menu-item>

          <!-- Active Flights (Real-time) -->
          <el-menu-item index="/flights/active" class="active-flights">
            <el-icon>
              <VideoCameraFilled />
            </el-icon>
            <template #title>
              <span>Aktif Uçuşlar</span>
              <el-tag
                v-if="flightStats.active"
                size="small"
                type="success"
                effect="dark"
                class="count-tag live"
              >
                <el-icon size="12"><VideoCameraFilled /></el-icon>
                {{ flightStats.active }}
              </el-tag>
            </template>
          </el-menu-item>
        </el-sub-menu>

        <!-- Reports Section -->
        <el-sub-menu index="reports" v-if="hasReportAccess">
          <template #title>
            <el-icon>
              <DataAnalysis />
            </el-icon>
            <span>Raporlar & Analiz</span>
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
            <template #title>KPI Dashboard</template>
          </el-menu-item>

          <el-menu-item index="/reports/analytics">
            <el-icon>
              <PieChart />
            </el-icon>
            <template #title>Veri Analizi</template>
          </el-menu-item>
        </el-sub-menu>

        <!-- System Management (Admin Only) -->
        <el-sub-menu index="system" v-if="hasAdminAccess">
          <template #title>
            <el-icon>
              <Tools />
            </el-icon>
            <span>Sistem Yönetimi</span>
            <el-badge
              v-if="systemIssues > 0"
              :value="systemIssues"
              type="danger"
              size="small"
              class="submenu-badge"
            />
          </template>

          <el-menu-item index="/system/health">
            <el-icon>
              <Monitor />
            </el-icon>
            <template #title>Sistem Durumu</template>
          </el-menu-item>

          <el-menu-item index="/system/logs">
            <el-icon>
              <Document />
            </el-icon>
            <template #title>Sistem Logları</template>
          </el-menu-item>

          <el-menu-item index="/system/settings">
            <el-icon>
              <Setting />
            </el-icon>
            <template #title>Ayarlar</template>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>

      <!-- Quick Actions (when collapsed) -->
      <div v-if="collapsed" class="quick-actions">
        <el-tooltip content="Yeni Uçuş Oluştur" placement="right">
          <el-button
            type="primary"
            :icon="Plus"
            circle
            size="large"
            @click="quickCreateFlight"
            class="quick-btn"
          />
        </el-tooltip>

        <el-tooltip content="Aktif Uçuşlar" placement="right">
          <el-button
            :icon="VideoCameraFilled"
            circle
            size="large"
            @click="quickActiveFlights"
            class="quick-btn"
            :class="{ 'has-activity': flightStats.active > 0 }"
          />
        </el-tooltip>

        <el-tooltip content="Sistem Durumu" placement="right" v-if="hasAdminAccess">
          <el-button
            :icon="Monitor"
            circle
            size="large"
            @click="quickSystemStatus"
            class="quick-btn"
            :class="{ 'has-warning': systemIssues > 0 }"
          />
        </el-tooltip>
      </div>
    </div>

    <!-- Sidebar Footer -->
    <div class="sidebar-footer">
      <!-- System Status Indicator -->
      <div class="system-status-indicator" @click="showSystemStatus">
        <el-tooltip :content="systemStatusText" placement="top">
          <div class="status-dot" :class="systemStatusClass"></div>
        </el-tooltip>
        <transition name="fade">
          <span v-show="!collapsed" class="status-text">{{ systemStatusText }}</span>
        </transition>
      </div>

      <!-- Version Info -->
      <transition name="fade">
        <div v-show="!collapsed" class="version-info">
          <div class="version-number">v1.0.0</div>
          <div class="build-info">Build {{ buildNumber }}</div>
        </div>
      </transition>

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

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { ElMessage } from 'element-plus'
import apiService from '@/services/api'

// Import icons
import {
  Monitor, Setting, Ship, MapLocation, Promotion, Connection, Avatar,
  Position, List, Plus, Upload, DataAnalysis, Document, TrendCharts,
  UserFilled, Expand, Fold, Tools, VideoCameraFilled, PieChart
} from '@element-plus/icons-vue'

// Props
const props = defineProps<{
  collapsed?: boolean
}>()

// Emits
const emit = defineEmits<{
  'menu-select': [index: string]
  'toggle-collapse': []
}>()

// Stores
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

// Reactive state
const buildNumber = ref('2025.1.23')
const autoRefreshInterval = ref<NodeJS.Timeout | null>(null)

// Mock data - replace with real API calls
const referenceStats = ref({
  airlines: 15,
  airports: 250,
  aircrafts: 45,
  routes: 120,
  crew: 180
})

const flightStats = ref({
  total: 1250,
  active: 8,
  delayed: 3,
  cancelled: 1
})

const dashboardNotifications = ref(3)
const userNotifications = ref(2)
const flightAlerts = ref(3)
const systemIssues = ref(1)

// Computed properties
const activeMenu = computed(() => {
  return route.path
})

const userDisplayName = computed(() => {
  return authStore.userInfo?.fullName || authStore.userInfo?.username || 'Kullanıcı'
})

const userRole = computed(() => {
  const roles = authStore.userRoles
  if (roles.includes('ADMIN') || roles.includes('ROLE_ADMIN')) return 'Yönetici'
  if (roles.includes('USER') || roles.includes('ROLE_USER')) return 'Kullanıcı'
  return 'Misafir'
})

const userAvatar = computed(() => {
  return authStore.userInfo?.avatar || null
})

const hasAdminAccess = computed(() => {
  return authStore.isAdmin
})

const hasCreateAccess = computed(() => {
  return authStore.isAdmin || authStore.hasPermission('flight:create')
})

const hasReportAccess = computed(() => {
  return authStore.isAdmin || authStore.hasPermission('report:read')
})

const systemStatusClass = computed(() => {
  if (systemIssues.value === 0) return 'status-healthy'
  if (systemIssues.value <= 2) return 'status-warning'
  return 'status-error'
})

const systemStatusText = computed(() => {
  if (systemIssues.value === 0) return 'Sistem Sağlıklı'
  if (systemIssues.value <= 2) return 'Uyarılar Var'
  return 'Kritik Sorunlar'
})

// Methods
function handleMenuSelect(index: string) {
  if (index !== route.path) {
    router.push(index)
  }
  emit('menu-select', index)

  // Close sidebar on mobile after selection
  if (window.innerWidth < 768) {
    emit('toggle-collapse')
  }
}

function toggleCollapse() {
  emit('toggle-collapse')
}

function goToDashboard() {
  if (route.path !== '/dashboard') {
    router.push('/dashboard')
  }
}

function quickCreateFlight() {
  router.push('/flights/create')
  ElMessage.success('Yeni uçuş oluşturma sayfasına yönlendiriliyorsunuz')
}

function quickActiveFlights() {
  router.push('/flights/active')
  ElMessage.info('Aktif uçuşlar sayfasına yönlendiriliyorsunuz')
}

function quickSystemStatus() {
  router.push('/system/health')
  ElMessage.info('Sistem durumu sayfasına yönlendiriliyorsunuz')
}

function showSystemStatus() {
  if (hasAdminAccess.value) {
    router.push('/system/health')
  } else {
    ElMessage.info('Sistem durumu: ' + systemStatusText.value)
  }
}

// Auto-refresh data
async function refreshData() {
  try {
    await Promise.all([
      refreshReferenceStats(),
      refreshFlightStats(),
      refreshSystemStatus()
    ])
  } catch (error) {
    console.error('Error refreshing sidebar data:', error)
  }
}

async function refreshReferenceStats() {
  try {
    const [airlines, airports, aircrafts, routes] = await Promise.all([
      apiService.getAirlines({ page: 0, size: 1 }),
      apiService.getAirports({ page: 0, size: 1 }),
      apiService.getAircrafts({ page: 0, size: 1 }),
      apiService.getRoutes({ page: 0, size: 1 })
    ])

    referenceStats.value = {
      airlines: airlines.totalElements || 0,
      airports: airports.totalElements || 0,
      aircrafts: aircrafts.totalElements || 0,
      routes: routes.totalElements || 0,
      crew: 0 // Crew endpoints henüz yok
    }
  } catch (error) {
    console.error('Error fetching reference stats:', error)
  }
}

async function refreshFlightStats() {
  try {
    const today = new Date().toISOString().split('T')[0]
    const stats = await apiService.flight.get(`/api/v1/flights/stats/dashboard/${today}`)

    flightStats.value = {
      total: stats.data.totalFlights || 0,
      active: stats.data.scheduled || 0,
      delayed: stats.data.delayed || 0,
      cancelled: stats.data.cancelled || 0
    }

    flightAlerts.value = flightStats.value.delayed + flightStats.value.cancelled
  } catch (error) {
    console.error('Error fetching flight stats:', error)
  }
}

async function refreshSystemStatus() {
  try {
    const services = await apiService.checkSystemHealth()
    systemIssues.value = services.filter(s => s.status === 'error').length
  } catch (error) {
    console.error('Error fetching system status:', error)
    systemIssues.value = 1 // Assume error if can't check
  }
}

// Auto-expand relevant submenu based on current route
function autoExpandSubmenu() {
  const currentPath = route.path

  setTimeout(() => {
    if (currentPath.startsWith('/flights')) {
      const flightsSubmenu = document.querySelector('.flights-submenu') as HTMLElement
      if (flightsSubmenu && !flightsSubmenu.classList.contains('is-opened')) {
        const title = flightsSubmenu.querySelector('.el-sub-menu__title') as HTMLElement
        title?.click()
      }
    } else if (['/airlines', '/airports', '/aircrafts', '/routes', '/crew'].some(path => currentPath.startsWith(path))) {
      const referenceSubmenu = document.querySelector('.reference-submenu') as HTMLElement
      if (referenceSubmenu && !referenceSubmenu.classList.contains('is-opened')) {
        const title = referenceSubmenu.querySelector('.el-sub-menu__title') as HTMLElement
        title?.click()
      }
    } else if (currentPath.startsWith('/reports')) {
      const reportsSubmenu = document.querySelector('[index="reports"]') as HTMLElement
      if (reportsSubmenu && !reportsSubmenu.classList.contains('is-opened')) {
        const title = reportsSubmenu.querySelector('.el-sub-menu__title') as HTMLElement
        title?.click()
      }
    } else if (currentPath.startsWith('/system')) {
      const systemSubmenu = document.querySelector('[index="system"]') as HTMLElement
      if (systemSubmenu && !systemSubmenu.classList.contains('is-opened')) {
        const title = systemSubmenu.querySelector('.el-sub-menu__title') as HTMLElement
        title?.click()
      }
    }
  }, 100)
}

// Watch route changes
watch(route, (newRoute) => {
  autoExpandSubmenu()
}, { immediate: true })

// Lifecycle
onMounted(() => {
  // Initial data load
  refreshData()

  // Set up auto-refresh
  autoRefreshInterval.value = setInterval(refreshData, 30000) // Every 30 seconds

  // Auto-expand current submenu
  autoExpandSubmenu()
})

onUnmounted(() => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value)
  }
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
    .sidebar-content .sidebar-logo {
      justify-content: center;
      cursor: pointer;

      .logo-text {
        display: none;
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
    cursor: pointer;

    &:hover {
      background-color: #f5f7fa;
    }

    .logo-text {
      font-size: 1.1rem;
      font-weight: 700;
      color: #303133;
      white-space: nowrap;
    }
  }

  .user-info-sidebar {
    padding: 1rem;
    border-bottom: 1px solid #f0f0f0;

    .user-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background-color: #f8f9fa;
      border-radius: 8px;
      position: relative;

      .user-details {
        flex: 1;
        min-width: 0;

        .user-name {
          display: block;
          font-size: 0.9rem;
          font-weight: 600;
          color: #303133;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          display: block;
          font-size: 0.75rem;
          color: #909399;
          margin-top: 2px;
        }
      }

      .user-badge {
        position: absolute;
        top: -5px;
        right: -5px;
      }
    }
  }

  .sidebar-menu {
    border: none;
    flex: 1;

    :deep(.el-menu-item) {
      padding-left: 1.5rem !important;
      height: 48px;
      line-height: 48px;
      border-radius: 0;
      margin: 0 0.5rem;
      transition: all 0.3s ease;
      position: relative;

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

        .count-tag {
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
          border-color: transparent;
        }
      }

      .el-icon {
        width: 20px;
        margin-right: 8px;
      }

      .count-tag {
        margin-left: auto;
        background-color: #f0f2f5;
        color: #606266;
        border: none;
        font-size: 0.75rem;

        &.live {
          background-color: #67c23a;
          color: white;
          animation: pulse 2s infinite;
        }
      }

      .menu-badge {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
      }

      &.active-flights {
        .count-tag.live {
          display: flex;
          align-items: center;
          gap: 4px;
        }
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
        position: relative;

        &:hover {
          background-color: #f5f7fa;
          color: #409eff;
        }

        .el-icon {
          width: 20px;
          margin-right: 8px;
        }

        .submenu-badge {
          position: absolute;
          right: 30px;
          top: 50%;
          transform: translateY(-50%);
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
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    border-top: 1px solid #f0f0f0;

    .quick-btn {
      &.has-activity {
        background-color: #67c23a;
        border-color: #67c23a;
        color: white;
        animation: pulse 2s infinite;
      }

      &.has-warning {
        background-color: #e6a23c;
        border-color: #e6a23c;
        color: white;
      }
    }
  }
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid #ebeef5;
  background-color: #fafafa;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;

  .system-status-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      color: #409eff;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      transition: all 0.3s ease;

      &.status-healthy {
        background-color: #67c23a;
        box-shadow: 0 0 6px rgba(103, 194, 58, 0.5);
      }

      &.status-warning {
        background-color: #e6a23c;
        box-shadow: 0 0 6px rgba(230, 162, 60, 0.5);
      }

      &.status-error {
        background-color: #f56c6c;
        box-shadow: 0 0 6px rgba(245, 108, 108, 0.5);
        animation: pulse 2s infinite;
      }
    }

    .status-text {
      font-size: 0.8rem;
      color: #606266;
    }
  }

  .version-info {
    flex: 1;

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

  .collapse-btn {
    flex-shrink: 0;

    &:hover {
      background-color: #ecf5ff;
      color: #409eff;
    }
  }
}

// Animations
@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
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

// Dark mode support
:deep(.dark) {
  .app-sidebar {
    background: #1f2937;
    border-right-color: #374151;

    .sidebar-content {
      .sidebar-logo {
        border-bottom-color: #374151;

        .logo-text {
          color: #f9fafb;
        }
      }

      .user-info-sidebar .user-card {
        background-color: #374151;

        .user-name {
          color: #f9fafb;
        }
      }
    }

    .sidebar-footer {
      background-color: #111827;
      border-top-color: #374151;
    }
  }
}
</style>

<template>
  <div class="dashboard-page">
    <!-- Page header -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">Kontrol Paneli</h1>
          <p class="page-subtitle">
            Hoş geldiniz, {{ user?.name || 'Kullanıcı' }}!
            Son güncelleme: {{ lastUpdateText }}
          </p>
        </div>
        <div class="header-actions">
          <BaseButton
            type="primary"
            icon="Refresh"
            :loading="refreshing"
            @click="refreshDashboard"
          >
            Yenile
          </BaseButton>
          <BaseButton
            icon="Download"
            @click="exportReport"
          >
            Rapor İndir
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Quick stats -->
    <div class="dashboard-stats">
      <KpiCard
        v-for="stat in quickStats"
        :key="stat.key"
        :title="stat.title"
        :value="stat.value"
        :change="stat.change"
        :icon="stat.icon"
        :color="stat.color"
        :loading="statsLoading"
        @click="handleStatClick(stat)"
      />
    </div>

    <!-- Main content grid -->
    <div class="dashboard-grid">
      <!-- Recent flights -->
      <BaseCard
        title="Son Uçuşlar"
        class="recent-flights-card"
        :actions="[
          { key: 'view-all', label: 'Tümünü Gör', handler: () => navigateTo('FlightManagement') }
        ]"
      >
        <RecentFlightsTable
          :flights="recentFlights"
          :loading="flightsLoading"
          @view-flight="handleViewFlight"
          @edit-flight="handleEditFlight"
        />
      </BaseCard>

      <!-- Flight status chart -->
      <BaseCard
        title="Uçuş Durumları"
        class="flight-status-card"
      >
        <FlightStatusChart
          :data="flightStatusData"
          :loading="chartsLoading"
          @status-click="handleStatusClick"
        />
      </BaseCard>

      <!-- Daily operations -->
      <BaseCard
        title="Günlük İşlemler"
        class="daily-operations-card"
      >
        <DailyOperationsChart
          :data="dailyOperationsData"
          :loading="chartsLoading"
          :date-range="dateRange"
          @date-change="handleDateRangeChange"
        />
      </BaseCard>

      <!-- Quick actions -->
      <BaseCard
        title="Hızlı İşlemler"
        class="quick-actions-card"
      >
        <div class="quick-actions-grid">
          <BaseButton
            v-for="action in quickActions"
            :key="action.key"
            :type="action.type"
            :icon="action.icon"
            size="large"
            class="quick-action-btn"
            @click="action.handler"
          >
            {{ action.label }}
          </BaseButton>
        </div>
      </BaseCard>

      <!-- Notifications panel -->
      <BaseCard
        title="Sistem Bildirimleri"
        class="notifications-card"
        :actions="[
          { key: 'mark-all-read', label: 'Tümünü Okundu İşaretle', handler: markAllNotificationsRead, props: { link: true, size: 'small' } }
        ]"
      >
        <NotificationsList
          :notifications="systemNotifications"
          :loading="notificationsLoading"
          @notification-click="handleNotificationClick"
        />
      </BaseCard>

      <!-- Performance metrics -->
      <BaseCard
        title="Performans Metrikleri"
        class="performance-card"
      >
        <PerformanceMetrics
          :metrics="performanceMetrics"
          :loading="metricsLoading"
          :time-period="timePeriod"
          @period-change="handleTimePeriodChange"
        />
      </BaseCard>
    </div>

    <!-- Modals -->
    <BaseModal
      v-model="showExportModal"
      title="Rapor Dışa Aktar"
      width="500px"
    >
      <ExportReportForm
        @export="handleExport"
        @cancel="showExportModal = false"
      />
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import KpiCard from '@/components/charts/KpiCard.vue'
import RecentFlightsTable from '@/components/tables/RecentFlightsTable.vue'
import FlightStatusChart from '@/components/charts/FlightStatusChart.vue'
import DailyOperationsChart from '@/components/charts/DailyOperationsChart.vue'
import NotificationsList from '@/components/common/NotificationsList.vue'
import PerformanceMetrics from '@/components/charts/PerformanceMetrics.vue'
import ExportReportForm from '@/components/forms/ExportReportForm.vue'
import { useWebSocket } from '@/composables/useWebSocket'; // YENİ

import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'
import { useFlightStore } from '@/stores/flights'
import { formatRelativeTime, formatNumber } from '@/utils/formatters'
import { debounce } from '@/utils/helpers'
import { useNotification } from '@/composables/useNotification'

// Composables
const router = useRouter()
const authStore = useAuthStore()
const dashboardStore = useDashboardStore()
const flightStore = useFlightStore()
const { showSuccess, showError, showInfo } = useNotification();


// Reactive state
const refreshing = ref(false)
const showExportModal = ref(false)
const lastUpdate = ref(new Date())
const dateRange = ref([
  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  new Date()
])
const timePeriod = ref('week')

// Loading states - separate for better UX
const statsLoading = ref(true)
const flightsLoading = ref(true)
const chartsLoading = ref(true)
const notificationsLoading = ref(true)
const metricsLoading = ref(true)

// Auto-refresh timer
let refreshTimer = null

// Computed properties
const user = computed(() => authStore.user)

const lastUpdateText = computed(() => {
  return formatRelativeTime(lastUpdate.value)
})

const quickStats = computed(() => [
  {
    key: 'total-flights',
    title: 'Toplam Uçuş',
    value: formatNumber(dashboardStore.stats.totalFlights),
    change: dashboardStore.stats.flightsChange,
    icon: 'Airplane',
    color: 'primary'
  },
  {
    key: 'active-flights',
    title: 'Aktif Uçuş',
    value: formatNumber(dashboardStore.stats.activeFlights),
    change: dashboardStore.stats.activeChange,
    icon: 'Timer',
    color: 'success'
  },
  {
    key: 'delayed-flights',
    title: 'Gecikmeli Uçuş',
    value: formatNumber(dashboardStore.stats.delayedFlights),
    change: dashboardStore.stats.delayedChange,
    icon: 'Warning',
    color: 'warning'
  },
  {
    key: 'cancelled-flights',
    title: 'İptal Edilen',
    value: formatNumber(dashboardStore.stats.cancelledFlights),
    change: dashboardStore.stats.cancelledChange,
    icon: 'Close',
    color: 'danger'
  }
])

const recentFlights = computed(() => dashboardStore.recentFlights)
const flightStatusData = computed(() => dashboardStore.flightStatusData)
const dailyOperationsData = computed(() => dashboardStore.dailyOperationsData)
const systemNotifications = computed(() => dashboardStore.notifications)
const performanceMetrics = computed(() => dashboardStore.performanceMetrics)

const quickActions = computed(() => [
  {
    key: 'add-flight',
    label: 'Yeni Uçuş',
    icon: 'Plus',
    type: 'primary',
    handler: () => navigateTo('FlightCreate')
  },
  {
    key: 'upload-csv',
    label: 'CSV Yükle',
    icon: 'Upload',
    type: 'success',
    handler: () => navigateTo('FlightUpload')
  },
  {
    key: 'view-reports',
    label: 'Raporlar',
    icon: 'Document',
    type: 'info',
    handler: () => navigateTo('FlightReports')
  },
  {
    key: 'manage-airlines',
    label: 'Havayolları',
    icon: 'OfficeBuilding',
    type: 'default',
    handler: () => navigateTo('AirlineManagement')
  }
])

// Debounced refresh function for efficiency
const debouncedRefresh = debounce(async () => {
  await loadDashboardData()
}, 1000)

useWebSocket({
  '/topic/updates': (message) => {
    // Genel bildirimleri işleyebiliriz
    console.log('General update received:', message);
    showInfo(`Sistem Bildirimi: ${message.content || 'Yeni bir güncelleme var.'}`);
    // Dashboard verilerini yenileme tetiklenebilir
    refreshDashboard();
  },
  '/topic/flights': (flightEvent) => {
    // Uçuşla ilgili anlık güncellemeleri işleyelim
    console.log('Flight event received:', flightEvent);
    flightStore.handleWebSocketFlightUpdate(flightEvent);

    // Kullanıcıya küçük bir bildirim gösterebiliriz
    const flightNumber = flightEvent.data?.flightNumber || '';
    if (flightEvent.type === 'CREATE') {
      showSuccess(`${flightNumber} numaralı yeni uçuş eklendi.`);
    } else if (flightEvent.type === 'STATUS_CHANGE') {
      showInfo(`${flightNumber} numaralı uçuşun durumu güncellendi: ${flightEvent.data.status}`);
    }
  }
});

// Methods
const refreshDashboard = async () => {
  if (refreshing.value) return

  refreshing.value = true
  try {
    await loadDashboardData()
    lastUpdate.value = new Date()
    ElMessage.success('Kontrol paneli yenilendi')
  } catch (error) {
    ElMessage.error('Veriler yenilenirken hata oluştu')
    console.error('Dashboard refresh error:', error)
  } finally {
    refreshing.value = false
  }
}

const loadDashboardData = async () => {
  try {
    // Load data in parallel for better performance
    const promises = []

    // Load stats
    promises.push(
      dashboardStore.loadStats().finally(() => {
        statsLoading.value = false
      })
    )

    // Load recent flights
    promises.push(
      dashboardStore.loadRecentFlights().finally(() => {
        flightsLoading.value = false
      })
    )

    // Load charts data
    promises.push(
      Promise.all([
        dashboardStore.loadFlightStatusData(),
        dashboardStore.loadDailyOperationsData()
      ]).finally(() => {
        chartsLoading.value = false
      })
    )

    // Load notifications
    promises.push(
      dashboardStore.loadNotifications().finally(() => {
        notificationsLoading.value = false
      })
    )

    // Load performance metrics
    promises.push(
      dashboardStore.loadPerformanceMetrics(timePeriod.value).finally(() => {
        metricsLoading.value = false
      })
    )

    await Promise.allSettled(promises)
  } catch (error) {
    console.error('Error loading dashboard data:', error)
    throw error
  }
}

const navigateTo = (routeName, params = {}) => {
  router.push({ name: routeName, params })
}

const handleStatClick = (stat) => {
  switch (stat.key) {
    case 'total-flights':
      navigateTo('FlightManagement')
      break
    case 'active-flights':
      navigateTo('FlightManagement', { status: 'ACTIVE' })
      break
    case 'delayed-flights':
      navigateTo('FlightManagement', { status: 'DELAYED' })
      break
    case 'cancelled-flights':
      navigateTo('FlightManagement', { status: 'CANCELLED' })
      break
  }
}

const handleViewFlight = (flight) => {
  navigateTo('FlightView', { id: flight.id })
}

const handleEditFlight = (flight) => {
  navigateTo('FlightEdit', { id: flight.id })
}

const handleStatusClick = (status) => {
  navigateTo('FlightManagement', { status: status.toUpperCase() })
}

const handleDateRangeChange = (newRange) => {
  dateRange.value = newRange
  debouncedRefresh()
}

const handleTimePeriodChange = (period) => {
  timePeriod.value = period
  metricsLoading.value = true
  dashboardStore.loadPerformanceMetrics(period).finally(() => {
    metricsLoading.value = false
  })
}

const handleNotificationClick = (notification) => {
  dashboardStore.markNotificationAsRead(notification.id)

  // Navigate based on notification type
  if (notification.actionUrl) {
    router.push(notification.actionUrl)
  }
}

const markAllNotificationsRead = () => {
  dashboardStore.markAllNotificationsAsRead()
  ElMessage.success('Tüm bildirimler okundu olarak işaretlendi')
}

const exportReport = () => {
  showExportModal.value = true
}

const handleExport = async (exportConfig) => {
  try {
    await dashboardStore.exportDashboardReport(exportConfig)
    showExportModal.value = false
    ElMessage.success('Rapor başarıyla dışa aktarıldı')
  } catch (error) {
    ElMessage.error('Rapor dışa aktarılırken hata oluştu')
    console.error('Export error:', error)
  }
}

// Auto-refresh functionality
const setupAutoRefresh = () => {
  // Refresh every 5 minutes
  refreshTimer = setInterval(() => {
    if (document.visibilityState === 'visible') {
      debouncedRefresh()
    }
  }, 5 * 60 * 1000)
}

const cleanupAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// Visibility change handler - pause refresh when tab is not visible
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    // Tab became visible, refresh data if it's been a while
    const timeSinceLastUpdate = Date.now() - lastUpdate.value.getTime()
    if (timeSinceLastUpdate > 2 * 60 * 1000) { // 2 minutes
      debouncedRefresh()
    }
  }
}

// Lifecycle
onMounted(async () => {
  // Load initial data
  await loadDashboardData()

  // Setup auto-refresh
  setupAutoRefresh()

  // Listen for visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange)

  // Setup performance monitoring
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          console.log('Dashboard load time:', entry.loadEventEnd - entry.loadEventStart, 'ms')
        }
      })
    })
    observer.observe({ entryTypes: ['navigation'] })
  }
})

onUnmounted(() => {
  cleanupAutoRefresh()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

</script>

<style scoped>
.dashboard-page {
  padding: 0;
  max-width: 100%;
}

/* Header */
.dashboard-header {
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-dark-2));
  color: white;
  padding: 32px 24px;
  margin: -24px -24px 24px -24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  max-width: 1400px;
  margin: 0 auto;
  gap: 24px;
}

.header-text {
  flex: 1;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
  line-height: 1.4;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

/* Stats grid */
.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

/* Main content grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
  grid-auto-rows: min-content;
}

/* Grid item positioning */
.recent-flights-card {
  grid-column: span 8;
}

.flight-status-card {
  grid-column: span 4;
}

.daily-operations-card {
  grid-column: span 8;
}

.quick-actions-card {
  grid-column: span 4;
}

.notifications-card {
  grid-column: span 6;
}

.performance-card {
  grid-column: span 6;
}

/* Quick actions */
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.quick-action-btn {
  height: 80px;
  flex-direction: column;
  gap: 8px;
  font-weight: 500;
}

.quick-action-btn :deep(.el-icon) {
  font-size: 24px;
}

/* Card optimizations */
.dashboard-grid :deep(.base-card) {
  height: fit-content;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.dashboard-grid :deep(.base-card):hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* Responsive design */
@media (max-width: 1200px) {
  .dashboard-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .recent-flights-card,
  .daily-operations-card {
    grid-column: span 12;
  }

  .flight-status-card,
  .quick-actions-card,
  .notifications-card,
  .performance-card {
    grid-column: span 6;
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    padding: 24px 16px;
    margin: -24px -16px 24px -16px;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .header-actions {
    justify-content: center;
  }

  .page-title {
    font-size: 24px;
  }

  .page-subtitle {
    font-size: 14px;
  }

  .dashboard-stats {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .dashboard-grid {
    gap: 16px;
  }

  .dashboard-grid > * {
    grid-column: span 12 !important;
  }

  .quick-actions-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .quick-action-btn {
    height: 60px;
  }
}

@media (max-width: 480px) {
  .dashboard-header {
    padding: 20px 12px;
    margin: -24px -12px 20px -12px;
  }

  .page-title {
    font-size: 20px;
  }

  .header-actions {
    flex-direction: column;
  }

  .dashboard-stats {
    gap: 12px;
  }

  .dashboard-grid {
    gap: 12px;
  }
}

/* Performance optimizations */
.dashboard-page {
  /* Enable GPU acceleration for smooth animations */
  transform: translateZ(0);
  will-change: transform;
}

/* Skeleton loading states */
.dashboard-stats:has([loading="true"]) {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* High contrast mode */
@media (prefers-contrast: more) {
  .dashboard-header {
    border-bottom: 2px solid white;
  }

  .dashboard-grid :deep(.base-card) {
    border-width: 2px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .dashboard-grid :deep(.base-card),
  .quick-action-btn {
    transition: none;
  }

  .dashboard-grid :deep(.base-card):hover {
    transform: none;
  }
}

/* Print styles */
@media print {
  .dashboard-header {
    background: white !important;
    color: black !important;
    border-bottom: 2px solid black;
  }

  .header-actions,
  .quick-actions-card {
    display: none;
  }

  .dashboard-grid {
    display: block;
  }

  .dashboard-grid > * {
    break-inside: avoid;
    margin-bottom: 20px;
  }
}
</style>

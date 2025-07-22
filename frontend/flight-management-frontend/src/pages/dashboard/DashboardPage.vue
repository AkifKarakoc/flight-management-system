<template>
  <div class="dashboard-page">
    <!-- Page Header with Actions -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Uçuş yönetim sistemine hoş geldiniz</p>
        </div>

        <div class="header-actions">
          <el-dropdown @command="handleExport" trigger="click">
            <el-button type="primary" :icon="Download">
              Rapor İndir
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="pdf">
                  <el-icon><Document /></el-icon>
                  PDF Raporu
                </el-dropdown-item>
                <el-dropdown-item command="excel">
                  <el-icon><Tickets /></el-icon>
                  Excel Raporu
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-button
            :icon="Refresh"
            @click="refreshDashboard"
            :loading="refreshing"
            title="Yenile"
          />

          <el-badge :value="unreadNotifications" :hidden="unreadNotifications === 0">
            <el-button :icon="Bell" @click="showNotifications" title="Bildirimler" />
          </el-badge>
        </div>
      </div>

      <!-- Connection Status -->
      <div class="connection-status">
        <el-tag
          :type="connectionStatus.type"
          size="small"
          :icon="connectionStatus.icon"
        >
          {{ connectionStatus.text }}
        </el-tag>
        <span class="last-update">
          Son Güncelleme: {{ formatLastUpdate(lastUpdate) }}
        </span>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="kpi-cards">
      <div class="kpi-row">
        <KpiCard
          title="Toplam Uçuş"
          :value="kpis.totalFlights"
          icon="Position"
          color="#409eff"
          :loading="loading"
          :trend-value="kpiTrends.totalFlights"
          :trend-type="kpiTrends.totalFlightsType"
        />
        <KpiCard
          title="Aktif Havayolları"
          :value="kpis.activeAirlines"
          icon="Ship"
          color="#67c23a"
          :loading="loading"
          :trend-value="kpiTrends.activeAirlines"
          :trend-type="kpiTrends.activeAirlinesType"
        />
        <KpiCard
          title="Toplam Havaalanı"
          :value="kpis.totalAirports"
          icon="MapLocation"
          color="#e6a23c"
          :loading="loading"
          :trend-value="kpiTrends.totalAirports"
          :trend-type="kpiTrends.totalAirportsType"
        />
        <KpiCard
          title="Aktif Uçaklar"
          :value="kpis.activeAircrafts"
          icon="Promotion"
          color="#f56c6c"
          :loading="loading"
          :trend-value="kpiTrends.activeAircrafts"
          :trend-type="kpiTrends.activeAircraftsType"
        />
      </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-section">
      <el-row :gutter="24">
        <el-col :xs="24" :lg="12">
          <div class="chart-card">
            <div class="card-header">
              <h3>Günlük Uçuş Dağılımı</h3>
              <div class="chart-controls">
                <el-button-group size="small">
                  <el-button
                    :type="chartPeriod === '7d' ? 'primary' : ''"
                    @click="updateChartPeriod('7d')"
                  >
                    7 Gün
                  </el-button>
                  <el-button
                    :type="chartPeriod === '30d' ? 'primary' : ''"
                    @click="updateChartPeriod('30d')"
                  >
                    30 Gün
                  </el-button>
                </el-button-group>
                <el-button
                  size="small"
                  :icon="Download"
                  @click="exportChart('flight')"
                  title="Grafiği İndir"
                />
              </div>
            </div>
            <div class="chart-content">
              <FlightChart
                ref="flightChartRef"
                :period="chartPeriod"
                @dataLoaded="onFlightChartDataLoaded"
              />
            </div>
          </div>
        </el-col>

        <el-col :xs="24" :lg="12">
          <div class="chart-card">
            <div class="card-header">
              <h3>Uçuş Türü Dağılımı</h3>
              <el-button
                size="small"
                :icon="Download"
                @click="exportChart('type')"
                title="Grafiği İndir"
              />
            </div>
            <div class="chart-content">
              <FlightTypeChart
                ref="flightTypeChartRef"
                @dataLoaded="onFlightTypeChartDataLoaded"
                @chartClick="onFlightTypeClick"
              />
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- Recent Activity -->
    <div class="activity-section">
      <el-row :gutter="24">
        <el-col :xs="24" :lg="16">
          <div class="activity-card">
            <div class="card-header">
              <h3>Son Uçuşlar</h3>
              <div class="activity-controls">
                <el-badge :value="realtimeUpdates" :hidden="realtimeUpdates === 0" type="success">
                  <el-button
                    size="small"
                    :type="autoRefresh ? 'primary' : ''"
                    @click="toggleAutoRefresh"
                    :icon="autoRefresh ? VideoPause : VideoPlay"
                  >
                    {{ autoRefresh ? 'Durdur' : 'Başlat' }}
                  </el-button>
                </el-badge>
                <el-link type="primary" @click="$router.push('/flights')">
                  Tümünü Gör
                </el-link>
              </div>
            </div>
            <div class="activity-content">
              <RecentFlightsTable
                :limit="5"
                :realtime="autoRefresh"
                @flightUpdate="onFlightUpdate"
              />
            </div>
          </div>
        </el-col>

        <el-col :xs="24" :lg="8">
          <div class="activity-card">
            <div class="card-header">
              <h3>Sistem Durumu</h3>
              <el-button
                size="small"
                :icon="Setting"
                @click="showSystemDetails"
                title="Detaylı Görünüm"
              />
            </div>
            <div class="activity-content">
              <SystemStatus
                ref="systemStatusRef"
                :auto-refresh="autoRefresh"
                @statusChange="onSystemStatusChange"
                @alertTriggered="onSystemAlert"
              />
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- Real-time Notifications Toast -->
    <div class="notification-container">
      <transition-group name="notification" tag="div">
        <div
          v-for="notification in realtimeNotifications"
          :key="notification.id"
          class="notification-toast"
          :class="notification.type"
        >
          <el-icon :size="16">
            <component :is="getNotificationIcon(notification.type)" />
          </el-icon>
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
          </div>
          <el-button
            size="small"
            :icon="Close"
            @click="dismissNotification(notification.id)"
            text
          />
        </div>
      </transition-group>
    </div>

    <!-- System Details Dialog -->
    <el-dialog
      v-model="systemDetailsVisible"
      title="Sistem Detayları"
      width="80%"
      :before-close="handleSystemDetailsClose"
    >
      <SystemStatus
        v-if="systemDetailsVisible"
        :auto-refresh="true"
        :refresh-interval="10000"
      />
    </el-dialog>

    <!-- Export Loading Dialog -->
    <el-dialog
      v-model="exportLoading"
      title="Rapor Hazırlanıyor"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="export-progress">
        <el-progress
          :percentage="exportProgress"
          :status="exportStatus"
          :stroke-width="8"
        />
        <div class="export-message">{{ exportMessage }}</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import {
  Refresh,
  Download,
  Bell,
  Document,
  Tickets,
  ArrowDown,
  VideoPlay,
  VideoPause,
  Setting,
  Close,
  CircleCheck,
  Warning,
  CircleClose,
  InfoFilled
} from '@element-plus/icons-vue'

// Components
import KpiCard from '@/components/charts/KpiCard.vue'
import FlightChart from '@/components/charts/FlightChart.vue'
import FlightTypeChart from '@/components/charts/FlightTypeChart.vue'
import RecentFlightsTable from '@/components/tables/RecentFlightsTable.vue'
import SystemStatus from '@/components/common/SystemStatus.vue'

// Services
import websocketService from '@/services/websocketService'
import exportService from '@/services/exportService'
import apiService from '@/services/api'

// Reactive data
const loading = ref(true)
const refreshing = ref(false)
const autoRefresh = ref(true)
const chartPeriod = ref('7d')
const lastUpdate = ref(new Date())
const unreadNotifications = ref(0)
const realtimeUpdates = ref(0)
const systemDetailsVisible = ref(false)

// Export states
const exportLoading = ref(false)
const exportProgress = ref(0)
const exportStatus = ref('')
const exportMessage = ref('')

// Chart references
const flightChartRef = ref(null)
const flightTypeChartRef = ref(null)
const systemStatusRef = ref(null)

// WebSocket connection status
const wsConnected = ref(false)
const wsConnections = reactive(new Map())

const kpis = reactive({
  totalFlights: 0,
  activeAirlines: 0,
  totalAirports: 0,
  activeAircrafts: 0
})

const kpiTrends = reactive({
  totalFlights: 0,
  totalFlightsType: 'up',
  activeAirlines: 0,
  activeAirlinesType: 'up',
  totalAirports: 0,
  totalAirportsType: 'up',
  activeAircrafts: 0,
  activeAircraftsType: 'up'
})

const realtimeNotifications = reactive([])
const dashboardData = reactive({
  kpis: {},
  recentFlights: [],
  systemStatus: [],
  alerts: []
})

// Computed properties
const connectionStatus = computed(() => {
  if (wsConnected.value) {
    return {
      type: 'success',
      icon: CircleCheck,
      text: 'Bağlı'
    }
  } else {
    return {
      type: 'danger',
      icon: CircleClose,
      text: 'Bağlantı Kesildi'
    }
  }
})

// Methods
const fetchKpis = async () => {
  loading.value = true
  try {
    // Gerçek backend'den veri çek
    const data = await apiService.getDashboardKpis()

    // Calculate trends
    Object.keys(data).forEach(key => {
      const oldValue = kpis[key]
      const newValue = data[key]
      const diff = newValue - oldValue

      kpiTrends[key] = Math.abs(diff)
      kpiTrends[`${key}Type`] = diff >= 0 ? 'up' : 'down'
    })

    Object.assign(kpis, data)
    dashboardData.kpis = { ...kpis }

  } catch (error) {
    console.error('Error fetching KPIs:', error)
    ElMessage.error('KPI verileri yüklenirken hata oluştu')
  } finally {
    loading.value = false
  }
}

const refreshDashboard = async () => {
  refreshing.value = true
  try {
    await fetchKpis()

    // Refresh charts
    if (flightChartRef.value?.refreshData) {
      await flightChartRef.value.refreshData()
    }
    if (flightTypeChartRef.value?.refreshData) {
      await flightTypeChartRef.value.refreshData()
    }

    lastUpdate.value = new Date()
    ElMessage.success('Dashboard güncellendi')
  } catch (error) {
    ElMessage.error('Dashboard güncellenirken hata oluştu')
  } finally {
    refreshing.value = false
  }
}

const updateChartPeriod = (period) => {
  chartPeriod.value = period
}

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    connectWebSockets()
    ElMessage.success('Otomatik güncelleme açıldı')
  } else {
    disconnectWebSockets()
    ElMessage.info('Otomatik güncelleme kapatıldı')
  }
}

const formatLastUpdate = (date) => {
  return date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// WebSocket methods
const connectWebSockets = async () => {
  try {
    // Connect to dashboard updates
    const dashboardWs = await websocketService.subscribeToDashboardUpdates(handleDashboardUpdate)
    wsConnections.set('dashboard', dashboardWs)

    // Connect to flight updates
    const flightWs = await websocketService.subscribeToFlightUpdates(handleFlightUpdate)
    wsConnections.set('flights', flightWs)

    // Connect to system status
    const systemWs = await websocketService.subscribeToSystemStatus(handleSystemStatusUpdate)
    wsConnections.set('system', systemWs)

    // Connect to notifications
    const notificationWs = await websocketService.subscribeToNotifications(handleNotification)
    wsConnections.set('notifications', notificationWs)

    wsConnected.value = true
    console.log('WebSocket connections established')
  } catch (error) {
    console.error('WebSocket connection error:', error)
    wsConnected.value = false
    ElMessage.error('Gerçek zamanlı bağlantı kurulamadı')
  }
}

const disconnectWebSockets = () => {
  wsConnections.forEach((ws, key) => {
    websocketService.disconnect(key)
  })
  wsConnections.clear()
  wsConnected.value = false
}

// WebSocket event handlers
const handleDashboardUpdate = (data) => {
  if (data.type === 'kpi_update') {
    Object.assign(kpis, data.kpis)
    realtimeUpdates.value++
  }
}

const handleFlightUpdate = (data) => {
  realtimeUpdates.value++
  showRealtimeNotification({
    type: 'info',
    title: 'Uçuş Güncellendi',
    message: `${data.flightNumber} durumu: ${data.status}`
  })
}

const handleSystemStatusUpdate = (data) => {
  if (systemStatusRef.value) {
    // Update system status component
  }
}

const handleNotification = (notification) => {
  unreadNotifications.value++
  showRealtimeNotification(notification)
}

const showRealtimeNotification = (notification) => {
  const id = Date.now()
  realtimeNotifications.push({
    id,
    ...notification,
    timestamp: new Date()
  })

  // Auto dismiss after 5 seconds
  setTimeout(() => {
    dismissNotification(id)
  }, 5000)
}

const dismissNotification = (id) => {
  const index = realtimeNotifications.findIndex(n => n.id === id)
  if (index > -1) {
    realtimeNotifications.splice(index, 1)
  }
}

const getNotificationIcon = (type) => {
  const icons = {
    'success': CircleCheck,
    'warning': Warning,
    'error': CircleClose,
    'info': InfoFilled
  }
  return icons[type] || InfoFilled
}

// Chart event handlers
const onFlightChartDataLoaded = (data) => {
  dashboardData.flightChart = data
}

const onFlightTypeChartDataLoaded = (data) => {
  dashboardData.flightTypeChart = data
}

const onFlightTypeClick = (data) => {
  ElMessage.info(`${data.name} kategorisi seçildi: ${data.value} uçuş`)
}

const onFlightUpdate = (flight) => {
  realtimeUpdates.value++
}

const onSystemStatusChange = (data) => {
  dashboardData.systemStatus = data.services
  dashboardData.alerts = data.alerts
}

const onSystemAlert = (alert) => {
  ElNotification({
    title: alert.title,
    message: alert.description,
    type: alert.type,
    duration: 0
  })
}

// Export methods
const handleExport = async (format) => {
  exportLoading.value = true
  exportProgress.value = 0
  exportMessage.value = 'Veriler hazırlanıyor...'

  try {
    // Simulate progress
    const progressInterval = setInterval(() => {
      if (exportProgress.value < 90) {
        exportProgress.value += 10
      }
    }, 200)

    await exportService.exportDashboardReport(dashboardData, format, {
      title: 'Dashboard Raporu',
      subtitle: `Sistem Durumu - ${new Date().toLocaleDateString('tr-TR')}`,
      metadata: {
        'Rapor Tarihi': new Date().toLocaleString('tr-TR'),
        'Toplam Uçuş': kpis.totalFlights,
        'Aktif Havayolları': kpis.activeAirlines,
        'Sistem': 'Flight Management System v1.0'
      }
    })

    clearInterval(progressInterval)
    exportProgress.value = 100
    exportStatus.value = 'success'
    exportMessage.value = 'Rapor başarıyla indirildi!'

    setTimeout(() => {
      exportLoading.value = false
      exportStatus.value = ''
    }, 1500)

  } catch (error) {
    console.error('Export error:', error)
    exportStatus.value = 'exception'
    exportMessage.value = 'Rapor oluşturulurken hata oluştu'
    ElMessage.error('Rapor indirme işlemi başarısız')

    setTimeout(() => {
      exportLoading.value = false
      exportStatus.value = ''
    }, 2000)
  }
}

const exportChart = async (chartType) => {
  try {
    let chartRef
    let filename

    if (chartType === 'flight') {
      chartRef = flightChartRef.value
      filename = `ucus_dagilimi_${chartPeriod.value}`
    } else if (chartType === 'type') {
      chartRef = flightTypeChartRef.value
      filename = 'ucus_turu_dagilimi'
    }

    if (chartRef?.exportChart) {
      const dataURL = chartRef.exportChart()
      if (dataURL) {
        const blob = await exportService.exportChartAsImage(dataURL, {
          format: 'png',
          backgroundColor: '#ffffff'
        })
        exportService.downloadBlob(blob, `${filename}.png`)
        ElMessage.success('Grafik başarıyla indirildi')
      }
    }
  } catch (error) {
    console.error('Chart export error:', error)
    ElMessage.error('Grafik indirme işlemi başarısız')
  }
}

// UI methods
const showNotifications = () => {
  unreadNotifications.value = 0
  ElMessage.info('Bildirimler paneli açılacak (yakında)')
}

const showSystemDetails = () => {
  systemDetailsVisible.value = true
}

const handleSystemDetailsClose = () => {
  systemDetailsVisible.value = false
}

// Lifecycle hooks
onMounted(async () => {
  await fetchKpis()
  if (autoRefresh.value) {
    await connectWebSockets()
  }
})

onUnmounted(() => {
  disconnectWebSockets()
})
</script>

<style scoped>
.dashboard-page {
  padding: 0;
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  background: white;
  padding: 24px;
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.header-info {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 16px;
  color: #606266;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.connection-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.last-update {
  font-size: 13px;
  color: #909399;
}

.kpi-cards {
  margin-bottom: 24px;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.charts-section {
  margin-bottom: 24px;
}

.chart-card, .activity-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 24px;
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.card-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.chart-controls,
.activity-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.chart-content {
  height: 300px;
}

.activity-content {
  min-height: 200px;
}

.notification-container {
  position: fixed;
  top: 80px;
  right: 24px;
  z-index: 3000;
  max-width: 350px;
}

.notification-toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  margin-bottom: 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border-left: 4px solid #409eff;
}

.notification-toast.success {
  border-left-color: #67c23a;
}

.notification-toast.warning {
  border-left-color: #e6a23c;
}

.notification-toast.error {
  border-left-color: #f56c6c;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.notification-message {
  font-size: 13px;
  color: #606266;
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.export-progress {
  text-align: center;
  padding: 20px 0;
}

.export-message {
  margin-top: 16px;
  color: #606266;
  font-size: 14px;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .header-actions {
    justify-content: space-between;
  }

  .kpi-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .page-title {
    font-size: 24px;
  }

  .chart-card, .activity-card {
    padding: 16px;
  }

  .chart-content {
    height: 250px;
  }

  .notification-container {
    right: 12px;
    max-width: calc(100vw - 24px);
  }
}

@media (max-width: 480px) {
  .kpi-row {
    grid-template-columns: 1fr;
  }

  .chart-controls,
  .activity-controls {
    flex-direction: column;
    gap: 4px;
  }
}
</style>

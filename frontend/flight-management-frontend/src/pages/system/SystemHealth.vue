<template>
  <div class="system-health-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1>
            <el-icon><Monitor /></el-icon>
            Sistem Durumu
          </h1>
          <p>Altyapı izleme ve sistem sağlığı kontrolü</p>
        </div>

        <div class="header-actions">
          <el-button-group>
            <el-button :icon="Refresh" @click="refreshStatus" :loading="refreshing">
              Yenile
            </el-button>
            <el-button :icon="Download" @click="exportLogs">
              Logları İndir
            </el-button>
            <el-button :icon="Setting" @click="openSettings">
              Ayarlar
            </el-button>
          </el-button-group>
        </div>
      </div>

      <!-- System Overview -->
      <div class="system-overview">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-card class="overview-card" :class="systemOverall.status">
              <div class="overview-content">
                <div class="overview-icon">
                  <el-icon size="32">
                    <component :is="systemOverall.icon" />
                  </el-icon>
                </div>
                <div class="overview-info">
                  <div class="overview-status">{{ systemOverall.text }}</div>
                  <div class="overview-label">Genel Durum</div>
                  <div class="overview-time">
                    Son güncelleme: {{ formatTime(lastUpdate) }}
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>

          <el-col :span="6">
            <el-card class="overview-card">
              <div class="overview-content">
                <div class="overview-icon uptime">
                  <el-icon size="32"><Clock /></el-icon>
                </div>
                <div class="overview-info">
                  <div class="overview-status">{{ uptime }}</div>
                  <div class="overview-label">Çalışma Süresi</div>
                  <div class="overview-time">99.9% kullanılabilirlik</div>
                </div>
              </div>
            </el-card>
          </el-col>

          <el-col :span="6">
            <el-card class="overview-card">
              <div class="overview-content">
                <div class="overview-icon performance">
                  <el-icon size="32"><TrendCharts /></el-icon>
                </div>
                <div class="overview-info">
                  <div class="overview-status">{{ performanceScore }}%</div>
                  <div class="overview-label">Performans Skoru</div>
                  <div class="overview-time">Ortalama yanıt: {{ averageResponse }}ms</div>
                </div>
              </div>
            </el-card>
          </el-col>

          <el-col :span="6">
            <el-card class="overview-card">
              <div class="overview-content">
                <div class="overview-icon alerts">
                  <el-icon size="32"><Bell /></el-icon>
                </div>
                <div class="overview-info">
                  <div class="overview-status">{{ activeAlerts }}</div>
                  <div class="overview-label">Aktif Uyarı</div>
                  <div class="overview-time">{{ criticalAlerts }} kritik</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- Services Status -->
    <div class="services-section">
      <el-card>
        <template #header>
          <div class="section-header">
            <span>Mikro Servisler</span>
            <div class="header-actions">
              <el-switch
                v-model="autoRefresh"
                active-text="Otomatik Yenileme"
                @change="toggleAutoRefresh"
              />
            </div>
          </div>
        </template>

        <div class="services-grid">
          <div
            v-for="service in services"
            :key="service.name"
            class="service-card"
            :class="service.status.toLowerCase()"
          >
            <div class="service-header">
              <div class="service-info">
                <div class="service-name">{{ service.displayName }}</div>
                <div class="service-url">{{ service.url }}</div>
              </div>
              <div class="service-status">
                <el-tag :type="getServiceTagType(service.status)" size="large">
                  <el-icon class="tag-icon">
                    <component :is="getServiceIcon(service.status)" />
                  </el-icon>
                  {{ getServiceStatusText(service.status) }}
                </el-tag>
              </div>
            </div>

            <div class="service-metrics">
              <div class="metric-item">
                <span class="metric-label">Yanıt Süresi</span>
                <span class="metric-value" :class="getResponseTimeClass(service.responseTime)">
                  {{ service.responseTime }}ms
                </span>
              </div>
              <div class="metric-item">
                <span class="metric-label">CPU</span>
                <span class="metric-value">{{ service.cpu }}%</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Bellek</span>
                <span class="metric-value">{{ service.memory }}%</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Çalışma Süresi</span>
                <span class="metric-value">{{ service.uptime }}</span>
              </div>
            </div>

            <div class="service-actions">
              <el-button-group size="small">
                <el-button @click="viewLogs(service)" :icon="Document">
                  Loglar
                </el-button>
                <el-button @click="viewMetrics(service)" :icon="TrendCharts">
                  Metrikler
                </el-button>
                <el-button
                  @click="restartService(service)"
                  :icon="RefreshRight"
                  type="warning"
                  v-if="service.status === 'DOWN'"
                >
                  Yeniden Başlat
                </el-button>
              </el-button-group>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Infrastructure Status -->
    <div class="infrastructure-section">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>Veritabanları</span>
            </template>
            <div class="infrastructure-list">
              <div
                v-for="db in databases"
                :key="db.name"
                class="infrastructure-item"
                :class="db.status.toLowerCase()"
              >
                <div class="item-header">
                  <div class="item-info">
                    <el-icon size="20"><Database /></el-icon>
                    <span class="item-name">{{ db.name }}</span>
                  </div>
                  <el-tag :type="getServiceTagType(db.status)" size="small">
                    {{ getServiceStatusText(db.status) }}
                  </el-tag>
                </div>
                <div class="item-metrics">
                  <div class="metric-small">
                    <span class="metric-label">Bağlantı</span>
                    <span class="metric-value">{{ db.connections }}</span>
                  </div>
                  <div class="metric-small">
                    <span class="metric-label">CPU</span>
                    <span class="metric-value">{{ db.cpu }}%</span>
                  </div>
                  <div class="metric-small">
                    <span class="metric-label">Disk</span>
                    <span class="metric-value">{{ db.disk }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card>
            <template #header>
              <span>Message Queue & Cache</span>
            </template>
            <div class="infrastructure-list">
              <div
                v-for="queue in messageQueues"
                :key="queue.name"
                class="infrastructure-item"
                :class="queue.status.toLowerCase()"
              >
                <div class="item-header">
                  <div class="item-info">
                    <el-icon size="20"><Connection /></el-icon>
                    <span class="item-name">{{ queue.name }}</span>
                  </div>
                  <el-tag :type="getServiceTagType(queue.status)" size="small">
                    {{ getServiceStatusText(queue.status) }}
                  </el-tag>
                </div>
                <div class="item-metrics">
                  <div class="metric-small">
                    <span class="metric-label">{{ queue.type === 'kafka' ? 'Mesajlar' : 'Anahtarlar' }}</span>
                    <span class="metric-value">{{ queue.messages || queue.keys }}</span>
                  </div>
                  <div class="metric-small">
                    <span class="metric-label">Bellek</span>
                    <span class="metric-value">{{ queue.memory }}%</span>
                  </div>
                  <div class="metric-small">
                    <span class="metric-label">Throughput</span>
                    <span class="metric-value">{{ queue.throughput }}/s</span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- System Alerts -->
    <div class="alerts-section" v-if="systemAlerts.length > 0">
      <el-card>
        <template #header>
          <div class="section-header">
            <span>Sistem Uyarıları</span>
            <el-button size="small" @click="clearAlerts">
              Tümünü Temizle
            </el-button>
          </div>
        </template>
        <div class="alerts-list">
          <el-alert
            v-for="alert in systemAlerts"
            :key="alert.id"
            :type="alert.type"
            :title="alert.title"
            :description="alert.description"
            :closable="true"
            @close="dismissAlert(alert.id)"
            show-icon
          >
            <template #default>
              <div class="alert-content">
                <div class="alert-info">
                  <div class="alert-time">{{ formatTime(alert.timestamp) }}</div>
                  <div class="alert-service">{{ alert.service }}</div>
                </div>
              </div>
            </template>
          </el-alert>
        </div>
      </el-card>
    </div>

    <!-- Performance Metrics Charts -->
    <div class="metrics-section">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>CPU & Bellek Kullanımı</span>
            </template>
            <div class="chart-container">
              <div ref="systemResourcesChart" class="chart-placeholder">
                <!-- Backend'den gelen gerçek verilerle grafik gösterilecek -->
                <div class="placeholder-text">
                  Sistem kaynak kullanım grafiği yüklenecek
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card>
            <template #header>
              <span>API Yanıt Süreleri</span>
            </template>
            <div class="chart-container">
              <div ref="responseTimeChart" class="chart-placeholder">
                <!-- Backend'den gelen gerçek verilerle grafik gösterilecek -->
                <div class="placeholder-text">
                  API yanıt süresi grafiği yüklenecek
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- Export Dialog -->
    <el-dialog v-model="exportDialogVisible" title="Log Dışa Aktarma" width="500px">
      <el-form ref="exportForm" :model="exportForm" label-width="120px">
        <el-form-item label="Tarih Aralığı">
          <el-date-picker
            v-model="exportForm.dateRange"
            type="datetimerange"
            range-separator="→"
            start-placeholder="Başlangıç"
            end-placeholder="Bitiş"
            format="DD.MM.YYYY HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="Servis">
          <el-select v-model="exportForm.service" placeholder="Servis seçin">
            <el-option label="Tüm Servisler" value="all" />
            <el-option
              v-for="service in services"
              :key="service.name"
              :label="service.displayName"
              :value="service.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Log Seviyesi">
          <el-select v-model="exportForm.logLevel" placeholder="Seviye seçin">
            <el-option label="Tümü" value="all" />
            <el-option label="ERROR" value="error" />
            <el-option label="WARN" value="warn" />
            <el-option label="INFO" value="info" />
            <el-option label="DEBUG" value="debug" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exportDialogVisible = false">İptal</el-button>
        <el-button type="primary" @click="confirmExport" :loading="exporting">
          Dışa Aktar
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Monitor,
  Refresh,
  Download,
  Setting,
  CircleCheck,
  CircleClose,
  Warning,
  Clock,
  TrendCharts,
  Bell,
  Document,
  RefreshRight,
  Database,
  Connection
} from '@element-plus/icons-vue'

// Reactive data
const refreshing = ref(false)
const autoRefresh = ref(true)
const lastUpdate = ref(new Date())
const exportDialogVisible = ref(false)
const exporting = ref(false)
const refreshInterval = ref<number | null>(null)

// System overview data
const uptime = ref('7 gün 14 saat')
const performanceScore = ref(94)
const averageResponse = ref(245)
const activeAlerts = ref(2)
const criticalAlerts = ref(0)

// System overall status
const systemOverall = computed(() => {
  const criticalIssues = services.filter(s => s.status === 'DOWN').length
  const warningIssues = services.filter(s => s.status === 'WARNING').length

  if (criticalIssues > 0) {
    return {
      status: 'danger',
      text: 'Kritik Sorun',
      icon: CircleClose
    }
  } else if (warningIssues > 0) {
    return {
      status: 'warning',
      text: 'Uyarı Var',
      icon: Warning
    }
  } else {
    return {
      status: 'success',
      text: 'Sistem Sağlıklı',
      icon: CircleCheck
    }
  }
})

// Services data (will be loaded from backend)
const services = reactive([
  {
    name: 'reference-manager',
    displayName: 'Reference Manager',
    url: 'http://reference-manager:8080',
    status: 'UP',
    responseTime: 120,
    cpu: 15,
    memory: 68,
    uptime: '7d 14h'
  },
  {
    name: 'flight-service',
    displayName: 'Flight Service',
    url: 'http://flight-service:8081',
    status: 'UP',
    responseTime: 95,
    cpu: 23,
    memory: 72,
    uptime: '7d 14h'
  },
  {
    name: 'archive-service',
    displayName: 'Archive Service',
    url: 'http://archive-service:8082',
    status: 'UP',
    responseTime: 150,
    cpu: 18,
    memory: 65,
    uptime: '7d 14h'
  }
])

// Database status (will be loaded from backend)
const databases = reactive([
  {
    name: 'reference-db',
    displayName: 'Reference Database (MySQL)',
    status: 'UP',
    connections: 12,
    cpu: 25,
    disk: 45
  },
  {
    name: 'flight-db',
    displayName: 'Flight Database (MySQL)',
    status: 'UP',
    connections: 18,
    cpu: 30,
    disk: 52
  },
  {
    name: 'archive-db',
    displayName: 'Archive Database (PostgreSQL)',
    status: 'UP',
    connections: 8,
    cpu: 15,
    disk: 38
  }
])

// Message queues and cache (will be loaded from backend)
const messageQueues = reactive([
  {
    name: 'kafka',
    displayName: 'Apache Kafka',
    type: 'kafka',
    status: 'UP',
    messages: '2.4K',
    memory: 42,
    throughput: 150
  },
  {
    name: 'redis',
    displayName: 'Redis Cache',
    type: 'redis',
    status: 'UP',
    keys: '15.2K',
    memory: 38,
    throughput: 320
  }
])

// System alerts (will be loaded from backend)
const systemAlerts = reactive([
  {
    id: 1,
    type: 'warning',
    title: 'Yüksek Bellek Kullanımı',
    description: 'Flight Service bellek kullanımı %72\'ye ulaştı',
    service: 'Flight Service',
    timestamp: new Date(Date.now() - 300000) // 5 minutes ago
  },
  {
    id: 2,
    type: 'info',
    title: 'Kafka Mesaj Kuyruğu',
    description: 'Bekleyen mesaj sayısı normalin üstünde',
    service: 'Apache Kafka',
    timestamp: new Date(Date.now() - 600000) // 10 minutes ago
  }
])

// Export form
const exportForm = reactive({
  dateRange: [
    new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
    new Date()
  ],
  service: 'all',
  logLevel: 'all'
})

// Methods
const formatTime = (date: Date): string => {
  return date.toLocaleString('tr-TR')
}

const getServiceTagType = (status: string): string => {
  switch (status.toUpperCase()) {
    case 'UP':
      return 'success'
    case 'WARNING':
      return 'warning'
    case 'DOWN':
      return 'danger'
    default:
      return 'info'
  }
}

const getServiceIcon = (status: string) => {
  switch (status.toUpperCase()) {
    case 'UP':
      return CircleCheck
    case 'WARNING':
      return Warning
    case 'DOWN':
      return CircleClose
    default:
      return CircleCheck
  }
}

const getServiceStatusText = (status: string): string => {
  switch (status.toUpperCase()) {
    case 'UP':
      return 'Çalışıyor'
    case 'WARNING':
      return 'Uyarı'
    case 'DOWN':
      return 'Durduruldu'
    default:
      return 'Bilinmiyor'
  }
}

const getResponseTimeClass = (responseTime: number): string => {
  if (responseTime < 100) return 'good'
  if (responseTime < 500) return 'warning'
  return 'danger'
}

const refreshStatus = async () => {
  refreshing.value = true
  try {
    // Load fresh data from backend health endpoints
    // await Promise.all([
    //   systemService.getServicesHealth(),
    //   systemService.getDatabasesHealth(),
    //   systemService.getInfrastructureHealth(),
    //   systemService.getSystemAlerts()
    // ])

    console.log('Refreshing system health data...')
    lastUpdate.value = new Date()
    ElMessage.success('Sistem durumu güncellendi')

  } catch (error) {
    console.error('Error refreshing system health:', error)
    ElMessage.error('Sistem durumu güncellenirken hata oluştu')
  } finally {
    refreshing.value = false
  }
}

const toggleAutoRefresh = (enabled: boolean) => {
  if (enabled) {
    refreshInterval.value = window.setInterval(refreshStatus, 30000) // 30 seconds
    ElMessage.success('Otomatik yenileme aktif')
  } else {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
      refreshInterval.value = null
    }
    ElMessage.info('Otomatik yenileme durduruldu')
  }
}

const exportLogs = () => {
  exportDialogVisible.value = true
}

const confirmExport = async () => {
  exporting.value = true
  try {
    // Call backend log export service
    // await systemService.exportLogs(exportForm)
    console.log('Exporting logs with params:', exportForm)

    // Simulate export delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    ElMessage.success('Loglar başarıyla dışa aktarıldı')
    exportDialogVisible.value = false

  } catch (error) {
    console.error('Error exporting logs:', error)
    ElMessage.error('Log dışa aktarımında hata oluştu')
  } finally {
    exporting.value = false
  }
}

const openSettings = () => {
  ElMessage.info('Sistem ayarları sayfasına yönlendirilecek')
  // router.push('/system/settings')
}

const viewLogs = (service: any) => {
  ElMessage.info(`${service.displayName} logları görüntülenecek`)
  // router.push(`/system/logs?service=${service.name}`)
}

const viewMetrics = (service: any) => {
  ElMessage.info(`${service.displayName} metrikleri görüntülenecek`)
  // Open metrics dashboard for specific service
}

const restartService = async (service: any) => {
  try {
    const confirmed = await ElMessageBox.confirm(
      `${service.displayName} servisini yeniden başlatmak istediğinizden emin misiniz?`,
      'Servis Yeniden Başlatma',
      {
        type: 'warning',
        confirmButtonText: 'Evet, Başlat',
        cancelButtonText: 'İptal'
      }
    )

    if (confirmed) {
      // Call backend service restart endpoint
      // await systemService.restartService(service.name)
      console.log(`Restarting service: ${service.name}`)
      ElMessage.success(`${service.displayName} yeniden başlatılıyor`)
    }

  } catch {
    // User cancelled
  }
}

const clearAlerts = async () => {
  try {
    const confirmed = await ElMessageBox.confirm(
      'Tüm sistem uyarılarını temizlemek istediğinizden emin misiniz?',
      'Uyarıları Temizle',
      {
        type: 'warning'
      }
    )

    if (confirmed) {
      systemAlerts.splice(0)
      ElMessage.success('Tüm uyarılar temizlendi')
    }
  } catch {
    // User cancelled
  }
}

const dismissAlert = (alertId: number) => {
  const index = systemAlerts.findIndex(alert => alert.id === alertId)
  if (index > -1) {
    systemAlerts.splice(index, 1)
    ElMessage.success('Uyarı kapatıldı')
  }
}

// Load initial data
const loadSystemHealth = async () => {
  try {
    // Load system health data from backend
    // const healthData = await systemService.getSystemHealth()
    // Update reactive data with real backend response
    console.log('Loading system health data...')

  } catch (error) {
    console.error('Error loading system health:', error)
    ElMessage.error('Sistem durumu yüklenirken hata oluştu')
  }
}

onMounted(() => {
  loadSystemHealth()
  if (autoRefresh.value) {
    toggleAutoRefresh(true)
  }
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})
</script>

<style scoped lang="scss">
.system-health-page {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 60px);
}

.page-header {
  background: white;
  padding: 24px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .title-section {
    h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    p {
      margin: 0;
      color: #666;
    }
  }
}

.system-overview {
  .overview-card {
    height: 120px;

    &.success {
      border-left: 4px solid #67C23A;
    }

    &.warning {
      border-left: 4px solid #E6A23C;
    }

    &.danger {
      border-left: 4px solid #F56C6C;
    }
  }

  .overview-content {
    display: flex;
    align-items: center;
    gap: 16px;
    height: 100%;
  }

  .overview-icon {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    &.uptime {
      background-color: rgba(64, 158, 255, 0.1);
      color: #409EFF;
    }

    &.performance {
      background-color: rgba(103, 194, 58, 0.1);
      color: #67C23A;
    }

    &.alerts {
      background-color: rgba(230, 162, 60, 0.1);
      color: #E6A23C;
    }
  }

  .overview-info {
    flex: 1;

    .overview-status {
      font-size: 24px;
      font-weight: bold;
      color: #303133;
      margin-bottom: 4px;
    }

    .overview-label {
      font-size: 14px;
      color: #606266;
      margin-bottom: 4px;
    }

    .overview-time {
      font-size: 12px;
      color: #909399;
    }
  }
}

.services-section,
.infrastructure-section,
.alerts-section,
.metrics-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.services-grid {
  display: grid;
  gap: 16px;
}

.service-card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;

  &.up {
    border-left: 4px solid #67C23A;
  }

  &.warning {
    border-left: 4px solid #E6A23C;
  }

  &.down {
    border-left: 4px solid #F56C6C;
  }
}

.service-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  .service-info {
    .service-name {
      font-size: 16px;
      font-weight: bold;
      color: #303133;
    }

    .service-url {
      font-size: 12px;
      color: #909399;
      font-family: monospace;
    }
  }
}

.service-metrics {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;

  .metric-item {
    display: flex;
    flex-direction: column;
    align-items: center;

    .metric-label {
      font-size: 12px;
      color: #909399;
      margin-bottom: 4px;
    }

    .metric-value {
      font-size: 14px;
      font-weight: bold;

      &.good {
        color: #67C23A;
      }

      &.warning {
        color: #E6A23C;
      }

      &.danger {
        color: #F56C6C;
      }
    }
  }
}

.service-actions {
  text-align: right;
}

.infrastructure-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.infrastructure-item {
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 12px;
  background: #fafafa;

  &.up {
    border-left: 3px solid #67C23A;
  }

  &.warning {
    border-left: 3px solid #E6A23C;
  }

  &.down {
    border-left: 3px solid #F56C6C;
  }
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  .item-info {
    display: flex;
    align-items: center;
    gap: 8px;

    .item-name {
      font-weight: 500;
    }
  }
}

.item-metrics {
  display: flex;
  gap: 16px;

  .metric-small {
    display: flex;
    flex-direction: column;

    .metric-label {
      font-size: 11px;
      color: #909399;
    }

    .metric-value {
      font-size: 13px;
      font-weight: bold;
      color: #303133;
    }
  }
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-content {
  display: flex;
  justify-content: space-between;

  .alert-info {
    .alert-time {
      font-size: 12px;
      color: #909399;
    }

    .alert-service {
      font-size: 12px;
      color: #606266;
      font-weight: 500;
    }
  }
}

.chart-container {
  height: 300px;

  .chart-placeholder {
    height: 100%;
    border: 1px dashed #ddd;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;

    .placeholder-text {
      color: #909399;
      font-size: 14px;
    }
  }
}

:deep(.el-card__body) {
  padding: 16px;
}

:deep(.el-alert) {
  margin-bottom: 8px;
}

:deep(.el-tag .tag-icon) {
  margin-right: 4px;
}
</style>

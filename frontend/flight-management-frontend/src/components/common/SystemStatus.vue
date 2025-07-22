<template>
  <div class="system-status">
    <div v-if="loading" class="status-loading">
      <el-skeleton animated>
        <template #template>
          <div v-for="i in 4" :key="i" style="margin-bottom: 16px;">
            <el-skeleton-item variant="text" style="width: 60%; margin-bottom: 8px;" />
            <el-skeleton-item variant="rect" style="width: 100%; height: 40px;" />
          </div>
        </template>
      </el-skeleton>
    </div>

    <div v-else class="status-content">
      <!-- Overall System Health -->
      <div class="overall-status">
        <div class="status-header">
          <el-icon :size="20" :color="overallStatusColor">
            <component :is="overallStatusIcon" />
          </el-icon>
          <span class="status-text" :style="{ color: overallStatusColor }">
            {{ overallStatusText }}
          </span>
          <el-tag :type="overallStatusType" size="small">
            {{ getStatusBadge(overallStatus) }}
          </el-tag>
        </div>
        <div class="last-update">
          Son Güncelleme: {{ formatLastUpdate(lastUpdate) }}
          <el-button
            size="small"
            type="primary"
            :icon="Refresh"
            circle
            @click="refreshStatus"
            :loading="refreshing"
            title="Yenile"
          />
        </div>
      </div>

      <el-divider />

      <!-- Service Status List -->
      <div class="services-status">
        <div
          v-for="service in systemServices"
          :key="service.name"
          class="service-item"
          :class="{ 'service-expanded': service.expanded }"
        >
          <div class="service-header" @click="toggleService(service)">
            <div class="service-info">
              <el-icon :size="16" :color="getStatusColor(service.status)">
                <component :is="getStatusIcon(service.status)" />
              </el-icon>
              <span class="service-name">{{ service.name }}</span>
              <el-tag :type="getStatusType(service.status)" size="small">
                {{ getStatusText(service.status) }}
              </el-tag>
            </div>

            <div class="service-actions">
              <span class="response-time" v-if="service.responseTime">
                {{ service.responseTime }}ms
              </span>
              <el-icon :size="14" class="expand-icon">
                <ArrowDown />
              </el-icon>
            </div>
          </div>

          <el-collapse-transition>
            <div v-show="service.expanded" class="service-details">
              <div class="details-grid">
                <div v-for="detail in service.details" :key="detail.label" class="detail-item">
                  <span class="detail-label">{{ detail.label }}:</span>
                  <span class="detail-value" :class="detail.type">{{ detail.value }}</span>
                </div>
              </div>

              <div v-if="service.metrics" class="service-metrics">
                <div class="metrics-title">Performans Metrikleri</div>
                <div class="metrics-grid">
                  <div v-for="metric in service.metrics" :key="metric.name" class="metric-item">
                    <div class="metric-name">{{ metric.name }}</div>
                    <div class="metric-value">{{ metric.value }}</div>
                    <div class="metric-progress">
                      <el-progress
                        :percentage="metric.percentage"
                        :color="getMetricColor(metric.percentage)"
                        :show-text="false"
                        :stroke-width="6"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="service.logs && service.logs.length > 0" class="service-logs">
                <div class="logs-title">Son Loglar</div>
                <div class="logs-list">
                  <div
                    v-for="log in service.logs.slice(0, 3)"
                    :key="log.id"
                    class="log-item"
                    :class="log.level.toLowerCase()"
                  >
                    <span class="log-time">{{ formatLogTime(log.timestamp) }}</span>
                    <span class="log-level">{{ log.level }}</span>
                    <span class="log-message">{{ log.message }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-collapse-transition>
        </div>
      </div>

      <!-- System Alerts -->
      <div v-if="systemAlerts.length > 0" class="system-alerts">
        <el-divider />
        <div class="alerts-title">
          <el-icon :size="16" color="#e6a23c">
            <Warning />
          </el-icon>
          Sistem Uyarıları
        </div>
        <div class="alerts-list">
          <el-alert
            v-for="alert in systemAlerts"
            :key="alert.id"
            :title="alert.title"
            :description="alert.description"
            :type="alert.type"
            :closable="alert.closable"
            show-icon
            @close="dismissAlert(alert.id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import apiService from '@/services/api'
import {
  Refresh,
  ArrowDown,
  CircleCheck,
  Warning,
  CircleClose,
  Clock,
  Monitor,
  Connection,
  Coin
} from '@element-plus/icons-vue'

const emit = defineEmits(['statusChange', 'alertTriggered'])

const loading = ref(true)
const refreshing = ref(false)
const lastUpdate = ref(new Date())
let refreshTimer = null

const props = defineProps({
  autoRefresh: {
    type: Boolean,
    default: true
  },
  refreshInterval: {
    type: Number,
    default: 30000 // 30 seconds
  }
})

const systemServices = reactive([
  {
    name: 'Flight Service',
    status: 'online',
    responseTime: 125,
    expanded: false,
    details: [
      { label: 'Endpoint', value: 'http://localhost:8081', type: 'url' },
      { label: 'Versiyon', value: 'v1.2.3', type: 'version' },
      { label: 'Uptime', value: '15d 4h 23m', type: 'uptime' },
      { label: 'Memory Usage', value: '2.1 GB / 4 GB', type: 'memory' }
    ],
    metrics: [
      { name: 'CPU Kullanımı', value: '45%', percentage: 45 },
      { name: 'Memory', value: '52%', percentage: 52 },
      { name: 'Disk I/O', value: '23%', percentage: 23 }
    ],
    logs: [
      { id: 1, level: 'INFO', message: 'Flight data successfully processed', timestamp: new Date() },
      { id: 2, level: 'WARN', message: 'High response time detected', timestamp: new Date(Date.now() - 300000) },
      { id: 3, level: 'INFO', message: 'Database connection established', timestamp: new Date(Date.now() - 600000) }
    ]
  },
  {
    name: 'Reference Manager',
    status: 'online',
    responseTime: 89,
    expanded: false,
    details: [
      { label: 'Endpoint', value: 'http://localhost:8082', type: 'url' },
      { label: 'Versiyon', value: 'v1.1.8', type: 'version' },
      { label: 'Uptime', value: '15d 4h 23m', type: 'uptime' },
      { label: 'Cache Hit Rate', value: '94.2%', type: 'cache' }
    ],
    metrics: [
      { name: 'CPU Kullanımı', value: '22%', percentage: 22 },
      { name: 'Memory', value: '38%', percentage: 38 },
      { name: 'Cache Efficiency', value: '94%', percentage: 94 }
    ],
    logs: [
      { id: 1, level: 'INFO', message: 'Reference data synchronized', timestamp: new Date() },
      { id: 2, level: 'INFO', message: 'Cache refreshed successfully', timestamp: new Date(Date.now() - 180000) }
    ]
  },
  {
    name: 'Archive Manager',
    status: 'warning',
    responseTime: 450,
    expanded: false,
    details: [
      { label: 'Endpoint', value: 'http://localhost:8083', type: 'url' },
      { label: 'Versiyon', value: 'v1.0.5', type: 'version' },
      { label: 'Uptime', value: '2d 15h 42m', type: 'uptime' },
      { label: 'Storage Usage', value: '856 GB / 1 TB', type: 'storage' }
    ],
    metrics: [
      { name: 'CPU Kullanımı', value: '78%', percentage: 78 },
      { name: 'Memory', value: '65%', percentage: 65 },
      { name: 'Disk Space', value: '86%', percentage: 86 }
    ],
    logs: [
      { id: 1, level: 'WARN', message: 'High disk usage detected', timestamp: new Date() },
      { id: 2, level: 'INFO', message: 'Archive cleanup completed', timestamp: new Date(Date.now() - 120000) },
      { id: 3, level: 'ERROR', message: 'Failed to archive old records', timestamp: new Date(Date.now() - 300000) }
    ]
  },
  {
    name: 'Database (PostgreSQL)',
    status: 'online',
    responseTime: 45,
    expanded: false,
    details: [
      { label: 'Host', value: 'localhost:5432', type: 'host' },
      { label: 'Versiyon', value: 'PostgreSQL 15.3', type: 'version' },
      { label: 'Uptime', value: '30d 12h 5m', type: 'uptime' },
      { label: 'Active Connections', value: '24 / 100', type: 'connections' }
    ],
    metrics: [
      { name: 'CPU Kullanımı', value: '35%', percentage: 35 },
      { name: 'Memory', value: '48%', percentage: 48 },
      { name: 'Connection Pool', value: '24%', percentage: 24 }
    ],
    logs: [
      { id: 1, level: 'INFO', message: 'Query executed successfully', timestamp: new Date() },
      { id: 2, level: 'INFO', message: 'Backup completed', timestamp: new Date(Date.now() - 3600000) }
    ]
  },
  {
    name: 'Redis Cache',
    status: 'online',
    responseTime: 12,
    expanded: false,
    details: [
      { label: 'Host', value: 'localhost:6379', type: 'host' },
      { label: 'Versiyon', value: 'Redis 7.0.11', type: 'version' },
      { label: 'Uptime', value: '30d 12h 5m', type: 'uptime' },
      { label: 'Memory Usage', value: '256 MB / 512 MB', type: 'memory' }
    ],
    metrics: [
      { name: 'Memory', value: '50%', percentage: 50 },
      { name: 'Hit Rate', value: '96%', percentage: 96 },
      { name: 'Operations/sec', value: '1.2K', percentage: 60 }
    ],
    logs: [
      { id: 1, level: 'INFO', message: 'Cache key expired and refreshed', timestamp: new Date() },
      { id: 2, level: 'INFO', message: 'Memory cleanup completed', timestamp: new Date(Date.now() - 900000) }
    ]
  },
  {
    name: 'Kafka Message Queue',
    status: 'error',
    responseTime: null,
    expanded: false,
    details: [
      { label: 'Bootstrap Servers', value: 'localhost:9092', type: 'host' },
      { label: 'Versiyon', value: 'Kafka 3.4.0', type: 'version' },
      { label: 'Uptime', value: 'Offline', type: 'uptime' },
      { label: 'Topics', value: '12', type: 'topics' }
    ],
    metrics: [
      { name: 'CPU Kullanımı', value: 'N/A', percentage: 0 },
      { name: 'Memory', value: 'N/A', percentage: 0 },
      { name: 'Message Rate', value: '0', percentage: 0 }
    ],
    logs: [
      { id: 1, level: 'ERROR', message: 'Connection refused to Kafka broker', timestamp: new Date() },
      { id: 2, level: 'ERROR', message: 'Failed to produce message', timestamp: new Date(Date.now() - 60000) },
      { id: 3, level: 'WARN', message: 'Retrying connection to broker', timestamp: new Date(Date.now() - 120000) }
    ]
  }
])

const systemAlerts = reactive([
  {
    id: 1,
    title: 'Yüksek Disk Kullanımı',
    description: 'Archive Manager servisi disk alanının %86\'sını kullanıyor. Temizlik gerekli.',
    type: 'warning',
    closable: true
  },
  {
    id: 2,
    title: 'Kafka Bağlantı Hatası',
    description: 'Kafka message queue servisine bağlanılamıyor. Mesaj işleme etkilenebilir.',
    type: 'error',
    closable: true
  }
])

// Computed properties
const overallStatus = computed(() => {
  const statuses = systemServices.map(s => s.status)
  if (statuses.includes('error')) return 'error'
  if (statuses.includes('warning')) return 'warning'
  return 'online'
})

const overallStatusColor = computed(() => getStatusColor(overallStatus.value))
const overallStatusIcon = computed(() => getStatusIcon(overallStatus.value))
const overallStatusText = computed(() => getStatusText(overallStatus.value))
const overallStatusType = computed(() => getStatusType(overallStatus.value))

// Methods
const getStatusColor = (status) => {
  const colors = {
    'online': '#67c23a',
    'warning': '#e6a23c',
    'error': '#f56c6c',
    'offline': '#909399'
  }
  return colors[status] || '#909399'
}

const getStatusIcon = (status) => {
  const icons = {
    'online': CircleCheck,
    'warning': Warning,
    'error': CircleClose,
    'offline': Clock
  }
  return icons[status] || Clock
}

const getStatusText = (status) => {
  const texts = {
    'online': 'Çevrimiçi',
    'warning': 'Uyarı',
    'error': 'Hata',
    'offline': 'Çevrimdışı'
  }
  return texts[status] || 'Bilinmiyor'
}

const getStatusType = (status) => {
  const types = {
    'online': 'success',
    'warning': 'warning',
    'error': 'danger',
    'offline': 'info'
  }
  return types[status] || 'info'
}

const getStatusBadge = (status) => {
  const badges = {
    'online': 'Sistem Sağlıklı',
    'warning': 'Dikkat Gerekli',
    'error': 'Kritik Durum',
    'offline': 'Servis Dışı'
  }
  return badges[status] || 'Durum Belirsiz'
}

const getMetricColor = (percentage) => {
  if (percentage < 50) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
}

const formatLastUpdate = (date) => {
  return date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatLogTime = (timestamp) => {
  return timestamp.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const toggleService = (service) => {
  service.expanded = !service.expanded
}

const refreshStatus = async () => {
  refreshing.value = true

  try {
// Gerçek backend health check
    const services = await apiService.checkSystemHealth()

// Update system services based on real backend status
    systemServices.forEach(service => {
      const backendService = services.find(s =>
        service.name.toLowerCase().includes(s.name.toLowerCase().replace(' service', ''))
      )

      if (backendService) {
        service.status = backendService.status
        service.responseTime = backendService.status === 'online'
          ? Math.floor(Math.random() * 200) + 50
          : null

// Update details based on status
        if (backendService.status === 'error') {
          service.details = service.details.map(detail => ({
            ...detail,
            value: detail.label === 'Uptime' ? 'Offline' : detail.value
          }))
        }
      }
    })

// Update last update time
    lastUpdate.value = new Date()

    emit('statusChange', { services: systemServices, alerts: systemAlerts })

  } catch (error) {
    console.error('Error refreshing status:', error)
// Update all services to error state
    systemServices.forEach(service => {
      service.status = 'error'
      service.responseTime = null
    })
  } finally {
    refreshing.value = false
  }
}

const dismissAlert = (alertId) => {
  const index = systemAlerts.findIndex(alert => alert.id === alertId)
  if (index > -1) {
    systemAlerts.splice(index, 1)
  }
}

const startAutoRefresh = () => {
  if (props.autoRefresh && !refreshTimer) {
    refreshTimer = setInterval(() => {
      refreshStatus()
    }, props.refreshInterval)
  }
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// Lifecycle hooks
onMounted(async () => {
  loading.value = false
  await refreshStatus()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})

// Expose methods
defineExpose({
  refreshStatus,
  getServiceStatus: (serviceName) => {
    return systemServices.find(s => s.name === serviceName)
  },
  addAlert: (alert) => {
    systemAlerts.push({
      id: Date.now(),
      ...alert,
      closable: true
    })
  }
})
</script>

<style scoped>
.system-status {
  width: 100%;
}

.status-loading {
  padding: 20px;
}

.status-content {
  padding: 16px;
}

.overall-status {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-text {
  font-size: 18px;
  font-weight: 600;
}

.last-update {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #909399;
}

.services-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.service-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
  transition: all 0.3s ease;
}

.service-item:hover {
  border-color: #c0c4cc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.service-expanded {
  border-color: #409eff;
}

.service-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  cursor: pointer;
  user-select: none;
}

.service-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.service-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.service-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.response-time {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
}

.expand-icon {
  color: #c0c4cc;
  transition: transform 0.3s ease;
}

.service-expanded .expand-icon {
  transform: rotate(180deg);
}

.service-details {
  border-top: 1px solid #f0f0f0;
  padding: 16px;
  background: #fafbfc;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}

.detail-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.detail-value {
  font-size: 13px;
  font-weight: 600;
}

.detail-value.url {
  color: #409eff;
}

.detail-value.version {
  color: #67c23a;
}

.detail-value.uptime {
  color: #e6a23c;
}

.detail-value.memory,
.detail-value.storage {
  color: #f56c6c;
}

.service-metrics {
  margin-bottom: 20px;
}

.metrics-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.metric-item {
  background: white;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}

.metric-name {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.metric-progress {
  margin-top: 4px;
}

.service-logs {
  margin-top: 16px;
}

.logs-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border-left: 3px solid #ddd;
  font-size: 13px;
}

.log-item.info {
  border-left-color: #409eff;
}

.log-item.warn {
  border-left-color: #e6a23c;
}

.log-item.error {
  border-left-color: #f56c6c;
}

.log-time {
  color: #909399;
  font-weight: 500;
  min-width: 40px;
}

.log-level {
  font-weight: 600;
  min-width: 50px;
  text-transform: uppercase;
}

.log-level {
  color: #409eff;
}

.log-item.warn .log-level {
  color: #e6a23c;
}

.log-item.error .log-level {
  color: #f56c6c;
}

.log-message {
  color: #606266;
  flex: 1;
}

.system-alerts {
  margin-top: 20px;
}

.alerts-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 768px) {
  .status-content {
    padding: 12px;
  }

  .service-header {
    padding: 12px;
  }

  .service-details {
    padding: 12px;
  }

  .details-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .log-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .log-time,
  .log-level {
    min-width: auto;
  }
}
</style>

<template>
  <div class="system-status">
    <div class="status-item" v-for="item in statusItems" :key="item.name">
      <div class="status-header">
        <div class="status-name">{{ item.name }}</div>
        <div class="status-indicator" :class="item.status">
          <div class="indicator-dot"></div>
          <span class="status-text">{{ getStatusText(item.status) }}</span>
        </div>
      </div>

      <div class="status-details" v-if="item.details">
        <div class="detail-item" v-for="detail in item.details" :key="detail.label">
          <span class="detail-label">{{ detail.label }}:</span>
          <span class="detail-value">{{ detail.value }}</span>
        </div>
      </div>
    </div>

    <div class="status-footer">
      <div class="last-check">
        Son kontrol: {{ formatRelativeTime(lastCheck) }}
      </div>
      <el-button size="small" :icon="Refresh" @click="checkStatus" :loading="checking">
        Kontrol Et
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { formatRelativeTime } from '@/utils/formatters'

const checking = ref(false)
const lastCheck = ref(new Date())
let statusInterval = null

const statusItems = reactive([
  {
    name: 'API Sunucusu',
    status: 'online',
    details: [
      { label: 'Yanıt Süresi', value: '125ms' },
      { label: 'Uptime', value: '99.9%' }
    ]
  },
  {
    name: 'Veritabanı',
    status: 'online',
    details: [
      { label: 'Bağlantı', value: 'MySQL 8.0' },
      { label: 'Performans', value: 'İyi' }
    ]
  },
  {
    name: 'Redis Cache',
    status: 'online',
    details: [
      { label: 'Memory', value: '45.2 MB' },
      { label: 'Hit Rate', value: '94.3%' }
    ]
  },
  {
    name: 'Kafka',
    status: 'warning',
    details: [
      { label: 'Messages/sec', value: '1.2K' },
      { label: 'Lag', value: '2.3s' }
    ]
  }
])

const getStatusText = (status) => {
  const statusMap = {
    online: 'Çevrimiçi',
    offline: 'Çevrimdışı',
    warning: 'Uyarı',
    error: 'Hata'
  }
  return statusMap[status] || 'Bilinmiyor'
}

const checkStatus = async () => {
  checking.value = true

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Update status (mock data)
    statusItems.forEach(item => {
      const statuses = ['online', 'warning']
      item.status = statuses[Math.floor(Math.random() * statuses.length)]

      // Update some random values
      if (item.name === 'API Sunucusu') {
        item.details[0].value = `${Math.floor(Math.random() * 200 + 50)}ms`
      } else if (item.name === 'Redis Cache') {
        item.details[1].value = `${(Math.random() * 10 + 90).toFixed(1)}%`
      }
    })

    lastCheck.value = new Date()
  } catch (error) {
    console.error('Status check failed:', error)
  } finally {
    checking.value = false
  }
}

onMounted(() => {
  // Check status every 30 seconds
  statusInterval = setInterval(checkStatus, 30000)
})

onUnmounted(() => {
  if (statusInterval) {
    clearInterval(statusInterval)
  }
})
</script>

<style scoped>
.system-status {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.status-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.status-item:last-child {
  border-bottom: none;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.status-name {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-indicator.online .indicator-dot {
  background-color: #67c23a;
}

.status-indicator.warning .indicator-dot {
  background-color: #e6a23c;
}

.status-indicator.error .indicator-dot {
  background-color: #f56c6c;
}

.status-indicator.offline .indicator-dot {
  background-color: #909399;
  animation: none;
}

.status-text {
  font-size: 12px;
  font-weight: 500;
}

.status-indicator.online .status-text {
  color: #67c23a;
}

.status-indicator.warning .status-text {
  color: #e6a23c;
}

.status-indicator.error .status-text {
  color: #f56c6c;
}

.status-indicator.offline .status-text {
  color: #909399;
}

.status-details {
  margin-left: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  color: #909399;
}

.detail-value {
  font-weight: 500;
}

.status-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.last-check {
  font-size: 12px;
  color: #909399;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>

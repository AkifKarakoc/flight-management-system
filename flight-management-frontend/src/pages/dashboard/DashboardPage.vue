<template>
  <div class="dashboard-container">
    <!-- Welcome Card -->
    <div class="welcome-card">
      <el-card shadow="never" class="welcome-content">
        <div class="welcome-info">
          <h1 class="welcome-title">
            Hoş geldiniz, {{ authStore.userName }}! 👋
          </h1>
          <p class="welcome-subtitle">
            Uçuş Yönetim Sistemi Dashboard'una hoş geldiniz.
            {{ formattedDate }} tarihindeki sistem durumu aşağıda görüntülenmektedir.
          </p>
        </div>
        <div class="welcome-actions">
          <el-button
            v-if="authStore.isAdmin"
            type="primary"
            size="large"
            @click="$router.push('/flights/create')"
          >
            <el-icon><Plus /></el-icon>
            Yeni Uçuş Oluştur
          </el-button>
          <el-button
            size="large"
            @click="$router.push('/flights')"
          >
            <el-icon><List /></el-icon>
            Uçuşları Görüntüle
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- KPI Cards -->
    <div class="kpi-section">
      <el-row :gutter="24">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="kpi-card">
            <div class="kpi-content">
              <div class="kpi-icon scheduled">
                <el-icon :size="24"><Clock /></el-icon>
              </div>
              <div class="kpi-info">
                <h3 class="kpi-value">{{ kpiData.scheduledFlights }}</h3>
                <p class="kpi-label">Planlanan Uçuş</p>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="kpi-card">
            <div class="kpi-content">
              <div class="kpi-icon active">
                <el-icon :size="24"><Ship /></el-icon>
              </div>
              <div class="kpi-info">
                <h3 class="kpi-value">{{ kpiData.activeFlights }}</h3>
                <p class="kpi-label">Aktif Uçuş</p>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="kpi-card">
            <div class="kpi-content">
              <div class="kpi-icon completed">
                <el-icon :size="24"><Check /></el-icon>
              </div>
              <div class="kpi-info">
                <h3 class="kpi-value">{{ kpiData.completedFlights }}</h3>
                <p class="kpi-label">Tamamlanan</p>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="kpi-card">
            <div class="kpi-content">
              <div class="kpi-icon delayed">
                <el-icon :size="24"><Warning /></el-icon>
              </div>
              <div class="kpi-info">
                <h3 class="kpi-value">{{ kpiData.delayedFlights }}</h3>
                <p class="kpi-label">Gecikmeli</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions-section">
      <el-card shadow="never">
        <template #header>
          <h3>Hızlı İşlemler</h3>
        </template>

        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <div class="action-item" @click="$router.push('/flights')">
              <el-icon :size="32" color="#409eff"><List /></el-icon>
              <h4>Uçuş Listesi</h4>
              <p>Tüm uçuşları görüntüle</p>
            </div>
          </el-col>

          <el-col v-if="authStore.isAdmin" :xs="24" :sm="12" :md="8" :lg="6">
            <div class="action-item" @click="$router.push('/flights/create')">
              <el-icon :size="32" color="#67c23a"><Plus /></el-icon>
              <h4>Yeni Uçuş</h4>
              <p>Uçuş oluştur</p>
            </div>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <div class="action-item" @click="$router.push('/airlines')">
              <el-icon :size="32" color="#e6a23c"><Ship /></el-icon>
              <h4>Havayolları</h4>
              <p>Havayolu yönetimi</p>
            </div>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <div class="action-item" @click="$router.push('/reports')">
              <el-icon :size="32" color="#f56c6c"><DocumentCopy /></el-icon>
              <h4>Raporlar</h4>
              <p>Detaylı raporlar</p>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- System Status -->
    <div class="system-status-section">
      <el-card shadow="never">
        <template #header>
          <div class="status-header">
            <h3>Sistem Durumu</h3>
            <el-tag :type="systemStatus.type" size="small">
              {{ systemStatus.text }}
            </el-tag>
          </div>
        </template>

        <el-row :gutter="24">
          <el-col :xs="24" :md="12">
            <div class="status-item">
              <div class="status-indicator">
                <el-icon :size="16" :color="serviceStatus.reference.color">
                  <CircleCheckFilled v-if="serviceStatus.reference.status === 'active'" />
                  <CircleCloseFilled v-else />
                </el-icon>
              </div>
              <div class="status-info">
                <h4>Reference Manager Service</h4>
                <p>Port: 8081 - {{ serviceStatus.reference.text }}</p>
              </div>
            </div>
          </el-col>

          <el-col :xs="24" :md="12">
            <div class="status-item">
              <div class="status-indicator">
                <el-icon :size="16" :color="serviceStatus.flight.color">
                  <CircleCheckFilled v-if="serviceStatus.flight.status === 'active'" />
                  <CircleCloseFilled v-else />
                </el-icon>
              </div>
              <div class="status-info">
                <h4>Flight Service</h4>
                <p>Port: 8082 - {{ serviceStatus.flight.text }}</p>
              </div>
            </div>
          </el-col>

          <el-col :xs="24" :md="12">
            <div class="status-item">
              <div class="status-indicator">
                <el-icon :size="16" :color="serviceStatus.archive.color">
                  <CircleCheckFilled v-if="serviceStatus.archive.status === 'active'" />
                  <CircleCloseFilled v-else />
                </el-icon>
              </div>
              <div class="status-info">
                <h4>Archive Service</h4>
                <p>Port: 8083 - {{ serviceStatus.archive.text }}</p>
              </div>
            </div>
          </el-col>

          <el-col :xs="24" :md="12">
            <div class="status-item">
              <div class="status-indicator">
                <el-icon :size="16" :color="serviceStatus.websocket.color">
                  <CircleCheckFilled v-if="serviceStatus.websocket.status === 'active'" />
                  <CircleCloseFilled v-else />
                </el-icon>
              </div>
              <div class="status-info">
                <h4>WebSocket Connection</h4>
                <p>Real-time - {{ serviceStatus.websocket.text }}</p>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import {
  Plus,
  List,
  Clock,
  Ship,
  Check,
  Warning,
  DocumentCopy,
  CircleCheckFilled,
  CircleCloseFilled
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useFlightStore } from '@/stores/flights'
import { useReferenceStore } from '@/stores/reference'

const authStore = useAuthStore()
const flightStore = useFlightStore()
const referenceStore = useReferenceStore()

// State
const serviceStatus = ref({
  reference: { status: 'inactive', text: 'Kontrol ediliyor...', color: '#909399' },
  flight: { status: 'inactive', text: 'Kontrol ediliyor...', color: '#909399' },
  archive: { status: 'inactive', text: 'Kontrol ediliyor...', color: '#909399' },
  websocket: { status: 'inactive', text: 'Kontrol ediliyor...', color: '#909399' }
})

// Computed
const formattedDate = computed(() => {
  return dayjs().format('DD MMMM YYYY')
})

const systemStatus = computed(() => {
  const activeServices = Object.values(serviceStatus.value).filter(s => s.status === 'active').length
  const totalServices = Object.keys(serviceStatus.value).length

  if (activeServices === totalServices) {
    return { type: 'success', text: 'Tüm Sistemler Aktif' }
  } else if (activeServices > 0) {
    return { type: 'warning', text: 'Kısmi Aktif' }
  } else {
    return { type: 'danger', text: 'Sistem Hatası' }
  }
})

const kpiData = computed(() => flightStore.kpiData)

// Methods
const loadDashboardData = async () => {
  try {
    // KPI verilerini yükle
    await flightStore.loadDashboardKPIs()

    // Reference data'yı cache'le (dropdown'lar için)
    await referenceStore.loadAllReferenceData()

  } catch (error) {
    console.error('Dashboard data load error:', error)
  }
}

const checkServiceStatus = async () => {
  // Reference Manager Service kontrolü
  try {
    await referenceStore.loadAirlines()
    serviceStatus.value.reference = {
      status: 'active',
      text: 'Çalışıyor',
      color: '#67c23a'
    }
  } catch (error) {
    serviceStatus.value.reference = {
      status: 'inactive',
      text: 'Bağlantı Hatası',
      color: '#f56c6c'
    }
  }

  // Flight Service kontrolü
  try {
    await flightStore.loadFlightStats()
    serviceStatus.value.flight = {
      status: 'active',
      text: 'Çalışıyor',
      color: '#67c23a'
    }
  } catch (error) {
    serviceStatus.value.flight = {
      status: 'inactive',
      text: 'Bağlantı Hatası',
      color: '#f56c6c'
    }
  }

  // Archive Service (placeholder)
  serviceStatus.value.archive = {
    status: 'active',
    text: 'Çalışıyor',
    color: '#67c23a'
  }

  // WebSocket (placeholder)
  serviceStatus.value.websocket = {
    status: 'inactive',
    text: 'Henüz Entegre Değil',
    color: '#e6a23c'
  }
}

// Lifecycle
onMounted(async () => {
  await loadDashboardData()
  await checkServiceStatus()
})
</script>

<style scoped>
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* Welcome Card */
.welcome-card {
  margin-bottom: 24px;
}

.welcome-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

:deep(.welcome-content .el-card__body) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32px;
}

.welcome-info h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
}

.welcome-info p {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
  line-height: 1.5;
}

.welcome-actions {
  display: flex;
  gap: 12px;
}

/* KPI Cards */
.kpi-section {
  margin-bottom: 24px;
}

.kpi-card {
  height: 120px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.kpi-card:hover {
  transform: translateY(-4px);
}

.kpi-content {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 100%;
}

.kpi-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-icon.scheduled {
  background-color: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.kpi-icon.active {
  background-color: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.kpi-icon.completed {
  background-color: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

.kpi-icon.delayed {
  background-color: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.kpi-info h3 {
  margin: 0 0 4px 0;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.kpi-info p {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

/* Quick Actions */
.quick-actions-section {
  margin-bottom: 24px;
}

.action-item {
  text-align: center;
  padding: 24px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.action-item:hover {
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  transform: translateY(-2px);
}

.action-item h4 {
  margin: 12px 0 8px 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.action-item p {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

/* System Status */
.system-status-section {
  margin-bottom: 24px;
}

.status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-header h3 {
  margin: 0;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f2f5;
}

.status-item:last-child {
  border-bottom: none;
}

.status-indicator {
  flex-shrink: 0;
}

.status-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.status-info p {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

/* Responsive */
@media (max-width: 768px) {
  :deep(.welcome-content .el-card__body) {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .welcome-actions {
    flex-direction: column;
    width: 100%;
  }

  .welcome-actions button {
    width: 100%;
  }

  .kpi-card {
    height: auto;
    margin-bottom: 16px;
  }

  .action-item {
    margin-bottom: 16px;
  }
}
</style>

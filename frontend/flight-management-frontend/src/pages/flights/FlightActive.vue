<template>
  <div class="flight-active-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1>
            <el-icon><VideoCameraFilled /></el-icon>
            Aktif Uçuşlar
          </h1>
          <p>Gerçek zamanlı uçuş takibi ve durum izleme</p>
        </div>

        <div class="header-actions">
          <el-button-group>
            <el-button :icon="Refresh" @click="refreshData" :loading="loading">
              Yenile
            </el-button>
            <el-button :icon="Download" @click="exportData">
              Dışa Aktar
            </el-button>
            <el-button :icon="Setting" @click="showSettings">
              Ayarlar
            </el-button>
          </el-button-group>
        </div>
      </div>

      <!-- Live Stats -->
      <div class="live-stats">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-card class="stat-card active">
              <div class="stat-content">
                <div class="stat-icon">
                  <el-icon size="24"><VideoCameraFilled /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ activeFlights.length }}</div>
                  <div class="stat-label">Aktif Uçuş</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card on-time">
              <div class="stat-content">
                <div class="stat-icon">
                  <el-icon size="24"><SuccessFilled /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ onTimeFlights }}</div>
                  <div class="stat-label">Zamanında</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card delayed">
              <div class="stat-content">
                <div class="stat-icon">
                  <el-icon size="24"><WarningFilled /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ delayedFlights }}</div>
                  <div class="stat-label">Geciken</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card emergency">
              <div class="stat-content">
                <div class="stat-icon">
                  <el-icon size="24"><CircleCloseFilled /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ emergencyFlights }}</div>
                  <div class="stat-label">Acil Durum</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <el-card>
        <el-row :gutter="16">
          <el-col :span="6">
            <el-select v-model="filters.airline" placeholder="Havayolu" clearable>
              <el-option label="Tüm Havayolları" value="" />
              <el-option label="Turkish Airlines" value="TK" />
              <el-option label="Pegasus" value="PC" />
              <el-option label="SunExpress" value="XQ" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select v-model="filters.status" placeholder="Durum" clearable>
              <el-option label="Tüm Durumlar" value="" />
              <el-option label="Kalkış Bekliyor" value="BOARDING" />
              <el-option label="Havada" value="IN_FLIGHT" />
              <el-option label="İniş Bekliyor" value="LANDING" />
              <el-option label="Geciken" value="DELAYED" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select v-model="filters.airport" placeholder="Havaalanı" clearable>
              <el-option label="Tüm Havaalanları" value="" />
              <el-option label="İstanbul (IST)" value="IST" />
              <el-option label="Ankara (ESB)" value="ESB" />
              <el-option label="İzmir (ADB)" value="ADB" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-input
              v-model="filters.search"
              placeholder="Uçuş numarası ara..."
              :prefix-icon="Search"
              clearable
            />
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- Active Flights Table -->
    <div class="flights-table">
      <el-card>
        <template #header>
          <div class="table-header">
            <span>Aktif Uçuşlar</span>
            <div class="table-actions">
              <el-switch
                v-model="autoRefresh"
                active-text="Otomatik Yenileme"
                @change="toggleAutoRefresh"
              />
              <el-tag :type="autoRefresh ? 'success' : 'info'" size="small">
                {{ autoRefresh ? 'Açık' : 'Kapalı' }}
              </el-tag>
            </div>
          </div>
        </template>

        <el-table
          :data="filteredFlights"
          :loading="loading"
          height="600"
          stripe
          @row-click="showFlightDetails"
        >
          <el-table-column type="index" width="50" />

          <el-table-column prop="flightNumber" label="Uçuş" width="120">
            <template #default="{ row }">
              <div class="flight-number">
                <strong>{{ row.flightNumber }}</strong>
                <el-tag v-if="row.priority === 'HIGH'" type="danger" size="small" class="priority-tag">
                  ÖNCELİKLİ
                </el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="airline" label="Havayolu" width="100">
            <template #default="{ row }">
              <el-tag :color="getAirlineColor(row.airline)" size="small">
                {{ row.airline }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="route" label="Rota" width="200">
            <template #default="{ row }">
              <div class="route-info">
                <span class="origin">{{ row.origin }}</span>
                <el-icon class="route-arrow"><Right /></el-icon>
                <span class="destination">{{ row.destination }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="status" label="Durum" width="140">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" :class="`status-${row.status}`">
                <el-icon><component :is="getStatusIcon(row.status)" /></el-icon>
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="departureTime" label="Kalkış" width="120">
            <template #default="{ row }">
              <div class="time-info">
                <div class="scheduled">{{ formatTime(row.scheduledDeparture) }}</div>
                <div v-if="row.actualDeparture" class="actual">
                  {{ formatTime(row.actualDeparture) }}
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="arrivalTime" label="İniş" width="120">
            <template #default="{ row }">
              <div class="time-info">
                <div class="scheduled">{{ formatTime(row.scheduledArrival) }}</div>
                <div v-if="row.estimatedArrival" class="estimated">
                  {{ formatTime(row.estimatedArrival) }}
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="delay" label="Gecikme" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.delay > 0" :type="getDelayType(row.delay)" size="small">
                +{{ row.delay }}dk
              </el-tag>
              <el-tag v-else type="success" size="small">
                Zamanında
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="gate" label="Kapı" width="80">
            <template #default="{ row }">
              <el-tag v-if="row.gate" size="small" class="gate-tag">
                {{ row.gate }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="progress" label="İlerleme" width="120">
            <template #default="{ row }">
              <el-progress
                :percentage="row.progress"
                :color="getProgressColor(row.progress)"
                :stroke-width="6"
              />
            </template>
          </el-table-column>

          <el-table-column label="İşlemler" width="120" fixed="right">
            <template #default="{ row }">
              <el-button-group size="small">
                <el-tooltip content="Detaylar">
                  <el-button :icon="View" @click.stop="showFlightDetails(row)" />
                </el-tooltip>
                <el-tooltip content="Harita">
                  <el-button :icon="Location" @click.stop="showOnMap(row)" />
                </el-tooltip>
                <el-tooltip content="İletişim" v-if="row.status === 'IN_FLIGHT'">
                  <el-button :icon="Message" @click.stop="contactFlight(row)" />
                </el-tooltip>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- Flight Details Dialog -->
    <el-dialog
      v-model="detailsVisible"
      :title="`${selectedFlight?.flightNumber} - Uçuş Detayları`"
      width="800px"
    >
      <div v-if="selectedFlight" class="flight-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Uçuş Numarası">
            {{ selectedFlight.flightNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="Havayolu">
            {{ selectedFlight.airline }}
          </el-descriptions-item>
          <el-descriptions-item label="Uçak Tipi">
            {{ selectedFlight.aircraftType }}
          </el-descriptions-item>
          <el-descriptions-item label="Durum">
            <el-tag :type="getStatusType(selectedFlight.status)">
              {{ getStatusText(selectedFlight.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Kalkış">
            {{ selectedFlight.origin }} - {{ formatTime(selectedFlight.scheduledDeparture) }}
          </el-descriptions-item>
          <el-descriptions-item label="İniş">
            {{ selectedFlight.destination }} - {{ formatTime(selectedFlight.scheduledArrival) }}
          </el-descriptions-item>
          <el-descriptions-item label="Kapı">
            {{ selectedFlight.gate || 'Atanmadı' }}
          </el-descriptions-item>
          <el-descriptions-item label="Yolcu Sayısı">
            {{ selectedFlight.passengerCount }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

// Import icons
import {
  VideoCameraFilled, Refresh, Download, Setting, SuccessFilled,
  WarningFilled, CircleCloseFilled, Search, Right, View,
  Location, Message
} from '@element-plus/icons-vue'

// Types
interface ActiveFlight {
  id: string
  flightNumber: string
  airline: string
  origin: string
  destination: string
  status: 'BOARDING' | 'IN_FLIGHT' | 'LANDING' | 'DELAYED' | 'EMERGENCY'
  scheduledDeparture: Date
  scheduledArrival: Date
  actualDeparture?: Date
  estimatedArrival?: Date
  delay: number
  gate?: string
  aircraftType: string
  passengerCount: number
  progress: number
  priority: 'LOW' | 'NORMAL' | 'HIGH'
}

// State
const loading = ref(false)
const autoRefresh = ref(true)
const detailsVisible = ref(false)
const selectedFlight = ref<ActiveFlight | null>(null)
const refreshInterval = ref<NodeJS.Timeout | null>(null)

const filters = ref({
  airline: '',
  status: '',
  airport: '',
  search: ''
})

// Mock data
const activeFlights = ref<ActiveFlight[]>([
  {
    id: '1',
    flightNumber: 'TK101',
    airline: 'TK',
    origin: 'IST',
    destination: 'ESB',
    status: 'IN_FLIGHT',
    scheduledDeparture: new Date('2025-01-23T10:30:00'),
    scheduledArrival: new Date('2025-01-23T11:45:00'),
    actualDeparture: new Date('2025-01-23T10:35:00'),
    estimatedArrival: new Date('2025-01-23T11:50:00'),
    delay: 5,
    gate: 'A12',
    aircraftType: 'Boeing 737',
    passengerCount: 150,
    progress: 65,
    priority: 'NORMAL'
  },
  {
    id: '2',
    flightNumber: 'PC102',
    airline: 'PC',
    origin: 'ADB',
    destination: 'IST',
    status: 'DELAYED',
    scheduledDeparture: new Date('2025-01-23T12:00:00'),
    scheduledArrival: new Date('2025-01-23T13:30:00'),
    delay: 25,
    gate: 'B05',
    aircraftType: 'Airbus A320',
    passengerCount: 180,
    progress: 0,
    priority: 'HIGH'
  },
  {
    id: '3',
    flightNumber: 'XQ205',
    airline: 'XQ',
    origin: 'IST',
    destination: 'ADB',
    status: 'BOARDING',
    scheduledDeparture: new Date('2025-01-23T14:15:00'),
    scheduledArrival: new Date('2025-01-23T15:45:00'),
    delay: 0,
    gate: 'C08',
    aircraftType: 'Boeing 737',
    passengerCount: 120,
    progress: 0,
    priority: 'NORMAL'
  }
])

// Computed
const filteredFlights = computed(() => {
  return activeFlights.value.filter(flight => {
    const matchesAirline = !filters.value.airline || flight.airline === filters.value.airline
    const matchesStatus = !filters.value.status || flight.status === filters.value.status
    const matchesAirport = !filters.value.airport ||
      flight.origin === filters.value.airport ||
      flight.destination === filters.value.airport
    const matchesSearch = !filters.value.search ||
      flight.flightNumber.toLowerCase().includes(filters.value.search.toLowerCase())

    return matchesAirline && matchesStatus && matchesAirport && matchesSearch
  })
})

const onTimeFlights = computed(() => {
  return activeFlights.value.filter(f => f.delay === 0).length
})

const delayedFlights = computed(() => {
  return activeFlights.value.filter(f => f.delay > 0 && f.status !== 'EMERGENCY').length
})

const emergencyFlights = computed(() => {
  return activeFlights.value.filter(f => f.status === 'EMERGENCY').length
})

// Methods
function formatTime(date: Date) {
  return dayjs(date).format('HH:mm')
}

function getStatusType(status: string) {
  const types = {
    'BOARDING': 'info',
    'IN_FLIGHT': 'success',
    'LANDING': 'warning',
    'DELAYED': 'warning',
    'EMERGENCY': 'danger'
  }
  return types[status] || 'info'
}

function getStatusIcon(status: string) {
  const icons = {
    'BOARDING': 'Clock',
    'IN_FLIGHT': 'VideoCameraFilled',
    'LANDING': 'Bottom',
    'DELAYED': 'WarningFilled',
    'EMERGENCY': 'CircleCloseFilled'
  }
  return icons[status] || 'Clock'
}

function getStatusText(status: string) {
  const texts = {
    'BOARDING': 'Kalkış Bekliyor',
    'IN_FLIGHT': 'Havada',
    'LANDING': 'İniş Bekliyor',
    'DELAYED': 'Geciken',
    'EMERGENCY': 'Acil Durum'
  }
  return texts[status] || status
}

function getDelayType(delay: number) {
  if (delay <= 15) return 'warning'
  if (delay <= 30) return 'danger'
  return 'danger'
}

function getProgressColor(progress: number) {
  if (progress < 30) return '#409EFF'
  if (progress < 70) return '#E6A23C'
  return '#67C23A'
}

function getAirlineColor(airline: string) {
  const colors = {
    'TK': '#C41E3A',
    'PC': '#FFD100',
    'XQ': '#F57C00'
  }
  return colors[airline] || '#409EFF'
}

function showFlightDetails(flight: ActiveFlight) {
  selectedFlight.value = flight
  detailsVisible.value = true
}

function showOnMap(flight: ActiveFlight) {
  ElMessage.info(`${flight.flightNumber} haritada gösteriliyor...`)
}

function contactFlight(flight: ActiveFlight) {
  ElMessage.info(`${flight.flightNumber} ile iletişim kuruluyor...`)
}

async function refreshData() {
  loading.value = true
  try {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Update progress for in-flight flights
    activeFlights.value.forEach(flight => {
      if (flight.status === 'IN_FLIGHT') {
        flight.progress = Math.min(100, flight.progress + Math.random() * 10)
      }
    })

    ElMessage.success('Veriler güncellendi')
  } catch (error) {
    ElMessage.error('Veri güncelleme hatası')
  } finally {
    loading.value = false
  }
}

function toggleAutoRefresh(enabled: boolean) {
  if (enabled) {
    refreshInterval.value = setInterval(refreshData, 30000) // 30 seconds
    ElMessage.success('Otomatik yenileme açıldı')
  } else {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
      refreshInterval.value = null
    }
    ElMessage.info('Otomatik yenileme kapatıldı')
  }
}

function exportData() {
  ElMessage.info('Veriler dışa aktarılıyor...')
}

function showSettings() {
  ElMessage.info('Ayarlar sayfası henüz hazır değil')
}

// Lifecycle
onMounted(() => {
  refreshData()
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
.flight-active-page {
  .page-header {
    margin-bottom: 1.5rem;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;

      .title-section {
        h1 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 0 0.5rem 0;
          color: #303133;
          font-size: 1.8rem;
        }

        p {
          margin: 0;
          color: #606266;
          font-size: 1rem;
        }
      }
    }

    .live-stats {
      .stat-card {
        border: none;

        &.active {
          border-left: 4px solid #67C23A;
        }

        &.on-time {
          border-left: 4px solid #409EFF;
        }

        &.delayed {
          border-left: 4px solid #E6A23C;
        }

        &.emergency {
          border-left: 4px solid #F56C6C;
        }

        .stat-content {
          display: flex;
          align-items: center;
          gap: 1rem;

          .stat-icon {
            padding: 0.75rem;
            border-radius: 8px;
            background-color: #f5f7fa;
          }

          .stat-info {
            .stat-value {
              font-size: 1.5rem;
              font-weight: bold;
              color: #303133;
              margin-bottom: 0.25rem;
            }

            .stat-label {
              font-size: 0.9rem;
              color: #606266;
            }
          }
        }
      }
    }
  }

  .filters-section {
    margin-bottom: 1.5rem;
  }

  .flights-table {
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .table-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
    }

    .flight-number {
      .priority-tag {
        margin-left: 0.5rem;
      }
    }

    .route-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .route-arrow {
        color: #909399;
      }
    }

    .time-info {
      .scheduled {
        font-weight: 500;
        color: #303133;
      }

      .actual, .estimated {
        font-size: 0.8rem;
        color: #67C23A;
      }
    }

    .gate-tag {
      background-color: #409EFF;
      color: white;
      border: none;
    }

    :deep(.status-IN_FLIGHT) {
      animation: pulse 2s infinite;
    }

    :deep(.status-EMERGENCY) {
      animation: blink 1s infinite;
    }
  }

  .flight-details {
    .el-descriptions {
      margin-top: 1rem;
    }
  }
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

@keyframes blink {
  0% { opacity: 1; }
  50% { opacity: 0.3; }
  100% { opacity: 1; }
}

@media (max-width: 768px) {
  .flight-active-page {
    .page-header .header-content {
      flex-direction: column;
      gap: 1rem;
    }

    .live-stats {
      :deep(.el-col) {
        margin-bottom: 1rem;
      }
    }
  }
}
</style>

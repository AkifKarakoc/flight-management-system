<template>
  <div class="recent-flights-table">
    <el-table
      :data="flights"
      v-loading="loading"
      :empty-text="emptyText"
      stripe
      :header-cell-style="{ backgroundColor: '#f5f7fa', color: '#606266' }"
    >
      <el-table-column prop="flightNumber" label="Uçuş No" width="120">
        <template #default="{ row }">
          <el-link type="primary" @click="viewFlightDetails(row)">
            {{ row.flightNumber }}
          </el-link>
        </template>
      </el-table-column>

      <el-table-column prop="airline" label="Havayolu" width="150">
        <template #default="{ row }">
          <div class="airline-cell">
            <span class="airline-name">{{ row.airline?.name || 'N/A' }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Güzergah" width="200">
        <template #default="{ row }">
          <div class="route-cell">
            <span class="airport-code">{{ row.origin?.icaoCode || 'N/A' }}</span>
            <el-icon class="route-arrow"><Right /></el-icon>
            <span class="airport-code">{{ row.destination?.icaoCode || 'N/A' }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="status" label="Durum" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="Kalkış" width="120">
        <template #default="{ row }">
          <div class="time-cell">
            <div class="scheduled-time">
              {{ formatTime(row.scheduledDeparture) }}
            </div>
            <div v-if="row.actualDeparture" class="actual-time">
              {{ formatTime(row.actualDeparture) }}
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Varış" width="120">
        <template #default="{ row }">
          <div class="time-cell">
            <div class="scheduled-time">
              {{ formatTime(row.scheduledArrival) }}
            </div>
            <div v-if="row.actualArrival" class="actual-time">
              {{ formatTime(row.actualArrival) }}
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Yolcu" width="80" align="center">
        <template #default="{ row }">
          <span class="passenger-count">{{ row.passengerCount || '-' }}</span>
        </template>
      </el-table-column>

      <el-table-column label="İşlemler" width="100" fixed="right">
        <template #default="{ row }">
          <el-dropdown @command="(command) => handleAction(command, row)" trigger="click">
            <el-button text :icon="More" size="small" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="view">
                  <el-icon><View /></el-icon>
                  Detay
                </el-dropdown-item>
                <el-dropdown-item command="edit">
                  <el-icon><Edit /></el-icon>
                  Düzenle
                </el-dropdown-item>
                <el-dropdown-item command="history" divided>
                  <el-icon><Clock /></el-icon>
                  Geçmiş
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination for larger datasets -->
    <div v-if="showPagination" class="table-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[5, 10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Right, More, View, Edit, Clock } from '@element-plus/icons-vue'
import apiService from '@/services/api.js'
import websocketService from '@/services/websocketService.js'

const props = defineProps({
  limit: {
    type: Number,
    default: 5
  },
  realtime: {
    type: Boolean,
    default: false
  },
  showPagination: {
    type: Boolean,
    default: false
  },
  autoRefresh: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['flightUpdate', 'flightSelect'])

const loading = ref(true)
const flights = ref([])
const currentPage = ref(1)
const pageSize = ref(props.limit)
const total = ref(0)
let refreshTimer = null
let wsConnection = null

const emptyText = ref('Henüz uçuş verisi bulunmuyor')

// Status mappings
const statusTypes = {
  'SCHEDULED': 'info',
  'BOARDING': 'warning',
  'DEPARTED': 'success',
  'IN_FLIGHT': 'primary',
  'ARRIVED': 'success',
  'CANCELLED': 'danger',
  'DELAYED': 'warning'
}

const statusTexts = {
  'SCHEDULED': 'Planlandı',
  'BOARDING': 'Boarding',
  'DEPARTED': 'Kalktı',
  'IN_FLIGHT': 'Uçuşta',
  'ARRIVED': 'Vardı',
  'CANCELLED': 'İptal',
  'DELAYED': 'Gecikmeli'
}

// Methods
const getStatusType = (status) => {
  return statusTypes[status] || ''
}

const getStatusText = (status) => {
  return statusTexts[status] || status
}

const formatTime = (datetime) => {
  if (!datetime) return '-'
  return new Date(datetime).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchFlights = async () => {
  loading.value = true
  try {
    const params = {
      page: props.showPagination ? currentPage.value - 1 : 0,
      size: pageSize.value,
      sort: 'scheduledDeparture,desc'
    }

    const response = await apiService.getRecentFlights(pageSize.value)

    if (Array.isArray(response)) {
      // Simple array response
      flights.value = response
      total.value = response.length
    } else {
      // Paginated response
      flights.value = response.content || []
      total.value = response.totalElements || 0
    }

  } catch (error) {
    console.error('Error fetching flights:', error)
    ElMessage.error('Uçuş verileri yüklenirken hata oluştu')
    emptyText.value = 'Veri yüklenirken hata oluştu'
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  fetchFlights()
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
  fetchFlights()
}

const viewFlightDetails = (flight) => {
  emit('flightSelect', flight)
  // Navigate to flight details page
  // this.$router.push(`/flights/${flight.id}`)
}

const handleAction = (command, flight) => {
  switch (command) {
    case 'view':
      viewFlightDetails(flight)
      break
    case 'edit':
      // Navigate to edit page
      // this.$router.push(`/flights/${flight.id}/edit`)
      ElMessage.info(`${flight.flightNumber} düzenleme sayfası açılacak`)
      break
    case 'history':
      // Show flight history
      ElMessage.info(`${flight.flightNumber} geçmişi gösterilecek`)
      break
  }
}

const startAutoRefresh = () => {
  if (props.autoRefresh && !refreshTimer) {
    refreshTimer = setInterval(() => {
      fetchFlights()
    }, 30000) // 30 seconds
  }
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

const connectWebSocket = async () => {
  if (props.realtime) {
    try {
      wsConnection = await websocketService.subscribeToFlightUpdates(handleFlightUpdate)
    } catch (error) {
      console.error('WebSocket connection failed:', error)
    }
  }
}

const disconnectWebSocket = () => {
  if (wsConnection) {
    websocketService.disconnect('flights')
    wsConnection = null
  }
}

const handleFlightUpdate = (updateData) => {
  // Find and update the flight in the list
  const index = flights.value.findIndex(f => f.id === updateData.flightId)
  if (index > -1) {
    // Update specific fields
    Object.assign(flights.value[index], updateData)
    emit('flightUpdate', updateData)
  } else {
    // New flight, refresh the list
    fetchFlights()
  }
}

// Watchers
watch(() => props.realtime, (newVal) => {
  if (newVal) {
    connectWebSocket()
    startAutoRefresh()
  } else {
    disconnectWebSocket()
    stopAutoRefresh()
  }
})

watch(() => props.limit, (newLimit) => {
  pageSize.value = newLimit
  fetchFlights()
})

// Lifecycle hooks
onMounted(async () => {
  await fetchFlights()

  if (props.realtime) {
    await connectWebSocket()
  }

  if (props.autoRefresh) {
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
  disconnectWebSocket()
})

// Expose methods for parent component
defineExpose({
  refresh: fetchFlights,
  updateFlight: (flightId, updates) => {
    const index = flights.value.findIndex(f => f.id === flightId)
    if (index > -1) {
      Object.assign(flights.value[index], updates)
    }
  }
})
</script>

<style scoped>
.recent-flights-table {
  width: 100%;
}

.airline-cell {
  display: flex;
  align-items: center;
}

.airline-name {
  font-size: 13px;
  color: #303133;
}

.route-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.airport-code {
  font-size: 13px;
  font-weight: 600;
  color: #409eff;
}

.route-arrow {
  color: #909399;
  font-size: 12px;
}

.time-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.scheduled-time {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
}

.actual-time {
  font-size: 11px;
  color: #67c23a;
  font-weight: 600;
}

.passenger-count {
  font-size: 13px;
  color: #606266;
}

.table-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

:deep(.el-table__empty-text) {
  color: #909399;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}

:deep(.el-table th) {
  padding: 8px 0;
}

:deep(.el-table td) {
  padding: 8px 0;
}

@media (max-width: 768px) {
  .route-cell {
    flex-direction: column;
    gap: 2px;
    align-items: flex-start;
  }

  .route-arrow {
    display: none;
  }

  .time-cell {
    gap: 1px;
  }

  .scheduled-time,
  .actual-time {
    font-size: 12px;
  }
}
</style>

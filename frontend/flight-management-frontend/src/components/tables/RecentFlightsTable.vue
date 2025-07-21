<template>
  <div class="recent-flights-table">
    <el-table
      :data="flights"
      v-loading="loading"
      stripe
      size="small"
      style="width: 100%"
      :show-header="showHeader"
      @row-click="handleRowClick"
      class="flights-table"
    >
      <el-table-column prop="flightNumber" label="Uçuş No" width="100">
        <template #default="scope">
          <div class="flight-number">
            <el-tag size="small" type="primary">{{ scope.row.flightNumber }}</el-tag>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="airline" label="Havayolu" width="120">
        <template #default="scope">
          <div class="airline-info">
            <div class="airline-code">{{ scope.row.airline.code }}</div>
            <div class="airline-name">{{ scope.row.airline.name }}</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="route" label="Rota" min-width="150">
        <template #default="scope">
          <div class="route-info">
            <span class="airport-code">{{ scope.row.origin.code }}</span>
            <el-icon class="route-arrow">
              <Right />
            </el-icon>
            <span class="airport-code">{{ scope.row.destination.code }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="status" label="Durum" width="100">
        <template #default="scope">
          <el-tag
            :type="getStatusType(scope.row.status)"
            size="small"
            effect="light"
          >
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="departureTime" label="Kalkış" width="100">
        <template #default="scope">
          <div class="time-info">
            {{ formatTime(scope.row.departureTime) }}
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="type" label="Tür" width="80">
        <template #default="scope">
          <el-tag
            :type="getFlightTypeStyle(scope.row.type)"
            size="small"
            effect="plain"
          >
            {{ scope.row.type }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="İşlemler" width="80" fixed="right">
        <template #default="scope">
          <el-button
            type="primary"
            size="small"
            text
            @click.stop="viewDetails(scope.row)"
          >
            <el-icon><View /></el-icon>
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="!loading && flights.length === 0" class="empty-state">
      <el-empty description="Henüz uçuş kaydı bulunmuyor" :image-size="80" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Right, View } from '@element-plus/icons-vue'
import { formatTime } from '@/utils/formatters'

const props = defineProps({
  limit: {
    type: Number,
    default: 10
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  autoRefresh: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()
const loading = ref(true)
const flights = ref([])

// Mock data generation
const generateMockFlights = (count) => {
  const airlines = [
    { code: 'TK', name: 'Turkish Airlines' },
    { code: 'PC', name: 'Pegasus' },
    { code: 'XQ', name: 'SunExpress' },
    { code: 'VF', name: 'FlyBosnia' }
  ]

  const airports = [
    { code: 'IST', name: 'İstanbul Havalimanı', city: 'İstanbul' },
    { code: 'SAW', name: 'Sabiha Gökçen', city: 'İstanbul' },
    { code: 'ESB', name: 'Esenboğa', city: 'Ankara' },
    { code: 'ADB', name: 'Adnan Menderes', city: 'İzmir' },
    { code: 'AYT', name: 'Antalya', city: 'Antalya' },
    { code: 'TZX', name: 'Trabzon', city: 'Trabzon' }
  ]

  const statuses = ['SCHEDULED', 'BOARDING', 'DEPARTED', 'ARRIVED', 'DELAYED', 'CANCELLED']
  const types = ['İç Hat', 'Dış Hat', 'Kargo', 'Özel']

  return Array.from({ length: count }, (_, index) => {
    const airline = airlines[Math.floor(Math.random() * airlines.length)]
    const origin = airports[Math.floor(Math.random() * airports.length)]
    let destination = airports[Math.floor(Math.random() * airports.length)]

    // Ensure origin and destination are different
    while (destination.code === origin.code) {
      destination = airports[Math.floor(Math.random() * airports.length)]
    }

    const baseTime = new Date()
    baseTime.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))

    return {
      id: `flight-${index + 1}`,
      flightNumber: `${airline.code}${Math.floor(Math.random() * 9000) + 1000}`,
      airline,
      origin,
      destination,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      type: types[Math.floor(Math.random() * types.length)],
      departureTime: baseTime.toISOString(),
      arrivalTime: new Date(baseTime.getTime() + (2 * 60 * 60 * 1000)).toISOString(), // +2 hours
      aircraft: {
        model: 'Boeing 737-800',
        registration: `TC-${Math.random().toString(36).substr(2, 3).toUpperCase()}`
      },
      passengerCount: Math.floor(Math.random() * 180) + 20
    }
  })
}

const fetchFlights = async () => {
  loading.value = true

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))

    flights.value = generateMockFlights(props.limit)
  } catch (error) {
    console.error('Error fetching flights:', error)
  } finally {
    loading.value = false
  }
}

const getStatusType = (status) => {
  const statusMap = {
    'SCHEDULED': '',
    'BOARDING': 'warning',
    'DEPARTED': 'success',
    'ARRIVED': 'info',
    'DELAYED': 'warning',
    'CANCELLED': 'danger'
  }
  return statusMap[status] || ''
}

const getStatusText = (status) => {
  const statusMap = {
    'SCHEDULED': 'Planlandı',
    'BOARDING': 'Biniş',
    'DEPARTED': 'Kalktı',
    'ARRIVED': 'Indi',
    'DELAYED': 'Gecikti',
    'CANCELLED': 'İptal'
  }
  return statusMap[status] || status
}

const getFlightTypeStyle = (type) => {
  const typeMap = {
    'İç Hat': 'primary',
    'Dış Hat': 'success',
    'Kargo': 'warning',
    'Özel': 'info'
  }
  return typeMap[type] || ''
}

const handleRowClick = (row) => {
  console.log('Row clicked:', row)
  // Could emit event or navigate
}

const viewDetails = (flight) => {
  console.log('View details:', flight)
  router.push(`/flights/${flight.id}`)
}

onMounted(() => {
  fetchFlights()

  // Auto refresh if enabled
  if (props.autoRefresh) {
    const interval = setInterval(fetchFlights, 30000) // Refresh every 30 seconds

    // Cleanup on unmount
    onUnmounted(() => {
      clearInterval(interval)
    })
  }
})
</script>

<style scoped>
.recent-flights-table {
  width: 100%;
}

.flights-table {
  font-size: 13px;
}

.flights-table :deep(.el-table__row) {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.flights-table :deep(.el-table__row:hover) {
  background-color: #f5f7fa !important;
}

.flight-number {
  font-weight: 600;
}

.airline-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.airline-code {
  font-weight: 600;
  color: #303133;
  font-size: 12px;
}

.airline-name {
  font-size: 11px;
  color: #909399;
  line-height: 1.2;
}

.route-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.airport-code {
  color: #606266;
  font-size: 12px;
  font-weight: 600;
}

.route-arrow {
  color: #909399;
  font-size: 12px;
}

.time-info {
  font-weight: 500;
  color: #303133;
  font-size: 12px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

@media (max-width: 768px) {
  .flights-table {
    font-size: 12px;
  }

  .airline-info,
  .route-info {
    gap: 4px;
  }

  .airline-name {
    display: none;
  }
}
</style>

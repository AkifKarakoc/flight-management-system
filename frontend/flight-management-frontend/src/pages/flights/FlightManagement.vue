<template>
  <div class="flight-management">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1>Uçuş Yönetimi</h1>
        <div class="header-actions">
          <el-button type="primary" :icon="Plus" @click="handleCreate">
            Yeni Uçuş
          </el-button>
          <el-button :icon="Upload" @click="handleUpload">
            Toplu Yükleme
          </el-button>
          <el-button :icon="Download" @click="handleExport">
            Dışa Aktar
          </el-button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-form">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input
              v-model="filters.search"
              placeholder="Uçuş numarası ara..."
              :prefix-icon="Search"
              clearable
              @input="handleSearch"
            />
          </el-col>
          <el-col :span="4">
            <el-select
              v-model="filters.airlineId"
              placeholder="Havayolu"
              clearable
              @change="handleFilterChange"
            >
              <el-option
                v-for="airline in airlines"
                :key="airline.id"
                :label="airline.name"
                :value="airline.id"
              />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select
              v-model="filters.status"
              placeholder="Durum"
              clearable
              @change="handleFilterChange"
            >
              <el-option
                v-for="status in flightStatuses"
                :key="status.value"
                :label="status.label"
                :value="status.value"
              />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-date-picker
              v-model="filters.flightDate"
              type="date"
              placeholder="Uçuş tarihi"
              format="DD.MM.YYYY"
              value-format="YYYY-MM-DD"
              @change="handleFilterChange"
            />
          </el-col>
          <el-col :span="6">
            <el-button @click="handleResetFilters">Temizle</el-button>
            <el-button type="primary" @click="handleApplyFilters">Filtrele</el-button>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- Table -->
    <el-card shadow="never">
      <el-table
        v-loading="loading"
        :data="flights"
        stripe
        @sort-change="handleSortChange"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column
          prop="flightNumber"
          label="Uçuş No"
          width="120"
          sortable="custom"
        >
          <template #default="{ row }">
            <el-link type="primary" @click="handleView(row)">
              {{ formatFlightNumber(row.flightNumber) }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column
          prop="airline.name"
          label="Havayolu"
          width="150"
        />

        <el-table-column
          label="Rota"
          width="200"
        >
          <template #default="{ row }">
            {{ formatRoute(row.originAirport?.iataCode, row.destinationAirport?.iataCode) }}
          </template>
        </el-table-column>

        <el-table-column
          prop="flightDate"
          label="Tarih"
          width="120"
          sortable="custom"
        >
          <template #default="{ row }">
            {{ formatDate(row.flightDate) }}
          </template>
        </el-table-column>

        <el-table-column
          label="Kalkış"
          width="100"
        >
          <template #default="{ row }">
            {{ formatTime(row.scheduledDeparture) }}
          </template>
        </el-table-column>

        <el-table-column
          label="Varış"
          width="100"
        >
          <template #default="{ row }">
            {{ formatTime(row.scheduledArrival) }}
          </template>
        </el-table-column>

        <el-table-column
          prop="status"
          label="Durum"
          width="120"
        >
          <template #default="{ row }">
            <el-tag
              :type="getStatusTagType(row.status)"
              size="small"
            >
              {{ getFlightStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="passengerCount"
          label="Yolcu"
          width="80"
          align="center"
        />

        <el-table-column
          label="İşlemler"
          width="150"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              size="small"
              :icon="View"
              @click="handleView(row)"
            />
            <el-button
              size="small"
              type="primary"
              :icon="Edit"
              @click="handleEdit(row)"
            />
            <el-button
              size="small"
              type="danger"
              :icon="Delete"
              @click="handleDelete(row)"
            />
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- Bulk Actions -->
    <div v-if="selectedFlights.length > 0" class="bulk-actions">
      <el-card shadow="always">
        <div class="bulk-content">
          <span>{{ selectedFlights.length }} uçuş seçildi</span>
          <div class="bulk-buttons">
            <el-button type="warning" @click="handleBulkCancel">
              Toplu İptal
            </el-button>
            <el-button type="danger" @click="handleBulkDelete">
              Toplu Sil
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Upload,
  Download,
  Search,
  View,
  Edit,
  Delete
} from '@element-plus/icons-vue'

import { useFlightStore } from '@/stores/flight.js'
import { useReferenceStore } from '@/stores/reference.js'
import { formatDate, formatTime, formatFlightNumber, formatRoute } from '@/utils/formatters.js'
import { debounce } from '@/utils/helpers.js'

const router = useRouter()
const flightStore = useFlightStore()
const referenceStore = useReferenceStore()

// State
const loading = ref(false)
const selectedFlights = ref([])

// Filters
const filters = ref({
  search: '',
  airlineId: null,
  status: '',
  flightDate: '',
  sortBy: 'scheduledDeparture',
  sortDirection: 'desc'
})

// Pagination
const currentPage = ref(1)
const pageSize = ref(20)

// Computed
const flights = computed(() => flightStore.flights)
const total = computed(() => flightStore.totalElements)
const airlines = computed(() => referenceStore.activeAirlines)

const flightStatuses = computed(() => [
  { value: 'SCHEDULED', label: 'Planlandı' },
  { value: 'BOARDING', label: 'Biniş' },
  { value: 'DEPARTED', label: 'Kalktı' },
  { value: 'IN_FLIGHT', label: 'Uçuşta' },
  { value: 'ARRIVED', label: 'İndi' },
  { value: 'CANCELLED', label: 'İptal' },
  { value: 'DELAYED', label: 'Gecikti' }
])

// Methods
const handleSearch = debounce(() => {
  currentPage.value = 1
  fetchFlights()
}, 500)

const handleFilterChange = () => {
  currentPage.value = 1
  fetchFlights()
}

const handleResetFilters = () => {
  filters.value = {
    search: '',
    airlineId: null,
    status: '',
    flightDate: '',
    sortBy: 'scheduledDeparture',
    sortDirection: 'desc'
  }
  currentPage.value = 1
  fetchFlights()
}

const handleApplyFilters = () => {
  currentPage.value = 1
  fetchFlights()
}

const handleSortChange = ({ prop, order }) => {
  filters.value.sortBy = prop
  filters.value.sortDirection = order === 'ascending' ? 'asc' : 'desc'
  fetchFlights()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchFlights()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchFlights()
}

const handleSelectionChange = (selection) => {
  selectedFlights.value = selection
}

const handleCreate = () => {
  router.push('/flights/create')
}

const handleUpload = () => {
  router.push('/flights/upload')
}

const handleView = (flight) => {
  router.push(`/flights/${flight.id}`)
}

const handleEdit = (flight) => {
  router.push(`/flights/${flight.id}/edit`)
}

const handleDelete = async (flight) => {
  try {
    await ElMessageBox.confirm(
      `"${flight.flightNumber}" uçuşunu silmek istediğinizden emin misiniz?`,
      'Uçuş Sil',
      {
        confirmButtonText: 'Sil',
        cancelButtonText: 'İptal',
        type: 'warning'
      }
    )

    await flightStore.deleteFlight(flight.id)
    await fetchFlights()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete failed:', error)
    }
  }
}

const handleExport = async () => {
  try {
    await flightStore.exportFlights(filters.value)
  } catch (error) {
    console.error('Export failed:', error)
  }
}

const handleBulkCancel = async () => {
  try {
    await ElMessageBox.confirm(
      `${selectedFlights.value.length} uçuşu iptal etmek istediğinizden emin misiniz?`,
      'Toplu İptal',
      {
        confirmButtonText: 'İptal Et',
        cancelButtonText: 'Vazgeç',
        type: 'warning'
      }
    )

    for (const flight of selectedFlights.value) {
      await flightStore.cancelFlight(flight.id, 'Toplu iptal')
    }

    selectedFlights.value = []
    await fetchFlights()
    ElMessage.success('Uçuşlar başarıyla iptal edildi')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Bulk cancel failed:', error)
    }
  }
}

const handleBulkDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `${selectedFlights.value.length} uçuşu silmek istediğinizden emin misiniz?`,
      'Toplu Silme',
      {
        confirmButtonText: 'Sil',
        cancelButtonText: 'İptal',
        type: 'warning'
      }
    )

    for (const flight of selectedFlights.value) {
      await flightStore.deleteFlight(flight.id)
    }

    selectedFlights.value = []
    await fetchFlights()
    ElMessage.success('Uçuşlar başarıyla silindi')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Bulk delete failed:', error)
    }
  }
}

const fetchFlights = async () => {
  loading.value = true
  try {
    await flightStore.fetchFlights({
      page: currentPage.value - 1,
      size: pageSize.value,
      ...filters.value
    })
  } catch (error) {
    console.error('Fetch flights failed:', error)
  } finally {
    loading.value = false
  }
}

const getStatusTagType = (status) => {
  const typeMap = {
    'SCHEDULED': 'info',
    'BOARDING': 'warning',
    'DEPARTED': 'success',
    'IN_FLIGHT': 'primary',
    'ARRIVED': 'success',
    'CANCELLED': 'danger',
    'DELAYED': 'warning'
  }
  return typeMap[status] || 'info'
}

const getFlightStatusText = (status) => {
  return flightStore.getFlightStatusText(status)
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    referenceStore.fetchAirlines(),
    fetchFlights()
  ])
})

// Watchers
watch(
  () => flightStore.filters,
  (newFilters) => {
    Object.assign(filters.value, newFilters)
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.flight-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h1 {
      margin: 0;
      color: #303133;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }
}

.filter-card {
  margin-bottom: 20px;

  .filter-form {
    .el-row {
      align-items: center;
    }
  }
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.bulk-actions {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;

  .bulk-content {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 10px 20px;

    .bulk-buttons {
      display: flex;
      gap: 12px;
    }
  }
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-table) {
  .el-table__header th {
    background-color: #fafafa;
  }
}
</style>

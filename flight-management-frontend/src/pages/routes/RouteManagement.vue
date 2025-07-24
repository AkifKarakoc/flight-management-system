<template>
  <div class="route-management">
    <el-card>
      <!-- Page Header -->
      <div class="page-header">
        <h2>Rota Yönetimi</h2>
        <div class="header-actions">
          <el-button @click="refreshData" :icon="Refresh">
            Yenile
          </el-button>
          <el-button
            v-if="authStore.isAdmin"
            type="primary"
            @click="showCreateDialog = true"
            :icon="Plus"
          >
            Yeni Rota
          </el-button>
        </div>
      </div>

      <!-- Search Section -->
      <div class="search-section">
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" :md="8">
            <el-input
              v-model="searchQuery"
              placeholder="Rota ara..."
              :prefix-icon="Search"
              clearable
              @input="handleSearch"
            />
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-select
              v-model="filterOriginAirport"
              placeholder="Kalkış Havalimanı"
              clearable
              filterable
              @change="handleSearch"
            >
              <el-option
                v-for="airport in referenceStore.airportOptions"
                :key="airport.value"
                :label="airport.label"
                :value="airport.value"
              />
            </el-select>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-select
              v-model="filterDestinationAirport"
              placeholder="Varış Havalimanı"
              clearable
              filterable
              @change="handleSearch"
            >
              <el-option
                v-for="airport in referenceStore.airportOptions"
                :key="airport.value"
                :label="airport.label"
                :value="airport.value"
              />
            </el-select>
          </el-col>
          <el-col :xs="24" :sm="8" :md="4">
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              Ara
            </el-button>
            <el-button @click="handleClearFilters">
              <el-icon><RefreshRight /></el-icon>
              Temizle
            </el-button>
          </el-col>
        </el-row>
      </div>

      <!-- Routes Table -->
      <div class="table-section">
        <RouteTable
          :routes="filteredRoutes"
          :loading="referenceStore.loadingStates.routes"
          :show-edit-button="authStore.isAdmin"
          :show-delete-button="authStore.isAdmin"
          @view="viewRoute"
          @edit="editRoute"
          @delete="deleteRoute"
          @sort-change="handleSortChange"
        />

        <!-- Pagination -->
        <div class="pagination-section">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </el-card>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingRoute ? 'Rota Düzenle' : 'Yeni Rota'"
      width="600px"
      :close-on-click-modal="false"
    >
      <RouteForm
        ref="routeFormRef"
        v-model="routeForm"
        :edit-mode="!!editingRoute"
      />

      <template #footer>
        <el-button @click="handleDialogClose">
          İptal
        </el-button>
        <el-button
          type="primary"
          :loading="loading"
          @click="handleSubmit"
        >
          {{ editingRoute ? 'Güncelle' : 'Kaydet' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- View Dialog -->
    <el-dialog
      v-model="showViewDialog"
      title="Rota Detayları"
      width="500px"
    >
      <div v-if="viewingRoute" class="route-details">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="Rota">
            <div class="route-display">
              <el-tag type="primary">{{ viewingRoute.originAirport?.iataCode }}</el-tag>
              <el-icon class="mx-2"><Right /></el-icon>
              <el-tag type="primary">{{ viewingRoute.destinationAirport?.iataCode }}</el-tag>
            </div>
            <div class="route-cities">
              {{ viewingRoute.originAirport?.name }} → {{ viewingRoute.destinationAirport?.name }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="Şehirler">
            {{ viewingRoute.originAirport?.city }}, {{ viewingRoute.originAirport?.country }} →
            {{ viewingRoute.destinationAirport?.city }}, {{ viewingRoute.destinationAirport?.country }}
          </el-descriptions-item>
          <el-descriptions-item label="Mesafe">
            {{ viewingRoute.distance ? `${viewingRoute.distance} km` : 'N/A' }}
          </el-descriptions-item>
          <el-descriptions-item label="Tahmini Uçuş Süresi">
            {{ formatFlightTime(viewingRoute.estimatedFlightTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="Rota Tipi">
            <el-tag :type="getRouteTypeTagType(viewingRoute.routeType)">
              {{ ROUTE_TYPE_LABELS[viewingRoute.routeType] || viewingRoute.routeType }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Durum">
            <el-tag :type="viewingRoute.active ? 'success' : 'danger'">
              {{ viewingRoute.active ? 'Aktif' : 'Pasif' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Refresh,
  Search,
  RefreshRight,
  View,
  Edit,
  Delete,
  Right
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useReferenceStore } from '@/stores/reference'
import { ROUTE_TYPE_LABELS } from '@/utils/constants'
import RouteTable from '@/components/tables/RouteTable.vue'
import RouteForm from '@/components/forms/RouteForm.vue'

const authStore = useAuthStore()
const referenceStore = useReferenceStore()

// State
const loading = ref(false)
const searchQuery = ref('')
const filterOriginAirport = ref(null)
const filterDestinationAirport = ref(null)
const filterType = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// Dialogs
const showCreateDialog = ref(false)
const showViewDialog = ref(false)
const editingRoute = ref(null)
const viewingRoute = ref(null)

// Form
const routeFormRef = ref()
const routeForm = reactive({
  originAirportId: null,
  destinationAirportId: null,
  distance: null,
  estimatedFlightTime: null,
  routeType: 'DOMESTIC',
  active: true
})

// Computed
const filteredRoutes = computed(() => {
  let routes = referenceStore.routes || []

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    routes = routes.filter(route => {
      const originCode = route.originAirport?.iataCode?.toLowerCase() || ''
      const destinationCode = route.destinationAirport?.iataCode?.toLowerCase() || ''
      const originCity = route.originAirport?.city?.toLowerCase() || ''
      const destinationCity = route.destinationAirport?.city?.toLowerCase() || ''

      return originCode.includes(query) ||
        destinationCode.includes(query) ||
        originCity.includes(query) ||
        destinationCity.includes(query) ||
        `${originCode} ${destinationCode}`.includes(query)
    })
  }

  // Origin airport filter
  if (filterOriginAirport.value) {
    routes = routes.filter(route => route.originAirportId === filterOriginAirport.value)
  }

  // Destination airport filter
  if (filterDestinationAirport.value) {
    routes = routes.filter(route => route.destinationAirportId === filterDestinationAirport.value)
  }

  // Type filter
  if (filterType.value) {
    routes = routes.filter(route => route.routeType === filterType.value)
  }

  total.value = routes.length

  // Client-side pagination
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return routes.slice(start, end)
})

// Methods
const loadData = async () => {
  await Promise.all([
    referenceStore.loadRoutes(true),
    referenceStore.loadAirports(true)
  ])
}

const refreshData = async () => {
  await loadData()
  ElMessage.success('Veriler yenilendi')
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleClearFilters = () => {
  searchQuery.value = ''
  filterOriginAirport.value = null
  filterDestinationAirport.value = null
  filterType.value = ''
  currentPage.value = 1
}

const handleSortChange = ({ column, prop, order }) => {
  // Sorting logic can be implemented here
  console.log('Sort change:', { prop, order })
}

const handlePageChange = (page) => {
  currentPage.value = page
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const getRouteTypeTagType = (type) => {
  const typeMap = {
    'DOMESTIC': 'success',
    'INTERNATIONAL': 'warning'
  }
  return typeMap[type] || 'info'
}

const formatFlightTime = (minutes) => {
  if (!minutes) return 'N/A'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}s ${mins}dk`
  }
  return `${mins}dk`
}

const resetForm = () => {
  Object.assign(routeForm, {
    originAirportId: null,
    destinationAirportId: null,
    distance: null,
    estimatedFlightTime: null,
    routeType: 'DOMESTIC',
    active: true
  })
  editingRoute.value = null
  routeFormRef.value?.resetForm()
}

const handleDialogClose = () => {
  showCreateDialog.value = false
  resetForm()
}

const viewRoute = (route) => {
  viewingRoute.value = route
  showViewDialog.value = true
}

const editRoute = (route) => {
  editingRoute.value = route
  Object.assign(routeForm, {
    originAirportId: route.originAirportId,
    destinationAirportId: route.destinationAirportId,
    distance: route.distance,
    estimatedFlightTime: route.estimatedFlightTime,
    routeType: route.routeType,
    active: route.active
  })
  showCreateDialog.value = true
}

const handleSubmit = async () => {
  if (!routeFormRef.value) return

  try {
    await routeFormRef.value.validate()
    loading.value = true

    if (editingRoute.value) {
      await referenceStore.updateRoute(editingRoute.value.id, routeForm)
      ElMessage.success('Rota başarıyla güncellendi')
    } else {
      await referenceStore.createRoute(routeForm)
      ElMessage.success('Rota başarıyla oluşturuldu')
    }

    handleDialogClose()
  } catch (error) {
    console.error('Submit error:', error)
  } finally {
    loading.value = false
  }
}

const deleteRoute = async (route) => {
  try {
    const originAirport = referenceStore.airports.find(a => a.id === route.originAirportId)
    const destinationAirport = referenceStore.airports.find(a => a.id === route.destinationAirportId)
    const routeName = `${originAirport?.iataCode || 'N/A'} → ${destinationAirport?.iataCode || 'N/A'}`

    await ElMessageBox.confirm(
      `"${routeName}" rotasını silmek istediğinizden emin misiniz?`,
      'Rota Sil',
      {
        confirmButtonText: 'Evet',
        cancelButtonText: 'İptal',
        type: 'warning'
      }
    )

    await referenceStore.deleteRoute(route.id)
    ElMessage.success('Rota başarıyla silindi')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete error:', error)
    }
  }
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h2 {
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.search-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.table-section {
  margin-top: 16px;
}

.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.route-details {
  padding: 16px 0;
}

.route-display {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.route-cities {
  font-size: 12px;
  color: #909399;
}

/* Responsive */
@media (max-width: 768px) {
  .header-actions {
    flex-direction: column;
  }

  .search-section .el-col {
    margin-bottom: 8px;
  }

  .data-table {
    font-size: 12px;
  }
}
</style>

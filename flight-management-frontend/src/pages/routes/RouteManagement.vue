<template>
  <div class="page-container">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <h2>Rota Yönetimi</h2>
          <div class="header-actions">
            <el-button
              v-if="authStore.isAdmin"
              type="primary"
              @click="showCreateDialog = true"
            >
              <el-icon><Plus /></el-icon>
              Yeni Rota
            </el-button>
            <el-button @click="refreshData">
              <el-icon><Refresh /></el-icon>
              Yenile
            </el-button>
          </div>
        </div>
      </template>

      <!-- Search & Filters -->
      <div class="search-section">
        <el-row :gutter="16">
          <el-col :xs="24" :sm="8" :md="6">
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
          <el-col :xs="24" :sm="8" :md="6">
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
          <el-col :xs="24" :sm="8" :md="6">
            <el-select
              v-model="filterType"
              placeholder="Rota Tipi"
              clearable
              @change="handleSearch"
            >
              <el-option
                v-for="(label, value) in ROUTE_TYPE_LABELS"
                :key="value"
                :label="label"
                :value="value"
              />
            </el-select>
          </el-col>
          <el-col :xs="24" :sm="24" :md="6">
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
        <el-table
          v-loading="referenceStore.loadingStates.routes"
          :data="filteredRoutes"
          stripe
          class="data-table"
          @sort-change="handleSortChange"
        >
          <el-table-column type="index" width="60" />

          <el-table-column
            label="Rota"
            min-width="250"
          >
            <template #default="{ row }">
              <div class="route-info">
                <div class="route-path">
                  <span class="airport-code">{{ row.originAirport?.iataCode || 'N/A' }}</span>
                  <el-icon class="route-arrow"><Right /></el-icon>
                  <span class="airport-code">{{ row.destinationAirport?.iataCode || 'N/A' }}</span>
                </div>
                <div class="route-names">
                  <span class="origin-name">{{ row.originAirport?.city }}</span>
                  <span class="destination-name">{{ row.destinationAirport?.city }}</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column
            prop="distance"
            label="Mesafe (km)"
            width="120"
            sortable="custom"
          >
            <template #default="{ row }">
              {{ row.distance || 'N/A' }}
            </template>
          </el-table-column>

          <el-table-column
            prop="estimatedFlightTime"
            label="Tahmini Süre"
            width="130"
          >
            <template #default="{ row }">
              {{ formatFlightTime(row.estimatedFlightTime) }}
            </template>
          </el-table-column>

          <el-table-column
            prop="routeType"
            label="Tip"
            width="120"
          >
            <template #default="{ row }">
              <el-tag :type="getRouteTypeTagType(row.routeType)">
                {{ ROUTE_TYPE_LABELS[row.routeType] || row.routeType }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column
            prop="active"
            label="Durum"
            width="100"
          >
            <template #default="{ row }">
              <el-tag :type="row.active ? 'success' : 'danger'">
                {{ row.active ? 'Aktif' : 'Pasif' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column
            label="İşlemler"
            width="200"
            fixed="right"
          >
            <template #default="{ row }">
              <el-button
                size="small"
                @click="viewRoute(row)"
              >
                <el-icon><View /></el-icon>
                Görüntüle
              </el-button>

              <el-button
                v-if="authStore.isAdmin"
                size="small"
                type="primary"
                @click="editRoute(row)"
              >
                <el-icon><Edit /></el-icon>
                Düzenle
              </el-button>

              <el-button
                v-if="authStore.isAdmin"
                size="small"
                type="danger"
                @click="deleteRoute(row)"
              >
                <el-icon><Delete /></el-icon>
                Sil
              </el-button>
            </template>
          </el-table-column>
        </el-table>

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
      <el-form
        ref="routeFormRef"
        :model="routeForm"
        :rules="routeRules"
        label-width="140px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Kalkış Havalimanı" prop="originAirportId">
              <el-select
                v-model="routeForm.originAirportId"
                placeholder="Kalkış seçiniz"
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="airport in referenceStore.airportOptions"
                  :key="airport.value"
                  :label="airport.label"
                  :value="airport.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Varış Havalimanı" prop="destinationAirportId">
              <el-select
                v-model="routeForm.destinationAirportId"
                placeholder="Varış seçiniz"
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="airport in referenceStore.airportOptions"
                  :key="airport.value"
                  :label="airport.label"
                  :value="airport.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Mesafe (km)" prop="distance">
              <el-input-number
                v-model="routeForm.distance"
                :min="1"
                :max="50000"
                placeholder="1250"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Uçuş Süresi (dk)" prop="estimatedFlightTime">
              <el-input-number
                v-model="routeForm.estimatedFlightTime"
                :min="1"
                :max="1440"
                placeholder="90"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Rota Tipi" prop="routeType">
              <el-select v-model="routeForm.routeType" placeholder="Seçiniz">
                <el-option
                  v-for="(label, value) in ROUTE_TYPE_LABELS"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Durum">
              <el-switch v-model="routeForm.active" active-text="Aktif" inactive-text="Pasif" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">İptal</el-button>
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

const authStore = useAuthStore()
const referenceStore = useReferenceStore()

// State
const loading = ref(false)
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
  routeType: '',
  active: true
})

const routeRules = {
  originAirportId: [
    { required: true, message: 'Kalkış havalimanı seçimi gereklidir', trigger: 'change' }
  ],
  destinationAirportId: [
    { required: true, message: 'Varış havalimanı seçimi gereklidir', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (value === routeForm.originAirportId) {
          callback(new Error('Kalkış ve varış havalimanı aynı olamaz'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  distance: [
    { required: true, message: 'Mesafe gereklidir', trigger: 'change' }
  ],
  estimatedFlightTime: [
    { required: true, message: 'Tahmini uçuş süresi gereklidir', trigger: 'change' }
  ],
  routeType: [
    { required: true, message: 'Rota tipi seçimi gereklidir', trigger: 'change' }
  ]
}

// Computed
const filteredRoutes = computed(() => {
  let routes = referenceStore.routes || []

  if (filterOriginAirport.value) {
    routes = routes.filter(route => route.originAirportId === filterOriginAirport.value)
  }

  if (filterDestinationAirport.value) {
    routes = routes.filter(route => route.destinationAirportId === filterDestinationAirport.value)
  }

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
  // Load airports first, then routes
  await Promise.all([
    referenceStore.loadAirports(true),
    referenceStore.loadRoutes(true)
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
  filterOriginAirport.value = null
  filterDestinationAirport.value = null
  filterType.value = ''
  currentPage.value = 1
}

const handleSortChange = ({ column, prop, order }) => {
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
    'INTERNATIONAL': 'primary'
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
    routeType: '',
    active: true
  })
  editingRoute.value = null
  routeFormRef.value?.clearValidate()
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

    showCreateDialog.value = false
    resetForm()
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

.route-info {
  padding: 4px 0;
}

.route-path {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.airport-code {
  font-weight: 600;
  font-size: 14px;
  color: #409eff;
}

.route-arrow {
  color: #909399;
}

.route-names {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #606266;
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
  margin-top: 4px;
}

.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.route-details {
  padding: 16px 0;
}

.mx-2 {
  margin: 0 8px;
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

  .route-names {
    flex-direction: column;
  }
}
</style>

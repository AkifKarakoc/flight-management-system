<template>
  <div class="page-container">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <h2>Havalimanı Yönetimi</h2>
          <div class="header-actions">
            <el-button
              v-if="authStore.isAdmin"
              type="primary"
              @click="showCreateDialog = true"
            >
              <el-icon><Plus /></el-icon>
              Yeni Havalimanı
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
            <el-input
              v-model="searchQuery"
              placeholder="Havalimanı ara..."
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :xs="24" :sm="8" :md="6">
            <el-input
              v-model="filterCountry"
              placeholder="Ülke filtresi"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </el-col>
          <el-col :xs="24" :sm="8" :md="6">
            <el-select
              v-model="filterType"
              placeholder="Tip Filtresi"
              clearable
              @change="handleSearch"
            >
              <el-option
                v-for="(label, value) in AIRPORT_TYPE_LABELS"
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

      <!-- Airports Table -->
      <div class="table-section">
        <el-table
          v-loading="referenceStore.loadingStates.airports"
          :data="filteredAirports"
          stripe
          class="data-table"
          @sort-change="handleSortChange"
        >
          <el-table-column type="index" width="60" />

          <el-table-column
            prop="name"
            label="Havalimanı"
            sortable="custom"
            min-width="200"
          >
            <template #default="{ row }">
              <div class="airport-info">
                <strong>{{ row.name }}</strong>
                <div class="airport-codes">
                  <el-tag size="small" type="primary">{{ row.iataCode }}</el-tag>
                  <el-tag size="small" type="info">{{ row.icaoCode || 'N/A' }}</el-tag>
                </div>
                <div class="airport-location">
                  <span class="location-text">{{ row.city }}, {{ row.country }}</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column
            prop="type"
            label="Tip"
            width="120"
          >
            <template #default="{ row }">
              <el-tag :type="getAirportTypeTagType(row.type)">
                {{ AIRPORT_TYPE_LABELS[row.type] || row.type }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column
            prop="timezone"
            label="Zaman Dilimi"
            width="130"
            show-overflow-tooltip
          />

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
                @click="viewAirport(row)"
              >
                <el-icon><View /></el-icon>
                Görüntüle
              </el-button>

              <el-button
                v-if="authStore.isAdmin"
                size="small"
                type="primary"
                @click="editAirport(row)"
              >
                <el-icon><Edit /></el-icon>
                Düzenle
              </el-button>

              <el-button
                v-if="authStore.isAdmin"
                size="small"
                type="danger"
                @click="deleteAirport(row)"
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
      :title="editingAirport ? 'Havalimanı Düzenle' : 'Yeni Havalimanı'"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="airportFormRef"
        :model="airportForm"
        :rules="airportRules"
        label-width="140px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="IATA Kodu" prop="iataCode">
              <el-input v-model="airportForm.iataCode" placeholder="IST" maxlength="3" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="ICAO Kodu" prop="icaoCode">
              <el-input v-model="airportForm.icaoCode" placeholder="LTFM" maxlength="4" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Havalimanı Adı" prop="name">
          <el-input v-model="airportForm.name" placeholder="İstanbul Havalimanı" />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Şehir" prop="city">
              <el-input v-model="airportForm.city" placeholder="İstanbul" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Ülke" prop="country">
              <el-input v-model="airportForm.country" placeholder="Turkey" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Tip" prop="type">
              <el-select v-model="airportForm.type" placeholder="Seçiniz">
                <el-option
                  v-for="(label, value) in AIRPORT_TYPE_LABELS"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Zaman Dilimi" prop="timezone">
              <el-input v-model="airportForm.timezone" placeholder="Europe/Istanbul" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Enlem">
              <el-input-number
                v-model="airportForm.latitude"
                :precision="6"
                :min="-90"
                :max="90"
                placeholder="41.275278"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Boylam">
              <el-input-number
                v-model="airportForm.longitude"
                :precision="6"
                :min="-180"
                :max="180"
                placeholder="28.751944"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Yükseklik (m)">
          <el-input-number
            v-model="airportForm.elevation"
            :min="0"
            :max="10000"
            placeholder="163"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="Durum">
          <el-switch v-model="airportForm.active" active-text="Aktif" inactive-text="Pasif" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">İptal</el-button>
        <el-button
          type="primary"
          :loading="loading"
          @click="handleSubmit"
        >
          {{ editingAirport ? 'Güncelle' : 'Kaydet' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- View Dialog -->
    <el-dialog
      v-model="showViewDialog"
      title="Havalimanı Detayları"
      width="600px"
    >
      <div v-if="viewingAirport" class="airport-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="IATA Kodu">{{ viewingAirport.iataCode }}</el-descriptions-item>
          <el-descriptions-item label="ICAO Kodu">{{ viewingAirport.icaoCode || 'N/A' }}</el-descriptions-item>
          <el-descriptions-item label="Havalimanı Adı" :span="2">{{ viewingAirport.name }}</el-descriptions-item>
          <el-descriptions-item label="Şehir">{{ viewingAirport.city }}</el-descriptions-item>
          <el-descriptions-item label="Ülke">{{ viewingAirport.country }}</el-descriptions-item>
          <el-descriptions-item label="Tip">
            <el-tag :type="getAirportTypeTagType(viewingAirport.type)">
              {{ AIRPORT_TYPE_LABELS[viewingAirport.type] || viewingAirport.type }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Zaman Dilimi">{{ viewingAirport.timezone || 'N/A' }}</el-descriptions-item>
          <el-descriptions-item label="Koordinatlar" :span="2">
            <span v-if="viewingAirport.latitude && viewingAirport.longitude">
              {{ viewingAirport.latitude.toFixed(6) }}, {{ viewingAirport.longitude.toFixed(6) }}
            </span>
            <span v-else>N/A</span>
          </el-descriptions-item>
          <el-descriptions-item label="Yükseklik">
            {{ viewingAirport.elevation ? `${viewingAirport.elevation} m` : 'N/A' }}
          </el-descriptions-item>
          <el-descriptions-item label="Durum">
            <el-tag :type="viewingAirport.active ? 'success' : 'danger'">
              {{ viewingAirport.active ? 'Aktif' : 'Pasif' }}
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
  Delete
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useReferenceStore } from '@/stores/reference'
import { AIRPORT_TYPE_LABELS } from '@/utils/constants'

const authStore = useAuthStore()
const referenceStore = useReferenceStore()

// State
const loading = ref(false)
const searchQuery = ref('')
const filterCountry = ref('')
const filterType = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// Dialogs
const showCreateDialog = ref(false)
const showViewDialog = ref(false)
const editingAirport = ref(null)
const viewingAirport = ref(null)

// Form
const airportFormRef = ref()
const airportForm = reactive({
  iataCode: '',
  icaoCode: '',
  name: '',
  city: '',
  country: '',
  type: '',
  timezone: '',
  latitude: null,
  longitude: null,
  elevation: null,
  active: true
})

const airportRules = {
  iataCode: [
    { required: true, message: 'IATA kodu gereklidir', trigger: 'blur' },
    { len: 3, message: 'IATA kodu 3 karakter olmalıdır', trigger: 'blur' }
  ],
  icaoCode: [
    { len: 4, message: 'ICAO kodu 4 karakter olmalıdır', trigger: 'blur' }
  ],
  name: [
    { required: true, message: 'Havalimanı adı gereklidir', trigger: 'blur' }
  ],
  city: [
    { required: true, message: 'Şehir gereklidir', trigger: 'blur' }
  ],
  country: [
    { required: true, message: 'Ülke gereklidir', trigger: 'blur' }
  ],
  type: [
    { required: true, message: 'Tip seçimi gereklidir', trigger: 'change' }
  ]
}

// Computed
const filteredAirports = computed(() => {
  let airports = referenceStore.airports || []

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    airports = airports.filter(airport =>
      airport.name?.toLowerCase().includes(query) ||
      airport.iataCode?.toLowerCase().includes(query) ||
      airport.icaoCode?.toLowerCase().includes(query) ||
      airport.city?.toLowerCase().includes(query)
    )
  }

  if (filterCountry.value) {
    const country = filterCountry.value.toLowerCase()
    airports = airports.filter(airport =>
      airport.country?.toLowerCase().includes(country)
    )
  }

  if (filterType.value) {
    airports = airports.filter(airport => airport.type === filterType.value)
  }

  total.value = airports.length

  // Client-side pagination
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return airports.slice(start, end)
})

// Methods
const loadData = async () => {
  await referenceStore.loadAirports(true)
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
  filterCountry.value = ''
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

const getAirportTypeTagType = (type) => {
  const typeMap = {
    'INTERNATIONAL': 'primary',
    'DOMESTIC': 'success',
    'REGIONAL': 'warning',
    'MILITARY': 'danger'
  }
  return typeMap[type] || 'info'
}

const resetForm = () => {
  Object.assign(airportForm, {
    iataCode: '',
    icaoCode: '',
    name: '',
    city: '',
    country: '',
    type: '',
    timezone: '',
    latitude: null,
    longitude: null,
    elevation: null,
    active: true
  })
  editingAirport.value = null
  airportFormRef.value?.clearValidate()
}

const viewAirport = (airport) => {
  viewingAirport.value = airport
  showViewDialog.value = true
}

const editAirport = (airport) => {
  editingAirport.value = airport
  Object.assign(airportForm, {
    iataCode: airport.iataCode,
    icaoCode: airport.icaoCode,
    name: airport.name,
    city: airport.city,
    country: airport.country,
    type: airport.type,
    timezone: airport.timezone,
    latitude: airport.latitude,
    longitude: airport.longitude,
    elevation: airport.elevation,
    active: airport.active
  })
  showCreateDialog.value = true
}

const handleSubmit = async () => {
  if (!airportFormRef.value) return

  try {
    await airportFormRef.value.validate()
    loading.value = true

    if (editingAirport.value) {
      await referenceStore.updateAirport(editingAirport.value.id, airportForm)
      ElMessage.success('Havalimanı başarıyla güncellendi')
    } else {
      await referenceStore.createAirport(airportForm)
      ElMessage.success('Havalimanı başarıyla oluşturuldu')
    }

    showCreateDialog.value = false
    resetForm()
  } catch (error) {
    console.error('Submit error:', error)
  } finally {
    loading.value = false
  }
}

const deleteAirport = async (airport) => {
  try {
    await ElMessageBox.confirm(
      `"${airport.name}" havalimanını silmek istediğinizden emin misiniz?`,
      'Havalimanı Sil',
      {
        confirmButtonText: 'Evet',
        cancelButtonText: 'İptal',
        type: 'warning'
      }
    )

    await referenceStore.deleteAirport(airport.id)
    ElMessage.success('Havalimanı başarıyla silindi')
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

.airport-info strong {
  font-size: 14px;
  color: #303133;
}

.airport-codes {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.location-text {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.airport-details {
  padding: 16px 0;
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

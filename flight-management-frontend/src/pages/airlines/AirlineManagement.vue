<template>
  <div class="page-container">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <h2>Havayolu Yönetimi</h2>
          <div class="header-actions">
            <el-button
              v-if="authStore.isAdmin"
              type="primary"
              @click="showCreateDialog = true"
            >
              <el-icon><Plus /></el-icon>
              Yeni Havayolu
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
          <el-col :xs="24" :sm="12" :md="8">
            <el-input
              v-model="searchQuery"
              placeholder="Havayolu ara..."
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-select
              v-model="filterType"
              placeholder="Tip Filtresi"
              clearable
              @change="handleSearch"
            >
              <el-option
                v-for="(label, value) in AIRLINE_TYPE_LABELS"
                :key="value"
                :label="label"
                :value="value"
              />
            </el-select>
          </el-col>
          <el-col :xs="24" :sm="24" :md="8">
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

      <!-- Airlines Table -->
      <div class="table-section">
        <el-table
          v-loading="referenceStore.loadingStates.airlines"
          :data="filteredAirlines"
          stripe
          class="data-table"
          @sort-change="handleSortChange"
        >
          <el-table-column type="index" width="60" />

          <el-table-column
            prop="name"
            label="Havayolu Adı"
            sortable="custom"
            min-width="200"
          >
            <template #default="{ row }">
              <div class="airline-info">
                <strong>{{ row.name }}</strong>
                <div class="airline-codes">
                  <el-tag size="small" type="info">{{ row.iataCode }}</el-tag>
                  <el-tag size="small" type="info">{{ row.icaoCode }}</el-tag>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column
            prop="country"
            label="Ülke"
            sortable="custom"
            width="120"
          />

          <el-table-column
            prop="type"
            label="Tip"
            width="130"
          >
            <template #default="{ row }">
              <el-tag :type="getAirlineTypeTagType(row.type)">
                {{ AIRLINE_TYPE_LABELS[row.type] || row.type }}
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
                @click="viewAirline(row)"
              >
                <el-icon><View /></el-icon>
                Görüntüle
              </el-button>

              <el-button
                v-if="authStore.isAdmin"
                size="small"
                type="primary"
                @click="editAirline(row)"
              >
                <el-icon><Edit /></el-icon>
                Düzenle
              </el-button>

              <el-button
                v-if="authStore.isAdmin"
                size="small"
                type="danger"
                @click="deleteAirline(row)"
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
      :title="editingAirline ? 'Havayolu Düzenle' : 'Yeni Havayolu'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="airlineFormRef"
        :model="airlineForm"
        :rules="airlineRules"
        label-width="140px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="IATA Kodu" prop="iataCode">
              <el-input v-model="airlineForm.iataCode" placeholder="TK" maxlength="3" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="ICAO Kodu" prop="icaoCode">
              <el-input v-model="airlineForm.icaoCode" placeholder="THY" maxlength="4" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Havayolu Adı" prop="name">
          <el-input v-model="airlineForm.name" placeholder="Turkish Airlines" />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Ülke" prop="country">
              <el-input v-model="airlineForm.country" placeholder="Turkey" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Tip" prop="type">
              <el-select v-model="airlineForm.type" placeholder="Seçiniz">
                <el-option
                  v-for="(label, value) in AIRLINE_TYPE_LABELS"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Durum">
          <el-switch v-model="airlineForm.active" active-text="Aktif" inactive-text="Pasif" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">İptal</el-button>
        <el-button
          type="primary"
          :loading="loading"
          @click="handleSubmit"
        >
          {{ editingAirline ? 'Güncelle' : 'Kaydet' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- View Dialog -->
    <el-dialog
      v-model="showViewDialog"
      title="Havayolu Detayları"
      width="500px"
    >
      <div v-if="viewingAirline" class="airline-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="IATA Kodu">{{ viewingAirline.iataCode }}</el-descriptions-item>
          <el-descriptions-item label="ICAO Kodu">{{ viewingAirline.icaoCode }}</el-descriptions-item>
          <el-descriptions-item label="Havayolu Adı" :span="2">{{ viewingAirline.name }}</el-descriptions-item>
          <el-descriptions-item label="Ülke">{{ viewingAirline.country }}</el-descriptions-item>
          <el-descriptions-item label="Tip">
            <el-tag :type="getAirlineTypeTagType(viewingAirline.type)">
              {{ AIRLINE_TYPE_LABELS[viewingAirline.type] || viewingAirline.type }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Durum" :span="2">
            <el-tag :type="viewingAirline.active ? 'success' : 'danger'">
              {{ viewingAirline.active ? 'Aktif' : 'Pasif' }}
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
import { AIRLINE_TYPE_LABELS } from '@/utils/constants'

const authStore = useAuthStore()
const referenceStore = useReferenceStore()

// State
const loading = ref(false)
const searchQuery = ref('')
const filterType = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// Dialogs
const showCreateDialog = ref(false)
const showViewDialog = ref(false)
const editingAirline = ref(null)
const viewingAirline = ref(null)

// Form
const airlineFormRef = ref()
const airlineForm = reactive({
  iataCode: '',
  icaoCode: '',
  name: '',
  country: '',
  type: '',
  active: true
})

const airlineRules = {
  iataCode: [
    { required: true, message: 'IATA kodu gereklidir', trigger: 'blur' },
    { min: 2, max: 3, message: 'IATA kodu 2-3 karakter olmalıdır', trigger: 'blur' }
  ],
  icaoCode: [
    { required: true, message: 'ICAO kodu gereklidir', trigger: 'blur' },
    { min: 3, max: 4, message: 'ICAO kodu 3-4 karakter olmalıdır', trigger: 'blur' }
  ],
  name: [
    { required: true, message: 'Havayolu adı gereklidir', trigger: 'blur' }
  ],
  country: [
    { required: true, message: 'Ülke gereklidir', trigger: 'blur' }
  ],
  type: [
    { required: true, message: 'Tip seçimi gereklidir', trigger: 'change' }
  ]
}

// Computed
const filteredAirlines = computed(() => {
  let airlines = referenceStore.airlines || []

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    airlines = airlines.filter(airline =>
      airline.name?.toLowerCase().includes(query) ||
      airline.iataCode?.toLowerCase().includes(query) ||
      airline.icaoCode?.toLowerCase().includes(query) ||
      airline.country?.toLowerCase().includes(query)
    )
  }

  if (filterType.value) {
    airlines = airlines.filter(airline => airline.type === filterType.value)
  }

  total.value = airlines.length

  // Client-side pagination
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return airlines.slice(start, end)
})

// Methods
const loadData = async () => {
  await referenceStore.loadAirlines(true)
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

const getAirlineTypeTagType = (type) => {
  const typeMap = {
    'FULL_SERVICE': 'primary',
    'LOW_COST': 'success',
    'CHARTER': 'warning',
    'CARGO': 'info'
  }
  return typeMap[type] || 'info'
}

const resetForm = () => {
  Object.assign(airlineForm, {
    iataCode: '',
    icaoCode: '',
    name: '',
    country: '',
    type: '',
    active: true
  })
  editingAirline.value = null
  airlineFormRef.value?.clearValidate()
}

const viewAirline = (airline) => {
  viewingAirline.value = airline
  showViewDialog.value = true
}

const editAirline = (airline) => {
  editingAirline.value = airline
  Object.assign(airlineForm, {
    iataCode: airline.iataCode,
    icaoCode: airline.icaoCode,
    name: airline.name,
    country: airline.country,
    type: airline.type,
    active: airline.active
  })
  showCreateDialog.value = true
}

const handleSubmit = async () => {
  if (!airlineFormRef.value) return

  try {
    await airlineFormRef.value.validate()
    loading.value = true

    if (editingAirline.value) {
      await referenceStore.updateAirline(editingAirline.value.id, airlineForm)
      ElMessage.success('Havayolu başarıyla güncellendi')
    } else {
      await referenceStore.createAirline(airlineForm)
      ElMessage.success('Havayolu başarıyla oluşturuldu')
    }

    showCreateDialog.value = false
    resetForm()
  } catch (error) {
    console.error('Submit error:', error)
  } finally {
    loading.value = false
  }
}

const deleteAirline = async (airline) => {
  try {
    await ElMessageBox.confirm(
      `"${airline.name}" havayolunu silmek istediğinizden emin misiniz?`,
      'Havayolu Sil',
      {
        confirmButtonText: 'Evet',
        cancelButtonText: 'İptal',
        type: 'warning'
      }
    )

    await referenceStore.deleteAirline(airline.id)
    ElMessage.success('Havayolu başarıyla silindi')
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

.airline-info strong {
  font-size: 14px;
  color: #303133;
}

.airline-codes {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.airline-details {
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

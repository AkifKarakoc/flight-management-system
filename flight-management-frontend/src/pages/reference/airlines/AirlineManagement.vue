<template>
  <div class="airline-management">
    <!-- Page header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">Havayolu Yönetimi</h1>
          <p class="page-description">
            Havayolu şirketlerini görüntüleyin, ekleyin ve düzenleyin
          </p>
        </div>
        <div class="header-actions">
          <BaseButton
            type="primary"
            icon="Plus"
            @click="navigateToCreate"
          >
            Yeni Havayolu
          </BaseButton>
          <BaseButton
            icon="Refresh"
            :loading="refreshing"
            @click="refreshData"
          >
            Yenile
          </BaseButton>
          <BaseButton
            icon="Download"
            @click="exportData"
          >
            Dışa Aktar
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Filters and search -->
    <BaseCard class="filters-card">
      <div class="filters-section">
        <div class="search-section">
          <BaseInput
            v-model="searchQuery"
            placeholder="Havayolu ara (ad, kod, ülke)..."
            prefix-icon="Search"
            clearable
            class="search-input"
            @input="handleSearch"
          />
        </div>

        <div class="filter-section">
          <BaseSelect
            v-model="filters.type"
            placeholder="Havayolu Tipi"
            :options="airlineTypeOptions"
            clearable
            style="width: 150px"
            @change="handleFilterChange"
          />
          <BaseSelect
            v-model="filters.country"
            placeholder="Ülke"
            :options="countryOptions"
            clearable
            style="width: 150px"
            @change="handleFilterChange"
          />
          <BaseSelect
            v-model="filters.status"
            placeholder="Durum"
            :options="statusOptions"
            clearable
            style="width: 120px"
            @change="handleFilterChange"
          />
          <BaseButton
            v-if="hasActiveFilters"
            type="default"
            icon="RefreshLeft"
            @click="clearFilters"
          >
            Filtreleri Temizle
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- Results summary -->
    <div v-if="filteredAirlines && filteredAirlines.length > 0" class="results-summary">
      <span class="summary-text">
        {{ filteredAirlines.length }} havayolu bulundu
        <span v-if="selectedAirlines && selectedAirlines.length > 0" class="selected-count">
          ({{ selectedAirlines.length }} seçili)
        </span>
      </span>

      <!-- Bulk actions -->
      <div v-if="selectedAirlines && selectedAirlines.length > 0" class="bulk-actions">
        <BaseButton
          type="danger"
          size="small"
          icon="Delete"
          @click="handleBulkDelete"
        >
          Seçilenleri Sil ({{ selectedAirlines.length }})
        </BaseButton>
      </div>
    </div>

    <!-- Airlines table -->
    <BaseCard class="table-card">
      <el-table
        v-loading="airlinesLoading"
        :data="paginatedAirlines"
        stripe
        border
        class="airlines-table"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <!-- Selection column -->
        <el-table-column type="selection" width="50" />

        <!-- Logo column -->
        <el-table-column label="Logo" width="80" align="center">
          <template #default="{ row }">
            <div class="airline-logo">
              <img
                v-if="row.logoUrl"
                :src="row.logoUrl"
                :alt="row.name"
                class="logo-image"
                @error="handleLogoError"
              />
              <div v-else class="logo-placeholder">
                {{ row.iataCode }}
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Basic info column -->
        <el-table-column label="Havayolu Bilgileri" min-width="250" sortable="custom" prop="name">
          <template #default="{ row }">
            <div class="airline-info">
              <div class="airline-name">{{ row.name }}</div>
              <div class="airline-codes">
                <el-tag size="small" type="primary">{{ row.iataCode }}</el-tag>
                <el-tag size="small" type="info">{{ row.icaoCode }}</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Country column -->
        <el-table-column label="Ülke" width="120" sortable="custom" prop="country">
          <template #default="{ row }">
            <div class="country-info">
              <span class="country-flag">{{ getCountryFlag(row.country) }}</span>
              <span class="country-name">{{ row.country }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- Type column -->
        <el-table-column label="Tip" width="120" sortable="custom" prop="type">
          <template #default="{ row }">
            <el-tag
              :type="getAirlineTypeColor(row.type)"
              size="small"
            >
              {{ formatAirlineType(row.type) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Status column -->
        <el-table-column label="Durum" width="100" sortable="custom" prop="active">
          <template #default="{ row }">
            <el-tag
              :type="row.active ? 'success' : 'danger'"
              size="small"
            >
              {{ row.active ? 'Aktif' : 'Pasif' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Stats column -->
        <el-table-column label="İstatistikler" width="120" align="center">
          <template #default="{ row }">
            <div class="airline-stats">
              <el-tooltip content="Toplam Uçuş Sayısı">
                <div class="stat-item">
                  <el-icon><Ship /></el-icon>
                  <span>{{ row.flightCount || 0 }}</span>
                </div>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>

        <!-- Actions column -->
        <el-table-column label="İşlemler" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <BaseButton
                size="small"
                icon="View"
                title="Detayları Görüntüle"
                @click="viewAirline(row)"
              />
              <BaseButton
                size="small"
                type="primary"
                icon="Edit"
                title="Düzenle"
                @click="editAirline(row)"
              />
              <el-dropdown
                trigger="click"
                @command="handleDropdownAction"
              >
                <BaseButton
                  size="small"
                  icon="MoreFilled"
                  title="Daha Fazla"
                />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      :command="{ action: 'toggle-status', airline: row }"
                      :icon="row.active ? 'Hide' : 'View'"
                    >
                      {{ row.active ? 'Pasifleştir' : 'Aktifleştir' }}
                    </el-dropdown-item>
                    <el-dropdown-item
                      :command="{ action: 'duplicate', airline: row }"
                      icon="CopyDocument"
                    >
                      Kopyala
                    </el-dropdown-item>
                    <el-dropdown-item
                      :command="{ action: 'export', airline: row }"
                      icon="Download"
                    >
                      Dışa Aktar
                    </el-dropdown-item>
                    <el-dropdown-item
                      :command="{ action: 'delete', airline: row }"
                      icon="Delete"
                      divided
                      class="danger-item"
                    >
                      Sil
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          :small="isMobile"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </BaseCard>

    <!-- Modals -->
    <BaseModal
      v-model="showDeleteModal"
      title="Havayolu Silme Onayı"
      width="500px"
    >
      <div class="delete-confirmation">
        <el-alert
          v-if="deleteCheckResult?.canDelete === false"
          type="warning"
          :title="deleteCheckResult.message"
          show-icon
          :closable="false"
        />

        <p class="delete-message">
          <strong>{{ airlineToDelete?.name }}</strong> havayolunu silmek istediğinizden emin misiniz?
        </p>

        <div v-if="deleteCheckResult?.dependencies" class="dependencies-info">
          <h4>Bu havayoluna bağlı veriler:</h4>
          <ul>
            <li v-if="deleteCheckResult.dependencies.flights > 0">
              {{ deleteCheckResult.dependencies.flights }} uçuş
            </li>
            <li v-if="deleteCheckResult.dependencies.aircraft > 0">
              {{ deleteCheckResult.dependencies.aircraft }} uçak
            </li>
          </ul>
        </div>
      </div>

      <template #footer>
        <div class="modal-footer">
          <BaseButton @click="showDeleteModal = false">
            İptal
          </BaseButton>
          <BaseButton
            v-if="deleteCheckResult?.canDelete !== false"
            type="danger"
            :loading="deleting"
            @click="confirmDelete"
          >
            Sil
          </BaseButton>
          <BaseButton
            v-else
            type="danger"
            :loading="deleting"
            @click="confirmForceDelete"
          >
            Zorla Sil
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Airline details modal -->
    <BaseModal
      v-model="showDetailsModal"
      title="Havayolu Detayları"
      width="800px"
    >
      <AirlineDetails
        v-if="selectedAirline"
        :airline="selectedAirline"
        @edit="editAirline"
        @close="showDetailsModal = false"
      />
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Ship, MoreFilled } from '@element-plus/icons-vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import AirlineDetails from '@/components/reference/AirlineDetails.vue'

import { useReferenceStore } from '@/stores/reference.js'
import { formatAirlineType } from '@/utils/formatters.js'
import { debounce } from '@/utils/helpers.js'
import { AIRLINE_TYPE } from '@/utils/constants.js'

// Composables
const router = useRouter()
const referenceStore = useReferenceStore()

// Reactive state
const searchQuery = ref('')
const refreshing = ref(false)
const selectedAirlines = ref([])
const showDeleteModal = ref(false)
const showDetailsModal = ref(false)
const airlineToDelete = ref(null)
const selectedAirline = ref(null)
const deleting = ref(false)
const deleteCheckResult = ref(null)
const isMobile = ref(window.innerWidth < 768)

// Filters
const filters = ref({
  type: null,
  country: null,
  status: null
})

// Sorting
const sortConfig = ref({
  prop: 'name',
  order: 'ascending'
})

// Pagination (local)
const pagination = ref({
  page: 1,
  size: 20,
  total: 0
})

// Computed properties
const airlines = computed(() => referenceStore.airlines)
const airlinesLoading = computed(() => referenceStore.airlinesLoading)

const airlineTypeOptions = computed(() => [
  { label: 'Tam Hizmet', value: AIRLINE_TYPE.FULL_SERVICE },
  { label: 'Düşük Maliyet', value: AIRLINE_TYPE.LOW_COST },
  { label: 'Kargo', value: AIRLINE_TYPE.CARGO },
  { label: 'Charter', value: AIRLINE_TYPE.CHARTER }
])

const countryOptions = computed(() => {
  const countries = [...new Set(airlines.value.map(airline => airline.country))]
  return countries.map(country => ({ label: country, value: country }))
})

const statusOptions = computed(() => [
  { label: 'Aktif', value: true },
  { label: 'Pasif', value: false }
])

const hasActiveFilters = computed(() => {
  return Object.values(filters.value).some(value => value !== null && value !== '')
})

const filteredAirlines = computed(() => {
  let result = [...(airlines.value || [])]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(airline =>
      airline.name.toLowerCase().includes(query) ||
      airline.iataCode.toLowerCase().includes(query) ||
      airline.icaoCode.toLowerCase().includes(query) ||
      airline.country.toLowerCase().includes(query)
    )
  }

  // Type filter
  if (filters.value.type) {
    result = result.filter(airline => airline.type === filters.value.type)
  }

  // Country filter
  if (filters.value.country) {
    result = result.filter(airline => airline.country === filters.value.country)
  }

  // Status filter
  if (filters.value.status !== null) {
    result = result.filter(airline => airline.active === filters.value.status)
  }

  // Sort
  result.sort((a, b) => {
    const aValue = a[sortConfig.value.prop] || ''
    const bValue = b[sortConfig.value.prop] || ''

    if (sortConfig.value.order === 'ascending') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Update pagination total
  pagination.value.total = result.length

  return result
})

const paginatedAirlines = computed(() => {
  const start = (pagination.value.page - 1) * pagination.value.size
  const end = start + pagination.value.size
  return (filteredAirlines.value || []).slice(start, end)
})

// Debounced search
const debouncedSearch = debounce(() => {
  pagination.value.page = 1 // Reset to first page on search
}, 300)

// Methods
const loadAirlines = async (useCache = true) => {
  try {
    await referenceStore.loadAirlines({
      page: 0,
      size: 1000 // Load all for client-side filtering
    }, useCache)
  } catch (error) {
    console.error('Error loading airlines:', error)
  }
}

const refreshData = async () => {
  refreshing.value = true
  try {
    await loadAirlines(false) // Force refresh
    ElMessage.success('Veriler yenilendi')
  } catch (error) {
    ElMessage.error('Veriler yenilenirken hata oluştu')
  } finally {
    refreshing.value = false
  }
}

const navigateToCreate = () => {
  router.push({ name: 'AirlineCreate' })
}

const viewAirline = async (airline) => {
  try {
    await referenceStore.getAirlineById(airline.id)
    selectedAirline.value = referenceStore.currentAirline
    showDetailsModal.value = true
  } catch (error) {
    console.error('Error loading airline details:', error)
  }
}

const editAirline = (airline) => {
  router.push({ name: 'AirlineEdit', params: { id: airline.id } })
}

const deleteAirline = async (airline) => {
  airlineToDelete.value = airline

  try {
    deleteCheckResult.value = await referenceStore.checkAirlineDeletion(airline.id)
    showDeleteModal.value = true
  } catch (error) {
    ElMessage.error('Silme kontrolü yapılırken hata oluştu')
  }
}

const confirmDelete = async () => {
  if (!airlineToDelete.value) return

  deleting.value = true
  try {
    await referenceStore.deleteAirline(airlineToDelete.value.id)
    showDeleteModal.value = false
    airlineToDelete.value = null
    deleteCheckResult.value = null
  } catch (error) {
    console.error('Error deleting airline:', error)
  } finally {
    deleting.value = false
  }
}

const confirmForceDelete = async () => {
  try {
    await ElMessageBox.confirm(
      'Bu işlem geri alınamaz ve tüm bağlı verileri silecektir!',
      'Zorla Silme Onayı',
      {
        type: 'error',
        confirmButtonText: 'Zorla Sil',
        cancelButtonText: 'İptal'
      }
    )

    deleting.value = true
    await referenceStore.deleteAirline(airlineToDelete.value.id, true)
    showDeleteModal.value = false
    airlineToDelete.value = null
    deleteCheckResult.value = null
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error force deleting airline:', error)
    }
  } finally {
    deleting.value = false
  }
}

const handleBulkDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `${selectedAirlines.value.length} havayolunu silmek istediğinizden emin misiniz?`,
      'Toplu Silme Onayı',
      {
        type: 'warning',
        confirmButtonText: 'Sil',
        cancelButtonText: 'İptal'
      }
    )

    const ids = selectedAirlines.value.map(airline => airline.id)
    await referenceStore.batchDeleteAirlines(ids)
    selectedAirlines.value = []
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error in bulk delete:', error)
    }
  }
}

const handleDropdownAction = ({ action, airline }) => {
  switch (action) {
    case 'toggle-status':
      toggleAirlineStatus(airline)
      break
    case 'duplicate':
      duplicateAirline(airline)
      break
    case 'export':
      exportAirline(airline)
      break
    case 'delete':
      deleteAirline(airline)
      break
  }
}

const toggleAirlineStatus = async (airline) => {
  try {
    const updatedData = { ...airline, active: !airline.active }
    await referenceStore.updateAirline(airline.id, updatedData)
    ElMessage.success(`Havayolu ${airline.active ? 'pasifleştirildi' : 'aktifleştirildi'}`)
  } catch (error) {
    console.error('Error toggling airline status:', error)
  }
}

const duplicateAirline = (airline) => {
  const duplicateData = {
    ...airline,
    name: `${airline.name} (Kopya)`,
    iataCode: '',
    icaoCode: ''
  }
  router.push({
    name: 'AirlineCreate',
    query: { duplicate: JSON.stringify(duplicateData) }
  })
}

const exportAirline = (airline) => {
  // Export single airline logic
  ElMessage.info('Tekil dışa aktarma özelliği yakında gelecek')
}

const exportData = () => {
  // Export all airlines logic
  ElMessage.info('Dışa aktarma özelliği yakında gelecek')
}

const handleSearch = () => {
  debouncedSearch()
}

const handleFilterChange = () => {
  pagination.value.page = 1
}

const clearFilters = () => {
  filters.value = {
    type: null,
    country: null,
    status: null
  }
  searchQuery.value = ''
  pagination.value.page = 1
}

const handleSelectionChange = (selection) => {
  selectedAirlines.value = selection
}

const handleSortChange = ({ prop, order }) => {
  sortConfig.value = { prop, order }
}

const handlePageChange = (page) => {
  pagination.value.page = page
}

const handlePageSizeChange = (size) => {
  pagination.value.size = size
  pagination.value.page = 1
}

const getAirlineTypeColor = (type) => {
  const colorMap = {
    [AIRLINE_TYPE.FULL_SERVICE]: 'primary',
    [AIRLINE_TYPE.LOW_COST]: 'success',
    [AIRLINE_TYPE.CARGO]: 'warning',
    [AIRLINE_TYPE.CHARTER]: 'info'
  }
  return colorMap[type] || 'default'
}

const getCountryFlag = (country) => {
  // Simple country to flag emoji mapping
  const flagMap = {
    'Turkey': '🇹🇷',
    'United States': '🇺🇸',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'United Kingdom': '🇬🇧'
  }
  return flagMap[country] || '🌍'
}

const handleLogoError = (event) => {
  event.target.style.display = 'none'
}

const handleResize = () => {
  isMobile.value = window.innerWidth < 768
}

// Lifecycle
onMounted(async () => {
  await loadAirlines()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Watch for filter changes
watch(filters, () => {
  handleFilterChange()
}, { deep: true })

// Page meta - handled by router configuration
</script>

<style scoped>
.airline-management {
  padding: 0;
}

/* Page header */
.page-header {
  background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
  color: white;
  padding: 32px 24px;
  margin: -24px -24px 24px -24px;
  border-radius: 0 0 16px 16px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  max-width: 1400px;
  margin: 0 auto;
  gap: 24px;
}

.header-info {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.page-description {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
  line-height: 1.4;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

/* Filters */
.filters-card {
  margin-bottom: 24px;
}

.filters-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-section {
  flex: 1;
}

.search-input {
  max-width: 400px;
}

.filter-section {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

/* Results summary */
.results-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.summary-text {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.selected-count {
  color: var(--el-color-primary);
  font-weight: 500;
}

.bulk-actions {
  display: flex;
  gap: 8px;
}

/* Table */
.table-card {
  margin-bottom: 0;
}

.airlines-table {
  width: 100%;
}

/* Table cell content */
.airline-logo {
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo-image {
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: 4px;
}

.logo-placeholder {
  width: 40px;
  height: 40px;
  background: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.airline-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.airline-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
  line-height: 1.3;
}

.airline-codes {
  display: flex;
  gap: 4px;
}

.country-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.country-flag {
  font-size: 16px;
}

.country-name {
  font-size: 13px;
}

.airline-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: center;
}

/* Pagination */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px 0;
  border-top: 1px solid var(--el-border-color-lighter);
  margin-top: 16px;
}

/* Modal content */
.delete-confirmation {
  padding: 16px 0;
}

.delete-message {
  margin: 16px 0;
  font-size: 14px;
  line-height: 1.5;
}

.dependencies-info {
  margin-top: 16px;
  padding: 12px;
  background: var(--el-color-warning-light-9);
  border-radius: 4px;
}

.dependencies-info h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--el-color-warning-dark-2);
}

.dependencies-info ul {
  margin: 0;
  padding-left: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Responsive design */
@media (max-width: 1024px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .header-actions {
    justify-content: center;
  }

  .filter-section {
    justify-content: center;
  }

  .results-summary {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 24px 16px;
    margin: -24px -16px 24px -16px;
  }

  .page-title {
    font-size: 24px;
  }

  .header-actions {
    flex-direction: column;
  }

  .filters-section {
    gap: 12px;
  }

  .search-input {
    max-width: none;
  }

  .filter-section {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-section > * {
    width: 100% !important;
  }

  .airlines-table {
    font-size: 12px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 2px;
  }
}

/* Dropdown danger item */
:deep(.danger-item) {
  color: var(--el-color-danger);
}

:deep(.danger-item:hover) {
  background-color: var(--el-color-danger-light-9);
}

/* High contrast mode */
@media (prefers-contrast: more) {
  .page-header {
    border: 2px solid white;
  }

  .airlines-table {
    border-width: 2px;
  }

  .logo-placeholder {
    border: 1px solid var(--el-color-primary);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .page-header,
  .action-buttons > *,
  .airline-logo {
    transition: none;
  }
}

/* Print styles */
@media print {
  .page-header {
    background: white !important;
    color: black !important;
    border-bottom: 2px solid black;
  }

  .header-actions,
  .filters-card,
  .bulk-actions,
  .action-buttons {
    display: none;
  }

  .airlines-table {
    break-inside: auto;
  }

  .pagination-wrapper {
    display: none;
  }
}
</style>

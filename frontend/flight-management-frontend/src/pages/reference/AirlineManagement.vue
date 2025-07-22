<template>
  <div class="airline-management">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="page-title">
          <el-icon size="24"><Ship /></el-icon>
          <h1>Havayolu Yönetimi</h1>
          <el-tag :type="airlines.length > 0 ? 'success' : 'info'">
            {{ airlines.length }} Havayolu
          </el-tag>
        </div>

        <div class="header-actions">
          <el-button
            type="primary"
            :icon="Plus"
            @click="handleCreate"
            :loading="loading"
          >
            Yeni Havayolu
          </el-button>

          <el-dropdown @command="handleBulkAction" :disabled="selectedRows.length === 0">
            <el-button :disabled="selectedRows.length === 0">
              Toplu İşlemler
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="activate" :icon="Check">
                  Seçilenleri Aktifleştir
                </el-dropdown-item>
                <el-dropdown-item command="deactivate" :icon="Close">
                  Seçilenleri Pasifleştir
                </el-dropdown-item>
                <el-dropdown-item command="delete" :icon="Delete" divided>
                  Seçilenleri Sil
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-button :icon="Refresh" @click="handleRefresh" :loading="loading">
            Yenile
          </el-button>

          <el-button :icon="Download" @click="handleExport">
            Dışa Aktar
          </el-button>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="search-filters">
        <div class="search-bar">
          <el-input
            v-model="searchQuery"
            placeholder="Havayolu ara... (kod, ad, ülke)"
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
            @clear="handleSearchClear"
            class="search-input"
          />
        </div>

        <div class="filters">
          <el-select
            v-model="filterCountry"
            placeholder="Ülke"
            clearable
            @change="handleFilter"
            class="filter-select"
          >
            <el-option
              v-for="country in availableCountries"
              :key="country.code"
              :label="country.name"
              :value="country.code"
            >
              <span class="country-option">
                <span class="country-flag">{{ country.flag }}</span>
                <span>{{ country.name }}</span>
              </span>
            </el-option>
          </el-select>

          <el-select
            v-model="filterStatus"
            placeholder="Durum"
            clearable
            @change="handleFilter"
            class="filter-select"
          >
            <el-option label="Aktif" value="active" />
            <el-option label="Pasif" value="inactive" />
          </el-select>

          <el-button :icon="Filter" @click="toggleAdvancedFilters">
            {{ showAdvancedFilters ? 'Basit' : 'Gelişmiş' }} Filtre
          </el-button>
        </div>
      </div>

      <!-- Advanced Filters -->
      <el-collapse-transition>
        <div v-show="showAdvancedFilters" class="advanced-filters">
          <el-card shadow="never">
            <div class="advanced-filters-grid">
              <el-form-item label="Kuruluş Yılı">
                <el-date-picker
                  v-model="filterFoundedYear"
                  type="year"
                  placeholder="Yıl seçin"
                  @change="handleFilter"
                />
              </el-form-item>

              <el-form-item label="Filo Büyüklüğü">
                <el-input-number
                  v-model="filterFleetSize"
                  :min="1"
                  placeholder="Min. uçak sayısı"
                  @change="handleFilter"
                />
              </el-form-item>

              <el-form-item>
                <el-button @click="clearFilters">Filtreleri Temizle</el-button>
              </el-form-item>
            </div>
          </el-card>
        </div>
      </el-collapse-transition>
    </div>

    <!-- Data Table -->
    <div class="table-container">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="filteredAirlines"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
        row-key="id"
        class="data-table"
        empty-text="Havayolu bulunamadı"
        :default-sort="{ prop: 'name', order: 'ascending' }"
      >
        <!-- Selection Column -->
        <el-table-column type="selection" width="55" fixed="left" />

        <!-- Index Column -->
        <el-table-column type="index" label="#" width="60" />

        <!-- Code Column -->
        <el-table-column
          prop="code"
          label="Kod"
          width="80"
          sortable
          fixed="left"
        >
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{ row.code }}</el-tag>
          </template>
        </el-table-column>

        <!-- Name Column -->
        <el-table-column
          prop="name"
          label="Havayolu Adı"
          min-width="200"
          sortable
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div class="airline-name">
              <span class="name">{{ row.name }}</span>
              <div class="country">
                <span class="flag">{{ getCountryFlag(row.country) }}</span>
                <span>{{ getCountryName(row.country) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Contact Info Column -->
        <el-table-column label="İletişim" min-width="150">
          <template #default="{ row }">
            <div class="contact-info">
              <div v-if="row.website" class="contact-item">
                <el-icon><Link /></el-icon>
                <a :href="row.website" target="_blank" class="link">Website</a>
              </div>
              <div v-if="row.email" class="contact-item">
                <el-icon><Message /></el-icon>
                <span>{{ row.email }}</span>
              </div>
              <div v-if="row.phone" class="contact-item">
                <el-icon><Phone /></el-icon>
                <span>{{ row.phone }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Fleet Info Column -->
        <el-table-column label="Filo Bilgisi" width="120" align="center">
          <template #default="{ row }">
            <div class="fleet-info">
              <div v-if="row.fleetSize" class="fleet-size">
                <el-icon><Promotion /></el-icon>
                <span>{{ row.fleetSize }} Uçak</span>
              </div>
              <div v-if="row.foundedYear" class="founded-year">
                <el-icon><Calendar /></el-icon>
                <span>{{ row.foundedYear }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Status Column -->
        <el-table-column prop="active" label="Durum" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.active"
              @change="handleStatusChange(row)"
              :loading="row.statusLoading"
              active-text="Aktif"
              inactive-text="Pasif"
            />
          </template>
        </el-table-column>

        <!-- Actions Column -->
        <el-table-column label="İşlemler" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-tooltip content="Görüntüle" placement="top">
                <el-button
                  :icon="View"
                  size="small"
                  @click="handleView(row)"
                />
              </el-tooltip>

              <el-tooltip content="Düzenle" placement="top">
                <el-button
                  :icon="Edit"
                  size="small"
                  type="primary"
                  @click="handleEdit(row)"
                />
              </el-tooltip>

              <el-tooltip content="Sil" placement="top">
                <el-button
                  :icon="Delete"
                  size="small"
                  type="danger"
                  @click="handleDelete(row)"
                />
              </el-tooltip>

              <el-dropdown @command="(command) => handleRowAction(command, row)">
                <el-button :icon="MoreFilled" size="small" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="duplicate" :icon="CopyDocument">
                      Kopyala
                    </el-dropdown-item>
                    <el-dropdown-item command="aircrafts" :icon="Promotion">
                      Uçakları Görüntüle
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalAirlines"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? 'Yeni Havayolu Ekle' : 'Havayolu Düzenle'"
      width="800px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="handleDialogClose"
    >
      <AirlineForm
        v-model="currentAirline"
        :is-editing="dialogMode === 'edit'"
        :submitting="submitting"
        @submit="handleFormSubmit"
        @cancel="handleDialogClose"
      />
    </el-dialog>

    <!-- View Dialog -->
    <el-dialog
      v-model="viewDialogVisible"
      title="Havayolu Detayları"
      width="600px"
    >
      <div v-if="viewingAirline" class="airline-details">
        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">Kod:</span>
            <el-tag type="primary">{{ viewingAirline.code }}</el-tag>
          </div>
          <div class="detail-item">
            <span class="label">Ad:</span>
            <span>{{ viewingAirline.name }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Ülke:</span>
            <span>
              {{ getCountryFlag(viewingAirline.country) }}
              {{ getCountryName(viewingAirline.country) }}
            </span>
          </div>
          <div class="detail-item">
            <span class="label">Durum:</span>
            <el-tag :type="viewingAirline.active ? 'success' : 'danger'">
              {{ viewingAirline.active ? 'Aktif' : 'Pasif' }}
            </el-tag>
          </div>
          <div class="detail-item" v-if="viewingAirline.website">
            <span class="label">Website:</span>
            <a :href="viewingAirline.website" target="_blank" class="link">
              {{ viewingAirline.website }}
            </a>
          </div>
          <div class="detail-item" v-if="viewingAirline.email">
            <span class="label">E-posta:</span>
            <span>{{ viewingAirline.email }}</span>
          </div>
          <div class="detail-item" v-if="viewingAirline.phone">
            <span class="label">Telefon:</span>
            <span>{{ viewingAirline.phone }}</span>
          </div>
          <div class="detail-item" v-if="viewingAirline.headquarters">
            <span class="label">Merkez:</span>
            <span>{{ viewingAirline.headquarters }}</span>
          </div>
          <div class="detail-item" v-if="viewingAirline.foundedYear">
            <span class="label">Kuruluş Yılı:</span>
            <span>{{ viewingAirline.foundedYear }}</span>
          </div>
          <div class="detail-item" v-if="viewingAirline.fleetSize">
            <span class="label">Filo Büyüklüğü:</span>
            <span>{{ viewingAirline.fleetSize }} Uçak</span>
          </div>
          <div class="detail-item full-width" v-if="viewingAirline.description">
            <span class="label">Açıklama:</span>
            <p>{{ viewingAirline.description }}</p>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Ship,
  Plus,
  ArrowDown,
  Check,
  Close,
  Delete,
  Refresh,
  Download,
  Search,
  Filter,
  View,
  Edit,
  MoreFilled,
  CopyDocument,
  Promotion,
  Link,
  Message,
  Phone,
  Calendar
} from '@element-plus/icons-vue'
import { useReferenceStore } from '@/stores/reference.js'
import { useAppStore } from '@/stores/app.js'
import AirlineForm from '@/components/forms/AirlineForm.vue'

// Stores
const referenceStore = useReferenceStore()
const appStore = useAppStore()
const router = useRouter()

// Reactive state
const loading = ref(false)
const submitting = ref(false)
const tableRef = ref(null)
const selectedRows = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const searchQuery = ref('')
const filterCountry = ref('')
const filterStatus = ref('')
const filterFoundedYear = ref('')
const filterFleetSize = ref('')
const showAdvancedFilters = ref(false)
const sortField = ref('name')
const sortOrder = ref('ascending')

// Dialog state
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const dialogMode = ref('create') // 'create' | 'edit'
const currentAirline = ref({})
const viewingAirline = ref(null)

// Countries mapping
const countries = {
  'TR': { name: 'Türkiye', flag: '🇹🇷' },
  'US': { name: 'ABD', flag: '🇺🇸' },
  'GB': { name: 'İngiltere', flag: '🇬🇧' },
  'DE': { name: 'Almanya', flag: '🇩🇪' },
  'FR': { name: 'Fransa', flag: '🇫🇷' },
  'IT': { name: 'İtalya', flag: '🇮🇹' },
  'ES': { name: 'İspanya', flag: '🇪🇸' },
  'NL': { name: 'Hollanda', flag: '🇳🇱' },
  'AE': { name: 'BAE', flag: '🇦🇪' },
  'QA': { name: 'Katar', flag: '🇶🇦' }
}

// Computed
const airlines = computed(() => referenceStore.airlines)

const availableCountries = computed(() => {
  const countrySet = new Set(airlines.value.map(a => a.country))
  return Array.from(countrySet).map(code => ({
    code,
    name: countries[code]?.name || code,
    flag: countries[code]?.flag || '🌍'
  }))
})

const filteredAirlines = computed(() => {
  let result = [...airlines.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(airline =>
      airline.code.toLowerCase().includes(query) ||
      airline.name.toLowerCase().includes(query) ||
      getCountryName(airline.country).toLowerCase().includes(query)
    )
  }

  // Country filter
  if (filterCountry.value) {
    result = result.filter(airline => airline.country === filterCountry.value)
  }

  // Status filter
  if (filterStatus.value) {
    const isActive = filterStatus.value === 'active'
    result = result.filter(airline => airline.active === isActive)
  }

  // Founded year filter
  if (filterFoundedYear.value) {
    const year = new Date(filterFoundedYear.value).getFullYear()
    result = result.filter(airline => airline.foundedYear === year)
  }

  // Fleet size filter
  if (filterFleetSize.value) {
    result = result.filter(airline =>
      airline.fleetSize && airline.fleetSize >= filterFleetSize.value
    )
  }

  // Sort
  result.sort((a, b) => {
    const aVal = a[sortField.value] || ''
    const bVal = b[sortField.value] || ''

    if (sortOrder.value === 'ascending') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })

  return result
})

const totalAirlines = computed(() => filteredAirlines.value.length)

// Methods
function getCountryName(code) {
  return countries[code]?.name || code
}

function getCountryFlag(code) {
  return countries[code]?.flag || '🌍'
}

async function loadAirlines() {
  loading.value = true
  try {
    await referenceStore.fetchAirlines(true) // Force refresh
  } catch (error) {
    ElMessage.error('Havayolları yüklenirken hata oluştu')
  } finally {
    loading.value = false
  }
}

function handleCreate() {
  dialogMode.value = 'create'
  currentAirline.value = {
    active: true,
    country: 'TR'
  }
  dialogVisible.value = true
}

function handleEdit(airline) {
  dialogMode.value = 'edit'
  currentAirline.value = { ...airline }
  dialogVisible.value = true
}

function handleView(airline) {
  viewingAirline.value = airline
  viewDialogVisible.value = true
}

async function handleDelete(airline) {
  try {
    await ElMessageBox.confirm(
      `"${airline.name}" havayolunu silmek istediğinizden emin misiniz?`,
      'Havayolu Sil',
      {
        confirmButtonText: 'Sil',
        cancelButtonText: 'İptal',
        type: 'warning'
      }
    )

    await referenceStore.deleteAirline(airline.id)
    ElMessage.success('Havayolu başarıyla silindi')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Havayolu silinirken hata oluştu')
    }
  }
}

async function handleStatusChange(airline) {
  airline.statusLoading = true
  try {
    await referenceStore.updateAirline(airline.id, { active: airline.active })
    ElMessage.success(`Havayolu ${airline.active ? 'aktifleştirildi' : 'pasifleştirildi'}`)
  } catch (error) {
    airline.active = !airline.active // Revert change
    ElMessage.error('Durum güncellenirken hata oluştu')
  } finally {
    airline.statusLoading = false
  }
}

async function handleFormSubmit(formData) {
  submitting.value = true
  try {
    if (dialogMode.value === 'create') {
      await referenceStore.createAirline(formData)
      ElMessage.success('Havayolu başarıyla oluşturuldu')
    } else {
      await referenceStore.updateAirline(currentAirline.value.id, formData)
      ElMessage.success('Havayolu başarıyla güncellendi')
    }

    dialogVisible.value = false
    currentAirline.value = {}
  } catch (error) {
    ElMessage.error(
      dialogMode.value === 'create'
        ? 'Havayolu oluşturulurken hata oluştu'
        : 'Havayolu güncellenirken hata oluştu'
    )
  } finally {
    submitting.value = false
  }
}

function handleDialogClose() {
  dialogVisible.value = false
  currentAirline.value = {}
}

function handleSelectionChange(selection) {
  selectedRows.value = selection
}

function handleSortChange({ prop, order }) {
  sortField.value = prop
  sortOrder.value = order
}

function handleSearch() {
  currentPage.value = 1
}

function handleSearchClear() {
  searchQuery.value = ''
  currentPage.value = 1
}

function handleFilter() {
  currentPage.value = 1
}

function toggleAdvancedFilters() {
  showAdvancedFilters.value = !showAdvancedFilters.value
}

function clearFilters() {
  filterCountry.value = ''
  filterStatus.value = ''
  filterFoundedYear.value = ''
  filterFleetSize.value = ''
  currentPage.value = 1
}

function handleRefresh() {
  loadAirlines()
}

function handleExport() {
  // TODO: Implement export functionality
  ElMessage.info('Dışa aktarma özelliği yakında eklenecek')
}

async function handleBulkAction(command) {
  if (selectedRows.value.length === 0) return

  try {
    const count = selectedRows.value.length
    await ElMessageBox.confirm(
      `${count} havayolu için ${command} işlemini gerçekleştirmek istediğinizden emin misiniz?`,
      'Toplu İşlem',
      {
        confirmButtonText: 'Evet',
        cancelButtonText: 'İptal',
        type: 'warning'
      }
    )

    // TODO: Implement bulk actions
    switch (command) {
      case 'activate':
        ElMessage.success(`${count} havayolu aktifleştirildi`)
        break
      case 'deactivate':
        ElMessage.success(`${count} havayolu pasifleştirildi`)
        break
      case 'delete':
        ElMessage.success(`${count} havayolu silindi`)
        break
    }

    selectedRows.value = []
    await loadAirlines()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Toplu işlem sırasında hata oluştu')
    }
  }
}

function handleRowAction(command, airline) {
  switch (command) {
    case 'duplicate':
      dialogMode.value = 'create'
      currentAirline.value = {
        ...airline,
        id: undefined,
        code: '',
        name: `${airline.name} (Kopya)`
      }
      dialogVisible.value = true
      break
    case 'aircrafts':
      router.push({
        name: 'Aircrafts',
        query: { airline: airline.id }
      })
      break
  }
}

function handleSizeChange(size) {
  pageSize.value = size
  currentPage.value = 1
}

function handlePageChange(page) {
  currentPage.value = page
}

// Lifecycle
onMounted(async () => {
  appStore.setPageTitle('Havayolu Yönetimi')
  await loadAirlines()
})

// Watch for route query changes
watch(() => router.currentRoute.value.query, (query) => {
  if (query.search) {
    searchQuery.value = query.search
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
.airline-management {
  padding: 1.5rem;

  .page-header {
    margin-bottom: 2rem;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;

      .page-title {
        display: flex;
        align-items: center;
        gap: 1rem;

        h1 {
          margin: 0;
          font-size: 1.75rem;
          font-weight: 600;
          color: #303133;
        }
      }

      .header-actions {
        display: flex;
        gap: 0.75rem;
      }
    }

    .search-filters {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;

      .search-bar {
        flex: 1;
        max-width: 400px;

        .search-input {
          width: 100%;
        }
      }

      .filters {
        display: flex;
        gap: 0.75rem;
        align-items: center;

        .filter-select {
          width: 120px;
        }
      }
    }

    .advanced-filters {
      margin-top: 1rem;

      .advanced-filters-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        align-items: end;
      }
    }
  }

  .table-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .data-table {
      .airline-name {
        .name {
          font-weight: 500;
          color: #303133;
          display: block;
          margin-bottom: 0.25rem;
        }

        .country {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.875rem;
          color: #909399;

          .flag {
            font-size: 1rem;
          }
        }
      }

      .contact-info {
        .contact-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-bottom: 0.25rem;
          font-size: 0.875rem;

          .el-icon {
            color: #909399;
            font-size: 0.75rem;
          }

          .link {
            color: #409eff;
            text-decoration: none;

            &:hover {
              text-decoration: underline;
            }
          }
        }
      }

      .fleet-info {
        text-align: center;

        div {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          margin-bottom: 0.25rem;
          font-size: 0.875rem;

          .el-icon {
            color: #909399;
            font-size: 0.75rem;
          }
        }
      }

      .action-buttons {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
      }
    }

    .pagination-container {
      padding: 1rem;
      display: flex;
      justify-content: center;
      border-top: 1px solid #ebeef5;
    }
  }

  .country-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .country-flag {
      font-size: 1.2rem;
    }
  }

  .airline-details {
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;

      .detail-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        &.full-width {
          grid-column: 1 / -1;
        }

        .label {
          font-weight: 600;
          color: #606266;
          font-size: 0.875rem;
        }

        .link {
          color: #409eff;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }

        p {
          margin: 0;
          line-height: 1.6;
        }
      }
    }
  }
}

// Responsive
@media (max-width: 768px) {
  .airline-management {
    padding: 1rem;

    .page-header {
      .header-content {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;

        .page-title {
          justify-content: center;
        }

        .header-actions {
          justify-content: center;
          flex-wrap: wrap;
        }
      }

      .search-filters {
        flex-direction: column;
        align-items: stretch;

        .filters {
          justify-content: center;
          flex-wrap: wrap;
        }
      }

      .advanced-filters {
        .advanced-filters-grid {
          grid-template-columns: 1fr;
        }
      }
    }

    .table-container {
      .data-table {
        :deep(.el-table__body-wrapper) {
          overflow-x: auto;
        }
      }
    }

    .airline-details {
      .detail-grid {
        grid-template-columns: 1fr;

        .detail-item {
          &.full-width {
            grid-column: 1;
          }
        }
      }
    }
  }
}

// Table animations
:deep(.el-table__row) {
  transition: all 0.3s ease;

  &:hover {
    background-color: #f5f7fa;
  }
}

// Loading state
:deep(.el-loading-mask) {
  border-radius: 8px;
}

// Switch styling
:deep(.el-switch) {
  &.is-checked .el-switch__core {
    background-color: #67c23a;
  }
}

// Tag styling
:deep(.el-tag) {
  &.el-tag--primary {
    background-color: #409eff;
    border-color: #409eff;
  }
}

// Button group styling
.action-buttons {
  :deep(.el-button) {
    &:hover {
      transform: translateY(-1px);
    }
  }
}

// Dialog animations
:deep(.el-dialog) {
  .el-dialog__header {
    border-bottom: 1px solid #ebeef5;
    padding-bottom: 1rem;
  }

  .el-dialog__body {
    padding-top: 1.5rem;
  }
}

// Empty state
:deep(.el-table__empty-block) {
  padding: 4rem 0;

  .el-table__empty-text {
    color: #909399;
    font-size: 1rem;
  }
}
</style>

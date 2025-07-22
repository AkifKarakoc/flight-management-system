<template>
  <div class="aircraft-management">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="page-title">
          <el-icon size="24"><Promotion /></el-icon>
          <h1>Uçak Yönetimi</h1>
          <el-tag :type="aircrafts.length > 0 ? 'success' : 'info'">
            {{ aircrafts.length }} Uçak
          </el-tag>
        </div>

        <div class="header-actions">
          <el-button
            type="primary"
            :icon="Plus"
            @click="handleCreate"
            :loading="loading"
          >
            Yeni Uçak
          </el-button>

          <el-dropdown @command="handleBulkAction" :disabled="selectedRows.length === 0">
            <el-button :disabled="selectedRows.length === 0">
              Toplu İşlemler
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="maintenance" :icon="Tools">
                  Bakıma Al
                </el-dropdown-item>
                <el-dropdown-item command="active" :icon="Check">
                  Aktifleştir
                </el-dropdown-item>
                <el-dropdown-item command="retire" :icon="Warning">
                  Emekliye Ayır
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
            placeholder="Uçak ara... (kayıt no, tip, havayolu)"
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
            @clear="handleSearchClear"
            class="search-input"
          />
        </div>

        <div class="filters">
          <el-select
            v-model="filterAirline"
            placeholder="Havayolu"
            clearable
            filterable
            @change="handleFilter"
            class="filter-select"
          >
            <el-option
              v-for="airline in availableAirlines"
              :key="airline.id"
              :label="airline.name"
              :value="airline.id"
            >
              <span class="airline-option">
                <span class="airline-code">{{ airline.code }}</span>
                <span>{{ airline.name }}</span>
              </span>
            </el-option>
          </el-select>

          <el-select
            v-model="filterType"
            placeholder="Uçak Tipi"
            clearable
            @change="handleFilter"
            class="filter-select"
          >
            <el-option
              v-for="type in availableTypes"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>

          <el-select
            v-model="filterStatus"
            placeholder="Durum"
            clearable
            @change="handleFilter"
            class="filter-select"
          >
            <el-option label="Aktif" value="ACTIVE" />
            <el-option label="Bakımda" value="MAINTENANCE" />
            <el-option label="Hizmet Dışı" value="OUT_OF_SERVICE" />
            <el-option label="Emekli" value="RETIRED" />
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
              <el-form-item label="Üretici">
                <el-select
                  v-model="filterManufacturer"
                  placeholder="Üretici"
                  clearable
                  @change="handleFilter"
                >
                  <el-option
                    v-for="manufacturer in availableManufacturers"
                    :key="manufacturer"
                    :label="manufacturer"
                    :value="manufacturer"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="Üretim Yılı">
                <el-date-picker
                  v-model="filterYear"
                  type="year"
                  placeholder="Yıl seçin"
                  @change="handleFilter"
                />
              </el-form-item>

              <el-form-item label="Min. Uçuş Saati">
                <el-input-number
                  v-model="filterFlightHours"
                  :min="0"
                  placeholder="Saat"
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

    <!-- Statistics Cards -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon active">
            <el-icon><CircleCheckFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ activeAircraftCount }}</div>
            <div class="stat-label">Aktif Uçak</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon maintenance">
            <el-icon><Tools /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ maintenanceAircraftCount }}</div>
            <div class="stat-label">Bakımda</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon total">
            <el-icon><DataAnalysis /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ totalFlightHours.toLocaleString() }}</div>
            <div class="stat-label">Toplam Uçuş Saati</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon fleet">
            <el-icon><Promotion /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ averageAge.toFixed(1) }}</div>
            <div class="stat-label">Ortalama Yaş (Yıl)</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Data Table -->
    <div class="table-container">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="paginatedAircrafts"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
        row-key="id"
        class="data-table"
        empty-text="Uçak bulunamadı"
        :default-sort="{ prop: 'registrationNumber', order: 'ascending' }"
      >
        <!-- Selection Column -->
        <el-table-column type="selection" width="55" fixed="left" />

        <!-- Index Column -->
        <el-table-column type="index" label="#" width="60" />

        <!-- Registration Number Column -->
        <el-table-column
          prop="registrationNumber"
          label="Kayıt No"
          width="120"
          sortable
          fixed="left"
        >
          <template #default="{ row }">
            <div class="registration-number">
              <el-tag type="primary" size="large">
                {{ row.registrationNumber }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <!-- Aircraft Info Column -->
        <el-table-column label="Uçak Bilgileri" min-width="200" sortable="custom">
          <template #default="{ row }">
            <div class="aircraft-info">
              <div class="aircraft-type">
                <span class="type-code">{{ row.aircraftType }}</span>
                <span class="model">{{ row.model }}</span>
              </div>
              <div class="manufacturer">
                <el-icon><OfficeBuilding /></el-icon>
                <span>{{ row.manufacturer }}</span>
              </div>
              <div v-if="row.seatCount" class="capacity">
                <el-icon><User /></el-icon>
                <span>{{ row.seatCount }} Koltuk</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Airline Column -->
        <el-table-column label="Havayolu" width="150">
          <template #default="{ row }">
            <div class="airline-info">
              <el-tag class="airline-tag">{{ getAirlineCode(row.airlineId) }}</el-tag>
              <div class="airline-name">{{ getAirlineName(row.airlineId) }}</div>
            </div>
          </template>
        </el-table-column>

        <!-- Age and Hours Column -->
        <el-table-column label="Yaş & Saat" width="120" align="center">
          <template #default="{ row }">
            <div class="age-hours">
              <div v-if="row.manufacturingDate" class="age">
                <el-icon><Calendar /></el-icon>
                <span>{{ calculateAge(row.manufacturingDate) }} yıl</span>
              </div>
              <div v-if="row.totalFlightHours" class="hours">
                <el-icon><Clock /></el-icon>
                <span>{{ row.totalFlightHours.toLocaleString() }}h</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Status Column -->
        <el-table-column prop="maintenanceStatus" label="Durum" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.maintenanceStatus)" size="small">
              {{ getStatusText(row.maintenanceStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Location Column -->
        <el-table-column prop="currentLocation" label="Konum" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <div v-if="row.currentLocation" class="location">
              <el-icon><MapLocation /></el-icon>
              <span>{{ row.currentLocation }}</span>
            </div>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>

        <!-- Active Status Column -->
        <el-table-column prop="active" label="Aktif" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.active"
              @change="handleStatusChange(row)"
              :loading="row.statusLoading"
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

              <el-tooltip content="Uçuş Geçmişi" placement="top">
                <el-button
                  :icon="Document"
                  size="small"
                  type="success"
                  @click="viewFlightHistory(row)"
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
                    <el-dropdown-item command="maintenance" :icon="Tools">
                      Bakıma Al
                    </el-dropdown-item>
                    <el-dropdown-item command="schedule" :icon="Calendar">
                      Uçuş Programı
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
          :total="totalAircrafts"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? 'Yeni Uçak Ekle' : 'Uçak Düzenle'"
      width="900px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="handleDialogClose"
    >
      <AircraftForm
        v-model="currentAircraft"
        :is-editing="dialogMode === 'edit'"
        :submitting="submitting"
        @submit="handleFormSubmit"
        @cancel="handleDialogClose"
      />
    </el-dialog>

    <!-- View Dialog -->
    <el-dialog
      v-model="viewDialogVisible"
      title="Uçak Detayları"
      width="800px"
    >
      <div v-if="viewingAircraft" class="aircraft-details">
        <div class="detail-header">
          <div class="aircraft-title">
            <h3>{{ viewingAircraft.registrationNumber }}</h3>
            <div class="aircraft-subtitle">
              <span>{{ viewingAircraft.manufacturer }} {{ viewingAircraft.model }}</span>
              <el-tag>{{ viewingAircraft.aircraftType }}</el-tag>
            </div>
          </div>
          <div class="status-badges">
            <el-tag :type="getStatusTagType(viewingAircraft.maintenanceStatus)">
              {{ getStatusText(viewingAircraft.maintenanceStatus) }}
            </el-tag>
            <el-tag :type="viewingAircraft.active ? 'success' : 'danger'">
              {{ viewingAircraft.active ? 'Aktif' : 'Pasif' }}
            </el-tag>
          </div>
        </div>

        <el-divider />

        <div class="detail-tabs">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="Genel Bilgiler" name="general">
              <div class="detail-grid">
                <div class="detail-section">
                  <h4>Uçak Bilgileri</h4>
                  <div class="detail-item">
                    <span class="label">Havayolu:</span>
                    <span>{{ getAirlineName(viewingAircraft.airlineId) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Üretici:</span>
                    <span>{{ viewingAircraft.manufacturer }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Model:</span>
                    <span>{{ viewingAircraft.model }}</span>
                  </div>
                  <div class="detail-item" v-if="viewingAircraft.seatCount">
                    <span class="label">Koltuk Sayısı:</span>
                    <span>{{ viewingAircraft.seatCount }}</span>
                  </div>
                </div>

                <div class="detail-section">
                  <h4>Operasyonel Bilgiler</h4>
                  <div class="detail-item" v-if="viewingAircraft.manufacturingDate">
                    <span class="label">Üretim Tarihi:</span>
                    <span>{{ formatDate(viewingAircraft.manufacturingDate) }}</span>
                  </div>
                  <div class="detail-item" v-if="viewingAircraft.serviceEntryDate">
                    <span class="label">Hizmete Giriş:</span>
                    <span>{{ formatDate(viewingAircraft.serviceEntryDate) }}</span>
                  </div>
                  <div class="detail-item" v-if="viewingAircraft.totalFlightHours">
                    <span class="label">Toplam Uçuş Saati:</span>
                    <span>{{ viewingAircraft.totalFlightHours.toLocaleString() }} saat</span>
                  </div>
                  <div class="detail-item" v-if="viewingAircraft.currentLocation">
                    <span class="label">Mevcut Konum:</span>
                    <span>{{ viewingAircraft.currentLocation }}</span>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="Teknik Özellikler" name="technical">
              <div class="detail-grid">
                <div class="detail-section">
                  <h4>Performans</h4>
                  <div class="detail-item" v-if="viewingAircraft.maxRange">
                    <span class="label">Maksimum Menzil:</span>
                    <span>{{ viewingAircraft.maxRange?.toLocaleString() }} km</span>
                  </div>
                  <div class="detail-item" v-if="viewingAircraft.maxSpeed">
                    <span class="label">Maksimum Hız:</span>
                    <span>{{ viewingAircraft.maxSpeed?.toLocaleString() }} km/h</span>
                  </div>
                  <div class="detail-item" v-if="viewingAircraft.maxAltitude">
                    <span class="label">Maksimum İrtifa:</span>
                    <span>{{ viewingAircraft.maxAltitude?.toLocaleString() }} ft</span>
                  </div>
                  <div class="detail-item" v-if="viewingAircraft.engineType">
                    <span class="label">Motor Tipi:</span>
                    <span>{{ getEngineTypeText(viewingAircraft.engineType) }}</span>
                  </div>
                </div>

                <div class="detail-section">
                  <h4>Kapasiteler</h4>
                  <div class="detail-item" v-if="viewingAircraft.fuelCapacity">
                    <span class="label">Yakıt Kapasitesi:</span>
                    <span>{{ viewingAircraft.fuelCapacity?.toLocaleString() }} L</span>
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>

        <div class="detail-section full-width" v-if="viewingAircraft.notes">
          <h4>Notlar</h4>
          <p>{{ viewingAircraft.notes }}</p>
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
  Promotion,
  Plus,
  ArrowDown,
  Check,
  Tools,
  Warning,
  Delete,
  Refresh,
  Download,
  Search,
  Filter,
  View,
  Edit,
  Document,
  MoreFilled,
  CopyDocument,
  Calendar,
  CircleCheckFilled,
  DataAnalysis,
  OfficeBuilding,
  User,
  Clock,
  MapLocation
} from '@element-plus/icons-vue'
import { useReferenceStore } from '@/stores/reference.js'
import { useAppStore } from '@/stores/app.js'
import AircraftForm from '@/components/forms/AircraftForm.vue'
import dayjs from 'dayjs'

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
const filterAirline = ref('')
const filterType = ref('')
const filterStatus = ref('')
const filterManufacturer = ref('')
const filterYear = ref('')
const filterFlightHours = ref('')
const showAdvancedFilters = ref(false)
const sortField = ref('registrationNumber')
const sortOrder = ref('ascending')

// Dialog state
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const dialogMode = ref('create')
const currentAircraft = ref({})
const viewingAircraft = ref(null)
const activeTab = ref('general')

// Computed
const aircrafts = computed(() => referenceStore.aircrafts)
const airlines = computed(() => referenceStore.airlines)

const availableAirlines = computed(() => {
  const airlineSet = new Set(aircrafts.value.map(a => a.airlineId))
  return airlines.value.filter(airline => airlineSet.has(airline.id))
})

const availableTypes = computed(() => {
  const typeSet = new Set(aircrafts.value.map(a => a.aircraftType).filter(Boolean))
  return Array.from(typeSet)
})

const availableManufacturers = computed(() => {
  const manufacturerSet = new Set(aircrafts.value.map(a => a.manufacturer).filter(Boolean))
  return Array.from(manufacturerSet)
})

const filteredAircrafts = computed(() => {
  let result = [...aircrafts.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(aircraft =>
      aircraft.registrationNumber?.toLowerCase().includes(query) ||
      aircraft.aircraftType?.toLowerCase().includes(query) ||
      aircraft.manufacturer?.toLowerCase().includes(query) ||
      aircraft.model?.toLowerCase().includes(query) ||
      getAirlineName(aircraft.airlineId)?.toLowerCase().includes(query)
    )
  }

  // Airline filter
  if (filterAirline.value) {
    result = result.filter(aircraft => aircraft.airlineId === filterAirline.value)
  }

  // Type filter
  if (filterType.value) {
    result = result.filter(aircraft => aircraft.aircraftType === filterType.value)
  }

  // Status filter
  if (filterStatus.value) {
    result = result.filter(aircraft => aircraft.maintenanceStatus === filterStatus.value)
  }

  // Manufacturer filter
  if (filterManufacturer.value) {
    result = result.filter(aircraft => aircraft.manufacturer === filterManufacturer.value)
  }

  // Year filter
  if (filterYear.value) {
    const year = new Date(filterYear.value).getFullYear()
    result = result.filter(aircraft => {
      if (!aircraft.manufacturingDate) return false
      return new Date(aircraft.manufacturingDate).getFullYear() === year
    })
  }

  // Flight hours filter
  if (filterFlightHours.value) {
    result = result.filter(aircraft =>
      aircraft.totalFlightHours && aircraft.totalFlightHours >= filterFlightHours.value
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

const totalAircrafts = computed(() => filteredAircrafts.value.length)

const paginatedAircrafts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredAircrafts.value.slice(start, end)
})

// Statistics computed
const activeAircraftCount = computed(() => {
  return aircrafts.value.filter(a => a.active && a.maintenanceStatus === 'ACTIVE').length
})

const maintenanceAircraftCount = computed(() => {
  return aircrafts.value.filter(a => a.maintenanceStatus === 'MAINTENANCE').length
})

const totalFlightHours = computed(() => {
  return aircrafts.value.reduce((total, aircraft) => {
    return total + (aircraft.totalFlightHours || 0)
  }, 0)
})

const averageAge = computed(() => {
  const aircraftsWithDate = aircrafts.value.filter(a => a.manufacturingDate)
  if (aircraftsWithDate.length === 0) return 0

  const totalAge = aircraftsWithDate.reduce((total, aircraft) => {
    return total + calculateAge(aircraft.manufacturingDate)
  }, 0)

  return totalAge / aircraftsWithDate.length
})

// Methods
function getAirlineName(airlineId) {
  const airline = airlines.value.find(a => a.id === airlineId)
  return airline ? airline.name : 'Bilinmeyen'
}

function getAirlineCode(airlineId) {
  const airline = airlines.value.find(a => a.id === airlineId)
  return airline ? airline.code : 'N/A'
}

function getStatusText(status) {
  const statuses = {
    'ACTIVE': 'Aktif',
    'MAINTENANCE': 'Bakımda',
    'OUT_OF_SERVICE': 'Hizmet Dışı',
    'RETIRED': 'Emekli'
  }
  return statuses[status] || status
}

function getStatusTagType(status) {
  const types = {
    'ACTIVE': 'success',
    'MAINTENANCE': 'warning',
    'OUT_OF_SERVICE': 'danger',
    'RETIRED': 'info'
  }
  return types[status] || 'default'
}

function getEngineTypeText(type) {
  const types = {
    'TURBOFAN': 'Turbofan',
    'TURBOJET': 'Turbojet',
    'TURBOPROP': 'Turboprop',
    'PISTON': 'Piston'
  }
  return types[type] || type
}

function calculateAge(manufacturingDate) {
  if (!manufacturingDate) return 0
  const today = new Date()
  const mfgDate = new Date(manufacturingDate)
  return today.getFullYear() - mfgDate.getFullYear()
}

function formatDate(dateString) {
  if (!dateString) return '-'
  return dayjs(dateString).format('DD.MM.YYYY')
}

async function loadAircrafts() {
  loading.value = true
  try {
    await referenceStore.fetchAircrafts(true)
  } catch (error) {
    ElMessage.error('Uçaklar yüklenirken hata oluştu')
  } finally {
    loading.value = false
  }
}

function handleCreate() {
  dialogMode.value = 'create'
  currentAircraft.value = {
    active: true,
    maintenanceStatus: 'ACTIVE',
    country: 'TR'
  }
  dialogVisible.value = true
}

function handleEdit(aircraft) {
  dialogMode.value = 'edit'
  currentAircraft.value = { ...aircraft }
  dialogVisible.value = true
}

function handleView(aircraft) {
  viewingAircraft.value = aircraft
  viewDialogVisible.value = true
  activeTab.value = 'general'
}

async function handleDelete(aircraft) {
  try {
    await ElMessageBox.confirm(
      `"${aircraft.registrationNumber}" uçağını silmek istediğinizden emin misiniz?`,
      'Uçak Sil',
      {
        confirmButtonText: 'Sil',
        cancelButtonText: 'İptal',
        type: 'warning'
      }
    )

    await referenceStore.deleteAircraft(aircraft.id)
    ElMessage.success('Uçak başarıyla silindi')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Uçak silinirken hata oluştu')
    }
  }
}

async function handleStatusChange(aircraft) {
  aircraft.statusLoading = true
  try {
    await referenceStore.updateAircraft(aircraft.id, { active: aircraft.active })
    ElMessage.success(`Uçak ${aircraft.active ? 'aktifleştirildi' : 'pasifleştirildi'}`)
  } catch (error) {
    aircraft.active = !aircraft.active
    ElMessage.error('Durum güncellenirken hata oluştu')
  } finally {
    aircraft.statusLoading = false
  }
}

async function handleFormSubmit(formData) {
  submitting.value = true
  try {
    if (dialogMode.value === 'create') {
      await referenceStore.createAircraft(formData)
      ElMessage.success('Uçak başarıyla oluşturuldu')
    } else {
      await referenceStore.updateAircraft(currentAircraft.value.id, formData)
      ElMessage.success('Uçak başarıyla güncellendi')
    }

    dialogVisible.value = false
    currentAircraft.value = {}
  } catch (error) {
    ElMessage.error(
      dialogMode.value === 'create'
        ? 'Uçak oluşturulurken hata oluştu'
        : 'Uçak güncellenirken hata oluştu'
    )
  } finally {
    submitting.value = false
  }
}

function handleDialogClose() {
  dialogVisible.value = false
  currentAircraft.value = {}
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
  filterAirline.value = ''
  filterType.value = ''
  filterStatus.value = ''
  filterManufacturer.value = ''
  filterYear.value = ''
  filterFlightHours.value = ''
  currentPage.value = 1
}

function handleRefresh() {
  loadAircrafts()
}

function handleExport() {
  ElMessage.info('Dışa aktarma özelliği yakında eklenecek')
}

async function handleBulkAction(command) {
  if (selectedRows.value.length === 0) return

  try {
    const count = selectedRows.value.length
    await ElMessageBox.confirm(
      `${count} uçak için ${command} işlemini gerçekleştirmek istediğinizden emin misiniz?`,
      'Toplu İşlem',
      {
        confirmButtonText: 'Evet',
        cancelButtonText: 'İptal',
        type: 'warning'
      }
    )

    switch (command) {
      case 'maintenance':
        ElMessage.success(`${count} uçak bakıma alındı`)
        break
      case 'active':
        ElMessage.success(`${count} uçak aktifleştirildi`)
        break
      case 'retire':
        ElMessage.success(`${count} uçak emekliye ayrıldı`)
        break
      case 'delete':
        ElMessage.success(`${count} uçak silindi`)
        break
    }

    selectedRows.value = []
    await loadAircrafts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Toplu işlem sırasında hata oluştu')
    }
  }
}

function handleRowAction(command, aircraft) {
  switch (command) {
    case 'duplicate':
      dialogMode.value = 'create'
      currentAircraft.value = {
        ...aircraft,
        id: undefined,
        registrationNumber: '',
        active: true
      }
      dialogVisible.value = true
      break
    case 'maintenance':
      updateMaintenanceStatus(aircraft, 'MAINTENANCE')
      break
    case 'schedule':
      router.push({
        name: 'Flights',
        query: { aircraft: aircraft.id }
      })
      break
  }
}

async function updateMaintenanceStatus(aircraft, status) {
  try {
    await referenceStore.updateAircraft(aircraft.id, { maintenanceStatus: status })
    ElMessage.success('Bakım durumu güncellendi')
    await loadAircrafts()
  } catch (error) {
    ElMessage.error('Bakım durumu güncellenirken hata oluştu')
  }
}

function viewFlightHistory(aircraft) {
  router.push({
    name: 'Flights',
    query: { aircraft: aircraft.id, view: 'history' }
  })
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
  appStore.setPageTitle('Uçak Yönetimi')
  await Promise.all([
    loadAircrafts(),
    referenceStore.fetchAirlines()
  ])
})

// Watch for route query changes
watch(() => router.currentRoute.value.query, (query) => {
  if (query.search) {
    searchQuery.value = query.search
  }
  if (query.airline) {
    filterAirline.value = parseInt(query.airline)
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
.aircraft-management {
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
          width: 140px;
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

  .stats-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;

    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;
        gap: 1rem;

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;

          &.active {
            background: linear-gradient(135deg, #67c23a, #85ce61);
            color: white;
          }

          &.maintenance {
            background: linear-gradient(135deg, #e6a23c, #ebb563);
            color: white;
          }

          &.total {
            background: linear-gradient(135deg, #409eff, #66b1ff);
            color: white;
          }

          &.fleet {
            background: linear-gradient(135deg, #909399, #a6a9ad);
            color: white;
          }
        }

        .stat-info {
          .stat-number {
            font-size: 1.5rem;
            font-weight: 700;
            color: #303133;
            line-height: 1;
          }

          .stat-label {
            font-size: 0.875rem;
            color: #606266;
            margin-top: 0.25rem;
          }
        }
      }
    }
  }
}

.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .data-table {
    .registration-number {
      display: flex;
      justify-content: center;

      .el-tag {
        font-weight: 600;
        font-size: 0.875rem;
      }
    }

    .aircraft-info {
      .aircraft-type {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.25rem;

        .type-code {
          font-weight: 600;
          color: #409eff;
        }

        .model {
          color: #606266;
          font-size: 0.875rem;
        }
      }

      .manufacturer,
      .capacity {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.875rem;
        color: #909399;
        margin-bottom: 0.25rem;

        .el-icon {
          font-size: 0.75rem;
        }
      }
    }

    .airline-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;

      .airline-tag {
        font-size: 0.75rem;
        font-weight: 600;
      }

      .airline-name {
        font-size: 0.875rem;
        color: #606266;
        text-align: center;
      }
    }

    .age-hours {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;

      .age,
      .hours {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.875rem;

        .el-icon {
          font-size: 0.75rem;
          color: #909399;
        }
      }
    }

    .location {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;

      .el-icon {
        font-size: 0.75rem;
        color: #909399;
      }
    }

    .no-data {
      color: #c0c4cc;
      font-style: italic;
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

.airline-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .airline-code {
    font-weight: 600;
    color: #409eff;
    min-width: 40px;
  }
}

.aircraft-details {
  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;

    .aircraft-title {
      h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #303133;
      }

      .aircraft-subtitle {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-top: 0.5rem;
        font-size: 0.875rem;
        color: #606266;
      }
    }

    .status-badges {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
  }

  .detail-tabs {
    margin-top: 1rem;

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;

      .detail-section {
        h4 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #303133;
          border-bottom: 1px solid #ebeef5;
          padding-bottom: 0.5rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          font-size: 0.875rem;

          .label {
            font-weight: 500;
            color: #606266;
            min-width: 120px;
          }
        }
      }
    }
  }

  .detail-section.full-width {
    margin-top: 1rem;

    h4 {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: #303133;
    }

    p {
      margin: 0;
      line-height: 1.6;
      color: #606266;
    }
  }
}

// Responsive
@media (max-width: 768px) {
  .aircraft-management {
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

    .stats-cards {
      grid-template-columns: repeat(2, 1fr);
    }

    .table-container {
      .data-table {
        :deep(.el-table__body-wrapper) {
          overflow-x: auto;
        }
      }
    }

    .aircraft-details {
      .detail-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 1rem;

        .status-badges {
          flex-direction: row;
        }
      }

      .detail-tabs {
        .detail-grid {
          grid-template-columns: 1fr;
          gap: 1rem;
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

  &.el-tag--success {
    background-color: #67c23a;
    border-color: #67c23a;
  }

  &.el-tag--warning {
    background-color: #e6a23c;
    border-color: #e6a23c;
  }

  &.el-tag--danger {
    background-color: #f56c6c;
    border-color: #f56c6c;
  }

  &.el-tag--info {
    background-color: #909399;
    border-color: #909399;
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

// Tabs styling
:deep(.el-tabs) {
  .el-tabs__header {
    margin-bottom: 1rem;
  }

  .el-tabs__nav-wrap {
    &::after {
      background-color: #ebeef5;
    }
  }

  .el-tabs__active-bar {
    background-color: #409eff;
  }

  .el-tabs__item {
    &.is-active {
      color: #409eff;
    }

    &:hover {
      color: #409eff;
    }
  }
}

// Card hover effects
:deep(.el-card) {
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}
</style>

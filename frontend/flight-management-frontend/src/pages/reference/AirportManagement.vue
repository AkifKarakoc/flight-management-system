<template>
  <div class="airport-management">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="page-title">
          <el-icon size="24"><MapLocation /></el-icon>
          <h1>Havaalanı Yönetimi</h1>
          <el-tag :type="airports.length > 0 ? 'success' : 'info'">
            {{ airports.length }} Havaalanı
          </el-tag>
        </div>

        <div class="header-actions">
          <el-button
            type="primary"
            :icon="Plus"
            @click="handleCreate"
            :loading="loading"
          >
            Yeni Havaalanı
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
                <el-dropdown-item command="export" :icon="Download">
                  Seçilenleri Dışa Aktar
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

          <el-button :icon="Upload" @click="handleImport">
            İçe Aktar
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
            placeholder="Havaalanı ara... (ICAO, IATA, ad, şehir)"
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
            v-model="filterType"
            placeholder="Tip"
            clearable
            @change="handleFilter"
            class="filter-select"
          >
            <el-option label="Uluslararası" value="INTERNATIONAL" />
            <el-option label="İç Hat" value="DOMESTIC" />
            <el-option label="Askeri" value="MILITARY" />
            <el-option label="Kargo" value="CARGO" />
            <el-option label="Özel" value="PRIVATE" />
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
              <el-form-item label="Pist Sayısı">
                <el-input-number
                  v-model="filterRunwayCount"
                  :min="1"
                  :max="10"
                  placeholder="Min. pist sayısı"
                  @change="handleFilter"
                />
              </el-form-item>

              <el-form-item label="Yolcu Kapasitesi">
                <el-input-number
                  v-model="filterCapacity"
                  :min="100000"
                  :step="1000000"
                  placeholder="Min. kapasite"
                  @change="handleFilter"
                />
              </el-form-item>

              <el-form-item label="Zaman Dilimi">
                <el-select
                  v-model="filterTimezone"
                  placeholder="Zaman dilimi"
                  clearable
                  @change="handleFilter"
                >
                  <el-option
                    v-for="tz in availableTimezones"
                    :key="tz"
                    :label="getTimezoneLabel(tz)"
                    :value="tz"
                  />
                </el-select>
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
        :data="paginatedAirports"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
        row-key="id"
        class="data-table"
        empty-text="Havaalanı bulunamadı"
        :default-sort="{ prop: 'name', order: 'ascending' }"
      >
        <!-- Selection Column -->
        <el-table-column type="selection" width="55" fixed="left" />

        <!-- Index Column -->
        <el-table-column type="index" label="#" width="60" />

        <!-- Codes Column -->
        <el-table-column label="Kodlar" width="120" fixed="left">
          <template #default="{ row }">
            <div class="airport-codes">
              <el-tag type="primary" size="small">{{ row.iataCode }}</el-tag>
              <el-tag type="info" size="small">{{ row.icaoCode }}</el-tag>
            </div>
          </template>
        </el-table-column>

        <!-- Name and Location Column -->
        <el-table-column
          prop="name"
          label="Havaalanı"
          min-width="250"
          sortable
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div class="airport-info">
              <div class="name">{{ row.name }}</div>
              <div class="location">
                <el-icon><Location /></el-icon>
                <span>{{ row.city }}, {{ getCountryName(row.country) }}</span>
                <span class="flag">{{ getCountryFlag(row.country) }}</span>
              </div>
              <div class="coordinates" v-if="row.latitude && row.longitude">
                <el-icon><Position /></el-icon>
                <span>{{ row.latitude?.toFixed(4) }}, {{ row.longitude?.toFixed(4) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Type Column -->
        <el-table-column prop="type" label="Tip" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)" size="small">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Technical Info Column -->
        <el-table-column label="Teknik Bilgiler" width="150" align="center">
          <template #default="{ row }">
            <div class="technical-info">
              <div v-if="row.runwayCount" class="info-item">
                <el-icon><Guide /></el-icon>
                <span>{{ row.runwayCount }} Pist</span>
              </div>
              <div v-if="row.terminalCount" class="info-item">
                <el-icon><OfficeBuilding /></el-icon>
                <span>{{ row.terminalCount }} Terminal</span>
              </div>
              <div v-if="row.elevation" class="info-item">
                <el-icon><TrendCharts /></el-icon>
                <span>{{ row.elevation }}m</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Capacity Column -->
        <el-table-column label="Kapasite" width="120" align="center">
          <template #default="{ row }">
            <div v-if="row.passengerCapacity" class="capacity-info">
              <el-icon><User /></el-icon>
              <span>{{ formatCapacity(row.passengerCapacity) }}</span>
            </div>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>

        <!-- Hub Airlines Column -->
        <el-table-column label="Hub Havayolları" width="150">
          <template #default="{ row }">
            <div v-if="row.hubAirlines?.length > 0" class="hub-airlines">
              <el-tag
                v-for="airlineId in row.hubAirlines.slice(0, 2)"
                :key="airlineId"
                size="small"
                class="hub-tag"
              >
                {{ getAirlineName(airlineId) }}
              </el-tag>
              <el-tag
                v-if="row.hubAirlines.length > 2"
                size="small"
                type="info"
              >
                +{{ row.hubAirlines.length - 2 }}
              </el-tag>
            </div>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>

        <!-- Contact Column -->
        <el-table-column label="İletişim" width="120">
          <template #default="{ row }">
            <div class="contact-actions">
              <el-tooltip v-if="row.website" content="Website" placement="top">
                <el-button
                  :icon="Link"
                  size="small"
                  @click="openWebsite(row.website)"
                />
              </el-tooltip>
              <el-tooltip v-if="row.phone" content="Telefon" placement="top">
                <el-button
                  :icon="Phone"
                  size="small"
                  @click="callPhone(row.phone)"
                />
              </el-tooltip>
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

              <el-tooltip content="Haritada Göster" placement="top">
                <el-button
                  :icon="Position"
                  size="small"
                  type="success"
                  @click="showOnMap(row)"
                  :disabled="!row.latitude || !row.longitude"
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
                    <el-dropdown-item command="routes" :icon="Connection">
                      Rotaları Görüntüle
                    </el-dropdown-item>
                    <el-dropdown-item command="weather" :icon="Cloudy">
                      Hava Durumu
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
          :total="totalAirports"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? 'Yeni Havaalanı Ekle' : 'Havaalanı Düzenle'"
      width="900px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="handleDialogClose"
    >
      <AirportForm
        v-model="currentAirport"
        :is-editing="dialogMode === 'edit'"
        :submitting="submitting"
        @submit="handleFormSubmit"
        @cancel="handleDialogClose"
      />
    </el-dialog>

    <!-- View Dialog -->
    <el-dialog
      v-model="viewDialogVisible"
      title="Havaalanı Detayları"
      width="700px"
    >
      <div v-if="viewingAirport" class="airport-details">
        <div class="detail-header">
          <div class="airport-title">
            <h3>{{ viewingAirport.name }}</h3>
            <div class="codes">
              <el-tag type="primary">{{ viewingAirport.iataCode }}</el-tag>
              <el-tag type="info">{{ viewingAirport.icaoCode }}</el-tag>
            </div>
          </div>
          <el-tag :type="viewingAirport.active ? 'success' : 'danger'">
            {{ viewingAirport.active ? 'Aktif' : 'Pasif' }}
          </el-tag>
        </div>

        <el-divider />

        <div class="detail-grid">
          <div class="detail-section">
            <h4>Konum Bilgileri</h4>
            <div class="detail-item">
              <span class="label">Şehir:</span>
              <span>{{ viewingAirport.city }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Ülke:</span>
              <span>
                {{ getCountryFlag(viewingAirport.country) }}
                {{ getCountryName(viewingAirport.country) }}
              </span>
            </div>
            <div class="detail-item" v-if="viewingAirport.latitude && viewingAirport.longitude">
              <span class="label">Koordinatlar:</span>
              <span>{{ viewingAirport.latitude }}, {{ viewingAirport.longitude }}</span>
            </div>
            <div class="detail-item" v-if="viewingAirport.elevation">
              <span class="label">Rakım:</span>
              <span>{{ viewingAirport.elevation }} metre</span>
            </div>
            <div class="detail-item" v-if="viewingAirport.timezone">
              <span class="label">Zaman Dilimi:</span>
              <span>{{ getTimezoneLabel(viewingAirport.timezone) }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h4>Teknik Özellikler</h4>
            <div class="detail-item">
              <span class="label">Tip:</span>
              <el-tag :type="getTypeTagType(viewingAirport.type)" size="small">
                {{ getTypeText(viewingAirport.type) }}
              </el-tag>
            </div>
            <div class="detail-item" v-if="viewingAirport.runwayCount">
              <span class="label">Pist Sayısı:</span>
              <span>{{ viewingAirport.runwayCount }}</span>
            </div>
            <div class="detail-item" v-if="viewingAirport.terminalCount">
              <span class="label">Terminal Sayısı:</span>
              <span>{{ viewingAirport.terminalCount }}</span>
            </div>
            <div class="detail-item" v-if="viewingAirport.passengerCapacity">
              <span class="label">Yolcu Kapasitesi:</span>
              <span>{{ formatCapacity(viewingAirport.passengerCapacity) }}</span>
            </div>
          </div>
        </div>

        <div v-if="viewingAirport.hubAirlines?.length > 0" class="detail-section full-width">
          <h4>Hub Havayolları</h4>
          <div class="hub-airlines-list">
            <el-tag
              v-for="airlineId in viewingAirport.hubAirlines"
              :key="airlineId"
              class="hub-tag"
            >
              {{ getAirlineName(airlineId) }}
            </el-tag>
          </div>
        </div>

        <div class="detail-section full-width" v-if="viewingAirport.description">
          <h4>Açıklama</h4>
          <p>{{ viewingAirport.description }}</p>
        </div>

        <div class="detail-actions">
          <el-button
            v-if="viewingAirport.latitude && viewingAirport.longitude"
            type="primary"
            :icon="Position"
            @click="showOnMap(viewingAirport)"
          >
            Haritada Göster
          </el-button>
          <el-button
            v-if="viewingAirport.website"
            :icon="Link"
            @click="openWebsite(viewingAirport.website)"
          >
            Website
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- Map Dialog -->
    <el-dialog
      v-model="mapDialogVisible"
      title="Havaalanı Konumu"
      width="800px"
    >
      <div class="map-container">
        <div class="map-placeholder">
          <el-icon size="48"><Position /></el-icon>
          <h3>{{ selectedAirportForMap?.name }}</h3>
          <p>Koordinatlar: {{ selectedAirportForMap?.latitude }}, {{ selectedAirportForMap?.longitude }}</p>
          <el-button type="primary" @click="openGoogleMaps">Google Maps'te Aç</el-button>
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
  MapLocation,
  Plus,
  ArrowDown,
  Check,
  Close,
  Delete,
  Refresh,
  Download,
  Upload,
  Search,
  Filter,
  View,
  Edit,
  MoreFilled,
  CopyDocument,
  Connection,
  Cloudy,
  Location,
  Position,
  Guide,
  OfficeBuilding,
  TrendCharts,
  User,
  Link,
  Phone
} from '@element-plus/icons-vue'
import { useReferenceStore } from '@/stores/reference.js'
import { useAppStore } from '@/stores/app.js'
import AirportForm from '@/components/forms/AirportForm.vue'

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
const filterType = ref('')
const filterStatus = ref('')
const filterRunwayCount = ref('')
const filterCapacity = ref('')
const filterTimezone = ref('')
const showAdvancedFilters = ref(false)
const sortField = ref('name')
const sortOrder = ref('ascending')

// Dialog state
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const mapDialogVisible = ref(false)
const dialogMode = ref('create')
const currentAirport = ref({})
const viewingAirport = ref(null)
const selectedAirportForMap = ref(null)

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
  'QA': { name: 'Katar', flag: '🇶🇦' },
  'JP': { name: 'Japonya', flag: '🇯🇵' },
  'SG': { name: 'Singapur', flag: '🇸🇬' }
}

// Computed
const airports = computed(() => referenceStore.airports)
const airlines = computed(() => referenceStore.airlines)

const availableCountries = computed(() => {
  const countrySet = new Set(airports.value.map(a => a.country))
  return Array.from(countrySet).map(code => ({
    code,
    name: countries[code]?.name || code,
    flag: countries[code]?.flag || '🌍'
  }))
})

const availableTimezones = computed(() => {
  const timezoneSet = new Set(airports.value.map(a => a.timezone).filter(Boolean))
  return Array.from(timezoneSet)
})

const filteredAirports = computed(() => {
  let result = [...airports.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(airport =>
      airport.icaoCode?.toLowerCase().includes(query) ||
      airport.iataCode?.toLowerCase().includes(query) ||
      airport.name?.toLowerCase().includes(query) ||
      airport.city?.toLowerCase().includes(query) ||
      getCountryName(airport.country).toLowerCase().includes(query)
    )
  }

  // Country filter
  if (filterCountry.value) {
    result = result.filter(airport => airport.country === filterCountry.value)
  }

  // Type filter
  if (filterType.value) {
    result = result.filter(airport => airport.type === filterType.value)
  }

  // Status filter
  if (filterStatus.value) {
    const isActive = filterStatus.value === 'active'
    result = result.filter(airport => airport.active === isActive)
  }

  // Runway count filter
  if (filterRunwayCount.value) {
    result = result.filter(airport =>
      airport.runwayCount && airport.runwayCount >= filterRunwayCount.value
    )
  }

  // Capacity filter
  if (filterCapacity.value) {
    result = result.filter(airport =>
      airport.passengerCapacity && airport.passengerCapacity >= filterCapacity.value
    )
  }

  // Timezone filter
  if (filterTimezone.value) {
    result = result.filter(airport => airport.timezone === filterTimezone.value)
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

const totalAirports = computed(() => filteredAirports.value.length)

const paginatedAirports = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredAirports.value.slice(start, end)
})

// Methods
function getCountryName(code) {
  return countries[code]?.name || code
}

function getCountryFlag(code) {
  return countries[code]?.flag || '🌍'
}

function getTypeText(type) {
  const types = {
    'INTERNATIONAL': 'Uluslararası',
    'DOMESTIC': 'İç Hat',
    'MILITARY': 'Askeri',
    'CARGO': 'Kargo',
    'PRIVATE': 'Özel'
  }
  return types[type] || type
}

function getTypeTagType(type) {
  const tagTypes = {
    'INTERNATIONAL': 'primary',
    'DOMESTIC': 'success',
    'MILITARY': 'warning',
    'CARGO': 'info',
    'PRIVATE': 'danger'
  }
  return tagTypes[type] || 'default'
}

function getTimezoneLabel(timezone) {
  const labels = {
    'Europe/Istanbul': 'Türkiye (UTC+3)',
    'UTC': 'UTC (GMT+0)',
    'Europe/London': 'Londra (GMT+0/+1)',
    'Europe/Paris': 'Paris (CET)',
    'America/New_York': 'New York (EST)',
    'America/Los_Angeles': 'Los Angeles (PST)',
    'Asia/Dubai': 'Dubai (GST)',
    'Asia/Tokyo': 'Tokyo (JST)',
    'Asia/Singapore': 'Singapur (SGT)',
    'Australia/Sydney': 'Sidney (AEST)'
  }
  return labels[timezone] || timezone
}

function formatCapacity(capacity) {
  if (capacity >= 1000000) {
    return `${(capacity / 1000000).toFixed(1)}M`
  } else if (capacity >= 1000) {
    return `${(capacity / 1000).toFixed(0)}K`
  }
  return capacity.toString()
}

function getAirlineName(airlineId) {
  const airline = airlines.value.find(a => a.id === airlineId)
  return airline ? airline.code : 'N/A'
}

async function loadAirports() {
  loading.value = true
  try {
    await referenceStore.fetchAirports(true)
  } catch (error) {
    ElMessage.error('Havaalanları yüklenirken hata oluştu')
  } finally {
    loading.value = false
  }
}

function handleCreate() {
  dialogMode.value = 'create'
  currentAirport.value = {
    active: true,
    country: 'TR',
    type: 'INTERNATIONAL',
    timezone: 'Europe/Istanbul',
    runwayCount: 1,
    terminalCount: 1
  }
  dialogVisible.value = true
}

function handleEdit(airport) {
  dialogMode.value = 'edit'
  currentAirport.value = { ...airport }
  dialogVisible.value = true
}

function handleView(airport) {
  viewingAirport.value = airport
  viewDialogVisible.value = true
}

async function handleDelete(airport) {
  try {
    await ElMessageBox.confirm(
      `"${airport.name}" havaalanını silmek istediğinizden emin misiniz?`,
      'Havaalanı Sil',
      {
        confirmButtonText: 'Sil',
        cancelButtonText: 'İptal',
        type: 'warning'
      }
    )

    await referenceStore.deleteAirport(airport.id)
    ElMessage.success('Havaalanı başarıyla silindi')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Havaalanı silinirken hata oluştu')
    }
  }
}

async function handleStatusChange(airport) {
  airport.statusLoading = true
  try {
    await referenceStore.updateAirport(airport.id, { active: airport.active })
    ElMessage.success(`Havaalanı ${airport.active ? 'aktifleştirildi' : 'pasifleştirildi'}`)
  } catch (error) {
    airport.active = !airport.active
    ElMessage.error('Durum güncellenirken hata oluştu')
  } finally {
    airport.statusLoading = false
  }
}

async function handleFormSubmit(formData) {
  submitting.value = true
  try {
    if (dialogMode.value === 'create') {
      await referenceStore.createAirport(formData)
      ElMessage.success('Havaalanı başarıyla oluşturuldu')
    } else {
      await referenceStore.updateAirport(currentAirport.value.id, formData)
      ElMessage.success('Havaalanı başarıyla güncellendi')
    }

    dialogVisible.value = false
    currentAirport.value = {}
  } catch (error) {
    ElMessage.error(
      dialogMode.value === 'create'
        ? 'Havaalanı oluşturulurken hata oluştu'
        : 'Havaalanı güncellenirken hata oluştu'
    )
  } finally {
    submitting.value = false
  }
}

function handleDialogClose() {
  dialogVisible.value = false
  currentAirport.value = {}
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
  filterType.value = ''
  filterStatus.value = ''
  filterRunwayCount.value = ''
  filterCapacity.value = ''
  filterTimezone.value = ''
  currentPage.value = 1
}

function handleRefresh() {
  loadAirports()
}

function handleImport() {
  ElMessage.info('İçe aktarma özelliği yakında eklenecek')
}

function handleExport() {
  ElMessage.info('Dışa aktarma özelliği yakında eklenecek')
}

async function handleBulkAction(command) {
  if (selectedRows.value.length === 0) return

  try {
    const count = selectedRows.value.length
    await ElMessageBox.confirm(
      `${count} havaalanı için ${command} işlemini gerçekleştirmek istediğinizden emin misiniz?`,
      'Toplu İşlem',
      {
        confirmButtonText: 'Evet',
        cancelButtonText: 'İptal',
        type: 'warning'
      }
    )

    switch (command) {
      case 'activate':
        ElMessage.success(`${count} havaalanı aktifleştirildi`)
        break
      case 'deactivate':
        ElMessage.success(`${count} havaalanı pasifleştirildi`)
        break
      case 'export':
        ElMessage.success(`${count} havaalanı dışa aktarıldı`)
        break
      case 'delete':
        ElMessage.success(`${count} havaalanı silindi`)
        break
    }

    selectedRows.value = []
    await loadAirports()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Toplu işlem sırasında hata oluştu')
    }
  }
}

function handleRowAction(command, airport) {
  switch (command) {
    case 'duplicate':
      dialogMode.value = 'create'
      currentAirport.value = {
        ...airport,
        id: undefined,
        icaoCode: '',
        iataCode: '',
        name: `${airport.name} (Kopya)`
      }
      dialogVisible.value = true
      break
    case 'routes':
      router.push({
        name: 'Routes',
        query: { airport: airport.id }
      })
      break
    case 'weather':
      ElMessage.info('Hava durumu özelliği yakında eklenecek')
      break
  }
}

function showOnMap(airport) {
  selectedAirportForMap.value = airport
  mapDialogVisible.value = true
}

function openGoogleMaps() {
  if (selectedAirportForMap.value) {
    const { latitude, longitude } = selectedAirportForMap.value
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`
    window.open(url, '_blank')
  }
}

function openWebsite(url) {
  window.open(url, '_blank')
}

function callPhone(phone) {
  window.location.href = `tel:${phone}`
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
  appStore.setPageTitle('Havaalanı Yönetimi')
  await Promise.all([
    loadAirports(),
    referenceStore.fetchAirlines()
  ])
})

// Watch for route query changes
watch(() => router.currentRoute.value.query, (query) => {
  if (query.search) {
    searchQuery.value = query.search
  }
  if (query.country) {
    filterCountry.value = query.country
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
.airport-management {
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
      .airport-codes {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .airport-info {
        .name {
          font-weight: 500;
          color: #303133;
          margin-bottom: 0.25rem;
        }

        .location {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.875rem;
          color: #909399;
          margin-bottom: 0.25rem;

          .flag {
            margin-left: 0.25rem;
          }
        }

        .coordinates {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: #c0c4cc;
        }
      }

      .technical-info {
        .info-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-bottom: 0.25rem;
          font-size: 0.875rem;

          .el-icon {
            color: #909399;
            font-size: 0.75rem;
          }
        }
      }

      .capacity-info {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-weight: 500;

        .el-icon {
          color: #409eff;
        }
      }

      .hub-airlines {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;

        .hub-tag {
          font-size: 0.75rem;
        }
      }

      .contact-actions {
        display: flex;
        gap: 0.25rem;
      }

      .action-buttons {
        display: flex;
        gap: 0.25rem;
        justify-content: center;
      }

      .no-data {
        color: #c0c4cc;
        font-style: italic;
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

  .airport-details {
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;

      .airport-title {
        h3 {
          margin: 0 0 0.5rem 0;
          color: #303133;
        }

        .codes {
          display: flex;
          gap: 0.5rem;
        }
      }
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 1.5rem;
    }

    .detail-section {
      &.full-width {
        grid-column: 1 / -1;
      }

      h4 {
        margin: 0 0 1rem 0;
        color: #606266;
        font-size: 1rem;
        border-bottom: 1px solid #ebeef5;
        padding-bottom: 0.5rem;
      }

      .detail-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.75rem;

        .label {
          font-weight: 500;
          color: #606266;
          min-width: 120px;
        }
      }

      p {
        margin: 0;
        line-height: 1.6;
        color: #303133;
      }
    }

    .hub-airlines-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .detail-actions {
      display: flex;
      gap: 1rem;
      padding-top: 1.5rem;
      border-top: 1px solid #ebeef5;
    }
  }

  .map-container {
    .map-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 8px;
      text-align: center;

      .el-icon {
        color: #409eff;
        margin-bottom: 1rem;
      }

      h3 {
        margin: 0 0 0.5rem 0;
        color: #303133;
      }

      p {
        margin: 0 0 1.5rem 0;
        color: #606266;
      }
    }
  }
}

// Responsive
@media (max-width: 768px) {
  .airport-management {
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

        .action-buttons {
          flex-direction: column;
          gap: 0.25rem;

          .el-button {
            padding: 0.25rem;
          }
        }
      }
    }

    .airport-details {
      .detail-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }

      .detail-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .detail-actions {
        flex-direction: column;

        .el-button {
          width: 100%;
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

  &.el-tag--info {
    background-color: #909399;
    border-color: #909399;
  }

  &.el-tag--danger {
    background-color: #f56c6c;
    border-color: #f56c6c;
  }
}

// Button hover effects
.action-buttons {
  :deep(.el-button) {
    &:hover {
      transform: translateY(-1px);
    }

    &.el-button--success:hover {
      background-color: #5daf34;
    }
  }
}

// Switch styling
:deep(.el-switch) {
  &.is-checked .el-switch__core {
    background-color: #67c23a;
  }
}

// Loading state
:deep(.el-loading-mask) {
  border-radius: 8px;
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

// Hub airlines styling
.hub-airlines {
  .hub-tag {
    background-color: #f0f9ff;
    border-color: #409eff;
    color: #409eff;

    &:hover {
      background-color: #409eff;
      color: white;
    }
  }
}

// Technical info icons
.technical-info {
  .info-item {
    .el-icon {
      transition: color 0.3s ease;
    }

    &:hover .el-icon {
      color: #409eff;
    }
  }
}

// Contact actions styling
.contact-actions {
  .el-button {
    border: none;
    background: transparent;

    &:hover {
      background-color: #f5f7fa;
    }
  }
}
</style>

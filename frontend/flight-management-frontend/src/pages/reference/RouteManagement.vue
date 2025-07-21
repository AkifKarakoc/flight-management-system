<template>
  <div class="route-management">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="page-title">
          <el-icon size="24"><Connection /></el-icon>
          <h1>Rota Yönetimi</h1>
          <el-tag :type="routes.length > 0 ? 'success' : 'info'">
            {{ routes.length }} Rota
          </el-tag>
        </div>

        <div class="header-actions">
          <el-button
            type="primary"
            :icon="Plus"
            @click="handleCreate"
            :loading="loading"
          >
            Yeni Rota
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
                <el-dropdown-item command="popular" :icon="Star">
                  Popüler İşaretle
                </el-dropdown-item>
                <el-dropdown-item command="calculate" :icon="Calculator">
                  Mesafe/Süre Hesapla
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
            placeholder="Rota ara... (kod, havaalanı, şehir)"
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
            @clear="handleSearchClear"
            class="search-input"
          />
        </div>

        <div class="filters">
          <el-select
            v-model="filterOriginCountry"
            placeholder="Kalkış Ülkesi"
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
            v-model="filterRouteType"
            placeholder="Rota Tipi"
            clearable
            @change="handleFilter"
            class="filter-select"
          >
            <el-option label="İç Hat" value="DOMESTIC" />
            <el-option label="Uluslararası" value="INTERNATIONAL" />
            <el-option label="Kıta İçi" value="CONTINENTAL" />
            <el-option label="Kıtalar Arası" value="INTERCONTINENTAL" />
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
            <el-option label="Popüler" value="popular" />
            <el-option label="Sezonluk" value="seasonal" />
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
              <el-form-item label="Min. Mesafe (km)">
                <el-input-number
                  v-model="filterMinDistance"
                  :min="0"
                  placeholder="Minimum mesafe"
                  @change="handleFilter"
                />
              </el-form-item>

              <el-form-item label="Max. Mesafe (km)">
                <el-input-number
                  v-model="filterMaxDistance"
                  :min="0"
                  placeholder="Maksimum mesafe"
                  @change="handleFilter"
                />
              </el-form-item>

              <el-form-item label="İşleten Havayolu">
                <el-select
                  v-model="filterOperatingAirline"
                  placeholder="Havayolu seçin"
                  clearable
                  filterable
                  @change="handleFilter"
                >
                  <el-option
                    v-for="airline in airlines"
                    :key="airline.id"
                    :label="airline.name"
                    :value="airline.id"
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

    <!-- Statistics Cards -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon active">
            <el-icon><CircleCheckFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ activeRoutesCount }}</div>
            <div class="stat-label">Aktif Rota</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon popular">
            <el-icon><Star /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ popularRoutesCount }}</div>
            <div class="stat-label">Popüler Rota</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon total">
            <el-icon><DataAnalysis /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ totalDistance.toLocaleString() }}</div>
            <div class="stat-label">Toplam Mesafe (km)</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon average">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ averageDistance.toFixed(0) }}</div>
            <div class="stat-label">Ortalama Mesafe (km)</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Data Table -->
    <div class="table-container">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="paginatedRoutes"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
        row-key="id"
        class="data-table"
        empty-text="Rota bulunamadı"
        :default-sort="{ prop: 'routeCode', order: 'ascending' }"
      >
        <!-- Selection Column -->
        <el-table-column type="selection" width="55" fixed="left" />

        <!-- Index Column -->
        <el-table-column type="index" label="#" width="60" />

        <!-- Route Code Column -->
        <el-table-column
          prop="routeCode"
          label="Rota Kodu"
          width="120"
          sortable
          fixed="left"
        >
          <template #default="{ row }">
            <el-tag type="primary" size="large">
              {{ row.routeCode }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Route Info Column -->
        <el-table-column label="Rota Bilgileri" min-width="300">
          <template #default="{ row }">
            <div class="route-info">
              <div class="route-path">
                <div class="airport origin">
                  <div class="airport-code">{{ getAirportCode(row.originAirportId, 'iata') }}</div>
                  <div class="airport-name">{{ getAirportName(row.originAirportId) }}</div>
                  <div class="airport-city">{{ getAirportCity(row.originAirportId) }}</div>
                </div>

                <div class="route-arrow">
                  <el-icon><Right /></el-icon>
                </div>

                <div class="airport destination">
                  <div class="airport-code">{{ getAirportCode(row.destinationAirportId, 'iata') }}</div>
                  <div class="airport-name">{{ getAirportName(row.destinationAirportId) }}</div>
                  <div class="airport-city">{{ getAirportCity(row.destinationAirportId) }}</div>
                </div>
              </div>

              <div class="route-type">
                <el-tag :type="getRouteTypeTagType(row.routeType)" size="small">
                  {{ getRouteTypeText(row.routeType) }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Distance & Duration Column -->
        <el-table-column label="Mesafe & Süre" width="150" align="center">
          <template #default="{ row }">
            <div class="distance-duration">
              <div v-if="row.distance" class="distance">
                <el-icon><Odometer /></el-icon>
                <span>{{ row.distance?.toLocaleString() }} km</span>
              </div>
              <div v-if="row.estimatedFlightTime" class="duration">
                <el-icon><Clock /></el-icon>
                <span>{{ row.estimatedFlightTime }}</span>
              </div>
              <div v-if="!row.distance && !row.estimatedFlightTime" class="no-data">
                <el-button
                  type="primary"
                  size="small"
                  text
                  @click="calculateRouteMetrics(row)"
                >
                  Hesapla
                </el-button>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Operating Airlines Column -->
        <el-table-column label="İşleten Havayolları" width="180">
          <template #default="{ row }">
            <div v-if="row.operatingAirlines?.length > 0" class="operating-airlines">
              <el-tag
                v-for="airlineId in row.operatingAirlines.slice(0, 3)"
                :key="airlineId"
                size="small"
                class="airline-tag"
              >
                {{ getAirlineCode(airlineId) }}
              </el-tag>
              <el-tag
                v-if="row.operatingAirlines.length > 3"
                size="small"
                type="info"
              >
                +{{ row.operatingAirlines.length - 3 }}
              </el-tag>
            </div>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>

        <!-- Route Properties Column -->
        <el-table-column label="Özellikler" width="120" align="center">
          <template #default="{ row }">
            <div class="route-properties">
              <el-tooltip v-if="row.popularRoute" content="Popüler Rota" placement="top">
                <el-icon class="property-icon popular"><Star /></el-icon>
              </el-tooltip>
              <el-tooltip v-if="row.seasonalRoute" content="Sezonluk Rota" placement="top">
                <el-icon class="property-icon seasonal"><Sunny /></el-icon>
              </el-tooltip>
              <el-tooltip v-if="row.routeType === 'INTERNATIONAL'" content="Uluslararası" placement="top">
                <el-icon class="property-icon international"><Flag /></el-icon>
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
                    <el-dropdown-item command="reverse" :icon="RefreshRight">
                      Ters Rota Oluştur
                    </el-dropdown-item>
                    <el-dropdown-item command="flights" :icon="Promotion">
                      Uçuşları Görüntüle
                    </el-dropdown-item>
                    <el-dropdown-item command="calculate" :icon="Calculator">
                      Hesapla
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
          :total="totalRoutes"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? 'Yeni Rota Ekle' : 'Rota Düzenle'"
      width="900px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="handleDialogClose"
    >
      <RouteForm
        v-model="currentRoute"
        :is-editing="dialogMode === 'edit'"
        :submitting="submitting"
        @submit="handleFormSubmit"
        @cancel="handleDialogClose"
      />
    </el-dialog>

    <!-- View Dialog -->
    <el-dialog
      v-model="viewDialogVisible"
      title="Rota Detayları"
      width="800px"
    >
      <div v-if="viewingRoute" class="route-details">
        <div class="detail-header">
          <div class="route-title">
            <h3>{{ viewingRoute.routeCode }}</h3>
            <div class="route-subtitle">
              <span>{{ getAirportName(viewingRoute.originAirportId) }}</span>
              <el-icon><Right /></el-icon>
              <span>{{ getAirportName(viewingRoute.destinationAirportId) }}</span>
            </div>
          </div>
          <div class="status-badges">
            <el-tag :type="getRouteTypeTagType(viewingRoute.routeType)">
              {{ getRouteTypeText(viewingRoute.routeType) }}
            </el-tag>
            <el-tag :type="viewingRoute.active ? 'success' : 'danger'">
              {{ viewingRoute.active ? 'Aktif' : 'Pasif' }}
            </el-tag>
          </div>
        </div>

        <el-divider />

        <!-- Route Visualization -->
        <div class="route-visualization">
          <div class="route-visual">
            <div class="airport origin">
              <div class="airport-code">{{ getAirportCode(viewingRoute.originAirportId, 'iata') }}</div>
              <div class="airport-name">{{ getAirportName(viewingRoute.originAirportId) }}</div>
              <div class="airport-city">{{ getAirportCity(viewingRoute.originAirportId) }}</div>
            </div>

            <div class="route-line">
              <div class="plane-icon">✈️</div>
              <div class="route-info">
                <div v-if="viewingRoute.distance" class="distance">{{ viewingRoute.distance }} km</div>
                <div v-if="viewingRoute.estimatedFlightTime" class="duration">{{ viewingRoute.estimatedFlightTime }}</div>
              </div>
            </div>

            <div class="airport destination">
              <div class="airport-code">{{ getAirportCode(viewingRoute.destinationAirportId, 'iata') }}</div>
              <div class="airport-name">{{ getAirportName(viewingRoute.destinationAirportId) }}</div>
              <div class="airport-city">{{ getAirportCity(viewingRoute.destinationAirportId) }}</div>
            </div>
          </div>
        </div>

        <el-divider />

        <div class="detail-grid">
          <div class="detail-section">
            <h4>Rota Bilgileri</h4>
            <div class="detail-item">
              <span class="label">Rota Kodu:</span>
              <el-tag type="primary">{{ viewingRoute.routeCode }}</el-tag>
            </div>
            <div class="detail-item">
              <span class="label">Rota Tipi:</span>
              <el-tag :type="getRouteTypeTagType(viewingRoute.routeType)">
                {{ getRouteTypeText(viewingRoute.routeType) }}
              </el-tag>
            </div>
            <div class="detail-item" v-if="viewingRoute.distance">
              <span class="label">Mesafe:</span>
              <span>{{ viewingRoute.distance?.toLocaleString() }} km</span>
            </div>
            <div class="detail-item" v-if="viewingRoute.estimatedFlightTime">
              <span class="label">Tahmini Uçuş Süresi:</span>
              <span>{{ viewingRoute.estimatedFlightTime }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h4>Özellikler</h4>
            <div class="detail-item">
              <span class="label">Popüler Rota:</span>
              <el-tag :type="viewingRoute.popularRoute ? 'success' : 'info'">
                {{ viewingRoute.popularRoute ? 'Evet' : 'Hayır' }}
              </el-tag>
            </div>
            <div class="detail-item">
              <span class="label">Sezonluk Rota:</span>
              <el-tag :type="viewingRoute.seasonalRoute ? 'warning' : 'info'">
                {{ viewingRoute.seasonalRoute ? 'Evet' : 'Hayır' }}
              </el-tag>
            </div>
            <div class="detail-item" v-if="viewingRoute.seasonalRoute && viewingRoute.season?.length">
              <span class="label">Sezonlar:</span>
              <div class="seasons">
                <el-tag
                  v-for="season in viewingRoute.season"
                  :key="season"
                  size="small"
                  class="season-tag"
                >
                  {{ getSeasonText(season) }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <div v-if="viewingRoute.operatingAirlines?.length" class="detail-section full-width">
          <h4>İşleten Havayolları</h4>
          <div class="operating-airlines-list">
            <el-tag
              v-for="airlineId in viewingRoute.operatingAirlines"
              :key="airlineId"
              class="airline-tag"
            >
              {{ getAirlineFullName(airlineId) }}
            </el-tag>
          </div>
        </div>

        <div class="detail-section full-width" v-if="viewingRoute.notes">
          <h4>Notlar</h4>
          <p>{{ viewingRoute.notes }}</p>
        </div>

        <div class="detail-actions">
          <el-button
            type="primary"
            :icon="Position"
            @click="showOnMap(viewingRoute)"
          >
            Haritada Göster
          </el-button>
          <el-button
            :icon="Promotion"
            @click="viewFlights(viewingRoute)"
          >
            Uçuşları Görüntüle
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- Map Dialog -->
    <el-dialog
      v-model="mapDialogVisible"
      title="Rota Haritası"
      width="900px"
    >
      <div class="map-container">
        <div class="map-placeholder">
          <el-icon size="48"><Position /></el-icon>
          <h3>{{ selectedRouteForMap?.routeCode }}</h3>
          <p>{{ getAirportCity(selectedRouteForMap?.originAirportId) }} → {{ getAirportCity(selectedRouteForMap?.destinationAirportId) }}</p>
          <div class="map-actions">
            <el-button type="primary" @click="openGoogleMaps">Google Maps'te Aç</el-button>
            <el-button @click="openFlightRadar">FlightRadar24'te Aç</el-button>
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
  Connection,
  Plus,
  ArrowDown,
  Check,
  Close,
  Star,
  Calculator,
  Delete,
  Refresh,
  Download,
  Search,
  Filter,
  View,
  Edit,
  Position,
  MoreFilled,
  CopyDocument,
  RefreshRight,
  Promotion,
  Right,
  CircleCheckFilled,
  DataAnalysis,
  TrendCharts,
  Odometer,
  Clock,
  Sunny,
  Flag
} from '@element-plus/icons-vue'
import { useReferenceStore } from '@/stores/reference'
import { useAppStore } from '@/stores/app'
import RouteForm from '@/components/forms/RouteForm.vue'

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
const filterOriginCountry = ref('')
const filterRouteType = ref('')
const filterStatus = ref('')
const filterMinDistance = ref('')
const filterMaxDistance = ref('')
const filterOperatingAirline = ref('')
const showAdvancedFilters = ref(false)
const sortField = ref('routeCode')
const sortOrder = ref('ascending')

// Dialog state
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const mapDialogVisible = ref(false)
const dialogMode = ref('create')
const currentRoute = ref({})
const viewingRoute = ref(null)
const selectedRouteForMap = ref(null)

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
const routes = computed(() => referenceStore.routes)
const airports = computed(() => referenceStore.airports)
const airlines = computed(() => referenceStore.airlines)

const availableCountries = computed(() => {
  const countrySet = new Set()
  routes.value.forEach(route => {
    const originAirport = airports.value.find(a => a.id === route.originAirportId)
    const destAirport = airports.value.find(a => a.id === route.destinationAirportId)
    if (originAirport) countrySet.add(originAirport.country)
    if (destAirport) countrySet.add(destAirport.country)
  })

  return Array.from(countrySet).map(code => ({
    code,
    name: countries[code]?.name || code,
    flag: countries[code]?.flag || '🌍'
  }))
})

const filteredRoutes = computed(() => {
  let result = [...routes.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(route =>
      route.routeCode?.toLowerCase().includes(query) ||
      getAirportCode(route.originAirportId, 'iata')?.toLowerCase().includes(query) ||
      getAirportCode(route.destinationAirportId, 'iata')?.toLowerCase().includes(query) ||
      getAirportName(route.originAirportId)?.toLowerCase().includes(query) ||
      getAirportName(route.destinationAirportId)?.toLowerCase().includes(query) ||
      getAirportCity(route.originAirportId)?.toLowerCase().includes(query) ||
      getAirportCity(route.destinationAirportId)?.toLowerCase().includes(query)
    )
  }

  // Origin country filter
  if (filterOriginCountry.value) {
    result = result.filter(route => {
      const originAirport = airports.value.find(a => a.id === route.originAirportId)
      return originAirport?.country === filterOriginCountry.value
    })
  }

  // Route type filter
  if (filterRouteType.value) {
    result = result.filter(route => route.routeType === filterRouteType.value)
  }

  // Status filter
  if (filterStatus.value) {
    switch (filterStatus.value) {
      case 'active':
        result = result.filter(route => route.active)
        break
      case 'inactive':
        result = result.filter(route => !route.active)
        break
      case 'popular':
        result = result.filter(route => route.popularRoute)
        break
      case 'seasonal':
        result = result.filter(route => route.seasonalRoute)
        break
    }
  }

  // Distance filters
  if (filterMinDistance.value) {
    result = result.filter(route =>
      route.distance && route.distance >= filterMinDistance.value
    )
  }

  if (filterMaxDistance.value) {
    result = result.filter(route =>
      route.distance && route.distance <= filterMaxDistance.value
    )
  }

  // Operating airline filter
  if (filterOperatingAirline.value) {
    result = result.filter(route =>
      route.operatingAirlines?.includes(filterOperatingAirline.value)
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

const totalRoutes = computed(() => filteredRoutes.value.length)

const paginatedRoutes = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredRoutes.value.slice(start, end)
})

// Statistics computed
const activeRoutesCount = computed(() => {
  return routes.value.filter(r => r.active).length
})

const popularRoutesCount = computed(() => {
  return routes.value.filter(r => r.popularRoute).length
})

const totalDistance = computed(() => {
  return routes.value.reduce((total, route) => {
    return total + (route.distance || 0)
  }, 0)
})

const averageDistance = computed(() => {
  const routesWithDistance = routes.value.filter(r => r.distance)
  if (routesWithDistance.length === 0) return 0

  return totalDistance.value / routesWithDistance.length
})

// Methods
function getAirportCode(airportId, type = 'iata') {
  const airport = airports.value.find(a => a.id === airportId)
  return airport ? airport[`${type}Code`] : 'N/A'
}

function getAirportName(airportId) {
  const airport = airports.value.find(a => a.id === airportId)
  return airport ? airport.name : 'Bilinmeyen Havaalanı'
}

function getAirportCity(airportId) {
  const airport = airports.value.find(a => a.id === airportId)
  return airport ? airport.city : 'Bilinmeyen Şehir'
}

function getAirlineCode(airlineId) {
  const airline = airlines.value.find(a => a.id === airlineId)
  return airline ? airline.code : 'N/A'
}

function getAirlineFullName(airlineId) {
  const airline = airlines.value.find(a => a.id === airlineId)
  return airline ? `${airline.code} - ${airline.name}` : 'Bilinmeyen Havayolu'
}

function getRouteTypeText(type) {
  const types = {
    'DOMESTIC': 'İç Hat',
    'INTERNATIONAL': 'Uluslararası',
    'CONTINENTAL': 'Kıta İçi',
    'INTERCONTINENTAL': 'Kıtalar Arası'
  }
  return types[type] || type
}

function getRouteTypeTagType(type) {
  const tagTypes = {
    'DOMESTIC': 'success',
    'INTERNATIONAL': 'primary',
    'CONTINENTAL': 'warning',
    'INTERCONTINENTAL': 'danger'
  }
  return tagTypes[type] || 'default'
}

function getSeasonText(season) {
  const seasons = {
    'SPRING': 'İlkbahar',
    'SUMMER': 'Yaz',
    'AUTUMN': 'Sonbahar',
    'WINTER': 'Kış'
  }
  return seasons[season] || season
}

async function loadRoutes() {
  loading.value = true
  try {
    await referenceStore.fetchRoutes(true)
  } catch (error) {
    ElMessage.error('Rotalar yüklenirken hata oluştu')
  } finally {
    loading.value = false
  }
}

function handleCreate() {
  dialogMode.value = 'create'
  currentRoute.value = {
    active: true,
    routeType: 'DOMESTIC',
    popularRoute: false,
    seasonalRoute: false,
    season: [],
    operatingAirlines: []
  }
  dialogVisible.value = true
}

function handleEdit(route) {
  dialogMode.value = 'edit'
  currentRoute.value = { ...route }
  dialogVisible.value = true
}

function handleView(route) {
  viewingRoute.value = route
  viewDialogVisible.value = true
}

async function handleDelete(route) {
  try {
    await ElMessageBox.confirm(
      `"${route.routeCode}" rotasını silmek istediğinizden emin misiniz?`,
      'Rota Sil',
      {
        confirmButtonText: 'Sil',
        cancelButtonText: 'İptal',
        type: 'warning'
      }
    )

    await referenceStore.deleteRoute(route.id)
    ElMessage.success('Rota başarıyla silindi')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Rota silinirken hata oluştu')
    }
  }
}

async function handleStatusChange(route) {
  route.statusLoading = true
  try {
    await referenceStore.updateRoute(route.id, { active: route.active })
    ElMessage.success(`Rota ${route.active ? 'aktifleştirildi' : 'pasifleştirildi'}`)
  } catch (error) {
    route.active = !route.active
    ElMessage.error('Durum güncellenirken hata oluştu')
  } finally {
    route.statusLoading = false
  }
}

async function handleFormSubmit(formData) {
  submitting.value = true
  try {
    if (dialogMode.value === 'create') {
      await referenceStore.createRoute(formData)
      ElMessage.success('Rota başarıyla oluşturuldu')
    } else {
      await referenceStore.updateRoute(currentRoute.value.id, formData)
      ElMessage.success('Rota başarıyla güncellendi')
    }

    dialogVisible.value = false
    currentRoute.value = {}
  } catch (error) {
    ElMessage.error(
      dialogMode.value === 'create'
        ? 'Rota oluşturulurken hata oluştu'
        : 'Rota güncellenirken hata oluştu'
    )
  } finally {
    submitting.value = false
  }
}

function handleDialogClose() {
  dialogVisible.value = false
  currentRoute.value = {}
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
  filterOriginCountry.value = ''
  filterRouteType.value = ''
  filterStatus.value = ''
  filterMinDistance.value = ''
  filterMaxDistance.value = ''
  filterOperatingAirline.value = ''
  currentPage.value = 1
}

function handleRefresh() {
  loadRoutes()
}

function handleExport() {
  ElMessage.info('Dışa aktarma özelliği yakında eklenecek')
}

async function handleBulkAction(command) {
  if (selectedRows.value.length === 0) return

  try {
    const count = selectedRows.value.length
    await ElMessageBox.confirm(
      `${count} rota için ${command} işlemini gerçekleştirmek istediğinizden emin misiniz?`,
      'Toplu İşlem',
      {
        confirmButtonText: 'Evet',
        cancelButtonText: 'İptal',
        type: 'warning'
      }
    )

    switch (command) {
      case 'activate':
        ElMessage.success(`${count} rota aktifleştirildi`)
        break
      case 'deactivate':
        ElMessage.success(`${count} rota pasifleştirildi`)
        break
      case 'popular':
        ElMessage.success(`${count} rota popüler olarak işaretlendi`)
        break
      case 'calculate':
        ElMessage.success(`${count} rota için mesafe/süre hesaplandı`)
        break
      case 'delete':
        ElMessage.success(`${count} rota silindi`)
        break
    }

    selectedRows.value = []
    await loadRoutes()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Toplu işlem sırasında hata oluştu')
    }
  }
}

function handleRowAction(command, route) {
  switch (command) {
    case 'duplicate':
      dialogMode.value = 'create'
      currentRoute.value = {
        ...route,
        id: undefined,
        routeCode: '',
        active: true
      }
      dialogVisible.value = true
      break
    case 'reverse':
      createReverseRoute(route)
      break
    case 'flights':
      viewFlights(route)
      break
    case 'calculate':
      calculateRouteMetrics(route)
      break
  }
}

async function createReverseRoute(route) {
  try {
    const reverseRoute = {
      ...route,
      id: undefined,
      routeCode: `${getAirportCode(route.destinationAirportId, 'iata')}-${getAirportCode(route.originAirportId, 'iata')}`,
      originAirportId: route.destinationAirportId,
      destinationAirportId: route.originAirportId,
      active: true
    }

    await referenceStore.createRoute(reverseRoute)
    ElMessage.success('Ters rota başarıyla oluşturuldu')
    await loadRoutes()
  } catch (error) {
    ElMessage.error('Ters rota oluşturulurken hata oluştu')
  }
}

function viewFlights(route) {
  router.push({
    name: 'Flights',
    query: { route: route.id }
  })
}

async function calculateRouteMetrics(route) {
  try {
    const originAirport = airports.value.find(a => a.id === route.originAirportId)
    const destAirport = airports.value.find(a => a.id === route.destinationAirportId)

    if (!originAirport?.latitude || !destAirport?.latitude) {
      ElMessage.warning('Havaalanı koordinat bilgileri eksik')
      return
    }

    // Calculate distance using Haversine formula
    const distance = calculateDistance(
      originAirport.latitude, originAirport.longitude,
      destAirport.latitude, destAirport.longitude
    )

    const flightTimeHours = distance / 800 // Average speed
    const hours = Math.floor(flightTimeHours)
    const minutes = Math.round((flightTimeHours - hours) * 60)
    const estimatedFlightTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

    await referenceStore.updateRoute(route.id, {
      distance: Math.round(distance),
      estimatedFlightTime
    })

    ElMessage.success('Mesafe ve süre hesaplandı')
    await loadRoutes()
  } catch (error) {
    ElMessage.error('Hesaplama sırasında hata oluştu')
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

function showOnMap(route) {
  selectedRouteForMap.value = route
  mapDialogVisible.value = true
}

function openGoogleMaps() {
  if (selectedRouteForMap.value) {
    const origin = airports.value.find(a => a.id === selectedRouteForMap.value.originAirportId)
    const destination = airports.value.find(a => a.id === selectedRouteForMap.value.destinationAirportId)

    if (origin?.latitude && destination?.latitude) {
      const url = `https://www.google.com/maps/dir/${origin.latitude},${origin.longitude}/${destination.latitude},${destination.longitude}`
      window.open(url, '_blank')
    }
  }
}

function openFlightRadar() {
  if (selectedRouteForMap.value) {
    const originCode = getAirportCode(selectedRouteForMap.value.originAirportId, 'iata')
    const destCode = getAirportCode(selectedRouteForMap.value.destinationAirportId, 'iata')
    const url = `https://www.flightradar24.com/data/airports/${originCode.toLowerCase()}/routes`
    window.open(url, '_blank')
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
  appStore.setPageTitle('Rota Yönetimi')
  await Promise.all([
    loadRoutes(),
    referenceStore.fetchAirports(),
    referenceStore.fetchAirlines()
  ])
})

// Watch for route query changes
watch(() => router.currentRoute.value.query, (query) => {
  if (query.search) {
    searchQuery.value = query.search
  }
  if (query.airport) {
    const airportId = parseInt(query.airport)
    // Filter routes that include this airport
    searchQuery.value = getAirportCode(airportId, 'iata')
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
.route-management {
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

          &.popular {
            background: linear-gradient(135deg, #e6a23c, #ebb563);
            color: white;
          }

          &.total {
            background: linear-gradient(135deg, #409eff, #66b1ff);
            color: white;
          }

          &.average {
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

  .table-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .data-table {
      .route-info {
        .route-path {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;

          .airport {
            flex: 1;
            text-align: center;

            &.origin .airport-code {
              color: #67c23a;
            }

            &.destination .airport-code {
              color: #f56c6c;
            }

            .airport-code {
              font-size: 1.1rem;
              font-weight: 700;
              margin-bottom: 0.25rem;
            }

            .airport-name {
              font-size: 0.875rem;
              color: #303133;
              margin-bottom: 0.25rem;
              font-weight: 500;
            }

            .airport-city {
              font-size: 0.75rem;
              color: #909399;
            }
          }

          .route-arrow {
            color: #409eff;
            font-size: 1.2rem;
          }
        }

        .route-type {
          text-align: center;
        }
      }

      .distance-duration {
        .distance, .duration {
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

        .no-data {
          text-align: center;
        }
      }

      .operating-airlines {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;

        .airline-tag {
          background-color: #f0f9ff;
          border-color: #409eff;
          color: #409eff;
          font-size: 0.75rem;
        }
      }

      .route-properties {
        display: flex;
        justify-content: center;
        gap: 0.5rem;

        .property-icon {
          font-size: 1.2rem;

          &.popular {
            color: #e6a23c;
          }

          &.seasonal {
            color: #f56c6c;
          }

          &.international {
            color: #409eff;
          }
        }
      }

      .action-buttons {
        display: flex;
        gap: 0.25rem;
        justify-content: center;
        flex-wrap: wrap;
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

  .route-details {
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;

      .route-title {
        h3 {
          margin: 0 0 0.5rem 0;
          color: #303133;
          font-size: 1.5rem;
        }

        .route-subtitle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #606266;
          font-size: 1rem;
        }
      }

      .status-badges {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-end;
      }
    }

    .route-visualization {
      margin: 1.5rem 0;

      .route-visual {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 2rem;
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

        .airport {
          text-align: center;
          flex: 1;

          &.origin {
            .airport-code {
              color: #67c23a;
            }
          }

          &.destination {
            .airport-code {
              color: #f56c6c;
            }
          }

          .airport-code {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
          }

          .airport-name {
            font-weight: 600;
            color: #303133;
            margin-bottom: 0.25rem;
          }

          .airport-city {
            font-size: 0.875rem;
            color: #909399;
          }
        }

        .route-line {
          flex: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          margin: 0 2rem;

          &::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, #67c23a 0%, #409eff 50%, #f56c6c 100%);
            z-index: 1;
          }

          .plane-icon {
            font-size: 2rem;
            z-index: 2;
            background: white;
            padding: 0 1rem;
            animation: fly 3s ease-in-out infinite;
          }

          .route-info {
            margin-top: 1rem;
            text-align: center;
            z-index: 2;
            background: white;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);

            .distance {
              font-weight: 600;
              color: #409eff;
              margin-bottom: 0.25rem;
            }

            .duration {
              font-size: 0.875rem;
              color: #606266;
            }
          }
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
        align-items: flex-start;
        margin-bottom: 0.75rem;

        .label {
          font-weight: 500;
          color: #606266;
          min-width: 150px;
        }

        .seasons {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }
      }

      p {
        margin: 0;
        line-height: 1.6;
        color: #303133;
      }
    }

    .operating-airlines-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;

      .airline-tag {
        background-color: #f0f9ff;
        border-color: #409eff;
        color: #409eff;
      }
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

      .map-actions {
        display: flex;
        gap: 1rem;
      }
    }
  }
}

// Responsive
@media (max-width: 768px) {
  .route-management {
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

          .filter-select {
            width: 120px;
          }
        }
      }
    }

    .stats-cards {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .table-container {
      .data-table {
        :deep(.el-table__body-wrapper) {
          overflow-x: auto;
        }

        .route-info .route-path {
          flex-direction: column;
          gap: 0.5rem;

          .route-arrow {
            transform: rotate(90deg);
          }
        }

        .action-buttons {
          flex-direction: column;
          gap: 0.25rem;

          .el-button {
            padding: 0.25rem;
            min-width: auto;
          }
        }
      }
    }

    .route-details {
      .detail-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;

        .status-badges {
          flex-direction: row;
          align-items: flex-start;
        }
      }

      .route-visualization .route-visual {
        flex-direction: column;
        gap: 2rem;

        .route-line {
          margin: 0;
          transform: rotate(90deg);
          width: 100px;
          height: 100px;

          &::before {
            top: <template>
  <div class="route-management">
            <!-- Page Header -->
            <div class="page-header">
      <div class="header-content">
        <div class="page-title">
          <el-icon size="24"><Connection /></el-icon>
          <h1>Rota Yönetimi</h1>
          <el-tag :type="routes.length > 0 ? 'success' : 'info'">
          {{ routes.length }} Rota
          </el-tag>
        </div>

        <div class="header-actions">
          <el-button
            type="primary"
          :icon="Plus"
          @click="handleCreate"
          :loading="loading"
          >
          Yeni Rota
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
          <el-dropdown-item command="popular" :icon="Star">
          Popüler İşaretle
          </el-dropdown-item>
          <el-dropdown-item command="calculate" :icon="Calculator">
          Mesafe/Süre Hesapla
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
          placeholder="Rota ara... (kod, havaalanı, şehir)"
          :prefix-icon="Search"
          clearable
          @input="handleSearch"
          @clear="handleSearchClear"
          class="search-input"
          />
          </div>

          <div class="filters">
          <el-select
          v-model="filterOriginCountry"
          placeholder="Kalkış Ülkesi"
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
          v-model="filterRouteType"
          placeholder="Rota Tipi"
          clearable
          @change="handleFilter"
          class="filter-select"
          >
          <el-option label="İç Hat" value="DOMESTIC" />
          <el-option label="Uluslararası" value="INTERNATIONAL" />
          <el-option label="Kıta İçi" value="CONTINENTAL" />
          <el-option label="Kıtalar Arası" value="INTERCONTINENTAL" />
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
          <el-option label="Popüler" value="popular" />
          <el-option label="Sezonluk" value="seasonal" />
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
              <el-form-item label="Min. Mesafe (km)">
                <el-input-number
            v-model="filterMinDistance"
          :min="0"
          placeholder="Minimum mesafe"
          @change="handleFilter"
          />
          </el-form-item>

          <el-form-item label="Max. Mesafe (km)">
          <el-input-number
          v-model="filterMaxDistance"
          :min="0"
          placeholder="Maksimum mesafe"
          @change="handleFilter"
          />
          </el-form-item>

          <el-form-item label="İşleten Havayolu">
          <el-select
          v-model="filterOperatingAirline"
          placeholder="Havayolu seçin"
          clearable
          filterable
          @change="handleFilter"
          >
          <el-option
          v-for="airline in airlines"
          :key="airline.id"
          :label="airline.name"
          :value="airline.id"
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

          <!-- Statistics Cards -->
          <div class="stats-cards">
          <el-card class="stat-card">
          <div class="stat-content">
          <div class="stat-icon active">
          <el-icon><CircleCheckFilled /></el-icon>
          </div>
          <div class="stat-info">
          <div class="stat-number">{{ activeRoutesCount }}</div>
          <div class="stat-label">Aktif Rota</div>
          </div>
          </div>
          </el-card>

          <el-card class="stat-card">
          <div class="stat-content">
          <div class="stat-icon popular">
          <el-icon><Star /></el-icon>
          </div>
          <div class="stat-info">
          <div class="stat-number">{{ popularRoutesCount }}</div>
          <div class="stat-label">Popüler Rota</div>
          </div>
          </div>
          </el-card>

          <el-card class="stat-card">
          <div class="stat-content">
          <div class="stat-icon total">
          <el-icon><DataAnalysis /></el-icon>
          </div>
          <div class="stat-info">
          <div class="stat-number">{{ totalDistance.toLocaleString() }}</div>
          <div class="stat-label">Toplam Mesafe (km)</div>
          </div>
          </div>
          </el-card>

          <el-card class="stat-card">
          <div class="stat-content">
          <div class="stat-icon average">
          <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
          <div class="stat-number">{{ averageDistance.toFixed(0) }}</div>
          <div class="stat-label">Ortalama Mesafe (km)</div>
          </div>
          </div>
          </el-card>
          </div>

          <!-- Data Table -->
          <div class="table-container">
          <el-table
          ref="tableRef"
          v-loading="loading"
          :data="paginatedRoutes"
          @selection-change="handleSelectionChange"
          @sort-change="handleSortChange"
          row-key="id"
          class="data-table"
          empty-text="Rota bulunamadı"
          :default-sort="{ prop: 'routeCode', order: 'ascending' }"
          >
          <!-- Selection Column -->
          <el-table-column type="selection" width="55" fixed="left" />

          <!-- Index Column -->
          <el-table-column type="index" label="#" width="60" />

          <!-- Route Code Column -->
          <el-table-column
          prop="routeCode"
          label="Rota Kodu"
          width="120"
          sortable
          fixed="left"
          >
          <template #default="{ row }">
          <el-tag type="primary" size="large">
          {{ row.routeCode }}
          </el-tag>
          </template>
          </el-table-column>

          <!-- Route Info Column -->
          <el-table-column label="Rota Bilgileri" min-width="300">
          <template #default="{ row }">
          <div class="route-info">
          <div class="route-path">
          <div class="airport origin">
          <div class="airport-code">{{ getAirportCode(row.originAirportId, 'iata') }}</div>
          <div class="airport-name">{{ getAirportName(row.originAirportId) }}</div>
          <div class="airport-city">{{ getAirportCity(row.originAirportId) }}</div>
          </div>

          <div class="route-arrow">
          <el-icon><Right /></el-icon>
          </div>

          <div class="airport destination">
          <div class="airport-code">{{ getAirportCode(row.destinationAirportId, 'iata') }}</div>
          <div class="airport-name">{{ getAirportName(row.destinationAirportId) }}</div>
          <div class="airport-city">{{ getAirportCity(row.destinationAirportId) }}</div>
          </div>
          </div>

          <div class="route-type">
          <el-tag :type="getRouteTypeTagType(row.routeType)" size="small">
          {{ getRouteTypeText(row.routeType) }}
          </el-tag>
          </div>
          </div>
          </template>
          </el-table-column>

          <!-- Distance & Duration Column -->
          <el-table-column label="Mesafe & Süre" width="150" align="center">
          <template #default="{ row }">
          <div class="distance-duration">
          <div v-if="row.distance" class="distance">
          <el-icon><Odometer /></el-icon>
          <span>{{ row.distance?.toLocaleString() }} km</span>
              </div>
              <div v-if="row.estimatedFlightTime" class="duration">
                <el-icon><Clock /></el-icon>
                <span>{{ row.estimatedFlightTime }}</span>
          </div>
          <div v-if="!row.distance && !row.estimatedFlightTime" class="no-data">
          <el-button
          type="primary"
          size="small"
          text
          @click="calculateRouteMetrics(row)"
          >
          Hesapla
          </el-button>
          </div>
          </div>
          </template>
          </el-table-column>

          <!-- Operating Airlines Column -->
          <el-table-column label="İşleten Havayolları" width="180">
          <template #default="{ row }">
          <div v-if="row.operatingAirlines?.length > 0" class="operating-airlines">
          <el-tag
          v-for="airlineId in row.operatingAirlines.slice(0, 3)"
          :key="airlineId"
          size="small"
          class="airline-tag"
          >
          {{ getAirlineCode(airlineId) }}
          </el-tag>
          <el-tag
          v-if="row.operatingAirlines.length > 3"
          size="small"
          type="info"
          >
          +{{ row.operatingAirlines.length - 3 }}
          </el-tag>
          </div>
          <span v-else class="no-data">-</span>
          </template>
          </el-table-column>

          <!-- Route Properties Column -->
          <el-table-column label="Özellikler" width="120" align="center">
          <template #default="{ row }">
          <div class="route-properties">
          <el-tooltip v-if="row.popularRoute" content="Popüler Rota" placement="top">
          <el-icon class="property-icon popular"><Star /></el-icon>
          </el-tooltip>
          <el-tooltip v-if="row.seasonalRoute" content="Sezonluk Rota" placement="top">
          <el-icon class="property-icon seasonal"><Sunny /></el-icon>
          </el-tooltip>
          <el-tooltip v-if="row.routeType === 'INTERNATIONAL'" content="Uluslararası" placement="top">
          <el-icon class="property-icon international"><Flag /></el-icon>
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
          <el-dropdown-item command="reverse" :icon="RefreshRight">
          Ters Rota Oluştur
          </el-dropdown-item>
          <el-dropdown-item command="flights" :icon="Promotion">
          Uçuşları Görüntüle
          </el-dropdown-item>
          <el-dropdown-item command="calculate" :icon="Calculator">
          Hesapla
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
          :total="totalRoutes"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
          />
          </div>
          </div>

          <!-- Create/Edit Dialog -->
          <el-dialog
          v-model="dialogVisible"
          :title="dialogMode === 'create' ? 'Yeni Rota Ekle' : 'Rota Düzenle'"
          width="900px"
          :close-on-click-modal="false"
          :close-on-press-escape="false"
          @close="handleDialogClose"
          >
          <RouteForm
          v-model="currentRoute"
          :is-editing="dialogMode === 'edit'"
          :submitting="submitting"
          @submit="handleFormSubmit"
          @cancel="handleDialogClose"
          />
          </el-dialog>

          <!-- View Dialog -->
          <el-dialog
          v-model="viewDialogVisible"
          title="Rota Detayları"
          width="800px"
          >
          <div v-if="viewingRoute" class="route-details">
          <div class="detail-header">
          <div class="route-title">
          <h3>{{ viewingRoute.routeCode }}</h3>
          <div class="route-subtitle">
          <span>{{ getAirportName(viewingRoute.originAirportId) }}</span>
          <el-icon><Right /></el-icon>
          <span>{{ getAirportName(viewingRoute.destinationAirportId) }}</span>
          </div>
          </div>
          <div class="status-badges">
          <el-tag :type="getRouteTypeTagType(viewingRoute.routeType)">
          {{ getRouteTypeText(viewingRoute.routeType) }}
          </el-tag>
          <el-tag :type="viewingRoute.active ? 'success' : 'danger'">
          {{ viewingRoute.active ? 'Aktif' : 'Pasif' }}
          </el-tag>
          </div>
          </div>

          <el-divider />

          <!-- Route Visualization -->
          <div class="route-visualization">
          <div class="route-visual">
          <div class="airport origin">
          <div class="airport-code">{{ getAirportCode(viewingRoute.originAirportId, 'iata') }}</div>
          <div class="airport-name">{{ getAirportName(viewingRoute.originAirportId) }}</div>
          <div class="airport-city">{{ getAirportCity(viewingRoute.originAirportId) }}</div>
          </div>

          <div class="route-line">
          <div class="plane-icon">✈️</div>
          <div class="route-info">
          <div v-if="viewingRoute.distance" class="distance">{{ viewingRoute.distance }} km</div>
                <div v-if="viewingRoute.estimatedFlightTime" class="duration">{{ viewingRoute.estimatedFlightTime }}</div>
          </div>
          </div>

          <div class="airport destination">
          <div class="airport-code">{{ getAirportCode(viewingRoute.destinationAirportId, 'iata') }}</div>
          <div class="airport-name">{{ getAirportName(viewingRoute.destinationAirportId) }}</div>
          <div class="airport-city">{{ getAirportCity(viewingRoute.destinationAirportId) }}</div>
          </div>
          </div>
          </div>

          <el-divider />

          <div class="detail-grid">
          <div class="detail-section">
          <h4>Rota Bilgileri</h4>
          <div class="detail-item">
          <span class="label">Rota Kodu:</span>
          <el-tag type="primary">{{ viewingRoute.routeCode }}</el-tag>
          </div>
          <div class="detail-item">
          <span class="label">Rota Tipi:</span>
          <el-tag :type="getRouteTypeTagType(viewingRoute.routeType)">
          {{ getRouteTypeText(viewingRoute.routeType) }}
          </el-tag>
          </div>
          <div class="detail-item" v-if="viewingRoute.distance">
          <span class="label">Mesafe:</span>
          <span>{{ viewingRoute.distance?.toLocaleString() }} km</span>
            </div>
            <div class="detail-item" v-if="viewingRoute.estimatedFlightTime">
              <span class="label">Tahmini Uçuş Süresi:</span>
              <span>{{ viewingRoute.estimatedFlightTime }}</span>
          </div>
          </div>

          <div class="detail-section">
          <h4>Özellikler</h4>
          <div class="detail-item">
          <span class="label">Popüler Rota:</span>
          <el-tag :type="viewingRoute.popularRoute ? 'success' : 'info'">
          {{ viewingRoute.popularRoute ? 'Evet' : 'Hayır' }}
          </el-tag>
          </div>
          <div class="detail-item">
          <span class="label">Sezonluk Rota:</span>
          <el-tag :type="viewingRoute.seasonalRoute ? 'warning' : 'info'">
          {{ viewingRoute.seasonalRoute ? 'Evet' : 'Hayır' }}
          </el-tag>
          </div>
          <div class="detail-item" v-if="viewingRoute.seasonalRoute && viewingRoute.season?.length">
          <span class="label">Sezonlar:</span>
          <div class="seasons">
          <el-tag
          v-for="season in viewingRoute.season"
          :key="season"
          size="small"
          class="season-tag"
          >
          {{ getSeasonText(season) }}
          </el-tag>
          </div>
          </div>
          </div>
          </div>

          <div v-if="viewingRoute.operatingAirlines?.length" class="detail-section full-width">
          <h4>İşleten Havayolları</h4>
          <div class="operating-airlines-list">
          <el-tag
          v-for="airlineId in viewingRoute.operatingAirlines"
          :key="airlineId"
          class="airline-tag"
          >
          {{ getAirlineFullName(airlineId) }}
          </el-tag>
          </div>
          </div>

          <div class="detail-section full-width" v-if="viewingRoute.notes">
          <h4>Notlar</h4>
          <p>{{ viewingRoute.notes }}</p>
          </div>

          <div class="detail-actions">
          <el-button
          type="primary"
          :icon="Position"
          @click="showOnMap(viewingRoute)"
          >
          Haritada Göster
          </el-button>
          <el-button
          :icon="Promotion"
          @click="viewFlights(viewingRoute)"
          >
          Uçuşları Görüntüle
          </el-button>
          </div>
          </div>
          </el-dialog>

          <!-- Map Dialog -->
          <el-dialog
          v-model="mapDialogVisible"
          title="Rota Haritası"
          width="900px"
          >
          <div class="map-container">
          <div class="map-placeholder">
          <el-icon size="48"><Position /></el-icon>
          <h3>{{ selectedRouteForMap?.routeCode }}</h3>
          <p>{{ getAirportCity(selectedRouteForMap?.originAirportId) }} → {{ getAirportCity(selectedRouteForMap?.destinationAirportId) }}</p>
          <div class="map-actions">
          <el-button type="primary" @click="openGoogleMaps">Google Maps'te Aç</el-button>
          <el-button @click="openFlightRadar">FlightRadar24'te Aç</el-button>
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
            Connection,
            Plus,
            ArrowDown,
            Check,
            Close,
            Star,
            Calculator,
            Delete,
            Refresh,
            Download,
            Search,
            Filter,
            View,
            Edit,
            Position,
            MoreFilled,
            CopyDocument,
            RefreshRight,
            Promotion,
            Right,
            CircleCheckFilled,
            DataAnalysis,
            TrendCharts,
            Odometer,
            Clock,
            Sunny,
            Flag
          } from '@element-plus/icons-vue'
          import { useReferenceStore } from '@/stores/reference'
          import { useAppStore } from '@/stores/app'
          import RouteForm from '@/components/forms/RouteForm.vue'

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
          const filterOriginCountry = ref('')
          const filterRouteType = ref('')
          const filterStatus = ref('')
          const filterMinDistance = ref('')
          const filterMaxDistance = ref('')
          const filterOperatingAirline = ref('')
          const showAdvancedFilters = ref(false)
          const sortField = ref('routeCode')
          const sortOrder = ref('ascending')

            // Dialog state
          const dialogVisible = ref(false)
          const viewDialogVisible = ref(false)
          const mapDialogVisible = ref(false)
          const dialogMode = ref('create')
          const currentRoute = ref({})
          const viewingRoute = ref(null)
          const selectedRouteForMap = ref(null)

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
            const routes = computed(() => referenceStore.routes)
            const airports = computed(() => referenceStore.airports)
            const airlines = computed(() => referenceStore.airlines)

            const availableCountries = computed(() => {
            const countrySet = new Set()
            routes.value.forEach(route => {
            const originAirport = airports.value.find(a => a.id === route.originAirportId)
            const destAirport = airports.value.find(a => a.id === route.destinationAirportId)
            if (originAirport) countrySet.add(originAirport.country)
            if (destAirport) countrySet.add(destAirport.country)
          })

          return Array.from(countrySet).map(code => ({
          code,
          name: countries[code]?.name || code,
          flag: countries[code]?.flag || '🌍'
          }))
          })

          const filteredRoutes = computed(() => {
            let result = [...routes.value]

              // Search filter
            if (searchQuery.value) {
            const query = searchQuery.value.toLowerCase()
            result = result.filter(route =>
      route.routeCode?.toLowerCase().includes(query) ||
            getAirportCode(route.originAirportId, 'iata')?.toLowerCase().includes(query) ||
            getAirportCode(route.destinationAirportId, 'iata')?.toLowerCase().includes(query) ||
            getAirportName(route.originAirportId)?.toLowerCase().includes(query) ||
            getAirportName(route.destinationAirportId)?.toLowerCase().includes(query) ||
            getAirportCity(route.originAirportId)?.toLowerCase().includes(query) ||
            getAirportCity(route.destinationAirportId)?.toLowerCase().includes(query)
          )
          }

            // Origin country filter
            if (filterOriginCountry.value) {
            result = result.filter(route => {
            const originAirport = airports.value.find(a => a.id === route.originAirportId)
            return originAirport?.country === filterOriginCountry.value
          })
          }

            // Route type filter
            if (filterRouteType.value) {
            result = result.filter(route => route.routeType === filterRouteType.value)
          }

            // Status filter
            if (filterStatus.value) {
            switch (filterStatus.value) {
            case 'active':
            result = result.filter(route => route.active)

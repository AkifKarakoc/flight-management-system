<template>
  <div class="search-filter">
    <!-- Basic Search -->
    <div class="filter-row">
      <div class="filter-item search-input">
        <el-input
          v-model="searchQuery"
          placeholder="Ara..."
          :prefix-icon="Search"
          clearable
          @input="handleSearchInput"
          @clear="handleSearchClear"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button
              :icon="Search"
              @click="handleSearch"
              :loading="searching"
            />
          </template>
        </el-input>
      </div>

      <div class="filter-item">
        <el-button
          :icon="showAdvanced ? ArrowUp : ArrowDown"
          @click="toggleAdvanced"
          size="default"
        >
          {{ showAdvanced ? 'Basit' : 'Gelişmiş' }} Filtre
        </el-button>
      </div>

      <div class="filter-item" v-if="hasActiveFilters">
        <el-button
          :icon="RefreshRight"
          @click="handleReset"
          size="default"
        >
          Temizle
        </el-button>
      </div>
    </div>

    <!-- Advanced Filters -->
    <el-collapse-transition>
      <div v-show="showAdvanced" class="advanced-filters">
        <el-form
          :model="filters"
          label-width="120px"
          label-position="left"
          size="default"
        >
          <div class="filter-grid">
            <!-- Status Filter -->
            <el-form-item label="Durum" v-if="showStatus">
              <el-select
                v-model="filters.status"
                placeholder="Durum seçin"
                clearable
                multiple
                collapse-tags
                collapse-tags-tooltip
                @change="handleFilterChange"
              >
                <el-option
                  v-for="status in statusOptions"
                  :key="status.value"
                  :label="status.label"
                  :value="status.value"
                >
                  <el-tag :type="status.type" size="small">
                    {{ status.label }}
                  </el-tag>
                </el-option>
              </el-select>
            </el-form-item>

            <!-- Type Filter -->
            <el-form-item label="Tip" v-if="showType">
              <el-select
                v-model="filters.type"
                placeholder="Tip seçin"
                clearable
                multiple
                collapse-tags
                @change="handleFilterChange"
              >
                <el-option
                  v-for="type in typeOptions"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                />
              </el-select>
            </el-form-item>

            <!-- Date Range -->
            <el-form-item label="Tarih Aralığı" v-if="showDateRange">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="→"
                start-placeholder="Başlangıç"
                end-placeholder="Bitiş"
                format="DD.MM.YYYY"
                value-format="YYYY-MM-DD"
                @change="handleDateRangeChange"
                clearable
              />
            </el-form-item>

            <!-- Airline Filter -->
            <el-form-item label="Havayolu" v-if="showAirline">
              <el-select
                v-model="filters.airlineId"
                placeholder="Havayolu seçin"
                clearable
                filterable
                @change="handleFilterChange"
                :loading="airlinesLoading"
              >
                <el-option
                  v-for="airline in airlines"
                  :key="airline.id"
                  :label="airline.name"
                  :value="airline.id"
                >
                  <span class="airline-option">
                    <span class="airline-code">{{ airline.iataCode }}</span>
                    <span>{{ airline.name }}</span>
                  </span>
                </el-option>
              </el-select>
            </el-form-item>

            <!-- Origin Airport -->
            <el-form-item label="Kalkış" v-if="showOrigin">
              <el-select
                v-model="filters.originAirportId"
                placeholder="Kalkış havaalanı"
                clearable
                filterable
                @change="handleFilterChange"
                :loading="airportsLoading"
              >
                <el-option
                  v-for="airport in airports"
                  :key="airport.id"
                  :label="`${airport.iataCode} - ${airport.name}`"
                  :value="airport.id"
                >
                  <span class="airport-option">
                    <span class="airport-code">{{ airport.iataCode }}</span>
                    <span>{{ airport.name }}</span>
                    <span class="airport-city">{{ airport.city }}</span>
                  </span>
                </el-option>
              </el-select>
            </el-form-item>

            <!-- Destination Airport -->
            <el-form-item label="Varış" v-if="showDestination">
              <el-select
                v-model="filters.destinationAirportId"
                placeholder="Varış havaalanı"
                clearable
                filterable
                @change="handleFilterChange"
                :loading="airportsLoading"
              >
                <el-option
                  v-for="airport in airports"
                  :key="airport.id"
                  :label="`${airport.iataCode} - ${airport.name}`"
                  :value="airport.id"
                >
                  <span class="airport-option">
                    <span class="airport-code">{{ airport.iataCode }}</span>
                    <span>{{ airport.name }}</span>
                    <span class="airport-city">{{ airport.city }}</span>
                  </span>
                </el-option>
              </el-select>
            </el-form-item>

            <!-- Custom Filters Slot -->
            <slot name="custom-filters" :filters="filters" :handleFilterChange="handleFilterChange" />
          </div>

          <!-- Filter Actions -->
          <div class="filter-actions">
            <el-button @click="handleApply" type="primary" :loading="searching">
              Filtrele
            </el-button>
            <el-button @click="handleReset">
              Temizle
            </el-button>
            <el-button @click="toggleAdvanced">
              Kapat
            </el-button>
          </div>
        </el-form>
      </div>
    </el-collapse-transition>

    <!-- Active Filters Display -->
    <div v-if="hasActiveFilters && !showAdvanced" class="active-filters">
      <span class="active-filters-label">Aktif Filtreler:</span>

      <el-tag
        v-for="filter in activeFiltersList"
        :key="filter.key"
        closable
        @close="removeFilter(filter.key)"
        size="small"
        class="filter-tag"
      >
        {{ filter.label }}: {{ filter.value }}
      </el-tag>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Search,
  ArrowUp,
  ArrowDown,
  RefreshRight
} from '@element-plus/icons-vue'
import { useReferenceStore } from '@/stores/reference'
import { FLIGHT_STATUS, FLIGHT_TYPES } from '@/utils/constants'

// Props
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },

  // Filter options visibility
  showStatus: {
    type: Boolean,
    default: true
  },
  showType: {
    type: Boolean,
    default: true
  },
  showDateRange: {
    type: Boolean,
    default: true
  },
  showAirline: {
    type: Boolean,
    default: true
  },
  showOrigin: {
    type: Boolean,
    default: true
  },
  showDestination: {
    type: Boolean,
    default: true
  },

  // Options
  statusOptions: {
    type: Array,
    default: () => [
      { value: 'SCHEDULED', label: 'Planlandı', type: 'info' },
      { value: 'BOARDING', label: 'Biniş', type: 'warning' },
      { value: 'DEPARTED', label: 'Kalktı', type: 'success' },
      { value: 'IN_FLIGHT', label: 'Uçuşta', type: 'primary' },
      { value: 'ARRIVED', label: 'İndi', type: 'success' },
      { value: 'CANCELLED', label: 'İptal', type: 'danger' },
      { value: 'DELAYED', label: 'Gecikti', type: 'warning' }
    ]
  },
  typeOptions: {
    type: Array,
    default: () => [
      { value: 'PASSENGER', label: 'Yolcu' },
      { value: 'CARGO', label: 'Kargo' },
      { value: 'DOMESTIC', label: 'İç Hat' },
      { value: 'INTERNATIONAL', label: 'Dış Hat' }
    ]
  },

  // Behavior
  autoSearch: {
    type: Boolean,
    default: false
  },
  searchDelay: {
    type: Number,
    default: 500
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'search', 'reset', 'filter-change'])

// Store
const referenceStore = useReferenceStore()

// State
const searchQuery = ref('')
const showAdvanced = ref(false)
const searching = ref(false)
const dateRange = ref([])
const searchTimeout = ref(null)

const filters = ref({
  status: [],
  type: [],
  airlineId: null,
  originAirportId: null,
  destinationAirportId: null,
  startDate: '',
  endDate: '',
  ...props.modelValue
})

// Loading states
const airlinesLoading = ref(false)
const airportsLoading = ref(false)

// Data
const airlines = computed(() => referenceStore.airlines)
const airports = computed(() => referenceStore.airports)

// Computed
const hasActiveFilters = computed(() => {
  return searchQuery.value ||
    filters.value.status?.length > 0 ||
    filters.value.type?.length > 0 ||
    filters.value.airlineId ||
    filters.value.originAirportId ||
    filters.value.destinationAirportId ||
    filters.value.startDate ||
    filters.value.endDate
})

const activeFiltersList = computed(() => {
  const list = []

  if (searchQuery.value) {
    list.push({
      key: 'search',
      label: 'Arama',
      value: searchQuery.value
    })
  }

  if (filters.value.status?.length > 0) {
    const statusLabels = filters.value.status.map(s =>
      props.statusOptions.find(opt => opt.value === s)?.label || s
    ).join(', ')
    list.push({
      key: 'status',
      label: 'Durum',
      value: statusLabels
    })
  }

  if (filters.value.type?.length > 0) {
    const typeLabels = filters.value.type.map(t =>
      props.typeOptions.find(opt => opt.value === t)?.label || t
    ).join(', ')
    list.push({
      key: 'type',
      label: 'Tip',
      value: typeLabels
    })
  }

  if (filters.value.airlineId) {
    const airline = airlines.value.find(a => a.id === filters.value.airlineId)
    if (airline) {
      list.push({
        key: 'airlineId',
        label: 'Havayolu',
        value: airline.name
      })
    }
  }

  if (filters.value.originAirportId) {
    const airport = airports.value.find(a => a.id === filters.value.originAirportId)
    if (airport) {
      list.push({
        key: 'originAirportId',
        label: 'Kalkış',
        value: `${airport.iataCode} - ${airport.name}`
      })
    }
  }

  if (filters.value.destinationAirportId) {
    const airport = airports.value.find(a => a.id === filters.value.destinationAirportId)
    if (airport) {
      list.push({
        key: 'destinationAirportId',
        label: 'Varış',
        value: `${airport.iataCode} - ${airport.name}`
      })
    }
  }

  if (filters.value.startDate && filters.value.endDate) {
    list.push({
      key: 'dateRange',
      label: 'Tarih',
      value: `${filters.value.startDate} - ${filters.value.endDate}`
    })
  }

  return list
})

// Methods
function handleSearchInput() {
  if (!props.autoSearch) return

  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  searchTimeout.value = setTimeout(() => {
    handleSearch()
  }, props.searchDelay)
}

function handleSearchClear() {
  searchQuery.value = ''
  handleSearch()
}

function handleSearch() {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
    searchTimeout.value = null
  }

  const searchData = {
    search: searchQuery.value,
    ...filters.value
  }

  emit('update:modelValue', searchData)
  emit('search', searchData)
}

function handleFilterChange() {
  emit('filter-change', filters.value)

  if (props.autoSearch) {
    handleSearch()
  }
}

function handleDateRangeChange(dates) {
  if (dates && dates.length === 2) {
    filters.value.startDate = dates[0]
    filters.value.endDate = dates[1]
  } else {
    filters.value.startDate = ''
    filters.value.endDate = ''
  }
  handleFilterChange()
}

function handleApply() {
  handleSearch()
}

function handleReset() {
  searchQuery.value = ''
  dateRange.value = []
  filters.value = {
    status: [],
    type: [],
    airlineId: null,
    originAirportId: null,
    destinationAirportId: null,
    startDate: '',
    endDate: ''
  }

  emit('update:modelValue', { search: '', ...filters.value })
  emit('reset')
}

function removeFilter(key) {
  if (key === 'search') {
    searchQuery.value = ''
  } else if (key === 'dateRange') {
    filters.value.startDate = ''
    filters.value.endDate = ''
    dateRange.value = []
  } else {
    if (Array.isArray(filters.value[key])) {
      filters.value[key] = []
    } else {
      filters.value[key] = null
    }
  }

  handleFilterChange()
  handleSearch()
}

function toggleAdvanced() {
  showAdvanced.value = !showAdvanced.value
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  filters.value = { ...filters.value, ...newValue }

  if (newValue.search !== undefined) {
    searchQuery.value = newValue.search
  }

  if (newValue.startDate && newValue.endDate) {
    dateRange.value = [newValue.startDate, newValue.endDate]
  }
}, { deep: true, immediate: true })

// Lifecycle
onMounted(async () => {
  // Load reference data if needed
  if (props.showAirline && airlines.value.length === 0) {
    airlinesLoading.value = true
    try {
      await referenceStore.fetchAirlines()
    } finally {
      airlinesLoading.value = false
    }
  }

  if ((props.showOrigin || props.showDestination) && airports.value.length === 0) {
    airportsLoading.value = true
    try {
      await referenceStore.fetchAirports()
    } finally {
      airportsLoading.value = false
    }
  }
})
</script>

<style scoped lang="scss">
.search-filter {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .filter-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;

    .filter-item {
      &.search-input {
        flex: 1;
        min-width: 300px;
      }
    }
  }

  .advanced-filters {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #ebeef5;

    .filter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .filter-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      padding-top: 1rem;
      border-top: 1px solid #f5f7fa;
    }
  }

  .active-filters {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #f5f7fa;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;

    .active-filters-label {
      font-size: 0.875rem;
      color: #606266;
      font-weight: 500;
      margin-right: 0.5rem;
    }

    .filter-tag {
      margin-right: 0.5rem;
      margin-bottom: 0.25rem;
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

  .airport-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .airport-code {
      font-weight: 600;
      color: #67c23a;
      min-width: 40px;
    }

    .airport-city {
      font-size: 0.875rem;
      color: #909399;
      margin-left: auto;
    }
  }
}

// Responsive
@media (max-width: 768px) {
  .search-filter {
    .filter-row {
      .filter-item {
        &.search-input {
          min-width: 100%;
          order: -1;
        }
      }
    }

    .advanced-filters {
      .filter-grid {
        grid-template-columns: 1fr;
      }

      .filter-actions {
        flex-direction: column;

        .el-button {
          width: 100%;
        }
      }
    }

    .active-filters {
      flex-direction: column;
      align-items: flex-start;
    }
  }
}
</style>

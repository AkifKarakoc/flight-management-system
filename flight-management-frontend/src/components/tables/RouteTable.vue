<template>
  <div class="route-table-container">
    <!-- Filters -->
    <div class="filters-section">
      <el-row :gutter="16" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-input
            v-model="searchQuery"
            placeholder="Route ara..."
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="filterOriginAirport"
            placeholder="Kalkış Havalimanı"
            clearable
            filterable
            style="width: 100%"
            @change="handleFilter"
          >
            <el-option
              v-for="airport in airportOptions"
              :key="airport.value"
              :label="airport.label"
              :value="airport.value"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="filterDestinationAirport"
            placeholder="Varış Havalimanı"
            clearable
            filterable
            style="width: 100%"
            @change="handleFilter"
          >
            <el-option
              v-for="airport in airportOptions"
              :key="airport.value"
              :label="airport.label"
              :value="airport.value"
            />
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-select
            v-model="filterType"
            placeholder="Route Tipi"
            clearable
            style="width: 100%"
            @change="handleFilter"
          >
            <el-option
              v-for="(label, value) in ROUTE_TYPE_LABELS"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-select
            v-model="filterStatus"
            placeholder="Durum"
            clearable
            style="width: 100%"
            @change="handleFilter"
          >
            <el-option label="Aktif" :value="true" />
            <el-option label="Pasif" :value="false" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button @click="clearFilters" :icon="RefreshRight">
            Filtreleri Temizle
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- Table -->
    <el-table
      :data="filteredRoutes"
      :loading="loading"
      stripe
      style="width: 100%"
    >
      <el-table-column
        label="Güzergah"
        width="180"
      >
        <template #default="{ row }">
          <el-tag type="info" size="small">
            {{ getRouteDisplay(row) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column
        prop="distance"
        label="Mesafe"
        width="100"
        sortable
      >
        <template #default="{ row }">
          {{ row.distance ? `${row.distance} km` : 'N/A' }}
        </template>
      </el-table-column>

      <el-table-column
        prop="estimatedFlightTime"
        label="Tahmini Süre"
        width="120"
        sortable
      >
        <template #default="{ row }">
          {{ row.estimatedFlightTime ? `${row.estimatedFlightTime} dk` : 'N/A' }}
        </template>
      </el-table-column>

      <el-table-column
        prop="routeType"
        label="Tip"
        width="100"
      >
        <template #default="{ row }">
          <el-tag
            :type="row.routeType === 'DOMESTIC' ? 'success' : 'warning'"
            size="small"
          >
            {{ ROUTE_TYPE_LABELS[row.routeType] || row.routeType }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column
        prop="visibility"
        label="Görünürlük"
        width="120"
      >
        <template #default="{ row }">
          <el-tag
            :type="getVisibilityTagType(row.visibility)"
            size="small"
          >
            {{ ROUTE_VISIBILITY_LABELS[row.visibility] || row.visibility }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column
        prop="active"
        label="Durum"
        width="80"
        sortable
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
            @click="$emit('view', row)"
          >
            <el-icon><View /></el-icon>
            Görüntüle
          </el-button>

          <el-button
            size="small"
            type="primary"
            @click="$emit('edit', row)"
          >
            <el-icon><Edit /></el-icon>
            Düzenle
          </el-button>

          <el-button
            size="small"
            type="danger"
            @click="$emit('delete', row)"
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
        @size-change="$emit('size-change', $event)"
        @current-change="$emit('page-change', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, RefreshRight, View, Edit, Delete } from '@element-plus/icons-vue'
import { useReferenceStore } from '@/stores/reference'
import { ROUTE_TYPE_LABELS, ROUTE_VISIBILITY_LABELS } from '@/utils/constants'

const referenceStore = useReferenceStore()

// Props
const props = defineProps({
  routes: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  currentPage: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 20
  },
  total: {
    type: Number,
    default: 0
  }
})

// Emits
defineEmits(['view', 'edit', 'delete', 'page-change', 'size-change'])

// Reactive Data
const searchQuery = ref('')
const filterOriginAirport = ref(null)
const filterDestinationAirport = ref(null)
const filterType = ref('')
const filterStatus = ref('')
const airportOptions = ref([])

// Computed
const filteredRoutes = computed(() => {
  let routes = props.routes || []

  // Arama filtresi
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    routes = routes.filter(route => {
      const routeDisplay = getRouteDisplay(route).toLowerCase()
      return routeDisplay.includes(query)
    })
  }

  // Kalkış havalimanı filtresi
  if (filterOriginAirport.value) {
    routes = routes.filter(route => route.originAirportId === filterOriginAirport.value)
  }

  // Varış havalimanı filtresi
  if (filterDestinationAirport.value) {
    routes = routes.filter(route => route.destinationAirportId === filterDestinationAirport.value)
  }

  // Tip filtresi
  if (filterType.value) {
    routes = routes.filter(route => route.routeType === filterType.value)
  }

  // Durum filtresi
  if (filterStatus.value !== '') {
    routes = routes.filter(route => route.active === filterStatus.value)
  }

  return routes
})

// Methods
const getRouteDisplay = (route) => {
  if (route.originAirport && route.destinationAirport) {
    return `${route.originAirport.iataCode} → ${route.destinationAirport.iataCode}`
  }
  return 'N/A'
}

const getVisibilityTagType = (visibility) => {
  const typeMap = {
    'PUBLIC': 'success',
    'PRIVATE': 'warning',
    'AIRLINE_SPECIFIC': 'info'
  }
  return typeMap[visibility] || 'info'
}

const handleSearch = () => {
  // Filtreleme computed property'de gerçekleşir
}

const handleFilter = () => {
  // Filtreleme computed property'de gerçekleşir
}

const clearFilters = () => {
  searchQuery.value = ''
  filterOriginAirport.value = null
  filterDestinationAirport.value = null
  filterType.value = ''
  filterStatus.value = ''
}

// Lifecycle
onMounted(async () => {
  await referenceStore.loadAirports()
  airportOptions.value = referenceStore.airportOptions
})
</script>

<style scoped>
.route-table-container {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}

.filters-section {
  margin-bottom: 20px;
}

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>s

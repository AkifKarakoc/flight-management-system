<template>
  <el-table
    :data="routes"
    :loading="loading"
    stripe
    class="data-table"
    @sort-change="$emit('sort-change', $event)"
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
          @click="$emit('view', row)"
        >
          <el-icon><View /></el-icon>
          Görüntüle
        </el-button>

        <el-button
          v-if="showEditButton"
          size="small"
          type="primary"
          @click="$emit('edit', row)"
        >
          <el-icon><Edit /></el-icon>
          Düzenle
        </el-button>

        <el-button
          v-if="showDeleteButton"
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
</template>

<script setup>
import { Right, View, Edit, Delete } from '@element-plus/icons-vue'
import { ROUTE_TYPE_LABELS } from '@/utils/constants'

// Props
defineProps({
  routes: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  showEditButton: {
    type: Boolean,
    default: true
  },
  showDeleteButton: {
    type: Boolean,
    default: true
  }
})

// Emits
defineEmits(['view', 'edit', 'delete', 'sort-change'])

// Methods
const formatFlightTime = (minutes) => {
  if (!minutes) return 'N/A'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}s ${mins}dk`
  }
  return `${mins}dk`
}

const getRouteTypeTagType = (type) => {
  const typeMap = {
    'DOMESTIC': 'success',
    'INTERNATIONAL': 'warning'
  }
  return typeMap[type] || 'info'
}
</script>

<style scoped>
.route-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.route-path {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.airport-code {
  color: #409EFF;
  font-size: 14px;
}

.route-arrow {
  color: #909399;
}

.route-names {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.data-table {
  width: 100%;
}
</style>

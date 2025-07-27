<template>
  <div class="airline-preview">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ airline?.name || 'Havayolu Önizleme' }}</span>
        </div>
      </template>
      
      <div class="preview-content">
        <div class="airline-info">
          <div class="info-row">
            <span class="label">IATA:</span>
            <span class="value">{{ airline?.iataCode || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">ICAO:</span>
            <span class="value">{{ airline?.icaoCode || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">Tip:</span>
            <span class="value">{{ formatAirlineType(airline?.type) }}</span>
          </div>
          <div class="info-row">
            <span class="label">Ülke:</span>
            <span class="value">{{ airline?.country || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">Şehir:</span>
            <span class="value">{{ airline?.city || '-' }}</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { formatAirlineType } from '@/utils/formatters'

defineProps({
  airline: {
    type: Object,
    default: () => ({})
  }
})
</script>

<style scoped>
.airline-preview {
  padding: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-content {
  padding: 16px 0;
}

.airline-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #f0f0f0;
}

.label {
  font-weight: 600;
  color: #666;
}

.value {
  color: #333;
}
</style> 
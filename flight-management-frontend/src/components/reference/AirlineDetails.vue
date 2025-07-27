<template>
  <div class="airline-details">
    <el-descriptions :column="2" border>
      <el-descriptions-item label="Havayolu Adı">
        {{ airline?.name || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="IATA Kodu">
        {{ airline?.iataCode || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="ICAO Kodu">
        {{ airline?.icaoCode || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="Tip">
        {{ formatAirlineType(airline?.type) }}
      </el-descriptions-item>
      <el-descriptions-item label="Ülke">
        {{ airline?.country || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="Şehir">
        {{ airline?.city || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="Telefon">
        {{ airline?.phone || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="E-posta">
        {{ airline?.email || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="Website">
        {{ airline?.website || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="Durum">
        <el-tag :type="airline?.active ? 'success' : 'danger'">
          {{ airline?.active ? 'Aktif' : 'Pasif' }}
        </el-tag>
      </el-descriptions-item>
    </el-descriptions>
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
.airline-details {
  padding: 16px;
}
</style> 
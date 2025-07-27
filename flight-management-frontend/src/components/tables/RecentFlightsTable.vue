<template>
  <div class="recent-flights-table">
    <BaseTable
      :data="flights"
      :loading="loading"
      :columns="columns"
      :show-header="true"
      :empty-text="loading ? 'Yükleniyor...' : 'Gösterilecek uçuş bulunamadı.'"
      row-key="id"
      table-layout="auto"
      height="380px"
    >
      <template #flightInfo="{ row }">
        <div class="flex items-center">
          <div>
            <div class="font-semibold text-gray-800">{{ row.flightNumber }}</div>
            <div class="text-xs text-gray-500">{{ row.airline.name }}</div>
          </div>
        </div>
      </template>

      <template #routePath="{ row }">
        <div class="font-mono text-sm flex items-center justify-center">
          <span class="font-bold">{{ row.originAirport.iataCode }}</span>
          <font-awesome-icon :icon="['fas', 'long-arrow-alt-right']" class="mx-2 text-gray-400" />
          <span class="font-bold">{{ row.destinationAirport.iataCode }}</span>
        </div>
      </template>

      <template #schedule="{ row }">
        <div class="text-sm">
          {{ formatDateTime(row.scheduledDeparture) }}
        </div>
      </template>

      <template #status="{ row }">
        <StatusBadge :status="row.status" :status-map="statusMap" size="small" />
      </template>
    </BaseTable>

    <div v-if="!loading && flights.length > 0" class="table-footer mt-2 text-center">
      <BaseButton variant="link" @click="$router.push({ name: 'FlightManagement' })">
        Tüm Uçuşları Gör
        <font-awesome-icon :icon="['fas', 'arrow-right']" class="ml-2" />
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useFormatters } from '@/composables/useFormatters';
import BaseTable from '@/components/tables/BaseTable.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';

defineProps({
  flights: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const { formatDateTime } = useFormatters();

const columns = ref([
  { slot: 'flightInfo', label: 'Uçuş', minWidth: 150 },
  { slot: 'routePath', label: 'Rota', align: 'center' },
  { slot: 'schedule', label: 'Planlanan Kalkış', minWidth: 160 },
  { slot: 'status', label: 'Durum', width: 130, align: 'center' },
]);

// Bu harita, FlightTable'daki ile aynı olmalı ki tutarlılık sağlansın
const statusMap = {
  SCHEDULED: { text: 'Planlandı', type: 'info' },
  BOARDING: { text: 'Yolcu Alıyor', type: 'primary' },
  DEPARTED: { text: 'Kalkış Yaptı', type: 'success' },
  ARRIVED: { text: 'Varış Yaptı', type: 'success' },
  CANCELLED: { text: 'İptal', type: 'danger' },
  DELAYED: { text: 'Rötarlı', type: 'warning' },
  DIVERTED: { text: 'Yönlendirildi', type: 'warning' },
  RETURNING: { text: 'Geri Dönüyor', type: 'warning' },
};
</script>

<style scoped>
.recent-flights-table :deep(.el-table__row) {
  cursor: pointer;
}
</style>

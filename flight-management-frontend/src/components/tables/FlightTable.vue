<template>
  <BaseTable :data="flights" :loading="loading" :columns="columns" row-key="id" table-layout="auto">
    <template #flightInfo="{ row }">
      <div class="font-semibold text-gray-800">{{ row.flightNumber }}</div>
      <div class="text-sm text-gray-500">{{ row.airline.name }}</div>
    </template>

    <template #routePath="{ row }">
      <div class="font-mono text-sm flex items-center">
        <span>{{ row.originAirport.iataCode }}</span>
        <font-awesome-icon :icon="['fas', 'plane']" class="mx-2 text-gray-400" />
        <span>{{ row.destinationAirport.iataCode }}</span>
      </div>
      <div class="text-xs text-gray-400">{{ row.route.routeName }}</div>
    </template>

    <template #schedule="{ row }">
      <div>
        <span class="font-semibold text-gray-600">Kalkış:</span>
        <span class="ml-1">{{ formatDateTime(row.scheduledDeparture) }}</span>
      </div>
      <div>
        <span class="font-semibold text-gray-600">Varış:</span>
        <span class="ml-1">{{ formatDateTime(row.scheduledArrival) }}</span>
      </div>
    </template>

    <template #status="{ row }">
      <StatusBadge :status="row.status" :status-map="statusMap" />
    </template>

    <template #actions="{ row }">
      <div class="flex items-center justify-end space-x-2">
        <el-tooltip content="Durumu Güncelle" placement="top">
          <BaseButton circle size="small" @click="$emit('update-status', row)">
            <font-awesome-icon :icon="['fas', 'exchange-alt']" />
          </BaseButton>
        </el-tooltip>
        <el-tooltip content="Düzenle" placement="top">
          <BaseButton circle size="small" variant="primary" @click="$emit('edit', row)">
            <font-awesome-icon :icon="['fas', 'pen-to-square']" />
          </BaseButton>
        </el-tooltip>
        <el-tooltip content="Sil" placement="top">
          <BaseButton circle size="small" variant="danger" @click="$emit('delete', row)">
            <font-awesome-icon :icon="['fas', 'trash']" />
          </BaseButton>
        </el-tooltip>
      </div>
    </template>
  </BaseTable>
</template>

<script setup>
import { ref } from 'vue';
import { useFormatters } from '@/composables/useFormatters';
import BaseTable from '@/components/tables/BaseTable.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import { ElTooltip } from 'element-plus';

defineProps({
  flights: { type: Array, required: true },
  loading: { type: Boolean, default: false },
});

defineEmits(['edit', 'delete', 'update-status']);

const { formatDateTime } = useFormatters();

const columns = ref([
  { slot: 'flightInfo', label: 'Uçuş', minWidth: 160 },
  { slot: 'routePath', label: 'Rota', minWidth: 180 },
  { slot: 'schedule', label: 'Zamanlama', minWidth: 200 },
  { prop: 'aircraft.registrationNumber', label: 'Uçak', width: 120 },
  { slot: 'status', label: 'Durum', width: 130 },
  { slot: 'actions', label: 'Aksiyonlar', width: 150, align: 'right' },
]);

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
</script>s

<template>
  <BaseTable
    :data="aircrafts"
    :loading="loading"
    :columns="columns"
    row-key="id"
  >
    <template #airline="{ row }">
      <div v-if="row.airline" class="flex items-center">
        <span class="font-medium">{{ row.airline.name }}</span>
        <span class="text-gray-500 ml-2">({{ row.airline.iataCode }})</span>
      </div>
    </template>

    <template #status="{ row }">
      <StatusBadge :status="row.status" :status-map="statusMap" />
    </template>

    <template #actions="{ row }">
      <div class="flex items-center space-x-2">
        <BaseButton size="small" variant="primary" @click="$emit('edit', row)">
          <font-awesome-icon :icon="['fas', 'pen-to-square']" />
        </BaseButton>
        <BaseButton size="small" variant="danger" @click="$emit('delete', row)">
          <font-awesome-icon :icon="['fas', 'trash']" />
        </BaseButton>
      </div>
    </template>
  </BaseTable>
</template>

<script setup>
import BaseTable from '@/components/tables/BaseTable.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import { ref } from 'vue';

defineProps({
  aircrafts: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['edit', 'delete']);

const columns = ref([
  { prop: 'registrationNumber', label: 'Reg. Number', sortable: true, minWidth: 150 },
  { prop: 'aircraftType', label: 'Type', sortable: true, width: 120 },
  { prop: 'manufacturer', label: 'Manufacturer', sortable: true },
  { prop: 'model', label: 'Model', sortable: true },
  { prop: 'seatCapacity', label: 'Capacity', sortable: true, width: 120 },
  { slot: 'airline', label: 'Airline', sortable: true },
  { slot: 'status', label: 'Status', sortable: true, width: 120 },
  { slot: 'actions', label: 'Actions', width: 120, align: 'center' },
]);

const statusMap = {
  ACTIVE: 'success',
  MAINTENANCE: 'warning',
  OUT_OF_SERVICE: 'info',
  RETIRED: 'danger',
};
</script>

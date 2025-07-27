<template>
  <BaseTable :data="routes" :loading="loading" :columns="columns" row-key="id">
    <template #routePath="{ row }">
      <div class="font-mono text-sm">
        <span v-for="(segment, index) in row.segments" :key="segment.id">
          <span class="font-semibold">{{ segment.originAirport.iataCode }}</span>
          <font-awesome-icon :icon="['fas', 'arrow-right']" class="mx-2 text-gray-400" />
          <span v-if="index === row.segments.length - 1" class="font-semibold">{{ segment.destinationAirport.iataCode }}</span>
        </span>
      </div>
    </template>
    <template #totalDistance="{ row }">
      {{ row.totalDistance }} km
    </template>
    <template #active="{ row }">
      <StatusBadge :status="row.active ? 'ACTIVE' : 'INACTIVE'" :status-map="statusMap" />
    </template>
    <template #actions="{ row }">
      <div class="flex space-x-2">
        <BaseButton size="small" @click="$emit('edit', row)">Edit</BaseButton>
        <BaseButton size="small" variant="danger" @click="$emit('delete', row)">Delete</BaseButton>
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
  routes: { type: Array, required: true },
  loading: { type: Boolean, default: false },
});

defineEmits(['edit', 'delete']);

const columns = ref([
  { prop: 'routeName', label: 'Route Name', sortable: true, minWidth: 200 },
  { prop: 'routeCode', label: 'Code', sortable: true, width: 120 },
  { slot: 'routePath', label: 'Path', minWidth: 250 },
  { prop: 'segmentCount', label: 'Segments', sortable: true, width: 120 },
  { slot: 'totalDistance', label: 'Distance', sortable: true, width: 150 },
  { prop: 'routeType', label: 'Type', sortable: true, width: 150 },
  { slot: 'active', label: 'Status', sortable: true, width: 120 },
  { slot: 'actions', label: 'Actions', width: 150, align: 'right' },
]);

const statusMap = {
  ACTIVE: { text: 'Active', type: 'success' },
  INACTIVE: { text: 'Inactive', type: 'danger' },
};
</script>

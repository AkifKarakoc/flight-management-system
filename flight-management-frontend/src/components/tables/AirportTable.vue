<template>
  <BaseTable :data="airports" :loading="loading" :columns="columns" row-key="id">
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
  airports: {
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
  { prop: 'name', label: 'Name', sortable: true, minWidth: 200 },
  { prop: 'iataCode', label: 'IATA', sortable: true, width: 100 },
  { prop: 'icaoCode', label: 'ICAO', sortable: true, width: 100 },
  { prop: 'city', label: 'City', sortable: true },
  { prop: 'country', label: 'Country', sortable: true },
  { prop: 'type', label: 'Type', sortable: true },
  { slot: 'active', label: 'Status', sortable: true, width: 120 },
  { slot: 'actions', label: 'Actions', width: 150, align: 'right' },
]);

const statusMap = {
  ACTIVE: { text: 'Active', type: 'success' },
  INACTIVE: { text: 'Inactive', type: 'danger' },
};
</script>

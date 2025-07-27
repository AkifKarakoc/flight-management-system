<template>
  <BaseTable :data="crewMembers" :loading="loading" :columns="columns" row-key="id">
    <template #fullName="{ row }">
      <div class="font-medium">{{ row.firstName }} {{ row.lastName }}</div>
      <div class="text-sm text-gray-500">{{ row.employeeNumber }}</div>
    </template>
    <template #airline="{ row }">
      <span v-if="row.airline">{{ row.airline.name }}</span>
    </template>
    <template #status="{ row }">
      <StatusBadge :status="row.status" :status-map="statusMap" />
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
  crewMembers: {
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
  { slot: 'fullName', label: 'Name & ID', sortable: true, minWidth: 180 },
  { prop: 'crewType', label: 'Type', sortable: true },
  { slot: 'airline', label: 'Airline', sortable: true },
  { prop: 'email', label: 'Email', sortable: true },
  { prop: 'aircraftQualifications', label: 'Qualifications' },
  { slot: 'status', label: 'Status', sortable: true },
  { slot: 'actions', label: 'Actions', width: 150, align: 'right' },
]);

const statusMap = {
  ACTIVE: { text: 'Active', type: 'success' },
  ON_LEAVE: { text: 'On Leave', type: 'info' },
  SICK_LEAVE: { text: 'Sick Leave', type: 'warning' },
  RETIRED: { text: 'Retired', type: 'danger' },
  SUSPENDED: { text: 'Suspended', type: 'danger' },
};
</script>

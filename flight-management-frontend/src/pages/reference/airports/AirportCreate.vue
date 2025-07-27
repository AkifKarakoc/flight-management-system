<template>
  <BaseCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">Create New Airport</h2>
        <BaseButton @click="$router.push({ name: 'AirportManagement' })">Back to List</BaseButton>
      </div>
    </template>
    <AirportForm :loading="loading" @submit="handleCreateAirport" />
  </BaseCard>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useReferenceStore } from '@/stores/reference';
import { useNotification } from '@/composables/useNotification';
import AirportForm from '@/components/forms/AirportForm.vue';
import BaseCard from '@/components/ui/BaseCard.vue';
import BaseButton from '@/components/ui/BaseButton.vue';

const router = useRouter();
const referenceStore = useReferenceStore();
const { showSuccess, showError } = useNotification();
const loading = ref(false);

const handleCreateAirport = async (formData) => {
  loading.value = true;
  try {
    await referenceStore.createAirport(formData);
    showSuccess('Airport created successfully!');
    router.push({ name: 'AirportManagement' });
  } catch (error) {
    showError(error.message || 'Failed to create airport.');
  } finally {
    loading.value = false;
  }
};
</script>

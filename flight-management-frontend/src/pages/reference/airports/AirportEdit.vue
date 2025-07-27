<template>
  <BaseCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">Edit Airport</h2>
        <BaseButton @click="$router.push({ name: 'AirportManagement' })">Back to List</BaseButton>
      </div>
    </template>
    <div v-if="initialLoading" class="text-center p-8">Loading...</div>
    <AirportForm v-else :initial-data="airport" :loading="formLoading" @submit="handleUpdateAirport" />
  </BaseCard>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useReferenceStore } from '@/stores/reference';
import { useNotification } from '@/composables/useNotification';
import AirportForm from '@/components/forms/AirportForm.vue';
import BaseCard from '@/components/ui/BaseCard.vue';
import BaseButton from '@/components/ui/BaseButton.vue';

const route = useRoute();
const router = useRouter();
const referenceStore = useReferenceStore();
const { showSuccess, showError } = useNotification();

const airport = ref(null);
const initialLoading = ref(true);
const formLoading = ref(false);
const airportId = route.params.id;

onMounted(async () => {
  try {
    airport.value = await referenceStore.fetchAirportById(airportId);
  } catch (error) {
    showError('Could not fetch airport data.');
  } finally {
    initialLoading.value = false;
  }
});

const handleUpdateAirport = async (formData) => {
  formLoading.value = true;
  try {
    await referenceStore.updateAirport(airportId, formData);
    showSuccess('Airport updated successfully!');
    router.push({ name: 'AirportManagement' });
  } catch (error) {
    showError(error.message || 'Failed to update airport.');
  } finally {
    formLoading.value = false;
  }
};
</script>

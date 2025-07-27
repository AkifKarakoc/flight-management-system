<template>
  <BaseCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Edit Aircraft</h2>
        <BaseButton
          variant="secondary"
          @click="$router.push({ name: 'AircraftManagement' })"
        >
          <font-awesome-icon :icon="['fas', 'arrow-left']" class="mr-2" />
          Back to List
        </BaseButton>
      </div>
    </template>

    <div v-if="initialLoading" class="flex justify-center items-center h-64">
      <font-awesome-icon :icon="['fas', 'spinner']" spin size="3x" />
    </div>
    <AircraftForm
      v-else
      :initial-data="aircraft"
      :loading="formLoading"
      @submit="handleUpdateAircraft"
    />
  </BaseCard>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useReferenceStore } from '@/stores/reference';
import { useNotification } from '@/composables/useNotification';
import AircraftForm from '@/components/forms/AircraftForm.vue';
import BaseCard from '@/components/ui/BaseCard.vue';
import BaseButton from '@/components/ui/BaseButton.vue';

const route = useRoute();
const router = useRouter();
const referenceStore = useReferenceStore();
const { showSuccess, showError } = useNotification();

const aircraft = ref(null);
const initialLoading = ref(true);
const formLoading = ref(false);
const aircraftId = route.params.id;

onMounted(async () => {
  try {
    aircraft.value = await referenceStore.fetchAircraftById(aircraftId);
  } catch (error) {
    showError('Could not fetch aircraft data.');
    router.push({ name: 'AircraftManagement' });
  } finally {
    initialLoading.value = false;
  }
});

const handleUpdateAircraft = async (formData) => {
  formLoading.value = true;
  try {
    await referenceStore.updateAircraft(aircraftId, formData);
    showSuccess('Aircraft updated successfully!');
    router.push({ name: 'AircraftManagement' });
  } catch (error) {
    showError(error.message || 'Failed to update aircraft.');
  } finally {
    formLoading.value = false;
  }
};
</script>

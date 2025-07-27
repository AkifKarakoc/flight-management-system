<template>
  <BaseCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Create New Aircraft</h2>
        <BaseButton
          variant="secondary"
          @click="$router.push({ name: 'AircraftManagement' })"
        >
          <font-awesome-icon :icon="['fas', 'arrow-left']" class="mr-2" />
          Back to List
        </BaseButton>
      </div>
    </template>

    <AircraftForm
      :loading="loading"
      @submit="handleCreateAircraft"
    />
  </BaseCard>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useReferenceStore } from '@/stores/reference';
import { useNotification } from '@/composables/useNotification';
import AircraftForm from '@/components/forms/AircraftForm.vue';
import BaseCard from '@/components/ui/BaseCard.vue';
import BaseButton from '@/components/ui/BaseButton.vue';

const router = useRouter();
const referenceStore = useReferenceStore();
const { showSuccess, showError } = useNotification();
const loading = ref(false);

const handleCreateAircraft = async (formData) => {
  loading.value = true;
  try {
    await referenceStore.createAircraft(formData);
    showSuccess('Aircraft created successfully!');
    router.push({ name: 'AircraftManagement' });
  } catch (error) {
    showError(error.message || 'Failed to create aircraft.');
  } finally {
    loading.value = false;
  }
};
</script>

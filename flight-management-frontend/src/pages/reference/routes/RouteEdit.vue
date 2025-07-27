<template>
  <BaseCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Edit Route</h2>
        <BaseButton
          variant="secondary"
          @click="$router.push({ name: 'RouteManagement' })"
        >
          <font-awesome-icon :icon="['fas', 'arrow-left']" class="mr-2" />
          Back to List
        </BaseButton>
      </div>
    </template>

    <div v-if="initialLoading" class="flex justify-center items-center h-64">
      <font-awesome-icon :icon="['fas', 'spinner']" spin size="3x" />
    </div>
    <RouteForm
      v-else
      :initial-data="route"
      :loading="formLoading"
      @submit="handleUpdateRoute"
    />
  </BaseCard>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useReferenceStore } from '@/stores/reference';
import { useNotification } from '@/composables/useNotification';
import RouteForm from '@/components/forms/RouteForm.vue';
import BaseCard from '@/components/ui/BaseCard.vue';
import BaseButton from '@/components/ui/BaseButton.vue';

const route = useRoute();
const router = useRouter();
const referenceStore = useReferenceStore();
const { showSuccess, showError } = useNotification();

const routeData = ref(null);
const initialLoading = ref(true);
const formLoading = ref(false);
const routeId = route.params.id;

onMounted(async () => {
  try {
    routeData.value = await referenceStore.fetchRouteById(routeId);
  } catch (error) {
    showError('Could not fetch route data.');
    router.push({ name: 'RouteManagement' });
  } finally {
    initialLoading.value = false;
  }
});

const handleUpdateRoute = async (formData) => {
  formLoading.value = true;
  try {
    await referenceStore.updateRoute(routeId, formData);
    showSuccess('Route updated successfully!');
    router.push({ name: 'RouteManagement' });
  } catch (error) {
    showError(error.message || 'Failed to update route.');
  } finally {
    formLoading.value = false;
  }
};
</script>

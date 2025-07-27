<template>
  <BaseCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">Create New Route</h2>
        <BaseButton @click="$router.push({ name: 'RouteManagement' })">Back to List</BaseButton>
      </div>
    </template>
    <RouteForm :loading="loading" @submit="handleCreateRoute" />
  </BaseCard>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useReferenceStore } from '@/stores/reference';
import { useNotification } from '@/composables/useNotification';
import RouteForm from '@/components/forms/RouteForm.vue';
import BaseCard from '@/components/ui/BaseCard.vue';
import BaseButton from '@/components/ui/BaseButton.vue';

const router = useRouter();
const referenceStore = useReferenceStore();
const { showSuccess, showError } = useNotification();
const loading = ref(false);

const handleCreateRoute = async (formData) => {
  loading.value = true;
  try {
    await referenceStore.createRoute(formData);
    showSuccess('Route created successfully!');
    router.push({ name: 'RouteManagement' });
  } catch (error) {
    showError(error.message || 'Failed to create route.');
  } finally {
    loading.value = false;
  }
};
</script>

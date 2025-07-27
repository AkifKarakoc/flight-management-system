<template>
  <BaseCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">Create New Crew Member</h2>
        <BaseButton @click="$router.push({ name: 'CrewManagement' })">Back to List</BaseButton>
      </div>
    </template>
    <CrewMemberForm :loading="loading" @submit="handleCreateCrewMember" />
  </BaseCard>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useReferenceStore } from '@/stores/reference';
import { useNotification } from '@/composables/useNotification';
import CrewMemberForm from '@/components/forms/CrewMemberForm.vue';
import BaseCard from '@/components/ui/BaseCard.vue';
import BaseButton from '@/components/ui/BaseButton.vue';

const router = useRouter();
const referenceStore = useReferenceStore();
const { showSuccess, showError } = useNotification();
const loading = ref(false);

const handleCreateCrewMember = async (formData) => {
  loading.value = true;
  try {
    await referenceStore.createCrewMember(formData);
    showSuccess('Crew member created successfully!');
    router.push({ name: 'CrewManagement' });
  } catch (error) {
    showError(error.message || 'Failed to create crew member.');
  } finally {
    loading.value = false;
  }
};
</script>

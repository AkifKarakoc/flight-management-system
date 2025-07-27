<template>
  <BaseCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">Edit Crew Member</h2>
        <BaseButton @click="$router.push({ name: 'CrewManagement' })">Back to List</BaseButton>
      </div>
    </template>
    <div v-if="initialLoading" class="text-center p-8">Loading...</div>
    <CrewMemberForm v-else :initial-data="crewMember" :loading="formLoading" @submit="handleUpdateCrewMember" />
  </BaseCard>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useReferenceStore } from '@/stores/reference';
import { useNotification } from '@/composables/useNotification';
import CrewMemberForm from '@/components/forms/CrewMemberForm.vue';
import BaseCard from '@/components/ui/BaseCard.vue';
import BaseButton from '@/components/ui/BaseButton.vue';

const route = useRoute();
const router = useRouter();
const referenceStore = useReferenceStore();
const { showSuccess, showError } = useNotification();

const crewMember = ref(null);
const initialLoading = ref(true);
const formLoading = ref(false);
const crewMemberId = route.params.id;

onMounted(async () => {
  try {
    crewMember.value = await referenceStore.fetchCrewMemberById(crewMemberId);
  } catch (error) {
    showError('Could not fetch crew member data.');
  } finally {
    initialLoading.value = false;
  }
});

const handleUpdateCrewMember = async (formData) => {
  formLoading.value = true;
  try {
    await referenceStore.updateCrewMember(crewMemberId, formData);
    showSuccess('Crew member updated successfully!');
    router.push({ name: 'CrewManagement' });
  } catch (error) {
    showError(error.message || 'Failed to update crew member.');
  } finally {
    formLoading.value = false;
  }
};
</script>

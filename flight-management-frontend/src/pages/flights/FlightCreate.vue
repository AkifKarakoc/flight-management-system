<template>
  <BaseCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">Yeni Uçuş Oluştur</h2>
        <BaseButton variant="secondary" @click="$router.push({ name: 'FlightManagement' })">
          Listeye Geri Dön
        </BaseButton>
      </div>
    </template>
    <FlightForm :loading="loading" @submit="handleCreateFlight" />
  </BaseCard>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useFlightStore } from '@/stores/flights';
import { useNotification } from '@/composables/useNotification';
import FlightForm from '@/components/forms/FlightForm.vue';
import BaseCard from '@/components/ui/BaseCard.vue';
import BaseButton from '@/components/ui/BaseButton.vue';

const router = useRouter();
const flightStore = useFlightStore();
const { showSuccess, showError } = useNotification();
const loading = ref(false);

const handleCreateFlight = async (formData) => {
  loading.value = true;
  try {
    await flightStore.createFlight(formData);
    showSuccess('Uçuş başarıyla oluşturuldu!');
    router.push({ name: 'FlightManagement' });
  } catch (error) {
    showError(error.message || 'Uçuş oluşturulamadı.');
  } finally {
    loading.value = false;
  }
};
</script>

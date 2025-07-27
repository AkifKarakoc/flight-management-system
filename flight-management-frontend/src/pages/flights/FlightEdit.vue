<template>
  <BaseCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">Uçuşu Düzenle</h2>
        <BaseButton variant="secondary" @click="$router.push({ name: 'FlightManagement' })">
          Listeye Geri Dön
        </BaseButton>
      </div>
    </template>
    <div v-if="initialLoading" class="text-center p-8">Yükleniyor...</div>
    <FlightForm v-else :initial-data="flight" :loading="formLoading" @submit="handleUpdateFlight" />
  </BaseCard>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFlightStore } from '@/stores/flights';
import { useNotification } from '@/composables/useNotification';
import FlightForm from '@/components/forms/FlightForm.vue';
import BaseCard from '@/components/ui/BaseCard.vue';
import BaseButton from '@/components/ui/BaseButton.vue';

const route = useRoute();
const router = useRouter();
const flightStore = useFlightStore();
const { showSuccess, showError } = useNotification();

const flight = ref(null);
const initialLoading = ref(true);
const formLoading = ref(false);
const flightId = route.params.id;

onMounted(async () => {
  try {
    const flightData = await flightStore.fetchFlightById(flightId);
    // Formun `initial-data` prop'u için DTO'yu sadeleştirmemiz gerekebilir.
    // API'den gelen `airline`, `aircraft` gibi nesneleri `airlineId` gibi ID'lere dönüştürüyoruz.
    flight.value = {
      ...flightData,
      airlineId: flightData.airline?.id,
      aircraftId: flightData.aircraft?.id,
      routeId: flightData.route?.id,
    };
  } catch (error) {
    showError('Uçuş verileri getirilemedi.');
  } finally {
    initialLoading.value = false;
  }
});

const handleUpdateFlight = async (formData) => {
  formLoading.value = true;
  try {
    await flightStore.updateFlight(flightId, formData);
    showSuccess('Uçuş başarıyla güncellendi!');
    router.push({ name: 'FlightManagement' });
  } catch (error) {
    showError(error.message || 'Uçuş güncellenemedi.');
  } finally {
    formLoading.value = false;
  }
};
</script>

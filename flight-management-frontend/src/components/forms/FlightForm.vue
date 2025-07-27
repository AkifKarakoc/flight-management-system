<template>
  <BaseForm :loading="loading" :initial-data="initialData" @submit="handleSubmit">
    <h3 class="text-lg font-semibold mb-4 border-b pb-2">Temel Uçuş Bilgileri</h3>
    <el-row :gutter="20">
      <el-col :span="8">
        <el-form-item label="Uçuş Numarası" prop="flightNumber" :rules="rules.required">
          <el-input v-model="form.flightNumber" placeholder="Örn: TK123" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="Havayolu" prop="airlineId" :rules="rules.required">
          <el-select
            v-model="form.airlineId"
            filterable
            remote
            :remote-method="searchAirlines"
            placeholder="Havayolu Seçin"
            class="w-full"
            @change="onAirlineChange"
            :loading="loadingStates.airlines"
          >
            <el-option v-for="item in airlines" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="Uçuş Tarihi" prop="flightDate" :rules="rules.required">
          <el-date-picker
            v-model="form.flightDate"
            type="date"
            placeholder="Tarih Seçin"
            class="w-full"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <h3 class="text-lg font-semibold my-4 border-b pb-2">Rota ve Uçak</h3>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="Rota" prop="routeId" :rules="rules.required">
          <el-select
            v-model="form.routeId"
            filterable
            remote
            :remote-method="searchRoutes"
            placeholder="Rota Seçin"
            class="w-full"
            :loading="loadingStates.routes"
          >
            <el-option
              v-for="item in routes"
              :key="item.id"
              :label="`${item.routeName} (${item.routePath})`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Uçak" prop="aircraftId" :rules="rules.required">
          <el-select
            v-model="form.aircraftId"
            filterable
            remote
            :remote-method="searchAircrafts"
            placeholder="Uçak Seçin"
            class="w-full"
            :disabled="!form.airlineId"
            :loading="loadingStates.aircrafts"
          >
            <el-option
              v-for="item in aircrafts"
              :key="item.id"
              :label="`${item.registrationNumber} (${item.aircraftType})`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <h3 class="text-lg font-semibold my-4 border-b pb-2">Zamanlama ve Detaylar</h3>
    <el-row :gutter="20">
      <el-col :span="6">
        <el-form-item label="Planlanan Kalkış (STD)" prop="scheduledDeparture" :rules="rules.required">
          <el-date-picker
            v-model="form.scheduledDeparture"
            type="datetime"
            placeholder="Tarih ve Saat Seçin"
            class="w-full"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="Planlanan Varış (STA)" prop="scheduledArrival" :rules="rules.required">
          <el-date-picker
            v-model="form.scheduledArrival"
            type="datetime"
            placeholder="Tarih ve Saat Seçin"
            class="w-full"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="Uçuş Tipi" prop="type" :rules="rules.required">
          <el-select v-model="form.type" class="w-full">
            <el-option label="Yolcu" value="PASSENGER" />
            <el-option label="Kargo" value="CARGO" />
            <el-option label="Pozisyon" value="POSITIONING" />
            <el-option label="Ferry" value="FERRY" />
            <el-option label="Eğitim" value="TRAINING" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="Kapı Numarası" prop="gateNumber">
          <el-input v-model="form.gateNumber" placeholder="Örn: A12" />
        </el-form-item>
      </el-col>
    </el-row>
  </BaseForm>
</template>

<script setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useReferenceStore } from '@/stores/reference';
import { useForm } from '@/composables/useForm';
import BaseForm from '@/components/forms/BaseForm.vue';
import { ElRow, ElCol, ElFormItem, ElInput, ElSelect, ElOption, ElDatePicker } from 'element-plus';
import debounce from 'lodash.debounce';

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      flightNumber: '',
      airlineId: null,
      aircraftId: null,
      routeId: null,
      flightDate: '',
      scheduledDeparture: '',
      scheduledArrival: '',
      type: 'PASSENGER',
      gateNumber: '',
    })
  },
  loading: Boolean,
});

const emit = defineEmits(['submit']);

const referenceStore = useReferenceStore();
// loading state'leri store'dan alıyoruz
const { airlines, aircrafts, routes, loading: loadingStates } = storeToRefs(referenceStore);

const { form, rules, handleSubmit } = useForm({
  initialData: props.initialData,
  rules: {
    required: [{ required: true, message: 'Bu alan zorunludur', trigger: 'change' }],
  },
  onSubmit: (formData) => {
    emit('submit', formData);
  }
});

// Arama fonksiyonlarını debounce ile sarmalayarak performansı artırıyoruz
const searchAirlines = debounce((query) => referenceStore.fetchAirlines({ name: query, size: 20 }), 300);
const searchRoutes = debounce((query) => referenceStore.fetchRoutes({ routeName: query, size: 20 }), 300);
const searchAircrafts = debounce((query) => {
  if (form.airlineId) {
    referenceStore.fetchAircrafts({ airlineId: form.airlineId, registrationNumber: query, size: 20 });
  }
}, 300);

const onAirlineChange = () => {
  form.aircraftId = null;
  referenceStore.clearAircrafts(); // Store'daki uçak listesini temizle
};

onMounted(() => {
  // Düzenleme modunda, form ilk yüklendiğinde ilişkili verileri (airline, route, aircraft)
  // select kutularında göstermek için API'den çekiyoruz.
  if (props.initialData?.airlineId) {
    referenceStore.fetchAirlines({ id: props.initialData.airlineId });
  }
  if (props.initialData?.routeId) {
    referenceStore.fetchRoutes({ id: props.initialData.routeId });
  }
  if (props.initialData?.aircraftId && props.initialData?.airlineId) {
    referenceStore.fetchAircrafts({ id: props.initialData.aircraftId, airlineId: props.initialData.airlineId });
  }
});
</script>

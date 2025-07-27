<template>
  <BaseForm :loading="loading" :initial-data="initialData" @submit="handleSubmit">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="Registration Number" prop="registrationNumber" :rules="rules.registrationNumber">
          <el-input v-model="form.registrationNumber" placeholder="e.g., TC-JJA" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Aircraft Type" prop="aircraftType" :rules="rules.aircraftType">
          <el-input v-model="form.aircraftType" placeholder="e.g., B777" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Manufacturer" prop="manufacturer" :rules="rules.manufacturer">
          <el-input v-model="form.manufacturer" placeholder="e.g., Boeing" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Model" prop="model" :rules="rules.model">
          <el-input v-model="form.model" placeholder="e.g., 777-300ER" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Seat Capacity" prop="seatCapacity" :rules="rules.seatCapacity">
          <el-input-number v-model="form.seatCapacity" :min="0" class="w-full" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Status" prop="status" :rules="rules.status">
          <el-select v-model="form.status" placeholder="Select status" class="w-full">
            <el-option label="Active" value="ACTIVE" />
            <el-option label="Maintenance" value="MAINTENANCE" />
            <el-option label="Out of Service" value="OUT_OF_SERVICE" />
            <el-option label="Retired" value="RETIRED" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Airline" prop="airlineId" :rules="rules.airlineId">
          <el-select v-model="form.airlineId" filterable remote :remote-method="searchAirlines" placeholder="Select airline" class="w-full" :loading="airlineLoading">
            <el-option
              v-for="airline in airlines"
              :key="airline.id"
              :label="`${airline.name} (${airline.iataCode})`"
              :value="airline.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>
  </BaseForm>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useReferenceStore } from '@/stores/reference';
import BaseForm from '@/components/forms/BaseForm.vue';
import { ElRow, ElCol, ElFormItem, ElInput, ElInputNumber, ElSelect, ElOption } from 'element-plus';
import { useForm } from '@/composables/useForm'; // Assuming you have a form composable

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      registrationNumber: '',
      aircraftType: '',
      manufacturer: '',
      model: '',
      seatCapacity: 0,
      status: 'ACTIVE',
      airlineId: null,
    })
  },
  loading: Boolean,
});

const emit = defineEmits(['submit']);

const referenceStore = useReferenceStore();
const { airlines, loading: { airlines: airlineLoading } } = storeToRefs(referenceStore);

const { form, rules, handleSubmit } = useForm({
  initialData: props.initialData,
  rules: {
    registrationNumber: [{ required: true, message: 'Registration number is required', trigger: 'blur' }],
    aircraftType: [{ required: true, message: 'Aircraft type is required', trigger: 'blur' }],
    manufacturer: [{ required: true, message: 'Manufacturer is required', trigger: 'blur' }],
    model: [{ required: true, message: 'Model is required', trigger: 'blur' }],
    status: [{ required: true, message: 'Status is required', trigger: 'change' }],
    airlineId: [{ required: true, message: 'Airline is required', trigger: 'change' }],
  },
  onSubmit: (formData) => {
    emit('submit', formData);
  }
});

const searchAirlines = (query) => {
  if (query) {
    referenceStore.fetchAirlines({ name: query, size: 50 });
  }
};

onMounted(() => {
  // Initial aırline list for dropdown
  if (airlines.value.length === 0) {
    referenceStore.fetchAirlines({ size: 1000 });
  }
  // If editing, and the airline isn't in the initial list, fetch it
  if(props.initialData?.airlineId && !airlines.value.some(a => a.id === props.initialData.airlineId)) {
    // Logic to fetch specific airline if needed
  }
});

watch(() => props.initialData, (newData) => {
  if (newData) {
    Object.assign(form, newData);
  }
}, { deep: true, immediate: true });
</script>

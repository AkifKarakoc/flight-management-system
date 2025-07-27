<template>
  <BaseForm :loading="loading" :initial-data="initialData" @submit="handleSubmit">
    <h3 class="text-lg font-semibold mb-2 border-b pb-2">Route Details</h3>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="Route Name" prop="routeName" :rules="rules.routeName">
          <el-input v-model="form.routeName" placeholder="e.g., Istanbul-Ankara-Izmir Route" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Route Code" prop="routeCode">
          <el-input v-model="form.routeCode" placeholder="e.g., TK-001" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="Route Type" prop="routeType" :rules="rules.routeType">
          <el-select v-model="form.routeType" class="w-full">
            <el-option label="Domestic" value="DOMESTIC" />
            <el-option label="International" value="INTERNATIONAL" />
            <el-option label="Continental" value="CONTINENTAL" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="Visibility" prop="visibility" :rules="rules.visibility">
          <el-select v-model="form.visibility" class="w-full">
            <el-option label="Private (Only me)" value="PRIVATE" />
            <el-option label="Shared (My airline)" value="SHARED" />
            <el-option label="Public" value="PUBLIC" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="Status" prop="active">
          <el-switch v-model="form.active" active-text="Active" inactive-text="Inactive" />
        </el-form-item>
      </el-col>
    </el-row>

    <h3 class="text-lg font-semibold my-4 border-b pb-2">Route Segments</h3>
    <div v-for="(segment, index) in form.segments" :key="index" class="mb-4 p-4 border rounded-md relative">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item :label="`Segment ${index + 1}: Origin`" :prop="`segments.${index}.originAirportId`" :rules="rules.segmentAirport">
            <el-select v-model="segment.originAirportId" filterable remote :remote-method="searchAirports" placeholder="Select origin" class="w-full">
              <el-option v-for="airport in airports" :key="airport.id" :label="`${airport.name} (${airport.iataCode})`" :value="airport.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item :label="`Destination`" :prop="`segments.${index}.destinationAirportId`" :rules="rules.segmentAirport">
            <el-select v-model="segment.destinationAirportId" filterable remote :remote-method="searchAirports" placeholder="Select destination" class="w-full">
              <el-option v-for="airport in airports" :key="airport.id" :label="`${airport.name} (${airport.iataCode})`" :value="airport.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="Distance (km)">
            <el-input-number v-model="segment.distance" :min="0" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="2" class="flex items-center">
          <BaseButton v-if="form.segments.length > 1" variant="danger" circle @click="removeSegment(index)" class="mt-2">
            <font-awesome-icon :icon="['fas', 'trash']" />
          </BaseButton>
        </el-col>
      </el-row>
    </div>
    <BaseButton @click="addSegment" variant="secondary" class="mt-2">
      <font-awesome-icon :icon="['fas', 'plus']" class="mr-2" />
      Add Segment
    </BaseButton>
  </BaseForm>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useReferenceStore } from '@/stores/reference';
import { useForm } from '@/composables/useForm';
import BaseForm from '@/components/forms/BaseForm.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import { ElRow, ElCol, ElFormItem, ElInput, ElSelect, ElOption, ElInputNumber, ElSwitch } from 'element-plus';

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      routeName: '',
      routeCode: '',
      routeType: 'DOMESTIC',
      visibility: 'PRIVATE',
      active: true,
      segments: [{ originAirportId: null, destinationAirportId: null, distance: 0 }],
    })
  },
  loading: Boolean,
});

const emit = defineEmits(['submit']);

const referenceStore = useReferenceStore();
const { airports } = storeToRefs(referenceStore);

const { form, rules, handleSubmit } = useForm({
  initialData: props.initialData,
  rules: {
    routeName: [{ required: true, message: 'Route name is required' }],
    routeType: [{ required: true, message: 'Route type is required' }],
    visibility: [{ required: true, message: 'Visibility is required' }],
    segmentAirport: [{ required: true, message: 'Origin and Destination are required' }],
  },
  onSubmit: (formData) => {
    // API'ye göndermeden önce segment sırasını ayarla
    const preparedData = {
      ...formData,
      segments: formData.segments.map((seg, index) => ({ ...seg, segmentOrder: index + 1 }))
    };
    emit('submit', preparedData);
  }
});

const searchAirports = (query) => {
  if (query) {
    referenceStore.fetchAirports({ name: query, size: 50 });
  }
};

const addSegment = () => {
  form.segments.push({ originAirportId: null, destinationAirportId: null, distance: 0 });
};

const removeSegment = (index) => {
  form.segments.splice(index, 1);
};

onMounted(() => {
  if (airports.value.length === 0) {
    referenceStore.fetchAirports({ size: 1000 });
  }
});
</script>

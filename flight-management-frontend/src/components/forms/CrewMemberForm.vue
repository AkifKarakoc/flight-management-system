<template>
  <BaseForm :loading="loading" :initial-data="initialData" @submit="handleSubmit">
    <el-row :gutter="24">
      <el-col :span="24">
        <h3 class="text-lg font-semibold mb-2 border-b pb-2">Personal Information</h3>
      </el-col>
      <el-col :span="12">
        <el-form-item label="First Name" prop="firstName" :rules="rules.firstName">
          <el-input v-model="form.firstName" placeholder="e.g., John" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Last Name" prop="lastName" :rules="rules.lastName">
          <el-input v-model="form.lastName" placeholder="e.g., Doe" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Date of Birth" prop="dateOfBirth" :rules="rules.dateOfBirth">
          <el-date-picker v-model="form.dateOfBirth" type="date" placeholder="Select date" class="w-full" format="YYYY-MM-DD" value-format="YYYY-MM-DD" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Gender" prop="gender" :rules="rules.gender">
          <el-select v-model="form.gender" placeholder="Select gender" class="w-full">
            <el-option label="Male" value="MALE" />
            <el-option label="Female" value="FEMALE" />
            <el-option label="Other" value="OTHER" />
          </el-select>
        </el-form-item>
      </el-col>

      <el-col :span="24">
        <h3 class="text-lg font-semibold my-4 border-b pb-2">Contact & Employment</h3>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Email Address" prop="email" :rules="rules.email">
          <el-input v-model="form.email" placeholder="e.g., john.doe@airline.com" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Phone Number" prop="phoneNumber">
          <el-input v-model="form.phoneNumber" placeholder="e.g., +90532123456" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Employee Number" prop="employeeNumber" :rules="rules.employeeNumber">
          <el-input v-model="form.employeeNumber" placeholder="e.g., EMP001" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Airline" prop="airlineId" :rules="rules.airlineId">
          <el-select v-model="form.airlineId" filterable remote :remote-method="searchAirlines" placeholder="Select airline" class="w-full" :loading="airlineLoading">
            <el-option v-for="airline in airlines" :key="airline.id" :label="`${airline.name} (${airline.iataCode})`" :value="airline.id" />
          </el-select>
        </el-form-item>
      </el-col>

      <el-col :span="24">
        <h3 class="text-lg font-semibold my-4 border-b pb-2">Role & Qualifications</h3>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Crew Type" prop="crewType" :rules="rules.crewType">
          <el-select v-model="form.crewType" placeholder="Select crew type" class="w-full">
            <el-option label="Captain" value="CAPTAIN" />
            <el-option label="First Officer" value="FIRST_OFFICER" />
            <el-option label="Flight Attendant" value="FLIGHT_ATTENDANT" />
            <el-option label="Purser" value="PURSER" />
            <el-option label="Cabin Crew" value="CABIN_CREW" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Status" prop="status" :rules="rules.status">
          <el-select v-model="form.status" placeholder="Select status" class="w-full">
            <el-option label="Active" value="ACTIVE" />
            <el-option label="On Leave" value="ON_LEAVE" />
            <el-option label="Sick Leave" value="SICK_LEAVE" />
            <el-option label="Retired" value="RETIRED" />
            <el-option label="Suspended" value="SUSPENDED" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item label="Aircraft Qualifications" prop="aircraftQualifications">
          <el-input v-model="form.aircraftQualifications" placeholder="e.g., B737,A320" />
        </el-form-item>
      </el-col>
    </el-row>
  </BaseForm>
</template>

<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useReferenceStore } from '@/stores/reference';
import { useForm } from '@/composables/useForm';
import BaseForm from '@/components/forms/BaseForm.vue';
import { ElRow, ElCol, ElFormItem, ElInput, ElSelect, ElOption, ElDatePicker } from 'element-plus';

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'MALE',
      email: '',
      phoneNumber: '',
      employeeNumber: '',
      airlineId: null,
      crewType: 'FLIGHT_ATTENDANT',
      status: 'ACTIVE',
      aircraftQualifications: ''
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
    firstName: [{ required: true, message: 'First name is required' }],
    lastName: [{ required: true, message: 'Last name is required' }],
    dateOfBirth: [{ required: true, message: 'Date of birth is required' }],
    gender: [{ required: true, message: 'Gender is required' }],
    email: [
      { required: true, message: 'Email is required' },
      { type: 'email', message: 'Please input correct email address' }
    ],
    employeeNumber: [{ required: true, message: 'Employee number is required' }],
    airlineId: [{ required: true, message: 'Airline is required' }],
    crewType: [{ required: true, message: 'Crew type is required' }],
    status: [{ required: true, message: 'Status is required' }],
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
</script>

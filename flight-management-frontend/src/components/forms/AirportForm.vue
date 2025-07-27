<template>
  <BaseForm :loading="loading" :initial-data="initialData" @submit="handleSubmit">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="Airport Name" prop="name" :rules="rules.name">
          <el-input v-model="form.name" placeholder="e.g., Istanbul Airport" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="IATA Code" prop="iataCode" :rules="rules.iataCode">
          <el-input v-model="form.iataCode" placeholder="e.g., IST" maxlength="3" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="ICAO Code" prop="icaoCode" :rules="rules.icaoCode">
          <el-input v-model="form.icaoCode" placeholder="e.g., LTFM" maxlength="4" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="City" prop="city" :rules="rules.city">
          <el-input v-model="form.city" placeholder="e.g., Istanbul" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Country" prop="country" :rules="rules.country">
          <el-input v-model="form.country" placeholder="e.g., Turkey" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Type" prop="type" :rules="rules.type">
          <el-select v-model="form.type" placeholder="Select type" class="w-full">
            <el-option label="International" value="INTERNATIONAL" />
            <el-option label="Domestic" value="DOMESTIC" />
            <el-option label="Cargo" value="CARGO" />
            <el-option label="Military" value="MILITARY" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item prop="active">
          <el-checkbox v-model="form.active">Active</el-checkbox>
        </el-form-item>
      </el-col>
    </el-row>
  </BaseForm>
</template>

<script setup>
import { useForm } from '@/composables/useForm';
import BaseForm from '@/components/forms/BaseForm.vue';
import { ElRow, ElCol, ElFormItem, ElInput, ElSelect, ElOption, ElCheckbox } from 'element-plus';

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      name: '',
      iataCode: '',
      icaoCode: '',
      city: '',
      country: '',
      type: 'INTERNATIONAL',
      active: true,
    })
  },
  loading: Boolean,
});

const emit = defineEmits(['submit']);

const { form, rules, handleSubmit } = useForm({
  initialData: props.initialData,
  rules: {
    name: [{ required: true, message: 'Airport name is required', trigger: 'blur' }],
    iataCode: [
      { required: true, message: 'IATA code is required', trigger: 'blur' },
      { len: 3, message: 'IATA code must be 3 characters', trigger: 'blur' },
    ],
    icaoCode: [
      { required: true, message: 'ICAO code is required', trigger: 'blur' },
      { len: 4, message: 'ICAO code must be 4 characters', trigger: 'blur' },
    ],
    city: [{ required: true, message: 'City is required', trigger: 'blur' }],
    country: [{ required: true, message: 'Country is required', trigger: 'blur' }],
    type: [{ required: true, message: 'Type is required', trigger: 'change' }],
  },
  onSubmit: (formData) => {
    emit('submit', formData);
  }
});
</script>

<template>
  <div class="export-report-form">
    <BaseForm
      :loading="loading"
      :initial-data="initialData"
      submit-text="Raporu Oluştur"
      @submit="handleSubmit"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="Rapor Formatı" prop="format" :rules="rules.required">
            <el-select v-model="form.format" placeholder="Format Seçin" class="w-full">
              <el-option label="Excel (.xlsx)" value="xlsx" />
              <el-option label="CSV (.csv)" value="csv" />
              <el-option label="PDF (.pdf)" value="pdf" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Tarih Aralığı" prop="dateRange" :rules="rules.required">
            <el-date-picker
              v-model="form.dateRange"
              type="daterange"
              range-separator="-"
              start-placeholder="Başlangıç Tarihi"
              end-placeholder="Bitiş Tarihi"
              class="w-full"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <h4 class="text-md font-semibold my-4 border-b pb-2">Dahil Edilecek Kolonlar</h4>
      <el-checkbox-group v-model="form.columns" class="w-full">
        <el-row>
          <el-col v-for="column in availableColumns" :key="column.value" :span="8">
            <el-checkbox :label="column.value">{{ column.label }}</el-checkbox>
          </el-col>
        </el-row>
      </el-checkbox-group>

      <div class="mt-4">
        <BaseButton type="button" size="small" @click="selectAllColumns">Tümünü Seç</BaseButton>
        <BaseButton type="button" size="small" variant="secondary" @click="clearAllColumns" class="ml-2">Seçimi Temizle</BaseButton>
      </div>

    </BaseForm>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useForm } from '@/composables/useForm';
import BaseForm from '@/components/forms/BaseForm.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import {
  ElRow,
  ElCol,
  ElFormItem,
  ElSelect,
  ElOption,
  ElDatePicker,
  ElCheckboxGroup,
  ElCheckbox,
} from 'element-plus';

const props = defineProps({
  // Rapor tipine göre (Uçuş, Personel vb.) dışarıdan kolon listesi alabiliriz.
  availableColumns: {
    type: Array,
    required: true,
    default: () => [
      // Örnek Uçuş Kolonları
      { label: 'Uçuş Numarası', value: 'flightNumber' },
      { label: 'Havayolu', value: 'airline.name' },
      { label: 'Rota', value: 'route.routeName' },
      { label: 'Kalkış Zamanı', value: 'scheduledDeparture' },
      { label: 'Varış Zamanı', value: 'scheduledArrival' },
      { label: 'Durum', value: 'status' },
    ]
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['submit']);

const initialData = ref({
  format: 'xlsx',
  dateRange: [],
  columns: props.availableColumns.map(c => c.value) // Başlangıçta hepsi seçili gelsin
});

const { form, rules, handleSubmit } = useForm({
  initialData: initialData.value,
  rules: {
    required: [{ required: true, message: 'Bu alan zorunludur', trigger: 'change' }],
  },
  onSubmit: (formData) => {
    // Tarih aralığını daha kullanışlı bir formata çevirip gönderelim
    const reportOptions = {
      ...formData,
      startDate: formData.dateRange ? formData.dateRange[0] : null,
      endDate: formData.dateRange ? formData.dateRange[1] : null,
    };
    delete reportOptions.dateRange; // Artık gereksiz

    emit('submit', reportOptions);
  }
});

const selectAllColumns = () => {
  form.columns = props.availableColumns.map(c => c.value);
};

const clearAllColumns = () => {
  form.columns = [];
};
</script>

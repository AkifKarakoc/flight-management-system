<template>
  <div class="airline-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="140px"
      label-position="left"
      @submit.prevent="handleSubmit"
    >
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="IATA Kodu" prop="iataCode">
            <el-input
              v-model="formData.iataCode"
              placeholder="Örn: TK"
              maxlength="3"
              :disabled="loading"
              style="text-transform: uppercase"
            />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="ICAO Kodu" prop="icaoCode">
            <el-input
              v-model="formData.icaoCode"
              placeholder="Örn: THY"
              maxlength="4"
              :disabled="loading"
              style="text-transform: uppercase"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="Havayolu Adı" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="Havayolu şirketi adını girin"
          :disabled="loading"
        />
      </el-form-item>

      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="Ülke" prop="country">
            <el-select
              v-model="formData.country"
              placeholder="Ülke seçin"
              filterable
              :disabled="loading"
              style="width: 100%"
            >
              <el-option
                v-for="country in countries"
                :key="country.code"
                :label="country.name"
                :value="country.name"
              />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="Durum" prop="active">
            <el-switch
              v-model="formData.active"
              :disabled="loading"
              active-text="Aktif"
              inactive-text="Pasif"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="Website" prop="website">
        <el-input
          v-model="formData.website"
          placeholder="https://example.com"
          :disabled="loading"
        />
      </el-form-item>

      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="E-posta" prop="contactEmail">
            <el-input
              v-model="formData.contactEmail"
              placeholder="contact@example.com"
              :disabled="loading"
            />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="Telefon" prop="contactPhone">
            <el-input
              v-model="formData.contactPhone"
              placeholder="+90 212 123 45 67"
              :disabled="loading"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="Notlar" prop="notes">
        <el-input
          v-model="formData.notes"
          type="textarea"
          :rows="3"
          placeholder="Opsiyonel notlar..."
          :disabled="loading"
        />
      </el-form-item>
    </el-form>

    <div class="form-actions">
      <el-button @click="$emit('cancel')" :disabled="loading">
        İptal
      </el-button>
      <el-button
        type="primary"
        @click="handleSubmit"
        :loading="loading"
      >
        {{ isEdit ? 'Güncelle' : 'Oluştur' }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { validators } from '@/utils/validators'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit', 'cancel'])

const formRef = ref()
const loading = ref(false)

// Form data
const formData = reactive({
  iataCode: '',
  icaoCode: '',
  name: '',
  country: '',
  website: '',
  contactEmail: '',
  contactPhone: '',
  active: true,
  notes: ''
})

// Countries list (simplified)
const countries = [
  { code: 'TR', name: 'Türkiye' },
  { code: 'US', name: 'Amerika Birleşik Devletleri' },
  { code: 'GB', name: 'Birleşik Krallık' },
  { code: 'DE', name: 'Almanya' },
  { code: 'FR', name: 'Fransa' },
  { code: 'ES', name: 'İspanya' },
  { code: 'IT', name: 'İtalya' },
  { code: 'NL', name: 'Hollanda' },
  { code: 'AE', name: 'Birleşik Arap Emirlikleri' },
  { code: 'QA', name: 'Katar' },
  { code: 'SA', name: 'Suudi Arabistan' },
  { code: 'JP', name: 'Japonya' },
  { code: 'CN', name: 'Çin' },
  { code: 'SG', name: 'Singapur' },
  { code: 'CA', name: 'Kanada' },
  { code: 'AU', name: 'Avustralya' }
].sort((a, b) => a.name.localeCompare(b.name, 'tr'))

// Validation rules
const rules = {
  iataCode: [
    validators.required('IATA kodu zorunludur'),
    validators.iataCode()
  ],
  icaoCode: [
    validators.required('ICAO kodu zorunludur'),
    validators.pattern(/^[A-Z]{3,4}$/, 'ICAO kodu 3-4 harften oluşmalıdır')
  ],
  name: [
    validators.required('Havayolu adı zorunludur'),
    validators.minLength(2),
    validators.maxLength(100)
  ],
  country: [
    validators.required('Ülke seçimi zorunludur')
  ],
  website: [
    validators.pattern(
      /^https?:\/\/.+/,
      'Geçerli bir website adresi girin (http:// veya https:// ile başlayan)'
    )
  ],
  contactEmail: [
    validators.email()
  ],
  contactPhone: [
    validators.pattern(
      /^[+]?[0-9\s\-\(\)]{10,20}$/,
      'Geçerli bir telefon numarası girin'
    )
  ]
}

// Methods
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    // Convert IATA and ICAO codes to uppercase
    const submitData = {
      ...formData,
      iataCode: formData.iataCode.toUpperCase(),
      icaoCode: formData.icaoCode.toUpperCase()
    }

    emit('submit', submitData)
  } catch (error) {
    console.log('Validation failed:', error)
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// Watch for modelValue changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    Object.assign(formData, {
      iataCode: '',
      icaoCode: '',
      name: '',
      country: '',
      website: '',
      contactEmail: '',
      contactPhone: '',
      active: true,
      notes: '',
      ...newValue
    })
  }
}, { immediate: true, deep: true })

// Expose methods
defineExpose({
  resetForm
})
</script>

<style scoped>
.airline-form {
  padding: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

:deep(.el-input__wrapper) {
  transition: all 0.2s;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset;
}

@media (max-width: 768px) {
  :deep(.el-form) {
    .el-row .el-col {
      margin-bottom: 0;
    }
  }
}
</style>

<template>
  <div class="airline-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="140px"
      label-position="left"
      class="form-container"
      @submit.prevent="handleSubmit"
    >
      <!-- Basic Information -->
      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Ship /></el-icon>
            <span>Temel Bilgiler</span>
          </div>
        </template>

        <div class="form-grid">
          <!-- Airline Code -->
          <el-form-item label="Havayolu Kodu" prop="code" class="form-item-full">
            <el-input
              v-model="formData.code"
              placeholder="Örn: TK, PC, SU"
              maxlength="3"
              show-word-limit
              :disabled="submitting"
              @input="formatAirlineCode"
            >
              <template #prefix>
                <el-icon><Document /></el-icon>
              </template>
            </el-input>
            <div class="help-text">2-3 karakter IATA/ICAO kodu</div>
          </el-form-item>

          <!-- Airline Name -->
          <el-form-item label="Havayolu Adı" prop="name" class="form-item-full">
            <el-input
              v-model="formData.name"
              placeholder="Örn: Turkish Airlines"
              maxlength="100"
              show-word-limit
              :disabled="submitting"
            >
              <template #prefix>
                <el-icon><OfficeBuilding /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- Country -->
          <el-form-item label="Ülke" prop="country">
            <el-select
              v-model="formData.country"
              placeholder="Ülke seçin"
              filterable
              :disabled="submitting"
              class="full-width"
            >
              <el-option
                v-for="country in countries"
                :key="country.code"
                :label="country.name"
                :value="country.code"
              >
                <span class="country-option">
                  <span class="country-flag">{{ country.flag }}</span>
                  <span>{{ country.name }}</span>
                </span>
              </el-option>
            </el-select>
          </el-form-item>

          <!-- Active Status -->
          <el-form-item label="Durum" prop="active">
            <el-switch
              v-model="formData.active"
              active-text="Aktif"
              inactive-text="Pasif"
              :disabled="submitting"
            />
          </el-form-item>
        </div>
      </el-card>

      <!-- Contact Information -->
      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Phone /></el-icon>
            <span>İletişim Bilgileri</span>
          </div>
        </template>

        <div class="form-grid">
          <!-- Website -->
          <el-form-item label="Website" prop="website">
            <el-input
              v-model="formData.website"
              placeholder="https://www.example.com"
              :disabled="submitting"
            >
              <template #prefix>
                <el-icon><Link /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- Email -->
          <el-form-item label="E-posta" prop="email">
            <el-input
              v-model="formData.email"
              placeholder="info@airline.com"
              type="email"
              :disabled="submitting"
            >
              <template #prefix>
                <el-icon><Message /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- Phone -->
          <el-form-item label="Telefon" prop="phone">
            <el-input
              v-model="formData.phone"
              placeholder="+90 212 123 45 67"
              :disabled="submitting"
            >
              <template #prefix>
                <el-icon><Phone /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- Headquarters -->
          <el-form-item label="Merkez" prop="headquarters">
            <el-input
              v-model="formData.headquarters"
              placeholder="İstanbul, Türkiye"
              :disabled="submitting"
            >
              <template #prefix>
                <el-icon><MapLocation /></el-icon>
              </template>
            </el-input>
          </el-form-item>
        </div>
      </el-card>

      <!-- Additional Information -->
      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><InfoFilled /></el-icon>
            <span>Ek Bilgiler</span>
          </div>
        </template>

        <div class="form-grid">
          <!-- Founded Year -->
          <el-form-item label="Kuruluş Yılı" prop="foundedYear">
            <el-input-number
              v-model="formData.foundedYear"
              :min="1900"
              :max="new Date().getFullYear()"
              placeholder="Kuruluş yılı"
              :disabled="submitting"
              class="full-width"
            />
          </el-form-item>

          <!-- Fleet Size -->
          <el-form-item label="Filo Büyüklüğü" prop="fleetSize">
            <el-input-number
              v-model="formData.fleetSize"
              :min="0"
              placeholder="Uçak sayısı"
              :disabled="submitting"
              class="full-width"
            />
          </el-form-item>

          <!-- Description -->
          <el-form-item label="Açıklama" prop="description" class="form-item-full">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="3"
              placeholder="Havayolu hakkında kısa açıklama..."
              maxlength="500"
              show-word-limit
              :disabled="submitting"
            />
          </el-form-item>
        </div>
      </el-card>

      <!-- Form Actions -->
      <div class="form-actions">
        <el-button @click="handleCancel" :disabled="submitting">
          İptal
        </el-button>
        <el-button @click="handleReset" :disabled="submitting">
          Sıfırla
        </el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="handleSubmit"
        >
          {{ isEditing ? 'Güncelle' : 'Kaydet' }}
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Ship,
  Document,
  OfficeBuilding,
  Phone,
  Link,
  Message,
  MapLocation,
  InfoFilled
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  isEditing: {
    type: Boolean,
    default: false
  },
  submitting: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'submit', 'cancel', 'reset'])

// Refs
const formRef = ref(null)

// Form data
const formData = reactive({
  code: '',
  name: '',
  country: 'TR',
  active: true,
  website: '',
  email: '',
  phone: '',
  headquarters: '',
  foundedYear: null,
  fleetSize: null,
  description: '',
  ...props.modelValue
})

// Countries data
const countries = ref([
  { code: 'TR', name: 'Türkiye', flag: '🇹🇷' },
  { code: 'US', name: 'Amerika Birleşik Devletleri', flag: '🇺🇸' },
  { code: 'GB', name: 'Birleşik Krallık', flag: '🇬🇧' },
  { code: 'DE', name: 'Almanya', flag: '🇩🇪' },
  { code: 'FR', name: 'Fransa', flag: '🇫🇷' },
  { code: 'IT', name: 'İtalya', flag: '🇮🇹' },
  { code: 'ES', name: 'İspanya', flag: '🇪🇸' },
  { code: 'NL', name: 'Hollanda', flag: '🇳🇱' },
  { code: 'AE', name: 'Birleşik Arap Emirlikleri', flag: '🇦🇪' },
  { code: 'QA', name: 'Katar', flag: '🇶🇦' },
  { code: 'SA', name: 'Suudi Arabistan', flag: '🇸🇦' },
  { code: 'SG', name: 'Singapur', flag: '🇸🇬' },
  { code: 'JP', name: 'Japonya', flag: '🇯🇵' },
  { code: 'KR', name: 'Güney Kore', flag: '🇰🇷' },
  { code: 'CN', name: 'Çin', flag: '🇨🇳' },
  { code: 'IN', name: 'Hindistan', flag: '🇮🇳' },
  { code: 'AU', name: 'Avustralya', flag: '🇦🇺' },
  { code: 'CA', name: 'Kanada', flag: '🇨🇦' },
  { code: 'BR', name: 'Brezilya', flag: '🇧🇷' },
  { code: 'RU', name: 'Rusya', flag: '🇷🇺' }
])

// Form validation rules
const formRules = {
  code: [
    { required: true, message: 'Havayolu kodu gereklidir', trigger: 'blur' },
    { min: 2, max: 3, message: '2-3 karakter olmalıdır', trigger: 'blur' },
    { pattern: /^[A-Z]+$/, message: 'Sadece büyük harfler kullanın', trigger: 'blur' }
  ],
  name: [
    { required: true, message: 'Havayolu adı gereklidir', trigger: 'blur' },
    { min: 2, max: 100, message: '2-100 karakter arasında olmalıdır', trigger: 'blur' }
  ],
  country: [
    { required: true, message: 'Ülke seçimi gereklidir', trigger: 'change' }
  ],
  email: [
    { type: 'email', message: 'Geçerli bir e-posta adresi girin', trigger: 'blur' }
  ],
  website: [
    { pattern: /^https?:\/\/.+\..+/, message: 'Geçerli bir website adresi girin', trigger: 'blur' }
  ],
  foundedYear: [
    { type: 'number', message: 'Geçerli bir yıl girin', trigger: 'blur' }
  ],
  fleetSize: [
    { type: 'number', message: 'Geçerli bir sayı girin', trigger: 'blur' }
  ]
}

// Methods
function formatAirlineCode() {
  formData.code = formData.code.toUpperCase()
}

async function handleSubmit() {
  if (!formRef.value) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    emit('submit', { ...formData })
  } catch (error) {
    console.error('Form validation failed:', error)
  }
}

function handleCancel() {
  emit('cancel')
}

function handleReset() {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  emit('reset')
}

// Watch for prop changes
watch(
  () => props.modelValue,
  (newValue) => {
    Object.assign(formData, newValue)
  },
  { deep: true }
)

// Watch form data changes
watch(
  formData,
  (newValue) => {
    emit('update:modelValue', { ...newValue })
  },
  { deep: true }
)

// Lifecycle
onMounted(() => {
  // Focus first input
  setTimeout(() => {
    const firstInput = document.querySelector('.airline-form input')
    if (firstInput) {
      firstInput.focus()
    }
  }, 100)
})
</script>

<style scoped lang="scss">
.airline-form {
  .form-container {
    max-width: 800px;
  }

  .form-card {
    margin-bottom: 1.5rem;
    border: 1px solid #ebeef5;

    .card-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: #303133;

      .el-icon {
        color: #409eff;
      }
    }
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;

    .form-item-full {
      grid-column: 1 / -1;
    }
  }

  .help-text {
    font-size: 0.75rem;
    color: #909399;
    margin-top: 0.25rem;
  }

  .country-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .country-flag {
      font-size: 1.2rem;
    }
  }

  .full-width {
    width: 100%;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #ebeef5;
  }
}

// Responsive
@media (max-width: 768px) {
  .airline-form {
    .form-grid {
      grid-template-columns: 1fr;

      .form-item-full {
        grid-column: 1;
      }
    }

    .form-actions {
      flex-direction: column;

      .el-button {
        width: 100%;
      }
    }
  }
}

// Form animations
:deep(.el-form-item) {
  transition: all 0.3s ease;

  &.is-error {
    animation: shake 0.5s ease-in-out;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

// Card hover effects
.form-card {
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }
}
</style>

<template>
  <div class="airport-form">
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
            <el-icon><MapLocation /></el-icon>
            <span>Temel Bilgiler</span>
          </div>
        </template>

        <div class="form-grid">
          <!-- ICAO Code -->
          <el-form-item label="ICAO Kodu" prop="icaoCode">
            <el-input
              v-model="formData.icaoCode"
              placeholder="Örn: LTBA, LTFM"
              maxlength="4"
              show-word-limit
              :disabled="submitting"
              @input="formatIcaoCode"
            >
              <template #prefix>
                <el-icon><Document /></el-icon>
              </template>
            </el-input>
            <div class="help-text">4 karakter ICAO kodu</div>
          </el-form-item>

          <!-- IATA Code -->
          <el-form-item label="IATA Kodu" prop="iataCode">
            <el-input
              v-model="formData.iataCode"
              placeholder="Örn: IST, SAW"
              maxlength="3"
              show-word-limit
              :disabled="submitting"
              @input="formatIataCode"
            >
              <template #prefix>
                <el-icon><Document /></el-icon>
              </template>
            </el-input>
            <div class="help-text">3 karakter IATA kodu</div>
          </el-form-item>

          <!-- Airport Name -->
          <el-form-item label="Havaalanı Adı" prop="name" class="form-item-full">
            <el-input
              v-model="formData.name"
              placeholder="Örn: İstanbul Havalimanı"
              maxlength="150"
              show-word-limit
              :disabled="submitting"
            >
              <template #prefix>
                <el-icon><OfficeBuilding /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- Airport Type -->
          <el-form-item label="Havaalanı Tipi" prop="type">
            <el-select
              v-model="formData.type"
              placeholder="Tip seçin"
              :disabled="submitting"
              class="full-width"
            >
              <el-option label="Uluslararası" value="INTERNATIONAL" />
              <el-option label="İç Hat" value="DOMESTIC" />
              <el-option label="Askeri" value="MILITARY" />
              <el-option label="Kargo" value="CARGO" />
              <el-option label="Özel" value="PRIVATE" />
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

      <!-- Location Information -->
      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Location /></el-icon>
            <span>Konum Bilgileri</span>
          </div>
        </template>

        <div class="form-grid">
          <!-- Country -->
          <el-form-item label="Ülke" prop="country">
            <el-select
              v-model="formData.country"
              placeholder="Ülke seçin"
              filterable
              :disabled="submitting"
              class="full-width"
              @change="handleCountryChange"
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

          <!-- City -->
          <el-form-item label="Şehir" prop="city">
            <el-input
              v-model="formData.city"
              placeholder="Örn: İstanbul"
              :disabled="submitting"
            >
              <template #prefix>
                <el-icon><OfficeBuilding /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- Latitude -->
          <el-form-item label="Enlem (Latitude)" prop="latitude">
            <el-input-number
              v-model="formData.latitude"
              :min="-90"
              :max="90"
              :precision="6"
              placeholder="41.275278"
              :disabled="submitting"
              class="full-width"
            />
          </el-form-item>

          <!-- Longitude -->
          <el-form-item label="Boylam (Longitude)" prop="longitude">
            <el-input-number
              v-model="formData.longitude"
              :min="-180"
              :max="180"
              :precision="6"
              placeholder="28.751944"
              :disabled="submitting"
              class="full-width"
            />
          </el-form-item>

          <!-- Elevation -->
          <el-form-item label="Rakım (metre)" prop="elevation">
            <el-input-number
              v-model="formData.elevation"
              :min="-500"
              :max="9000"
              placeholder="163"
              :disabled="submitting"
              class="full-width"
            />
          </el-form-item>

          <!-- Timezone -->
          <el-form-item label="Zaman Dilimi" prop="timezone">
            <el-select
              v-model="formData.timezone"
              placeholder="Zaman dilimi seçin"
              filterable
              :disabled="submitting"
              class="full-width"
            >
              <el-option
                v-for="tz in timezones"
                :key="tz.value"
                :label="tz.label"
                :value="tz.value"
              />
            </el-select>
          </el-form-item>
        </div>
      </el-card>

      <!-- Technical Information -->
      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Tools /></el-icon>
            <span>Teknik Bilgiler</span>
          </div>
        </template>

        <div class="form-grid">
          <!-- Number of Runways -->
          <el-form-item label="Pist Sayısı" prop="runwayCount">
            <el-input-number
              v-model="formData.runwayCount"
              :min="0"
              :max="10"
              placeholder="2"
              :disabled="submitting"
              class="full-width"
            />
          </el-form-item>

          <!-- Number of Terminals -->
          <el-form-item label="Terminal Sayısı" prop="terminalCount">
            <el-input-number
              v-model="formData.terminalCount"
              :min="0"
              :max="20"
              placeholder="1"
              :disabled="submitting"
              class="full-width"
            />
          </el-form-item>

          <!-- Annual Passenger Capacity -->
          <el-form-item label="Yıllık Yolcu Kapasitesi" prop="passengerCapacity">
            <el-input-number
              v-model="formData.passengerCapacity"
              :min="0"
              :step="1000000"
              placeholder="200000000"
              :disabled="submitting"
              class="full-width"
            />
            <div class="help-text">Yıllık yolcu kapasitesi</div>
          </el-form-item>

          <!-- Hub Airlines -->
          <el-form-item label="Hub Havayolları" prop="hubAirlines" class="form-item-full">
            <el-select
              v-model="formData.hubAirlines"
              multiple
              filterable
              placeholder="Hub olarak kullanılan havayollarını seçin"
              :disabled="submitting"
              class="full-width"
            >
              <el-option
                v-for="airline in airlines"
                :key="airline.id"
                :label="airline.name"
                :value="airline.id"
              />
            </el-select>
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
          <!-- Website -->
          <el-form-item label="Website" prop="website">
            <el-input
              v-model="formData.website"
              placeholder="https://www.istanbul-airport.com"
              :disabled="submitting"
            >
              <template #prefix>
                <el-icon><Link /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- Phone -->
          <el-form-item label="Telefon" prop="phone">
            <el-input
              v-model="formData.phone"
              placeholder="+90 212 444 44 44"
              :disabled="submitting"
            >
              <template #prefix>
                <el-icon><Phone /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- Description -->
          <el-form-item label="Açıklama" prop="description" class="form-item-full">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="3"
              placeholder="Havaalanı hakkında kısa açıklama..."
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
  MapLocation,
  Document,
  OfficeBuilding,
  Location,
  Tools,
  InfoFilled,
  Link,
  Phone
} from '@element-plus/icons-vue'
import { useReferenceStore } from '@/stores/reference'

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

// Store
const referenceStore = useReferenceStore()

// Refs
const formRef = ref(null)

// Form data
const formData = reactive({
  icaoCode: '',
  iataCode: '',
  name: '',
  type: 'INTERNATIONAL',
  active: true,
  country: 'TR',
  city: '',
  latitude: null,
  longitude: null,
  elevation: null,
  timezone: 'Europe/Istanbul',
  runwayCount: 1,
  terminalCount: 1,
  passengerCapacity: null,
  hubAirlines: [],
  website: '',
  phone: '',
  description: '',
  ...props.modelValue
})

// Reference data
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
  { code: 'JP', name: 'Japonya', flag: '🇯🇵' },
  { code: 'SG', name: 'Singapur', flag: '🇸🇬' }
])

const timezones = ref([
  { value: 'Europe/Istanbul', label: 'Türkiye (UTC+3)' },
  { value: 'UTC', label: 'UTC (GMT+0)' },
  { value: 'Europe/London', label: 'Londra (GMT+0/+1)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'America/New_York', label: 'New York (EST)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Singapore', label: 'Singapur (SGT)' },
  { value: 'Australia/Sydney', label: 'Sidney (AEST)' }
])

const airlines = computed(() => {
  return referenceStore.airlines
})

// Form validation rules
const formRules = {
  icaoCode: [
    { required: true, message: 'ICAO kodu gereklidir', trigger: 'blur' },
    { len: 4, message: '4 karakter olmalıdır', trigger: 'blur' },
    { pattern: /^[A-Z]+$/, message: 'Sadece büyük harfler kullanın', trigger: 'blur' }
  ],
  iataCode: [
    { required: true, message: 'IATA kodu gereklidir', trigger: 'blur' },
    { len: 3, message: '3 karakter olmalıdır', trigger: 'blur' },
    { pattern: /^[A-Z]+$/, message: 'Sadece büyük harfler kullanın', trigger: 'blur' }
  ],
  name: [
    { required: true, message: 'Havaalanı adı gereklidir', trigger: 'blur' },
    { min: 3, max: 150, message: '3-150 karakter arasında olmalıdır', trigger: 'blur' }
  ],
  type: [
    { required: true, message: 'Havaalanı tipi seçimi gereklidir', trigger: 'change' }
  ],
  country: [
    { required: true, message: 'Ülke seçimi gereklidir', trigger: 'change' }
  ],
  city: [
    { required: true, message: 'Şehir bilgisi gereklidir', trigger: 'blur' }
  ],
  latitude: [
    { type: 'number', message: 'Geçerli bir enlem değeri girin', trigger: 'blur' }
  ],
  longitude: [
    { type: 'number', message: 'Geçerli bir boylam değeri girin', trigger: 'blur' }
  ],
  website: [
    { pattern: /^https?:\/\/.+\..+/, message: 'Geçerli bir website adresi girin', trigger: 'blur' }
  ]
}

// Methods
function formatIcaoCode() {
  formData.icaoCode = formData.icaoCode.toUpperCase()
}

function formatIataCode() {
  formData.iataCode = formData.iataCode.toUpperCase()
}

function handleCountryChange(countryCode) {
  // Auto-set timezone based on country
  const timezoneMap = {
    'TR': 'Europe/Istanbul',
    'US': 'America/New_York',
    'GB': 'Europe/London',
    'DE': 'Europe/Paris',
    'FR': 'Europe/Paris',
    'AE': 'Asia/Dubai',
    'JP': 'Asia/Tokyo',
    'SG': 'Asia/Singapore'
  }

  if (timezoneMap[countryCode]) {
    formData.timezone = timezoneMap[countryCode]
  }
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
onMounted(async () => {
  // Load airlines for hub selection
  try {
    await referenceStore.fetchAirlines()
  } catch (error) {
    console.error('Failed to load airlines:', error)
  }

  // Focus first input
  setTimeout(() => {
    const firstInput = document.querySelector('.airport-form input')
    if (firstInput) {
      firstInput.focus()
    }
  }, 100)
})
</script>

<style scoped lang="scss">
.airport-form {
  .form-container {
    max-width: 900px;
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
  .airport-form {
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

// Number input styling
:deep(.el-input-number) {
  width: 100%;
}
</style>

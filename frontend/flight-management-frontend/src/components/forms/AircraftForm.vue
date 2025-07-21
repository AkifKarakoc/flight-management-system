<template>
  <div class="aircraft-form">
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
            <el-icon><Promotion /></el-icon>
            <span>Temel Bilgiler</span>
          </div>
        </template>

        <div class="form-grid">
          <!-- Registration Number -->
          <el-form-item label="Kayıt Numarası" prop="registrationNumber">
            <el-input
              v-model="formData.registrationNumber"
              placeholder="Örn: TC-JRO, N747BA"
              maxlength="10"
              show-word-limit
              :disabled="submitting"
              @input="formatRegistrationNumber"
            >
              <template #prefix>
                <el-icon><Document /></el-icon>
              </template>
            </el-input>
            <div class="help-text">Uçağın tail numarası</div>
          </el-form-item>

          <!-- Airline -->
          <el-form-item label="Havayolu" prop="airlineId">
            <el-select
              v-model="formData.airlineId"
              placeholder="Havayolu seçin"
              filterable
              :disabled="submitting"
              :loading="airlinesLoading"
              class="full-width"
            >
              <el-option
                v-for="airline in airlines"
                :key="airline.id"
                :label="airline.name"
                :value="airline.id"
              >
                <span class="airline-option">
                  <span class="airline-code">{{ airline.code }}</span>
                  <span>{{ airline.name }}</span>
                </span>
              </el-option>
            </el-select>
          </el-form-item>

          <!-- Aircraft Type -->
          <el-form-item label="Uçak Tipi" prop="aircraftType">
            <el-select
              v-model="formData.aircraftType"
              placeholder="Uçak tipi seçin"
              filterable
              :disabled="submitting"
              class="full-width"
              @change="handleAircraftTypeChange"
            >
              <el-option
                v-for="type in aircraftTypes"
                :key="type.code"
                :label="`${type.code} - ${type.name}`"
                :value="type.code"
              >
                <div class="aircraft-type-option">
                  <div class="type-header">
                    <span class="type-code">{{ type.code }}</span>
                    <span class="type-manufacturer">{{ type.manufacturer }}</span>
                  </div>
                  <div class="type-name">{{ type.name }}</div>
                </div>
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

      <!-- Technical Specifications -->
      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Tools /></el-icon>
            <span>Teknik Özellikler</span>
          </div>
        </template>

        <div class="form-grid">
          <!-- Manufacturer -->
          <el-form-item label="Üretici" prop="manufacturer">
            <el-input
              v-model="formData.manufacturer"
              placeholder="Örn: Boeing, Airbus"
              :disabled="submitting || manufacturerLocked"
            >
              <template #prefix>
                <el-icon><OfficeBuilding /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- Model -->
          <el-form-item label="Model" prop="model">
            <el-input
              v-model="formData.model"
              placeholder="Örn: 737-800, A320-200"
              :disabled="submitting || modelLocked"
            >
              <template #prefix>
                <el-icon><Setting /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- Seat Configuration -->
          <el-form-item label="Koltuk Kapasitesi" prop="seatCount">
            <el-input-number
              v-model="formData.seatCount"
              :min="1"
              :max="1000"
              placeholder="180"
              :disabled="submitting"
              class="full-width"
            />
          </el-form-item>

          <!-- Maximum Range -->
          <el-form-item label="Maksimum Menzil (km)" prop="maxRange">
            <el-input-number
              v-model="formData.maxRange"
              :min="0"
              :step="100"
              placeholder="5000"
              :disabled="submitting"
              class="full-width"
            />
          </el-form-item>

          <!-- Maximum Speed -->
          <el-form-item label="Maksimum Hız (km/h)" prop="maxSpeed">
            <el-input-number
              v-model="formData.maxSpeed"
              :min="0"
              :step="10"
              placeholder="850"
              :disabled="submitting"
              class="full-width"
            />
          </el-form-item>

          <!-- Fuel Capacity -->
          <el-form-item label="Yakıt Kapasitesi (L)" prop="fuelCapacity">
            <el-input-number
              v-model="formData.fuelCapacity"
              :min="0"
              :step="1000"
              placeholder="26000"
              :disabled="submitting"
              class="full-width"
            />
          </el-form-item>

          <!-- Maximum Altitude -->
          <el-form-item label="Maksimum İrtifa (ft)" prop="maxAltitude">
            <el-input-number
              v-model="formData.maxAltitude"
              :min="0"
              :step="1000"
              placeholder="41000"
              :disabled="submitting"
              class="full-width"
            />
          </el-form-item>

          <!-- Engine Type -->
          <el-form-item label="Motor Tipi" prop="engineType">
            <el-select
              v-model="formData.engineType"
              placeholder="Motor tipi seçin"
              :disabled="submitting"
              class="full-width"
            >
              <el-option label="Jet - Turbofan" value="TURBOFAN" />
              <el-option label="Jet - Turbojet" value="TURBOJET" />
              <el-option label="Turboprop" value="TURBOPROP" />
              <el-option label="Piston" value="PISTON" />
            </el-select>
          </el-form-item>
        </div>
      </el-card>

      <!-- Operational Information -->
      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Clock /></el-icon>
            <span>Operasyonel Bilgiler</span>
          </div>
        </template>

        <div class="form-grid">
          <!-- Manufacturing Date -->
          <el-form-item label="Üretim Tarihi" prop="manufacturingDate">
            <el-date-picker
              v-model="formData.manufacturingDate"
              type="date"
              placeholder="Üretim tarihi seçin"
              :disabled="submitting"
              :disabled-date="disabledManufacturingDate"
              class="full-width"
              format="DD.MM.YYYY"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>

          <!-- First Flight Date -->
          <el-form-item label="İlk Uçuş Tarihi" prop="firstFlightDate">
            <el-date-picker
              v-model="formData.firstFlightDate"
              type="date"
              placeholder="İlk uçuş tarihi seçin"
              :disabled="submitting"
              :disabled-date="disabledFirstFlightDate"
              class="full-width"
              format="DD.MM.YYYY"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>

          <!-- Service Entry Date -->
          <el-form-item label="Hizmete Giriş" prop="serviceEntryDate">
            <el-date-picker
              v-model="formData.serviceEntryDate"
              type="date"
              placeholder="Hizmete giriş tarihi seçin"
              :disabled="submitting"
              :disabled-date="disabledServiceDate"
              class="full-width"
              format="DD.MM.YYYY"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>

          <!-- Total Flight Hours -->
          <el-form-item label="Toplam Uçuş Saati" prop="totalFlightHours">
            <el-input-number
              v-model="formData.totalFlightHours"
              :min="0"
              :precision="1"
              placeholder="25000.5"
              :disabled="submitting"
              class="full-width"
            />
          </el-form-item>

          <!-- Maintenance Status -->
          <el-form-item label="Bakım Durumu" prop="maintenanceStatus">
            <el-select
              v-model="formData.maintenanceStatus"
              placeholder="Bakım durumu seçin"
              :disabled="submitting"
              class="full-width"
            >
              <el-option label="Aktif" value="ACTIVE" />
              <el-option label="Bakımda" value="MAINTENANCE" />
              <el-option label="Hizmet Dışı" value="OUT_OF_SERVICE" />
              <el-option label="Emekli" value="RETIRED" />
            </el-select>
          </el-form-item>

          <!-- Current Location -->
          <el-form-item label="Mevcut Konum" prop="currentLocation">
            <el-input
              v-model="formData.currentLocation"
              placeholder="Örn: İstanbul Havalimanı"
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
          <!-- Notes -->
          <el-form-item label="Notlar" prop="notes" class="form-item-full">
            <el-input
              v-model="formData.notes"
              type="textarea"
              :rows="3"
              placeholder="Uçak hakkında ek notlar..."
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
  Promotion,
  Document,
  Tools,
  OfficeBuilding,
  Setting,
  Clock,
  MapLocation,
  InfoFilled
} from '@element-plus/icons-vue'
import { useReferenceStore } from '@/stores/reference'
import dayjs from 'dayjs'

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
const airlinesLoading = ref(false)
const manufacturerLocked = ref(false)
const modelLocked = ref(false)

// Form data
const formData = reactive({
  registrationNumber: '',
  airlineId: null,
  aircraftType: '',
  active: true,
  manufacturer: '',
  model: '',
  seatCount: null,
  maxRange: null,
  maxSpeed: null,
  fuelCapacity: null,
  maxAltitude: null,
  engineType: '',
  manufacturingDate: '',
  firstFlightDate: '',
  serviceEntryDate: '',
  totalFlightHours: null,
  maintenanceStatus: 'ACTIVE',
  currentLocation: '',
  notes: '',
  ...props.modelValue
})

// Aircraft types data
const aircraftTypes = ref([
  {
    code: 'A320',
    name: 'A320-200',
    manufacturer: 'Airbus',
    defaultSpecs: {
      seatCount: 180,
      maxRange: 6100,
      maxSpeed: 871,
      fuelCapacity: 26000,
      maxAltitude: 39000,
      engineType: 'TURBOFAN'
    }
  },
  {
    code: 'A321',
    name: 'A321-200',
    manufacturer: 'Airbus',
    defaultSpecs: {
      seatCount: 220,
      maxRange: 5950,
      maxSpeed: 871,
      fuelCapacity: 32940,
      maxAltitude: 39000,
      engineType: 'TURBOFAN'
    }
  },
  {
    code: 'B737',
    name: '737-800',
    manufacturer: 'Boeing',
    defaultSpecs: {
      seatCount: 189,
      maxRange: 5765,
      maxSpeed: 842,
      fuelCapacity: 26020,
      maxAltitude: 41000,
      engineType: 'TURBOFAN'
    }
  },
  {
    code: 'B777',
    name: '777-300ER',
    manufacturer: 'Boeing',
    defaultSpecs: {
      seatCount: 365,
      maxRange: 14594,
      maxSpeed: 905,
      fuelCapacity: 181000,
      maxAltitude: 43100,
      engineType: 'TURBOFAN'
    }
  },
  {
    code: 'B787',
    name: '787-9',
    manufacturer: 'Boeing',
    defaultSpecs: {
      seatCount: 290,
      maxRange: 14800,
      maxSpeed: 903,
      fuelCapacity: 126000,
      maxAltitude: 43000,
      engineType: 'TURBOFAN'
    }
  }
])

// Computed
const airlines = computed(() => {
  return referenceStore.airlines
})

// Form validation rules
const formRules = {
  registrationNumber: [
    { required: true, message: 'Kayıt numarası gereklidir', trigger: 'blur' },
    { min: 4, max: 10, message: '4-10 karakter arasında olmalıdır', trigger: 'blur' },
    { pattern: /^[A-Z0-9-]+$/, message: 'Sadece büyük harf, rakam ve tire kullanın', trigger: 'blur' }
  ],
  airlineId: [
    { required: true, message: 'Havayolu seçimi gereklidir', trigger: 'change' }
  ],
  aircraftType: [
    { required: true, message: 'Uçak tipi seçimi gereklidir', trigger: 'change' }
  ],
  manufacturer: [
    { required: true, message: 'Üretici bilgisi gereklidir', trigger: 'blur' }
  ],
  model: [
    { required: true, message: 'Model bilgisi gereklidir', trigger: 'blur' }
  ],
  seatCount: [
    { type: 'number', min: 1, message: 'Geçerli bir koltuk sayısı girin', trigger: 'blur' }
  ]
}

// Methods
function formatRegistrationNumber() {
  formData.registrationNumber = formData.registrationNumber.toUpperCase()
}

function handleAircraftTypeChange(typeCode) {
  const selectedType = aircraftTypes.value.find(type => type.code === typeCode)

  if (selectedType) {
    // Auto-fill manufacturer and model
    formData.manufacturer = selectedType.manufacturer
    formData.model = selectedType.name

    // Auto-fill default specifications if not already set
    const specs = selectedType.defaultSpecs
    if (!formData.seatCount) formData.seatCount = specs.seatCount
    if (!formData.maxRange) formData.maxRange = specs.maxRange
    if (!formData.maxSpeed) formData.maxSpeed = specs.maxSpeed
    if (!formData.fuelCapacity) formData.fuelCapacity = specs.fuelCapacity
    if (!formData.maxAltitude) formData.maxAltitude = specs.maxAltitude
    if (!formData.engineType) formData.engineType = specs.engineType

    // Lock manufacturer and model fields
    manufacturerLocked.value = true
    modelLocked.value = true
  } else {
    manufacturerLocked.value = false
    modelLocked.value = false
  }
}

// Date validation functions
function disabledManufacturingDate(time) {
  const today = new Date()
  const fiftyYearsAgo = new Date(today.getFullYear() - 50, today.getMonth(), today.getDate())
  return time > today || time < fiftyYearsAgo
}

function disabledFirstFlightDate(time) {
  const today = new Date()
  const manufacturingDate = formData.manufacturingDate ? new Date(formData.manufacturingDate) : null

  if (manufacturingDate) {
    return time > today || time < manufacturingDate
  }

  return time > today
}

function disabledServiceDate(time) {
  const today = new Date()
  const firstFlightDate = formData.firstFlightDate ? new Date(formData.firstFlightDate) : null

  if (firstFlightDate) {
    return time > today || time < firstFlightDate
  }

  return time > today
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
  manufacturerLocked.value = false
  modelLocked.value = false
  emit('reset')
}

// Watch for prop changes
watch(
  () => props.modelValue,
  (newValue) => {
    Object.assign(formData, newValue)

    // Check if aircraft type is set to enable/disable locks
    if (newValue.aircraftType) {
      const selectedType = aircraftTypes.value.find(type => type.code === newValue.aircraftType)
      if (selectedType) {
        manufacturerLocked.value = true
        modelLocked.value = true
      }
    }
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
  // Load airlines
  try {
    airlinesLoading.value = true
    await referenceStore.fetchAirlines()
  } catch (error) {
    console.error('Failed to load airlines:', error)
    ElMessage.error('Havayolları yüklenirken hata oluştu')
  } finally {
    airlinesLoading.value = false
  }

  // Check if editing mode and aircraft type is set
  if (props.isEditing && formData.aircraftType) {
    const selectedType = aircraftTypes.value.find(type => type.code === formData.aircraftType)
    if (selectedType) {
      manufacturerLocked.value = true
      modelLocked.value = true
    }
  }

  // Focus first input
  setTimeout(() => {
    const firstInput = document.querySelector('.aircraft-form input')
    if (firstInput) {
      firstInput.focus()
    }
  }, 100)
})
</script>

<style scoped lang="scss">
.aircraft-form {
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

  .airline-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .airline-code {
      font-weight: 600;
      color: #409eff;
      min-width: 40px;
    }
  }

  .aircraft-type-option {
    .type-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;

      .type-code {
        font-weight: 600;
        color: #409eff;
      }

      .type-manufacturer {
        font-size: 0.875rem;
        color: #909399;
      }
    }

    .type-name {
      font-size: 0.875rem;
      color: #606266;
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
  .aircraft-form {
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

// Date picker styling
:deep(.el-date-editor) {
  width: 100%;
}

// Disabled input styling
:deep(.el-input.is-disabled .el-input__wrapper) {
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  color: #c0c4cc;
  cursor: not-allowed;
}

// Select dropdown styling
:deep(.el-select-dropdown__item) {
  padding: 12px 20px;
  line-height: 1.4;
}
</style>

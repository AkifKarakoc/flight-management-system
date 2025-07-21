<template>
  <div class="flight-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="140px"
      label-position="left"
      class="form-container"
      @submit.prevent="handleSubmit"
    >
      <!-- Basic Flight Information -->
      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Position /></el-icon>
            <span>Uçuş Bilgileri</span>
          </div>
        </template>

        <div class="form-grid">
          <!-- Flight Number -->
          <el-form-item label="Uçuş Numarası" prop="flightNumber">
            <el-input
              v-model="formData.flightNumber"
              placeholder="Örn: TK101"
              maxlength="10"
              show-word-limit
              :disabled="submitting"
              @input="formatFlightNumber"
            >
              <template #prefix>
                <el-icon><Position /></el-icon>
              </template>
            </el-input>
            <div class="help-text">Havayolu kodu + rakam (örn: TK101)</div>
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
              @change="handleAirlineChange"
            >
              <el-option
                v-for="airline in airlines"
                :key="airline.id"
                :label="airline.name"
                :value="airline.id"
              >
                <span class="airline-option">
                  <span class="airline-code">{{ airline.iataCode }}</span>
                  <span>{{ airline.name }}</span>
                </span>
              </el-option>
            </el-select>
          </el-form-item>

          <!-- Aircraft -->
          <el-form-item label="Uçak" prop="aircraftId">
            <el-select
              v-model="formData.aircraftId"
              placeholder="Uçak seçin"
              filterable
              :disabled="submitting || !formData.airlineId"
              :loading="aircraftsLoading"
              class="full-width"
              @change="handleAircraftChange"
            >
              <el-option
                v-for="aircraft in availableAircrafts"
                :key="aircraft.id"
                :label="`${aircraft.registrationNumber} - ${aircraft.aircraftType}`"
                :value="aircraft.id"
              >
                <span class="aircraft-option">
                  <span class="aircraft-reg">{{ aircraft.registrationNumber }}</span>
                  <span class="aircraft-type">{{ aircraft.aircraftType }}</span>
                  <span class="aircraft-capacity">{{ aircraft.capacity }} kişi</span>
                </span>
              </el-option>
            </el-select>
            <div v-if="!formData.airlineId" class="help-text">Önce havayolu seçin</div>
          </el-form-item>

          <!-- Flight Type -->
          <el-form-item label="Uçuş Tipi" prop="type">
            <el-select
              v-model="formData.type"
              placeholder="Uçuş tipi seçin"
              :disabled="submitting"
              class="full-width"
              @change="handleTypeChange"
            >
              <el-option
                v-for="type in flightTypes"
                :key="type.value"
                :label="type.label"
                :value="type.value"
              >
                <el-tag :type="type.tagType" size="small">
                  {{ type.label }}
                </el-tag>
              </el-option>
            </el-select>
          </el-form-item>
        </div>
      </el-card>

      <!-- Route Information -->
      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Connection /></el-icon>
            <span>Rota Bilgileri</span>
          </div>
        </template>

        <div class="form-grid">
          <!-- Origin Airport -->
          <el-form-item label="Kalkış Havaalanı" prop="originAirportId">
            <el-select
              v-model="formData.originAirportId"
              placeholder="Kalkış havaalanı seçin"
              filterable
              :disabled="submitting"
              :loading="airportsLoading"
              class="full-width"
              @change="handleOriginChange"
            >
              <el-option
                v-for="airport in airports"
                :key="airport.id"
                :label="`${airport.iataCode} - ${airport.name}`"
                :value="airport.id"
              >
                <span class="airport-option">
                  <span class="airport-code">{{ airport.iataCode }}</span>
                  <span class="airport-name">{{ airport.name }}</span>
                  <span class="airport-city">{{ airport.city }}</span>
                </span>
              </el-option>
            </el-select>
          </el-form-item>

          <!-- Destination Airport -->
          <el-form-item label="Varış Havaalanı" prop="destinationAirportId">
            <el-select
              v-model="formData.destinationAirportId"
              placeholder="Varış havaalanı seçin"
              filterable
              :disabled="submitting"
              :loading="airportsLoading"
              class="full-width"
              @change="handleDestinationChange"
            >
              <el-option
                v-for="airport in airports"
                :key="airport.id"
                :label="`${airport.iataCode} - ${airport.name}`"
                :value="airport.id"
                :disabled="airport.id === formData.originAirportId"
              >
                <span class="airport-option">
                  <span class="airport-code">{{ airport.iataCode }}</span>
                  <span class="airport-name">{{ airport.name }}</span>
                  <span class="airport-city">{{ airport.city }}</span>
                </span>
              </el-option>
            </el-select>
          </el-form-item>

          <!-- Route Info Display -->
          <div v-if="routeInfo" class="form-item-full route-info">
            <el-alert
              :title="`Mesafe: ${routeInfo.distance} km | Tahmini Süre: ${routeInfo.duration} saat`"
              type="info"
              :closable="false"
              show-icon
            />
          </div>
        </div>
      </el-card>

      <!-- Schedule Information -->
      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Clock /></el-icon>
            <span>Zaman Bilgileri</span>
          </div>
        </template>

        <div class="form-grid">
          <!-- Flight Date -->
          <el-form-item label="Uçuş Tarihi" prop="flightDate">
            <el-date-picker
              v-model="formData.flightDate"
              type="date"
              placeholder="Tarih seçin"
              format="DD.MM.YYYY"
              value-format="YYYY-MM-DD"
              :disabled="submitting"
              :disabled-date="disabledDate"
              class="full-width"
              @change="handleDateChange"
            />
          </el-form-item>

          <!-- Scheduled Departure -->
          <el-form-item label="Planlanan Kalkış" prop="scheduledDeparture">
            <el-date-picker
              v-model="formData.scheduledDeparture"
              type="datetime"
              placeholder="Kalkış zamanı"
              format="DD.MM.YYYY HH:mm"
              value-format="YYYY-MM-DD HH:mm"
              :disabled="submitting"
              :disabled-date="disabledDate"
              class="full-width"
              @change="handleDepartureChange"
            />
          </el-form-item>

          <!-- Scheduled Arrival -->
          <el-form-item label="Planlanan Varış" prop="scheduledArrival">
            <el-date-picker
              v-model="formData.scheduledArrival"
              type="datetime"
              placeholder="Varış zamanı"
              format="DD.MM.YYYY HH:mm"
              value-format="YYYY-MM-DD HH:mm"
              :disabled="submitting || !formData.scheduledDeparture"
              class="full-width"
            />
          </el-form-item>

          <!-- Auto Calculate Duration -->
          <el-form-item class="form-item-full">
            <el-checkbox
              v-model="autoCalculateDuration"
              :disabled="submitting"
            >
              Varış zamanını otomatik hesapla
            </el-checkbox>
          </el-form-item>
        </div>
      </el-card>

      <!-- Capacity Information -->
      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><User /></el-icon>
            <span>Kapasite Bilgileri</span>
          </div>
        </template>

        <div class="form-grid">
          <!-- Passenger Count -->
          <el-form-item
            v-if="formData.type === 'PASSENGER' || formData.type === 'DOMESTIC' || formData.type === 'INTERNATIONAL'"
            label="Yolcu Sayısı"
            prop="passengerCount"
          >
            <el-input-number
              v-model="formData.passengerCount"
              :min="0"
              :max="maxPassengerCount"
              :disabled="submitting"
              placeholder="Yolcu sayısı"
              class="full-width"
            />
            <div v-if="maxPassengerCount" class="help-text">
              Maksimum: {{ maxPassengerCount }} yolcu
            </div>
          </el-form-item>

          <!-- Cargo Weight -->
          <el-form-item
            v-if="formData.type === 'CARGO'"
            label="Kargo Ağırlığı (kg)"
            prop="cargoWeight"
          >
            <el-input-number
              v-model="formData.cargoWeight"
              :min="0"
              :max="maxCargoWeight"
              :disabled="submitting"
              placeholder="Kargo ağırlığı"
              class="full-width"
            />
            <div v-if="maxCargoWeight" class="help-text">
              Maksimum: {{ maxCargoWeight }} kg
            </div>
          </el-form-item>
        </div>
      </el-card>

      <!-- Additional Information -->
      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Document /></el-icon>
            <span>Ek Bilgiler</span>
          </div>
        </template>

        <div class="form-grid">
          <!-- Notes -->
          <el-form-item label="Notlar" class="form-item-full">
            <el-input
              v-model="formData.notes"
              type="textarea"
              :rows="3"
              placeholder="Uçuş ile ilgili notlar..."
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
          Temizle
        </el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="submitting"
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
  Position,
  Connection,
  Clock,
  User,
  Document
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
const aircraftsLoading = ref(false)
const airportsLoading = ref(false)
const autoCalculateDuration = ref(true)

// Form data
const formData = reactive({
  flightNumber: '',
  airlineId: null,
  aircraftId: null,
  originAirportId: null,
  destinationAirportId: null,
  flightDate: '',
  scheduledDeparture: '',
  scheduledArrival: '',
  type: 'PASSENGER',
  passengerCount: null,
  cargoWeight: null,
  notes: '',
  ...props.modelValue
})

// Flight types
const flightTypes = ref([
  { value: 'PASSENGER', label: 'Yolcu Uçuşu', tagType: 'primary' },
  { value: 'CARGO', label: 'Kargo Uçuşu', tagType: 'warning' },
  { value: 'DOMESTIC', label: 'İç Hat', tagType: 'success' },
  { value: 'INTERNATIONAL', label: 'Dış Hat', tagType: 'info' }
])

// Computed
const airlines = computed(() => referenceStore.airlines)
const airports = computed(() => referenceStore.airports)
const aircrafts = computed(() => referenceStore.aircrafts)

const availableAircrafts = computed(() => {
  if (!formData.airlineId) return []
  return aircrafts.value.filter(aircraft =>
    aircraft.airlineId === formData.airlineId && aircraft.active
  )
})

const selectedAircraft = computed(() => {
  return availableAircrafts.value.find(aircraft => aircraft.id === formData.aircraftId)
})

const maxPassengerCount = computed(() => {
  return selectedAircraft.value?.capacity || null
})

const maxCargoWeight = computed(() => {
  return selectedAircraft.value?.maxCargoWeight || 50000 // Default max cargo
})

const routeInfo = computed(() => {
  if (!formData.originAirportId || !formData.destinationAirportId) return null

  const origin = airports.value.find(a => a.id === formData.originAirportId)
  const destination = airports.value.find(a => a.id === formData.destinationAirportId)

  if (!origin || !destination) return null

  // Calculate distance (simplified)
  const distance = calculateDistance(origin, destination)
  const duration = Math.round(distance / 800 * 10) / 10 // Estimate: 800 km/h average speed

  return { distance, duration }
})

// Form validation rules
const formRules = {
  flightNumber: [
    { required: true, message: 'Uçuş numarası gereklidir', trigger: 'blur' },
    { min: 3, max: 10, message: '3-10 karakter arasında olmalıdır', trigger: 'blur' },
    { pattern: /^[A-Z]{2,3}[0-9]{1,4}$/, message: 'Geçerli format: TK101', trigger: 'blur' }
  ],
  airlineId: [
    { required: true, message: 'Havayolu seçimi gereklidir', trigger: 'change' }
  ],
  aircraftId: [
    { required: true, message: 'Uçak seçimi gereklidir', trigger: 'change' }
  ],
  originAirportId: [
    { required: true, message: 'Kalkış havaalanı seçimi gereklidir', trigger: 'change' }
  ],
  destinationAirportId: [
    { required: true, message: 'Varış havaalanı seçimi gereklidir', trigger: 'change' }
  ],
  flightDate: [
    { required: true, message: 'Uçuş tarihi gereklidir', trigger: 'change' }
  ],
  scheduledDeparture: [
    { required: true, message: 'Kalkış zamanı gereklidir', trigger: 'change' }
  ],
  scheduledArrival: [
    { required: true, message: 'Varış zamanı gereklidir', trigger: 'change' }
  ],
  type: [
    { required: true, message: 'Uçuş tipi seçimi gereklidir', trigger: 'change' }
  ],
  passengerCount: [
    {
      validator: (rule, value, callback) => {
        if (['PASSENGER', 'DOMESTIC', 'INTERNATIONAL'].includes(formData.type)) {
          if (!value || value <= 0) {
            callback(new Error('Yolcu sayısı gereklidir'))
          } else if (maxPassengerCount.value && value > maxPassengerCount.value) {
            callback(new Error(`Maksimum ${maxPassengerCount.value} yolcu`))
          }
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  cargoWeight: [
    {
      validator: (rule, value, callback) => {
        if (formData.type === 'CARGO') {
          if (!value || value <= 0) {
            callback(new Error('Kargo ağırlığı gereklidir'))
          } else if (maxCargoWeight.value && value > maxCargoWeight.value) {
            callback(new Error(`Maksimum ${maxCargoWeight.value} kg`))
          }
        }
        callback()
      },
      trigger: 'blur'
    }
  ]
}

// Methods
function formatFlightNumber() {
  formData.flightNumber = formData.flightNumber.toUpperCase()
}

function handleAirlineChange() {
  // Reset aircraft when airline changes
  formData.aircraftId = null
}

function handleAircraftChange() {
  // Auto-set passenger count to aircraft capacity
  if (selectedAircraft.value && ['PASSENGER', 'DOMESTIC', 'INTERNATIONAL'].includes(formData.type)) {
    formData.passengerCount = selectedAircraft.value.capacity
  }
}

function handleTypeChange() {
  // Reset capacity values when type changes
  formData.passengerCount = null
  formData.cargoWeight = null

  // Auto-set values based on aircraft
  if (selectedAircraft.value) {
    if (['PASSENGER', 'DOMESTIC', 'INTERNATIONAL'].includes(formData.type)) {
      formData.passengerCount = selectedAircraft.value.capacity
    }
  }
}

function handleOriginChange() {
  calculateArrivalTime()
}

function handleDestinationChange() {
  calculateArrivalTime()
}

function handleDateChange() {
  // Update departure time if date changes
  if (formData.scheduledDeparture) {
    const departureTime = dayjs(formData.scheduledDeparture).format('HH:mm')
    formData.scheduledDeparture = `${formData.flightDate} ${departureTime}`
    calculateArrivalTime()
  }
}

function handleDepartureChange() {
  calculateArrivalTime()
}

function calculateArrivalTime() {
  if (!autoCalculateDuration.value || !formData.scheduledDeparture || !routeInfo.value) return

  const departure = dayjs(formData.scheduledDeparture)
  const arrival = departure.add(routeInfo.value.duration * 60, 'minute')
  formData.scheduledArrival = arrival.format('YYYY-MM-DD HH:mm')
}

function calculateDistance(origin, destination) {
  // Simplified distance calculation using Haversine formula
  const R = 6371 // Earth's radius in km
  const dLat = (destination.latitude - origin.latitude) * Math.PI / 180
  const dLon = (destination.longitude - origin.longitude) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(origin.latitude * Math.PI / 180) * Math.cos(destination.latitude * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return Math.round(R * c)
}

function disabledDate(time) {
  // Disable past dates for new flights
  if (!props.isEditing) {
    return time.getTime() < Date.now() - 24 * 60 * 60 * 1000
  }
  return false
}

async function handleSubmit() {
  if (!formRef.value) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    // Validate departure before arrival
    if (dayjs(formData.scheduledArrival).isBefore(formData.scheduledDeparture)) {
      ElMessage.error('Varış zamanı kalkış zamanından önce olamaz')
      return
    }

    emit('update:modelValue', formData)
    emit('submit', formData)

  } catch (error) {
    console.error('Form validation failed:', error)
  }
}

function handleCancel() {
  emit('cancel')
}

function handleReset() {
  formRef.value?.resetFields()
  Object.assign(formData, {
    flightNumber: '',
    airlineId: null,
    aircraftId: null,
    originAirportId: null,
    destinationAirportId: null,
    flightDate: '',
    scheduledDeparture: '',
    scheduledArrival: '',
    type: 'PASSENGER',
    passengerCount: null,
    cargoWeight: null,
    notes: ''
  })
  emit('reset')
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  Object.assign(formData, newValue)
}, { deep: true })

watch(() => autoCalculateDuration.value, (enabled) => {
  if (enabled) {
    calculateArrivalTime()
  }
})

// Lifecycle
onMounted(async () => {
  // Load reference data
  await Promise.all([
    loadAirlines(),
    loadAirports(),
    loadAircrafts()
  ])
})

async function loadAirlines() {
  if (airlines.value.length === 0) {
    airlinesLoading.value = true
    try {
      await referenceStore.fetchAirlines()
    } finally {
      airlinesLoading.value = false
    }
  }
}

async function loadAirports() {
  if (airports.value.length === 0) {
    airportsLoading.value = true
    try {
      await referenceStore.fetchAirports()
    } finally {
      airportsLoading.value = false
    }
  }
}

async function loadAircrafts() {
  if (aircrafts.value.length === 0) {
    aircraftsLoading.value = true
    try {
      await referenceStore.fetchAircrafts()
    } finally {
      aircraftsLoading.value = false
    }
  }
}
</script>

<style scoped lang="scss">
.flight-form {
  .form-container {
    max-width: 100%;
  }

  .form-card {
    margin-bottom: 2rem;
    border: 1px solid #ebeef5;

    &:last-child {
      margin-bottom: 0;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: #303133;
    }
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    align-items: start;

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

  .aircraft-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .aircraft-reg {
      font-weight: 600;
      color: #67c23a;
      min-width: 80px;
    }

    .aircraft-type {
      flex: 1;
      color: #606266;
    }

    .aircraft-capacity {
      font-size: 0.875rem;
      color: #909399;
    }
  }

  .airport-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .airport-code {
      font-weight: 600;
      color: #409eff;
      min-width: 40px;
    }

    .airport-name {
      flex: 1;
      color: #606266;
    }

    .airport-city {
      font-size: 0.875rem;
      color: #909399;
    }
  }

  .route-info {
    margin-top: 1rem;
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
  .flight-form {
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

// Input styling
:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-date-editor) {
  width: 100%;
}

:deep(.el-textarea .el-textarea__inner) {
  resize: vertical;
  min-height: 80px;
}
</style>

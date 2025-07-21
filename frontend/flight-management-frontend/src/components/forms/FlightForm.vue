<template>
  <div class="flight-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="140px"
      size="default"
      @submit.prevent="handleSubmit"
    >
      <el-row :gutter="24">
        <!-- Sol Kolon - Uçuş ve Rota Bilgileri -->
        <el-col :xs="24" :lg="12">
          <el-card shadow="never" class="form-card">
            <template #header>
              <div class="card-header">
                <el-icon><Position /></el-icon>
                <span>Uçuş Bilgileri</span>
              </div>
            </template>

            <el-form-item label="Uçuş Numarası" prop="flightNumber">
              <el-input
                v-model="formData.flightNumber"
                placeholder="Örn: TK1234"
                :disabled="isEditing"
                maxlength="10"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="Havayolu" prop="airlineId">
              <el-select
                v-model="formData.airlineId"
                placeholder="Havayolu seçiniz"
                filterable
                loading-text="Yükleniyor..."
                no-data-text="Havayolu bulunamadı"
                style="width: 100%"
              >
                <el-option
                  v-for="airline in airlines"
                  :key="airline.id"
                  :label="`${airline.code} - ${airline.name}`"
                  :value="airline.id"
                >
                  <span style="float: left">{{ airline.code }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">
                    {{ airline.name }}
                  </span>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="Uçak" prop="aircraftId">
              <el-select
                v-model="formData.aircraftId"
                placeholder="Uçak seçiniz"
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="aircraft in aircrafts"
                  :key="aircraft.id"
                  :label="`${aircraft.registration} - ${aircraft.model}`"
                  :value="aircraft.id"
                >
                  <span style="float: left">{{ aircraft.registration }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">
                    {{ aircraft.model }}
                  </span>
                </el-option>
              </el-select>
            </el-form-item>

            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="Kalkış" prop="originAirportId">
                  <el-select
                    v-model="formData.originAirportId"
                    placeholder="Kalkış havaalanı"
                    filterable
                    style="width: 100%"
                  >
                    <el-option
                      v-for="airport in airports"
                      :key="airport.id"
                      :label="`${airport.code} - ${airport.name}`"
                      :value="airport.id"
                    >
                      <span style="float: left">{{ airport.code }}</span>
                      <span style="float: right; color: #8492a6; font-size: 13px">
                        {{ airport.city }}
                      </span>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Varış" prop="destinationAirportId">
                  <el-select
                    v-model="formData.destinationAirportId"
                    placeholder="Varış havaalanı"
                    filterable
                    style="width: 100%"
                  >
                    <el-option
                      v-for="airport in filteredDestinations"
                      :key="airport.id"
                      :label="`${airport.code} - ${airport.name}`"
                      :value="airport.id"
                    >
                      <span style="float: left">{{ airport.code }}</span>
                      <span style="float: right; color: #8492a6; font-size: 13px">
                        {{ airport.city }}
                      </span>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-card>
        </el-col>

        <!-- Sağ Kolon - Zaman ve Uçuş Türü Bilgileri -->
        <el-col :xs="24" :lg="12">
          <el-card shadow="never" class="form-card">
            <template #header>
              <div class="card-header">
                <el-icon><Clock /></el-icon>
                <span>Zaman & Tür Bilgileri</span>
              </div>
            </template>

            <el-form-item label="Uçuş Tarihi" prop="flightDate">
              <el-date-picker
                v-model="formData.flightDate"
                type="date"
                placeholder="Uçuş tarihini seçiniz"
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                :disabled-date="disabledDate"
              />
            </el-form-item>

            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="Kalkış Saati" prop="scheduledDeparture">
                  <el-time-picker
                    v-model="formData.scheduledDeparture"
                    placeholder="Kalkış saati"
                    format="HH:mm"
                    value-format="HH:mm"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Varış Saati" prop="scheduledArrival">
                  <el-time-picker
                    v-model="formData.scheduledArrival"
                    placeholder="Varış saati"
                    format="HH:mm"
                    value-format="HH:mm"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="Uçuş Türü" prop="type">
              <el-radio-group v-model="formData.type">
                <el-radio label="DOMESTIC">İç Hat</el-radio>
                <el-radio label="INTERNATIONAL">Dış Hat</el-radio>
                <el-radio label="CARGO">Kargo</el-radio>
                <el-radio label="CHARTER">Özel</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="Yolcu Sayısı" prop="passengerCount">
                  <el-input-number
                    v-model="formData.passengerCount"
                    :min="0"
                    :max="getMaxPassengerCount()"
                    placeholder="Yolcu sayısı"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Kargo Ağırlığı (kg)" prop="cargoWeight">
                  <el-input-number
                    v-model="formData.cargoWeight"
                    :min="0"
                    :step="0.1"
                    :precision="1"
                    placeholder="Kargo ağırlığı"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-card>
        </el-col>
      </el-row>

      <!-- Notlar -->
      <el-row>
        <el-col :span="24">
          <el-card shadow="never" class="form-card">
            <template #header>
              <div class="card-header">
                <el-icon><Document /></el-icon>
                <span>Ek Bilgiler</span>
              </div>
            </template>

            <el-form-item label="Notlar" prop="notes">
              <el-input
                v-model="formData.notes"
                type="textarea"
                :rows="3"
                placeholder="Uçuş ile ilgili ek notlar..."
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-card>
        </el-col>
      </el-row>

      <!-- Form Actions -->
      <div class="form-actions">
        <el-button @click="handleCancel" :disabled="submitting">
          İptal
        </el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEditing ? 'Güncelle' : 'Kaydet' }}
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Position, Clock, Document } from '@element-plus/icons-vue'

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

const emit = defineEmits(['update:modelValue', 'submit', 'cancel'])

const router = useRouter()
const formRef = ref(null)

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
  type: 'DOMESTIC',
  passengerCount: 0,
  cargoWeight: 0,
  notes: '',
  ...props.modelValue
})

// Reference data
const airlines = ref([])
const aircrafts = ref([])
const airports = ref([])

// Computed properties
const filteredDestinations = computed(() => {
  return airports.value.filter(airport => airport.id !== formData.originAirportId)
})

// Form validation rules
const formRules = {
  flightNumber: [
    { required: true, message: 'Uçuş numarası gereklidir', trigger: 'blur' },
    { pattern: /^[A-Z]{2}\d{3,4}$/, message: 'Geçerli format: TK1234', trigger: 'blur' }
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
    { required: true, message: 'Varış havaalanı seçimi gereklidir', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (value === formData.originAirportId) {
          callback(new Error('Varış havaalanı kalkış havaalanından farklı olmalıdır'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  flightDate: [
    { required: true, message: 'Uçuş tarihi gereklidir', trigger: 'change' }
  ],
  scheduledDeparture: [
    { required: true, message: 'Kalkış saati gereklidir', trigger: 'change' }
  ],
  scheduledArrival: [
    { required: true, message: 'Varış saati gereklidir', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (value && formData.scheduledDeparture && value <= formData.scheduledDeparture) {
          callback(new Error('Varış saati kalkış saatinden sonra olmalıdır'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  type: [
    { required: true, message: 'Uçuş türü seçimi gereklidir', trigger: 'change' }
  ],
  passengerCount: [
    { type: 'number', min: 0, message: 'Yolcu sayısı 0 veya daha büyük olmalıdır', trigger: 'change' }
  ],
  cargoWeight: [
    { type: 'number', min: 0, message: 'Kargo ağırlığı 0 veya daha büyük olmalıdır', trigger: 'change' }
  ]
}

// Methods
const disabledDate = (time) => {
  // Disable past dates
  return time.getTime() < Date.now() - 8.64e7
}

const getMaxPassengerCount = () => {
  const selectedAircraft = aircrafts.value.find(a => a.id === formData.aircraftId)
  return selectedAircraft?.passengerCapacity || 300
}

const handleSubmit = async () => {
  try {
    const valid = await formRef.value.validate()
    if (valid) {
      emit('submit', { ...formData })
    }
  } catch (error) {
    console.error('Form validation failed:', error)
  }
}

const handleCancel = () => {
  emit('cancel')
}

const loadReferenceData = async () => {
  try {
    // Load airlines
    airlines.value = [
      { id: 1, code: 'TK', name: 'Turkish Airlines' },
      { id: 2, code: 'PC', name: 'Pegasus Airlines' },
      { id: 3, code: 'XQ', name: 'SunExpress' },
      { id: 4, code: 'VF', name: 'FlyBosnia' }
    ]

    // Load aircrafts
    aircrafts.value = [
      { id: 1, registration: 'TC-JRO', model: 'Boeing 737-800', passengerCapacity: 189 },
      { id: 2, registration: 'TC-NBJ', model: 'Airbus A320', passengerCapacity: 180 },
      { id: 3, registration: 'TC-SNJ', model: 'Boeing 777-300ER', passengerCapacity: 349 },
      { id: 4, registration: 'TC-LSA', model: 'Airbus A330-300', passengerCapacity: 289 }
    ]

    // Load airports
    airports.value = [
      { id: 1, code: 'IST', name: 'İstanbul Havalimanı', city: 'İstanbul' },
      { id: 2, code: 'SAW', name: 'Sabiha Gökçen Havalimanı', city: 'İstanbul' },
      { id: 3, code: 'ESB', name: 'Esenboğa Havalimanı', city: 'Ankara' },
      { id: 4, code: 'ADB', name: 'Adnan Menderes Havalimanı', city: 'İzmir' },
      { id: 5, code: 'AYT', name: 'Antalya Havalimanı', city: 'Antalya' },
      { id: 6, code: 'TZX', name: 'Trabzon Havalimanı', city: 'Trabzon' }
    ]
  } catch (error) {
    console.error('Error loading reference data:', error)
    ElMessage.error('Referans veriler yüklenirken hata oluştu')
  }
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  Object.assign(formData, newValue)
}, { deep: true })

watch(formData, (newValue) => {
  emit('update:modelValue', newValue)
}, { deep: true })

// Watch origin airport change to clear destination if same
watch(() => formData.originAirportId, (newOrigin) => {
  if (newOrigin === formData.destinationAirportId) {
    formData.destinationAirportId = null
  }
})

// Lifecycle
onMounted(() => {
  loadReferenceData()
})

// Expose form methods
defineExpose({
  validate: () => formRef.value?.validate(),
  resetFields: () => formRef.value?.resetFields(),
  clearValidate: () => formRef.value?.clearValidate()
})
</script>

<style scoped>
.flight-form {
  max-width: 1200px;
  margin: 0 auto;
}

.form-card {
  margin-bottom: 24px;
  border: 1px solid #ebeef5;
}

.form-card :deep(.el-card__header) {
  background: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
  padding: 16px 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.form-card :deep(.el-card__body) {
  padding: 24px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px 0;
  border-top: 1px solid #ebeef5;
  margin-top: 24px;
}

.flight-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.flight-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

.flight-form :deep(.el-input__wrapper) {
  border-radius: 6px;
}

.flight-form :deep(.el-select) {
  width: 100%;
}

.flight-form :deep(.el-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

@media (max-width: 768px) {
  .flight-form {
    padding: 0 16px;
  }

  .form-card :deep(.el-card__body) {
    padding: 16px;
  }

  .flight-form :deep(.el-radio-group) {
    flex-direction: column;
    gap: 8px;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>

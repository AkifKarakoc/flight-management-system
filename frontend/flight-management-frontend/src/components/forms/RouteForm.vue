<template>
  <div class="route-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="140px"
      label-position="left"
      class="form-container"
      @submit.prevent="handleSubmit"
    >
      <!-- Route Information -->
      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Connection /></el-icon>
            <span>Rota Bilgileri</span>
          </div>
        </template>

        <div class="form-grid">
          <!-- Route Code -->
          <el-form-item label="Rota Kodu" prop="routeCode" class="form-item-full">
            <el-input
              v-model="formData.routeCode"
              placeholder="Örn: IST-ADB, SAW-ESB"
              maxlength="20"
              show-word-limit
              :disabled="submitting"
              @input="formatRouteCode"
            >
              <template #prefix>
                <el-icon><Document /></el-icon>
              </template>
            </el-input>
            <div class="help-text">Kalkış-Varış havaalanı kodları</div>
          </el-form-item>

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
                v-for="airport in availableOriginAirports"
                :key="airport.id"
                :label="`${airport.iataCode} - ${airport.name}`"
                :value="airport.id"
              >
                <div class="airport-option">
                  <div class="airport-codes">
                    <span class="iata-code">{{ airport.iataCode }}</span>
                    <span class="icao-code">{{ airport.icaoCode }}</span>
                  </div>
                  <div class="airport-details">
                    <div class="airport-name">{{ airport.name }}</div>
                    <div class="airport-location">{{ airport.city }}, {{ getCountryName(airport.country) }}</div>
                  </div>
                </div>
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
                v-for="airport in availableDestinationAirports"
                :key="airport.id"
                :label="`${airport.iataCode} - ${airport.name}`"
                :value="airport.id"
              >
                <div class="airport-option">
                  <div class="airport-codes">
                    <span class="iata-code">{{ airport.iataCode }}</span>
                    <span class="icao-code">{{ airport.icaoCode }}</span>
                  </div>
                  <div class="airport-details">
                    <div class="airport-name">{{ airport.name }}</div>
                    <div class="airport-location">{{ airport.city }}, {{ getCountryName(airport.country) }}</div>
                  </div>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <!-- Route Type -->
          <el-form-item label="Rota Tipi" prop="routeType">
            <el-select
              v-model="formData.routeType"
              placeholder="Rota tipi seçin"
              :disabled="submitting"
              class="full-width"
            >
              <el-option label="İç Hat" value="DOMESTIC" />
              <el-option label="Uluslararası" value="INTERNATIONAL" />
              <el-option label="Kıta İçi" value="CONTINENTAL" />
              <el-option label="Kıtalar Arası" value="INTERCONTINENTAL" />
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

      <!-- Distance and Duration -->
      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Odometer /></el-icon>
            <span>Mesafe ve Süre</span>
          </div>
        </template>

        <div class="form-grid">
          <!-- Distance -->
          <el-form-item label="Mesafe (km)" prop="distance">
            <el-input-number
              v-model="formData.distance"
              :min="1"
              :max="20000"
              :precision="0"
              placeholder="1500"
              :disabled="submitting || distanceCalculated"
              class="full-width"
            />
            <div class="help-text" v-if="distanceCalculated">
              Otomatik hesaplanmış mesafe
            </div>
          </el-form-item>

          <!-- Estimated Flight Time -->
          <el-form-item label="Tahmini Uçuş Süresi" prop="estimatedFlightTime">
            <el-time-picker
              v-model="formData.estimatedFlightTime"
              placeholder="Uçuş süresi seçin"
              format="HH:mm"
              value-format="HH:mm"
              :disabled="submitting || durationCalculated"
              class="full-width"
            />
            <div class="help-text" v-if="durationCalculated">
              Otomatik hesaplanmış süre
            </div>
          </el-form-item>

          <!-- Calculate Button -->
          <el-form-item class="form-item-full" v-if="canCalculateDistance">
            <el-button
              type="primary"
              :icon="Promotion"
              @click="calculateRouteMetrics"
              :loading="calculating"
              :disabled="submitting"
            >
              Mesafe ve Süre Hesapla
            </el-button>
          </el-form-item>
        </div>
      </el-card>

      <!-- Airlines Operating This Route -->
      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Ship /></el-icon>
            <span>Bu Rotayı İşleten Havayolları</span>
          </div>
        </template>

        <div class="form-grid">
          <!-- Operating Airlines -->
          <el-form-item label="Havayolları" prop="operatingAirlines" class="form-item-full">
            <el-select
              v-model="formData.operatingAirlines"
              multiple
              filterable
              placeholder="Bu rotayı işleten havayollarını seçin"
              :disabled="submitting"
              :loading="airlinesLoading"
              class="full-width"
            >
              <el-option
                v-for="airline in airlines"
                :key="airline.id"
                :label="`${airline.code} - ${airline.name}`"
                :value="airline.id"
              >
                <div class="airline-option">
                  <span class="airline-code">{{ airline.code }}</span>
                  <span class="airline-name">{{ airline.name }}</span>
                  <span class="airline-country">{{ getCountryName(airline.country) }}</span>
                </div>
              </el-option>
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
          <!-- Popular Route -->
          <el-form-item label="Popüler Rota" prop="popularRoute">
            <el-switch
              v-model="formData.popularRoute"
              active-text="Evet"
              inactive-text="Hayır"
              :disabled="submitting"
            />
            <div class="help-text">Yoğun trafiğe sahip rotalar</div>
          </el-form-item>

          <!-- Seasonal Route -->
          <el-form-item label="Sezonluk Rota" prop="seasonalRoute">
            <el-switch
              v-model="formData.seasonalRoute"
              active-text="Evet"
              inactive-text="Hayır"
              :disabled="submitting"
            />
            <div class="help-text">Sadece belirli sezonlarda işletilen rotalar</div>
          </el-form-item>

          <!-- Season (if seasonal) -->
          <el-form-item
            label="Sezon"
            prop="season"
            v-if="formData.seasonalRoute"
            class="form-item-full"
          >
            <el-checkbox-group v-model="formData.season" :disabled="submitting">
              <el-checkbox label="SPRING">İlkbahar</el-checkbox>
              <el-checkbox label="SUMMER">Yaz</el-checkbox>
              <el-checkbox label="AUTUMN">Sonbahar</el-checkbox>
              <el-checkbox label="WINTER">Kış</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <!-- Notes -->
          <el-form-item label="Notlar" prop="notes" class="form-item-full">
            <el-input
              v-model="formData.notes"
              type="textarea"
              :rows="3"
              placeholder="Rota hakkında ek notlar..."
              maxlength="500"
              show-word-limit
              :disabled="submitting"
            />
          </el-form-item>
        </div>
      </el-card>

      <!-- Route Preview -->
      <el-card class="form-card route-preview" shadow="never" v-if="routePreview">
        <template #header>
          <div class="card-header">
            <el-icon><View /></el-icon>
            <span>Rota Önizleme</span>
          </div>
        </template>

        <div class="preview-content">
          <div class="route-visual">
            <div class="airport origin">
              <div class="airport-code">{{ routePreview.origin.iataCode }}</div>
              <div class="airport-name">{{ routePreview.origin.name }}</div>
              <div class="airport-city">{{ routePreview.origin.city }}</div>
            </div>

            <div class="route-line">
              <div class="plane-icon">✈️</div>
              <div class="route-info">
                <div v-if="formData.distance" class="distance">{{ formData.distance }} km</div>
                <div v-if="formData.estimatedFlightTime" class="duration">{{ formData.estimatedFlightTime }}</div>
              </div>
            </div>

            <div class="airport destination">
              <div class="airport-code">{{ routePreview.destination.iataCode }}</div>
              <div class="airport-name">{{ routePreview.destination.name }}</div>
              <div class="airport-city">{{ routePreview.destination.city }}</div>
            </div>
          </div>
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
  Connection,
  Document,
  Odometer,
  Ship,
  InfoFilled,
  View,
  Promotion
} from '@element-plus/icons-vue'
import { useReferenceStore } from '@/stores/reference.js'

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
const airportsLoading = ref(false)
const airlinesLoading = ref(false)
const calculating = ref(false)
const distanceCalculated = ref(false)
const durationCalculated = ref(false)

// Form data
const formData = reactive({
  routeCode: '',
  originAirportId: null,
  destinationAirportId: null,
  routeType: 'DOMESTIC',
  active: true,
  distance: null,
  estimatedFlightTime: '',
  operatingAirlines: [],
  popularRoute: false,
  seasonalRoute: false,
  season: [],
  notes: '',
  ...props.modelValue
})

// Countries mapping for display
const countries = {
  'TR': 'Türkiye',
  'US': 'ABD',
  'GB': 'İngiltere',
  'DE': 'Almanya',
  'FR': 'Fransa',
  'IT': 'İtalya',
  'ES': 'İspanya',
  'NL': 'Hollanda',
  'AE': 'BAE',
  'QA': 'Katar',
  'JP': 'Japonya',
  'SG': 'Singapur'
}

// Computed
const airports = computed(() => {
  return referenceStore.airports
})

const airlines = computed(() => {
  return referenceStore.airlines
})

const availableOriginAirports = computed(() => {
  return airports.value.filter(airport =>
    airport.id !== formData.destinationAirportId && airport.active
  )
})

const availableDestinationAirports = computed(() => {
  return airports.value.filter(airport =>
    airport.id !== formData.originAirportId && airport.active
  )
})

const canCalculateDistance = computed(() => {
  return formData.originAirportId && formData.destinationAirportId
})

const routePreview = computed(() => {
  if (!formData.originAirportId || !formData.destinationAirportId) return null

  const origin = airports.value.find(a => a.id === formData.originAirportId)
  const destination = airports.value.find(a => a.id === formData.destinationAirportId)

  if (!origin || !destination) return null

  return { origin, destination }
})

// Form validation rules
const formRules = {
  routeCode: [
    { required: true, message: 'Rota kodu gereklidir', trigger: 'blur' },
    { min: 5, max: 20, message: '5-20 karakter arasında olmalıdır', trigger: 'blur' }
  ],
  originAirportId: [
    { required: true, message: 'Kalkış havaalanı seçimi gereklidir', trigger: 'change' }
  ],
  destinationAirportId: [
    { required: true, message: 'Varış havaalanı seçimi gereklidir', trigger: 'change' }
  ],
  routeType: [
    { required: true, message: 'Rota tipi seçimi gereklidir', trigger: 'change' }
  ],
  distance: [
    { type: 'number', min: 1, message: 'Geçerli bir mesafe girin', trigger: 'blur' }
  ]
}

// Methods
function formatRouteCode() {
  formData.routeCode = formData.routeCode.toUpperCase()
}

function getCountryName(countryCode) {
  return countries[countryCode] || countryCode
}

function handleOriginChange() {
  updateRouteCode()
  resetCalculatedValues()
}

function handleDestinationChange() {
  updateRouteCode()
  resetCalculatedValues()
}

function updateRouteCode() {
  if (formData.originAirportId && formData.destinationAirportId) {
    const origin = airports.value.find(a => a.id === formData.originAirportId)
    const destination = airports.value.find(a => a.id === formData.destinationAirportId)

    if (origin && destination) {
      formData.routeCode = `${origin.iataCode}-${destination.iataCode}`

      // Determine route type based on countries
      if (origin.country === destination.country) {
        formData.routeType = 'DOMESTIC'
      } else {
        formData.routeType = 'INTERNATIONAL'
      }
    }
  }
}

function resetCalculatedValues() {
  formData.distance = null
  formData.estimatedFlightTime = ''
  distanceCalculated.value = false
  durationCalculated.value = false
}

async function calculateRouteMetrics() {
  if (!formData.originAirportId || !formData.destinationAirportId) return

  calculating.value = true

  try {
    const origin = airports.value.find(a => a.id === formData.originAirportId)
    const destination = airports.value.find(a => a.id === formData.destinationAirportId)

    if (!origin || !destination || !origin.latitude || !origin.longitude || !destination.latitude || !destination.longitude) {
      ElMessage.warning('Havaalanı koordinat bilgileri eksik')
      return
    }

    // Calculate distance using Haversine formula
    const distance = calculateDistance(
      origin.latitude, origin.longitude,
      destination.latitude, destination.longitude
    )

    formData.distance = Math.round(distance)
    distanceCalculated.value = true

    // Calculate estimated flight time (assuming average speed of 800 km/h)
    const flightTimeHours = distance / 800
    const hours = Math.floor(flightTimeHours)
    const minutes = Math.round((flightTimeHours - hours) * 60)

    formData.estimatedFlightTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    durationCalculated.value = true

    ElMessage.success('Mesafe ve süre başarıyla hesaplandı')
  } catch (error) {
    console.error('Route calculation failed:', error)
    ElMessage.error('Hesaplama sırasında hata oluştu')
  } finally {
    calculating.value = false
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

async function handleSubmit() {
  if (!formRef.value) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    // Custom validation
    if (formData.originAirportId === formData.destinationAirportId) {
      ElMessage.error('Kalkış ve varış havaalanları aynı olamaz')
      return
    }

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
  resetCalculatedValues()
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
  // Load airports and airlines
  try {
    airportsLoading.value = true
    airlinesLoading.value = true

    await Promise.all([
      referenceStore.fetchAirports(),
      referenceStore.fetchAirlines()
    ])
  } catch (error) {
    console.error('Failed to load reference data:', error)
    ElMessage.error('Referans veriler yüklenirken hata oluştu')
  } finally {
    airportsLoading.value = false
    airlinesLoading.value = false
  }

  // Focus first input
  setTimeout(() => {
    const firstInput = document.querySelector('.route-form input')
    if (firstInput) {
      firstInput.focus()
    }
  }, 100)
})
</script>

<style scoped lang="scss">
.route-form {
  .form-container {
    max-width: 900px;
  }

  .form-card {
    margin-bottom: 1.5rem;
    border: 1px solid #ebeef5;

    &.route-preview {
      border-color: #409eff;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    }

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

  .airport-option {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 0;

    .airport-codes {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 60px;

      .iata-code {
        font-weight: 600;
        color: #409eff;
        font-size: 1rem;
      }

      .icao-code {
        font-size: 0.75rem;
        color: #909399;
      }
    }

    .airport-details {
      flex: 1;

      .airport-name {
        font-weight: 500;
        color: #303133;
        margin-bottom: 0.25rem;
      }

      .airport-location {
        font-size: 0.875rem;
        color: #606266;
      }
    }
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

    .airline-name {
      flex: 1;
    }

    .airline-country {
      font-size: 0.875rem;
      color: #909399;
    }
  }

  .full-width {
    width: 100%;
  }

  .preview-content {
    .route-visual {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      .airport {
        text-align: center;
        flex: 1;

        &.origin {
          .airport-code {
            color: #67c23a;
          }
        }

        &.destination {
          .airport-code {
            color: #f56c6c;
          }
        }

        .airport-code {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .airport-name {
          font-weight: 600;
          color: #303133;
          margin-bottom: 0.25rem;
        }

        .airport-city {
          font-size: 0.875rem;
          color: #909399;
        }
      }

      .route-line {
        flex: 2;
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        margin: 0 2rem;

        &::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #67c23a 0%, #409eff 50%, #f56c6c 100%);
          z-index: 1;
        }

        .plane-icon {
          font-size: 2rem;
          z-index: 2;
          background: white;
          padding: 0 1rem;
          animation: fly 3s ease-in-out infinite;
        }

        .route-info {
          margin-top: 1rem;
          text-align: center;
          z-index: 2;
          background: white;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);

          .distance {
            font-weight: 600;
            color: #409eff;
            margin-bottom: 0.25rem;
          }

          .duration {
            font-size: 0.875rem;
            color: #606266;
          }
        }
      }
    }
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
  .route-form {
    .form-grid {
      grid-template-columns: 1fr;

      .form-item-full {
        grid-column: 1;
      }
    }

    .preview-content .route-visual {
      flex-direction: column;
      gap: 2rem;

      .route-line {
        margin: 0;
        transform: rotate(90deg);
        width: 100px;
        height: 100px;

        &::before {
          top: 0;
          bottom: 0;
          left: 50%;
          right: auto;
          width: 2px;
          height: 100%;
          background: linear-gradient(180deg, #67c23a 0%, #409eff 50%, #f56c6c 100%);
        }

        .plane-icon {
          transform: rotate(90deg);
        }

        .route-info {
          margin-top: 0;
          margin-left: 3rem;
          transform: rotate(-90deg);
        }
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

// Animations
@keyframes fly {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(10px); }
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

// Input styling
:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-time-picker) {
  width: 100%;
}

:deep(.el-select) {
  width: 100%;
}

// Checkbox group styling
:deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

// Select dropdown styling
:deep(.el-select-dropdown__item) {
  padding: 8px 12px;
  line-height: 1.4;
}
</style>

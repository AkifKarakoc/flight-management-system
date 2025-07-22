<template>
  <div class="flight-create">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="page-title">
          <el-icon size="28"><Plus /></el-icon>
          <h1>{{ isDuplicating ? 'Uçuş Kopyala' : 'Yeni Uçuş Oluştur' }}</h1>
          <el-tag v-if="isDuplicating" type="warning" size="large">
            Kopyalama Modu
          </el-tag>
        </div>

        <div class="header-actions">
          <el-button @click="goBack" :disabled="submitting">
            <el-icon><ArrowLeft /></el-icon>
            Geri Dön
          </el-button>

          <el-button
            @click="saveDraft"
            :disabled="submitting"
            :loading="draftSaving"
          >
            <el-icon><Document /></el-icon>
            Taslak Kaydet
          </el-button>

          <el-dropdown @command="handleQuickAction">
            <el-button :disabled="submitting">
              <el-icon><MoreFilled /></el-icon>
              Hızlı İşlemler
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="template" :icon="Download">
                  Şablon Kullan
                </el-dropdown-item>
                <el-dropdown-item command="validate" :icon="CircleCheck">
                  Doğrula
                </el-dropdown-item>
                <el-dropdown-item command="conflicts" :icon="Warning">
                  Çakışma Kontrolü
                </el-dropdown-item>
                <el-dropdown-item command="clear" :icon="Delete">
                  Formu Temizle
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- Progress Indicator -->
      <div class="progress-indicator">
        <el-steps :active="currentStep" finish-status="success" align-center>
          <el-step title="Temel Bilgiler" :icon="Position" />
          <el-step title="Rota & Zaman" :icon="Connection" />
          <el-step title="Kapasite" :icon="User" />
          <el-step title="Doğrulama" :icon="CircleCheck" />
        </el-steps>
      </div>
    </div>

    <!-- Flight Form -->
    <div class="form-container">
      <FlightForm
        ref="flightFormRef"
        v-model="flightData"
        :submitting="submitting"
        @submit="handleSubmit"
        @cancel="handleCancel"
        @reset="handleReset"
      />

      <!-- Action Bar -->
      <div class="action-bar">
        <div class="left-actions">
          <el-button
            v-if="currentStep > 0"
            @click="previousStep"
            :disabled="submitting"
          >
            <el-icon><ArrowLeft /></el-icon>
            Önceki
          </el-button>
        </div>

        <div class="step-info">
          Adım {{ currentStep + 1 }} / 4
        </div>

        <div class="right-actions">
          <el-button
            v-if="currentStep < 3"
            type="primary"
            @click="nextStep"
            :disabled="submitting || !canProceedToNext"
          >
            Sonraki
            <el-icon><ArrowRight /></el-icon>
          </el-button>

          <el-button
            v-else
            type="primary"
            @click="handleSubmit"
            :loading="submitting"
          >
            <el-icon><Check /></el-icon>
            {{ isDuplicating ? 'Kopyala' : 'Oluştur' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Validation Results -->
    <el-dialog
      v-model="validationDialogVisible"
      title="Doğrulama Sonuçları"
      width="600px"
      @close="validationResults = null"
    >
      <div v-if="validationResults" class="validation-results">
        <!-- Success Messages -->
        <div v-if="validationResults.valid" class="validation-success">
          <el-alert
            title="Doğrulama Başarılı"
            description="Uçuş bilgileri doğrulandı. Oluşturmaya hazır."
            type="success"
            :closable="false"
            show-icon
          />
        </div>

        <!-- Error Messages -->
        <div v-if="validationResults.errors?.length > 0" class="validation-errors">
          <el-alert
            title="Doğrulama Hataları"
            type="error"
            :closable="false"
            show-icon
          >
            <ul>
              <li v-for="error in validationResults.errors" :key="error">
                {{ error }}
              </li>
            </ul>
          </el-alert>
        </div>

        <!-- Warning Messages -->
        <div v-if="validationResults.warnings?.length > 0" class="validation-warnings">
          <el-alert
            title="Uyarılar"
            type="warning"
            :closable="false"
            show-icon
          >
            <ul>
              <li v-for="warning in validationResults.warnings" :key="warning">
                {{ warning }}
              </li>
            </ul>
          </el-alert>
        </div>

        <!-- Conflict Information -->
        <div v-if="validationResults.conflicts?.length > 0" class="validation-conflicts">
          <el-alert
            title="Çakışan Uçuşlar"
            type="warning"
            :closable="false"
            show-icon
          >
            <div class="conflicts-list">
              <div
                v-for="conflict in validationResults.conflicts"
                :key="conflict.id"
                class="conflict-item"
              >
                <strong>{{ conflict.flightNumber }}</strong> -
                {{ conflict.reason }}
                <br>
                <small>{{ formatDateTime(conflict.scheduledDeparture) }}</small>
              </div>
            </div>
          </el-alert>
        </div>

        <!-- Suggestions -->
        <div v-if="validationResults.suggestions?.length > 0" class="validation-suggestions">
          <el-alert
            title="Öneriler"
            type="info"
            :closable="false"
            show-icon
          >
            <ul>
              <li v-for="suggestion in validationResults.suggestions" :key="suggestion">
                {{ suggestion }}
              </li>
            </ul>
          </el-alert>
        </div>
      </div>

      <template #footer>
        <el-button @click="validationDialogVisible = false">Kapat</el-button>
        <el-button
          v-if="validationResults?.valid"
          type="primary"
          @click="proceedAfterValidation"
        >
          Devam Et
        </el-button>
      </template>
    </el-dialog>

    <!-- Templates Dialog -->
    <el-dialog
      v-model="templatesDialogVisible"
      title="Uçuş Şablonları"
      width="800px"
    >
      <div class="templates-grid">
        <div
          v-for="template in flightTemplates"
          :key="template.id"
          class="template-card"
          @click="applyTemplate(template)"
        >
          <div class="template-header">
            <h4>{{ template.name }}</h4>
            <el-tag :type="template.type">{{ template.category }}</el-tag>
          </div>
          <div class="template-description">
            {{ template.description }}
          </div>
          <div class="template-details">
            <span>{{ template.route }}</span>
            <span>{{ template.duration }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="templatesDialogVisible = false">İptal</el-button>
      </template>
    </el-dialog>

    <!-- Unsaved Changes Warning -->
    <el-dialog
      v-model="unsavedChangesVisible"
      title="Kaydedilmemiş Değişiklikler"
      width="400px"
    >
      <p>Formda kaydedilmemiş değişiklikler var. Çıkmak istediğinizden emin misiniz?</p>

      <template #footer>
        <el-button @click="unsavedChangesVisible = false">İptal</el-button>
        <el-button @click="saveAndExit" type="primary">Kaydet ve Çık</el-button>
        <el-button @click="exitWithoutSaving" type="danger">Kaydetmeden Çık</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  ArrowLeft,
  ArrowRight,
  Document,
  MoreFilled,
  Download,
  CircleCheck,
  Warning,
  Delete,
  Position,
  Connection,
  User,
  Check
} from '@element-plus/icons-vue'
import { useFlightStore } from '@/stores/flight.js'
import { useAppStore } from '@/stores/app.js'
import FlightForm from '@/components/forms/FlightForm.vue'
import dayjs from 'dayjs'

// Router and stores
const router = useRouter()
const route = useRoute()
const flightStore = useFlightStore()
const appStore = useAppStore()

// Refs
const flightFormRef = ref(null)

// State
const submitting = ref(false)
const draftSaving = ref(false)
const currentStep = ref(0)
const hasUnsavedChanges = ref(false)

// Dialog states
const validationDialogVisible = ref(false)
const templatesDialogVisible = ref(false)
const unsavedChangesVisible = ref(false)

// Form data
const flightData = reactive({
  flightNumber: '',
  airlineId: null,
  aircraftId: null,
  originAirportId: null,
  destinationAirportId: null,
  flightDate: dayjs().format('YYYY-MM-DD'),
  scheduledDeparture: '',
  scheduledArrival: '',
  type: 'PASSENGER',
  passengerCount: null,
  cargoWeight: null,
  notes: ''
})

// Validation results
const validationResults = ref(null)

// Template data
const flightTemplates = ref([
  {
    id: 1,
    name: 'İstanbul-Ankara İç Hat',
    category: 'İç Hat',
    type: 'primary',
    description: 'Standart iç hat uçuşu şablonu',
    route: 'IST → ESB',
    duration: '1.5 saat',
    data: {
      type: 'DOMESTIC',
      originAirportId: 1, // Istanbul
      destinationAirportId: 2, // Ankara
      scheduledDeparture: '08:00',
      scheduledArrival: '09:30'
    }
  },
  {
    id: 2,
    name: 'İstanbul-Paris Dış Hat',
    category: 'Dış Hat',
    type: 'success',
    description: 'Avrupa dış hat uçuşu şablonu',
    route: 'IST → CDG',
    duration: '4 saat',
    data: {
      type: 'INTERNATIONAL',
      scheduledDeparture: '14:00',
      scheduledArrival: '18:00'
    }
  },
  {
    id: 3,
    name: 'Kargo Uçuşu',
    category: 'Kargo',
    type: 'warning',
    description: 'Standart kargo uçuşu şablonu',
    route: 'Genel',
    duration: 'Değişken',
    data: {
      type: 'CARGO',
      cargoWeight: 5000
    }
  }
])

// Computed
const isDuplicating = computed(() => {
  return route.query.duplicate !== undefined
})

const canProceedToNext = computed(() => {
  switch (currentStep.value) {
    case 0: // Basic info
      return flightData.flightNumber && flightData.airlineId && flightData.aircraftId
    case 1: // Route & time
      return flightData.originAirportId && flightData.destinationAirportId &&
        flightData.scheduledDeparture && flightData.scheduledArrival
    case 2: // Capacity
      return flightData.type === 'CARGO' ? flightData.cargoWeight > 0 : flightData.passengerCount > 0
    case 3: // Validation
      return true
    default:
      return false
  }
})

// Methods
function goBack() {
  if (hasUnsavedChanges.value) {
    unsavedChangesVisible.value = true
  } else {
    router.push('/flights')
  }
}

function nextStep() {
  if (currentStep.value < 3) {
    currentStep.value++
  }
}

function previousStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

async function handleSubmit() {
  if (!validateForm()) {
    ElMessage.error('Lütfen tüm gerekli alanları doldurun')
    return
  }

  submitting.value = true

  try {
    // Validate flight data before submitting
    const validation = await flightStore.validateFlight(flightData)

    if (!validation.valid) {
      validationResults.value = validation
      validationDialogVisible.value = true
      return
    }

    // Check for conflicts
    const conflicts = await flightStore.checkConflicts(flightData)
    if (conflicts.length > 0) {
      const confirmed = await ElMessageBox.confirm(
        `${conflicts.length} çakışma tespit edildi. Devam etmek istediğinizden emin misiniz?`,
        'Çakışma Uyarısı',
        {
          confirmButtonText: 'Devam Et',
          cancelButtonText: 'İptal',
          type: 'warning'
        }
      )

      if (!confirmed) return
    }

    // Create flight
    await flightStore.createFlight(flightData)

    ElMessage.success(isDuplicating.value ? 'Uçuş başarıyla kopyalandı' : 'Uçuş başarıyla oluşturuldu')

    // Clear unsaved changes flag
    hasUnsavedChanges.value = false

    // Navigate to flights list
    router.push('/flights')

  } catch (error) {
    console.error('Flight creation failed:', error)
    ElMessage.error('Uçuş oluşturulurken hata oluştu')
  } finally {
    submitting.value = false
  }
}

function handleCancel() {
  goBack()
}

function handleReset() {
  Object.assign(flightData, {
    flightNumber: '',
    airlineId: null,
    aircraftId: null,
    originAirportId: null,
    destinationAirportId: null,
    flightDate: dayjs().format('YYYY-MM-DD'),
    scheduledDeparture: '',
    scheduledArrival: '',
    type: 'PASSENGER',
    passengerCount: null,
    cargoWeight: null,
    notes: ''
  })

  currentStep.value = 0
  hasUnsavedChanges.value = false
  ElMessage.success('Form temizlendi')
}

async function handleQuickAction(command) {
  switch (command) {
    case 'template':
      templatesDialogVisible.value = true
      break
    case 'validate':
      await validateFlight()
      break
    case 'conflicts':
      await checkConflicts()
      break
    case 'clear':
      handleReset()
      break
  }
}

async function validateFlight() {
  if (!validateForm()) {
    ElMessage.error('Lütfen tüm gerekli alanları doldurun')
    return
  }

  try {
    const validation = await flightStore.validateFlight(flightData)
    validationResults.value = validation
    validationDialogVisible.value = true
  } catch (error) {
    ElMessage.error('Doğrulama sırasında hata oluştu')
  }
}

async function checkConflicts() {
  if (!flightData.aircraftId || !flightData.scheduledDeparture) {
    ElMessage.warning('Çakışma kontrolü için uçak ve kalkış zamanı gerekli')
    return
  }

  try {
    const conflicts = await flightStore.checkConflicts(flightData)

    if (conflicts.length === 0) {
      ElMessage.success('Çakışma tespit edilmedi')
    } else {
      validationResults.value = {
        valid: false,
        conflicts: conflicts,
        errors: [`${conflicts.length} çakışma tespit edildi`]
      }
      validationDialogVisible.value = true
    }
  } catch (error) {
    ElMessage.error('Çakışma kontrolü sırasında hata oluştu')
  }
}

function proceedAfterValidation() {
  validationDialogVisible.value = false
  if (validationResults.value?.valid) {
    handleSubmit()
  }
}

function applyTemplate(template) {
  Object.assign(flightData, template.data)
  templatesDialogVisible.value = false
  hasUnsavedChanges.value = true
  ElMessage.success(`"${template.name}" şablonu uygulandı`)
}

async function saveDraft() {
  draftSaving.value = true

  try {
    // Save to localStorage as draft
    const draftData = {
      ...flightData,
      timestamp: Date.now(),
      step: currentStep.value
    }

    localStorage.setItem('flight_draft', JSON.stringify(draftData))

    hasUnsavedChanges.value = false
    ElMessage.success('Taslak kaydedildi')

  } catch (error) {
    ElMessage.error('Taslak kaydedilemedi')
  } finally {
    draftSaving.value = false
  }
}

function loadDraft() {
  try {
    const draftData = localStorage.getItem('flight_draft')
    if (draftData) {
      const draft = JSON.parse(draftData)

      // Check if draft is not too old (24 hours)
      const draftAge = Date.now() - draft.timestamp
      if (draftAge < 24 * 60 * 60 * 1000) {
        Object.assign(flightData, draft)
        currentStep.value = draft.step || 0
        hasUnsavedChanges.value = true

        ElMessage.info('Kaydedilmiş taslak yüklendi')
      } else {
        // Remove old draft
        localStorage.removeItem('flight_draft')
      }
    }
  } catch (error) {
    console.error('Draft loading failed:', error)
  }
}

function saveAndExit() {
  saveDraft().then(() => {
    unsavedChangesVisible.value = false
    router.push('/flights')
  })
}

function exitWithoutSaving() {
  hasUnsavedChanges.value = false
  unsavedChangesVisible.value = false
  router.push('/flights')
}

function validateForm() {
  return flightData.flightNumber &&
    flightData.airlineId &&
    flightData.aircraftId &&
    flightData.originAirportId &&
    flightData.destinationAirportId &&
    flightData.scheduledDeparture &&
    flightData.scheduledArrival &&
    (flightData.type === 'CARGO' ? flightData.cargoWeight > 0 : flightData.passengerCount > 0)
}

function formatDateTime(dateTime) {
  return dayjs(dateTime).format('DD.MM.YYYY HH:mm')
}

// Track form changes
function trackChanges() {
  hasUnsavedChanges.value = true
}

// Lifecycle
onMounted(() => {
  appStore.setPageTitle(isDuplicating.value ? 'Uçuş Kopyala' : 'Yeni Uçuş Oluştur')

  // Load duplicate data if provided
  if (isDuplicating.value && route.query.duplicate) {
    try {
      const duplicateData = JSON.parse(route.query.duplicate)
      Object.assign(flightData, duplicateData)
      hasUnsavedChanges.value = true
    } catch (error) {
      console.error('Failed to parse duplicate data:', error)
      ElMessage.error('Kopyalama verisi okunamadı')
    }
  } else {
    // Try to load draft
    loadDraft()
  }

  // Set up form change tracking
  const originalValues = { ...flightData }

  // Watch for changes
  Object.keys(flightData).forEach(key => {
    if (flightData[key] !== originalValues[key]) {
      hasUnsavedChanges.value = true
    }
  })
})

onBeforeUnmount(() => {
  // Clear draft if flight was successfully created
  if (!hasUnsavedChanges.value) {
    localStorage.removeItem('flight_draft')
  }
})

// Route guard for unsaved changes
onBeforeRouteLeave((to, from, next) => {
  if (hasUnsavedChanges.value) {
    unsavedChangesVisible.value = true
    next(false)
  } else {
    next()
  }
})

// Handle browser refresh/close
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

function handleBeforeUnload(event) {
  if (hasUnsavedChanges.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
})
</script>

<style scoped lang="scss">
.flight-create {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;

  .page-header {
    margin-bottom: 2rem;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;

      .page-title {
        display: flex;
        align-items: center;
        gap: 1rem;

        h1 {
          margin: 0;
          font-size: 1.75rem;
          font-weight: 600;
          color: #303133;
        }
      }

      .header-actions {
        display: flex;
        gap: 0.75rem;
      }
    }

    .progress-indicator {
      background: white;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

      :deep(.el-steps) {
        .el-step__title {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .el-step__icon {
          &.is-text {
            border-width: 2px;
          }
        }
      }
    }
  }

  .form-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    overflow: hidden;

    .action-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      border-top: 1px solid #ebeef5;
      background: #fafafa;

      .left-actions,
      .right-actions {
        display: flex;
        gap: 0.75rem;
      }

      .step-info {
        font-size: 0.875rem;
        color: #606266;
        font-weight: 500;
      }
    }
  }

  .validation-results {
    .validation-success,
    .validation-errors,
    .validation-warnings,
    .validation-conflicts,
    .validation-suggestions {
      margin-bottom: 1rem;

      &:last-child {
        margin-bottom: 0;
      }

      ul {
        margin: 0.5rem 0 0 0;
        padding-left: 1.5rem;

        li {
          margin-bottom: 0.25rem;
        }
      }

      .conflicts-list {
        .conflict-item {
          padding: 0.5rem;
          background: #fdf6ec;
          border-radius: 4px;
          margin-bottom: 0.5rem;

          &:last-child {
            margin-bottom: 0;
          }

          small {
            color: #909399;
          }
        }
      }
    }
  }

  .templates-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;

    .template-card {
      border: 1px solid #ebeef5;
      border-radius: 8px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: #409eff;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
      }

      .template-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;

        h4 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #303133;
        }
      }

      .template-description {
        color: #606266;
        font-size: 0.875rem;
        margin-bottom: 0.75rem;
        line-height: 1.4;
      }

      .template-details {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: #909399;

        span {
          &:first-child {
            font-weight: 500;
            color: #409eff;
          }
        }
      }
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .flight-create {
    padding: 1rem;

    .page-header {
      .header-content {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;

        .header-actions {
          justify-content: flex-end;
          flex-wrap: wrap;
        }
      }

      .progress-indicator {
        padding: 1rem;

        :deep(.el-steps) {
          .el-step__title {
            font-size: 0.75rem;
          }
        }
      }
    }

    .form-container .action-bar {
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;

      .left-actions,
      .right-actions {
        width: 100%;
        justify-content: center;
      }

      .step-info {
        order: -1;
        text-align: center;
      }
    }

    .templates-grid {
      grid-template-columns: 1fr;
    }
  }
}

@media (max-width: 480px) {
  .flight-create {
    .page-header .header-actions {
      flex-direction: column;
      gap: 0.5rem;

      .el-button {
        width: 100%;
      }
    }

    .form-container .action-bar {
      .left-actions,
      .right-actions {
        flex-direction: column;

        .el-button {
          width: 100%;
        }
      }
    }
  }
}

// Animation for step transitions
.step-enter-active,
.step-leave-active {
  transition: all 0.3s ease;
}

.step-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.step-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

// Progress indicator styling
:deep(.el-steps--horizontal) {
  .el-step__head {
    .el-step__line {
      background-color: #e4e7ed;
    }
  }

  .el-step.is-finish {
    .el-step__head .el-step__line {
      background-color: #67c23a;
    }
  }

  .el-step.is-process {
    .el-step__head .el-step__icon {
      border-color: #409eff;
      background-color: #409eff;
      color: white;
    }
  }
}

// Dialog customization
:deep(.el-dialog__body) {
  padding-top: 1rem;
}

// Alert customization
:deep(.el-alert) {
  .el-alert__content {
    .el-alert__title {
      font-weight: 600;
    }
  }
}
</style>

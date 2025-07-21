<template>
  <div class="flight-edit">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="page-title">
          <el-icon size="28"><Edit /></el-icon>
          <h1>Uçuş Düzenle</h1>
          <el-tag v-if="originalFlight" type="primary" size="large">
            {{ originalFlight.flightNumber }}
          </el-tag>
        </div>

        <div class="header-actions">
          <el-button @click="goBack" :disabled="submitting">
            <el-icon><ArrowLeft /></el-icon>
            Geri Dön
          </el-button>

          <el-button
            @click="viewHistory"
            :disabled="submitting"
          >
            <el-icon><Clock /></el-icon>
            Geçmiş
          </el-button>

          <el-dropdown @command="handleQuickAction">
            <el-button :disabled="submitting">
              <el-icon><MoreFilled /></el-icon>
              İşlemler
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="duplicate" :icon="CopyDocument">
                  Kopyala
                </el-dropdown-item>
                <el-dropdown-item command="validate" :icon="CircleCheck">
                  Doğrula
                </el-dropdown-item>
                <el-dropdown-item command="conflicts" :icon="Warning">
                  Çakışma Kontrolü
                </el-dropdown-item>
                <el-dropdown-item
                  command="cancel"
                  :icon="Close"
                  :disabled="isFlightCompleted"
                >
                  Uçuşu İptal Et
                </el-dropdown-item>
                <el-dropdown-item
                  command="reset"
                  :icon="RefreshRight"
                  class="danger-action"
                >
                  Değişiklikleri Geri Al
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- Flight Status & Info Bar -->
      <div class="flight-info-bar">
        <div class="flight-status">
          <div class="status-item">
            <span class="label">Durum:</span>
            <el-tag :type="getStatusTagType(originalFlight?.status)" size="large">
              {{ getStatusText(originalFlight?.status) }}
            </el-tag>
          </div>

          <div class="status-item">
            <span class="label">Son Güncelleme:</span>
            <span class="value">{{ formatDateTime(originalFlight?.updatedAt) }}</span>
          </div>

          <div class="status-item">
            <span class="label">Oluşturan:</span>
            <span class="value">{{ originalFlight?.createdBy || 'Sistem' }}</span>
          </div>
        </div>

        <div class="flight-actions">
          <el-button
            v-if="!isFlightCompleted"
            type="warning"
            size="small"
            @click="openStatusDialog"
          >
            Durum Güncelle
          </el-button>
        </div>
      </div>

      <!-- Changes Summary -->
      <div v-if="hasChanges" class="changes-summary">
        <el-alert
          title="Kaydedilmemiş Değişiklikler"
          :description="`${changeCount} alan değiştirildi`"
          type="warning"
          :closable="false"
          show-icon
        >
          <template #default>
            <div class="changes-actions">
              <el-button size="small" @click="showChanges">
                Değişiklikleri Gör
              </el-button>
              <el-button size="small" type="primary" @click="handleSubmit">
                Kaydet
              </el-button>
              <el-button size="small" @click="discardChanges">
                Geri Al
              </el-button>
            </div>
          </template>
        </el-alert>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <el-skeleton animated>
        <template #template>
          <div class="skeleton-form">
            <el-skeleton-item variant="text" style="width: 100%; height: 400px;" />
          </div>
        </template>
      </el-skeleton>
    </div>

    <!-- Flight Form -->
    <div v-else-if="originalFlight" class="form-container">
      <FlightForm
        ref="flightFormRef"
        v-model="flightData"
        :is-editing="true"
        :submitting="submitting"
        @submit="handleSubmit"
        @cancel="handleCancel"
        @reset="handleReset"
      />
    </div>

    <!-- Error State -->
    <div v-else class="error-state">
      <el-empty
        :image-size="120"
        description="Uçuş bulunamadı"
      >
        <el-button type="primary" @click="goBack">
          Geri Dön
        </el-button>
      </el-empty>
    </div>

    <!-- Status Update Dialog -->
    <el-dialog
      v-model="statusDialogVisible"
      title="Uçuş Durumu Güncelle"
      width="500px"
      @close="resetStatusDialog"
    >
      <el-form :model="statusForm" label-width="100px">
        <el-form-item label="Yeni Durum">
          <el-select v-model="statusForm.status" placeholder="Durum seçin">
            <el-option
              v-for="status in availableStatuses"
              :key="status.value"
              :label="status.label"
              :value="status.value"
              :disabled="!canChangeToStatus(status.value)"
            >
              <el-tag :type="status.type" size="small">
                {{ status.label }}
              </el-tag>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="Not">
          <el-input
            v-model="statusForm.notes"
            type="textarea"
            :rows="3"
            placeholder="Durum değişikliği ile ilgili not..."
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="statusDialogVisible = false">İptal</el-button>
        <el-button
          type="primary"
          @click="updateFlightStatus"
          :loading="statusUpdateLoading"
        >
          Güncelle
        </el-button>
      </template>
    </el-dialog>

    <!-- Changes Preview Dialog -->
    <el-dialog
      v-model="changesDialogVisible"
      title="Yapılan Değişiklikler"
      width="700px"
    >
      <div class="changes-preview">
        <el-table :data="changesList" style="width: 100%">
          <el-table-column prop="field" label="Alan" width="150" />
          <el-table-column prop="oldValue" label="Eski Değer" />
          <el-table-column prop="newValue" label="Yeni Değer" />
        </el-table>
      </div>

      <template #footer>
        <el-button @click="changesDialogVisible = false">Kapat</el-button>
      </template>
    </el-dialog>

    <!-- Flight History Dialog -->
    <el-dialog
      v-model="historyDialogVisible"
      title="Uçuş Geçmişi"
      width="800px"
      @close="flightHistory = []"
    >
      <div v-if="historyLoading" class="history-loading">
        <el-skeleton animated :rows="5" />
      </div>

      <div v-else-if="flightHistory.length > 0" class="flight-history">
        <el-timeline>
          <el-timeline-item
            v-for="(event, index) in flightHistory"
            :key="index"
            :timestamp="formatDateTime(event.timestamp)"
            :type="getHistoryEventType(event.type)"
          >
            <div class="history-event">
              <h4>{{ event.title }}</h4>
              <p v-if="event.description">{{ event.description }}</p>
              <div v-if="event.details" class="event-details">
                <el-tag
                  v-for="(value, key) in event.details"
                  :key="key"
                  size="small"
                  type="info"
                >
                  {{ key }}: {{ value }}
                </el-tag>
              </div>
              <div class="event-meta">
                <span>{{ event.user || 'Sistem' }}</span>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>

      <div v-else class="empty-history">
        <el-empty description="Henüz geçmiş kaydı bulunmuyor" />
      </div>

      <template #footer>
        <el-button @click="historyDialogVisible = false">Kapat</el-button>
      </template>
    </el-dialog>

    <!-- Cancel Flight Dialog -->
    <el-dialog
      v-model="cancelDialogVisible"
      title="Uçuşu İptal Et"
      width="500px"
      @close="resetCancelDialog"
    >
      <el-alert
        title="Uyarı"
        description="Bu işlem geri alınamaz. Uçuş iptal edilecek ve tüm yolculara bildirim gönderilecektir."
        type="warning"
        :closable="false"
        show-icon
      />

      <el-form :model="cancelForm" label-width="100px" style="margin-top: 20px;">
        <el-form-item label="İptal Nedeni" required>
          <el-input
            v-model="cancelForm.reason"
            type="textarea"
            :rows="3"
            placeholder="İptal nedenini belirtin..."
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="cancelDialogVisible = false">Vazgeç</el-button>
        <el-button
          type="danger"
          @click="cancelFlight"
          :loading="cancelLoading"
        >
          İptal Et
        </el-button>
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Edit,
  ArrowLeft,
  Clock,
  MoreFilled,
  CopyDocument,
  CircleCheck,
  Warning,
  Close,
  RefreshRight
} from '@element-plus/icons-vue'
import { useFlightStore } from '@/stores/flight'
import { useAppStore } from '@/stores/app'
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
const loading = ref(true)
const submitting = ref(false)
const originalFlight = ref(null)
const flightHistory = ref([])
const historyLoading = ref(false)

// Dialog states
const statusDialogVisible = ref(false)
const changesDialogVisible = ref(false)
const historyDialogVisible = ref(false)
const cancelDialogVisible = ref(false)
const unsavedChangesVisible = ref(false)

// Loading states
const statusUpdateLoading = ref(false)
const cancelLoading = ref(false)

// Form data
const flightData = reactive({})

// Original form data for comparison
const originalFormData = ref({})

// Form states
const statusForm = reactive({
  status: '',
  notes: ''
})

const cancelForm = reactive({
  reason: ''
})

// Computed
const flightId = computed(() => route.params.id)

const isFlightCompleted = computed(() => {
  return originalFlight.value && ['ARRIVED', 'CANCELLED'].includes(originalFlight.value.status)
})

const hasChanges = computed(() => {
  if (!originalFormData.value) return false

  return Object.keys(flightData).some(key =>
    flightData[key] !== originalFormData.value[key]
  )
})

const changeCount = computed(() => {
  if (!originalFormData.value) return 0

  return Object.keys(flightData).filter(key =>
    flightData[key] !== originalFormData.value[key]
  ).length
})

const changesList = computed(() => {
  if (!originalFormData.value) return []

  return Object.keys(flightData)
    .filter(key => flightData[key] !== originalFormData.value[key])
    .map(key => ({
      field: getFieldLabel(key),
      oldValue: formatValue(originalFormData.value[key]),
      newValue: formatValue(flightData[key])
    }))
})

const availableStatuses = computed(() => {
  const currentStatus = originalFlight.value?.status

  const allStatuses = [
    { value: 'SCHEDULED', label: 'Planlandı', type: 'info' },
    { value: 'BOARDING', label: 'Biniş', type: 'warning' },
    { value: 'DEPARTED', label: 'Kalktı', type: 'success' },
    { value: 'IN_FLIGHT', label: 'Uçuşta', type: 'primary' },
    { value: 'ARRIVED', label: 'İndi', type: 'success' },
    { value: 'DELAYED', label: 'Gecikti', type: 'warning' },
    { value: 'CANCELLED', label: 'İptal', type: 'danger' }
  ]

  // Filter based on current status logic
  return allStatuses.filter(status => canChangeToStatus(status.value))
})

// Methods
async function loadFlight() {
  loading.value = true

  try {
    const flight = await flightStore.fetchFlightById(flightId.value, true)
    originalFlight.value = flight

    // Copy data to form
    Object.assign(flightData, {
      flightNumber: flight.flightNumber,
      airlineId: flight.airlineId,
      aircraftId: flight.aircraftId,
      originAirportId: flight.originAirportId,
      destinationAirportId: flight.destinationAirportId,
      flightDate: flight.flightDate,
      scheduledDeparture: flight.scheduledDeparture,
      scheduledArrival: flight.scheduledArrival,
      type: flight.type,
      passengerCount: flight.passengerCount,
      cargoWeight: flight.cargoWeight,
      notes: flight.notes || ''
    })

    // Store original data for comparison
    originalFormData.value = { ...flightData }

  } catch (error) {
    console.error('Failed to load flight:', error)
    ElMessage.error('Uçuş yüklenemedi')
  } finally {
    loading.value = false
  }
}

function goBack() {
  if (hasChanges.value) {
    unsavedChangesVisible.value = true
  } else {
    router.push('/flights')
  }
}

async function handleSubmit() {
  if (!validateForm()) {
    ElMessage.error('Lütfen tüm gerekli alanları doldurun')
    return
  }

  submitting.value = true

  try {
    // Validate changes
    const validation = await flightStore.validateFlight(flightData)

    if (!validation.valid) {
      ElMessage.error('Form doğrulama hatası')
      return
    }

    // Update flight
    await flightStore.updateFlight(flightId.value, flightData)

    ElMessage.success('Uçuş başarıyla güncellendi')

    // Update original data
    originalFormData.value = { ...flightData }

    // Reload flight data
    await loadFlight()

  } catch (error) {
    console.error('Flight update failed:', error)
    ElMessage.error('Uçuş güncellenirken hata oluştu')
  } finally {
    submitting.value = false
  }
}

function handleCancel() {
  goBack()
}

function handleReset() {
  Object.assign(flightData, originalFormData.value)
  ElMessage.success('Değişiklikler geri alındı')
}

async function handleQuickAction(command) {
  switch (command) {
    case 'duplicate':
      duplicateFlight()
      break
    case 'validate':
      await validateFlight()
      break
    case 'conflicts':
      await checkConflicts()
      break
    case 'cancel':
      openCancelDialog()
      break
    case 'reset':
      handleReset()
      break
  }
}

function duplicateFlight() {
  const duplicateData = {
    ...flightData,
    flightNumber: '',
    flightDate: dayjs().format('YYYY-MM-DD'),
    status: 'SCHEDULED'
  }

  router.push({
    path: '/flights/create',
    query: { duplicate: JSON.stringify(duplicateData) }
  })
}

async function validateFlight() {
  try {
    const validation = await flightStore.validateFlight(flightData)

    if (validation.valid) {
      ElMessage.success('Uçuş bilgileri geçerli')
    } else {
      ElMessage.error('Doğrulama hataları tespit edildi')
    }
  } catch (error) {
    ElMessage.error('Doğrulama sırasında hata oluştu')
  }
}

async function checkConflicts() {
  try {
    const conflicts = await flightStore.checkConflicts(flightData)

    if (conflicts.length === 0) {
      ElMessage.success('Çakışma tespit edilmedi')
    } else {
      ElMessage.warning(`${conflicts.length} çakışma tespit edildi`)
    }
  } catch (error) {
    ElMessage.error('Çakışma kontrolü sırasında hata oluştu')
  }
}

function openStatusDialog() {
  statusForm.status = originalFlight.value.status
  statusForm.notes = ''
  statusDialogVisible.value = true
}

async function updateFlightStatus() {
  if (!statusForm.status) {
    ElMessage.warning('Lütfen durum seçin')
    return
  }

  statusUpdateLoading.value = true

  try {
    await flightStore.updateFlightStatus(
      flightId.value,
      statusForm.status,
      statusForm.notes
    )

    statusDialogVisible.value = false
    resetStatusDialog()

    // Reload flight data
    await loadFlight()

  } catch (error) {
    ElMessage.error('Durum güncellenirken hata oluştu')
  } finally {
    statusUpdateLoading.value = false
  }
}

function openCancelDialog() {
  cancelForm.reason = ''
  cancelDialogVisible.value = true
}

async function cancelFlight() {
  if (!cancelForm.reason.trim()) {
    ElMessage.warning('Lütfen iptal nedenini belirtin')
    return
  }

  cancelLoading.value = true

  try {
    await flightStore.cancelFlight(flightId.value, cancelForm.reason)

    cancelDialogVisible.value = false
    resetCancelDialog()

    // Reload flight data
    await loadFlight()

  } catch (error) {
    ElMessage.error('Uçuş iptal edilirken hata oluştu')
  } finally {
    cancelLoading.value = false
  }
}

async function viewHistory() {
  historyDialogVisible.value = true
  historyLoading.value = true

  try {
    // This would be a real API call in production
    const history = await flightStore.getHistory?.(flightId.value) || []
    flightHistory.value = history
  } catch (error) {
    console.error('Failed to load flight history:', error)
    ElMessage.error('Geçmiş yüklenirken hata oluştu')
  } finally {
    historyLoading.value = false
  }
}

function showChanges() {
  changesDialogVisible.value = true
}

function discardChanges() {
  Object.assign(flightData, originalFormData.value)
  ElMessage.success('Değişiklikler geri alındı')
}

function saveAndExit() {
  handleSubmit().then(() => {
    unsavedChangesVisible.value = false
    router.push('/flights')
  })
}

function exitWithoutSaving() {
  unsavedChangesVisible.value = false
  router.push('/flights')
}

function resetStatusDialog() {
  statusForm.status = ''
  statusForm.notes = ''
}

function resetCancelDialog() {
  cancelForm.reason = ''
}

function validateForm() {
  return flightData.flightNumber &&
    flightData.airlineId &&
    flightData.aircraftId &&
    flightData.originAirportId &&
    flightData.destinationAirportId &&
    flightData.scheduledDeparture &&
    flightData.scheduledArrival
}

function canChangeToStatus(newStatus) {
  const currentStatus = originalFlight.value?.status

  // Define allowed status transitions
  const transitions = {
    'SCHEDULED': ['BOARDING', 'DELAYED', 'CANCELLED'],
    'BOARDING': ['DEPARTED', 'DELAYED', 'CANCELLED'],
    'DEPARTED': ['IN_FLIGHT', 'CANCELLED'],
    'IN_FLIGHT': ['ARRIVED'],
    'DELAYED': ['BOARDING', 'DEPARTED', 'CANCELLED'],
    'ARRIVED': [], // No transitions from arrived
    'CANCELLED': [] // No transitions from cancelled
  }

  return transitions[currentStatus]?.includes(newStatus) || newStatus === currentStatus
}

// Helper methods
function getStatusText(status) {
  return flightStore.getFlightStatusText(status)
}

function getStatusTagType(status) {
  const typeMap = {
    'SCHEDULED': 'info',
    'BOARDING': 'warning',
    'DEPARTED': 'success',
    'IN_FLIGHT': 'primary',
    'ARRIVED': 'success',
    'CANCELLED': 'danger',
    'DELAYED': 'warning'
  }
  return typeMap[status] || 'info'
}

function getHistoryEventType(eventType) {
  const typeMap = {
    'created': 'primary',
    'updated': 'info',
    'status_changed': 'warning',
    'cancelled': 'danger',
    'completed': 'success'
  }
  return typeMap[eventType] || 'info'
}

function getFieldLabel(field) {
  const labels = {
    'flightNumber': 'Uçuş Numarası',
    'airlineId': 'Havayolu',
    'aircraftId': 'Uçak',
    'originAirportId': 'Kalkış',
    'destinationAirportId': 'Varış',
    'flightDate': 'Tarih',
    'scheduledDeparture': 'Kalkış Zamanı',
    'scheduledArrival': 'Varış Zamanı',
    'type': 'Tip',
    'passengerCount': 'Yolcu Sayısı',
    'cargoWeight': 'Kargo Ağırlığı',
    'notes': 'Notlar'
  }
  return labels[field] || field
}

function formatValue(value) {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'Evet' : 'Hayır'
  if (typeof value === 'string' && value.includes('T')) {
    return formatDateTime(value)
  }
  return String(value)
}

function formatDateTime(dateTime) {
  return dayjs(dateTime).format('DD.MM.YYYY HH:mm')
}

// Lifecycle
onMounted(async () => {
  appStore.setPageTitle('Uçuş Düzenle')
  await loadFlight()
})

// Route guard for unsaved changes
onBeforeRouteLeave((to, from, next) => {
  if (hasChanges.value) {
    unsavedChangesVisible.value = true
    next(false)
  } else {
    next()
  }
})

// Watch for form changes to update page title
watch(() => originalFlight.value?.flightNumber, (flightNumber) => {
  if (flightNumber) {
    appStore.setPageTitle(`Uçuş Düzenle - ${flightNumber}`)
  }
})
</script>

<style scoped lang="scss">
.flight-edit {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;

  .page-header {
    margin-bottom: 2rem;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;

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

    .flight-info-bar {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;

      .flight-status {
        display: flex;
        gap: 2rem;

        .status-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;

          .label {
            color: #606266;
            font-weight: 500;
            font-size: 0.875rem;
          }

          .value {
            color: #303133;
            font-weight: 600;
          }
        }
      }

      .flight-actions {
        display: flex;
        gap: 0.75rem;
      }
    }

    .changes-summary {
      .el-alert {
        :deep(.el-alert__content) {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .changes-actions {
            display: flex;
            gap: 0.5rem;
            margin-left: 1rem;
          }
        }
      }
    }
  }

  .loading-container {
    background: white;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    .skeleton-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  }

  .form-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .error-state {
    background: white;
    border-radius: 8px;
    padding: 3rem;
    text-align: center;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }

  .changes-preview {
    .el-table {
      :deep(.el-table__body-wrapper) {
        max-height: 300px;
        overflow-y: auto;
      }
    }
  }

  .flight-history {
    max-height: 400px;
    overflow-y: auto;

    .history-event {
      h4 {
        margin: 0 0 0.5rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: #303133;
      }

      p {
        margin: 0 0 0.5rem 0;
        color: #606266;
        font-size: 0.875rem;
        line-height: 1.4;
      }

      .event-details {
        margin: 0.5rem 0;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .event-meta {
        font-size: 0.75rem;
        color: #909399;
        margin-top: 0.5rem;
      }
    }
  }

  .history-loading {
    padding: 2rem 0;
  }

  .empty-history {
    padding: 2rem 0;
  }
}

// Dropdown danger action styling
:deep(.danger-action) {
  color: #f56c6c !important;

  &:hover {
    background-color: #fef0f0 !important;
    color: #f56c6c !important;
  }
}

// Responsive design
@media (max-width: 768px) {
  .flight-edit {
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

      .flight-info-bar {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;

        .flight-status {
          flex-direction: column;
          gap: 1rem;

          .status-item {
            justify-content: space-between;
          }
        }

        .flight-actions {
          justify-content: center;
        }
      }

      .changes-summary {
        .el-alert {
          :deep(.el-alert__content) {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;

            .changes-actions {
              margin-left: 0;
              justify-content: center;
            }
          }
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .flight-edit {
    .page-header {
      .header-actions {
        flex-direction: column;
        gap: 0.5rem;

        .el-button {
          width: 100%;
        }
      }

      .flight-info-bar .flight-status {
        .status-item {
          font-size: 0.875rem;
        }
      }

      .changes-summary {
        .changes-actions {
          flex-direction: column;

          .el-button {
            width: 100%;
          }
        }
      }
    }
  }
}

// Timeline customization
:deep(.el-timeline) {
  .el-timeline-item__timestamp {
    font-size: 0.75rem;
    color: #909399;
  }
}

// Dialog customization
:deep(.el-dialog__body) {
  padding-top: 1rem;
}

// Alert customization in changes summary
:deep(.el-alert--warning) {
  .el-alert__icon {
    font-size: 1.2rem;
  }
}
</style>

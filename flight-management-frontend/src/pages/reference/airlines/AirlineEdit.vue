<template>
  <div class="airline-edit">
    <!-- Page header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">Havayolu Düzenle</h1>
          <p class="page-description">
            <span v-if="currentAirline">{{ currentAirline.name }}</span>
            <span v-else>Havayolu bilgilerini güncelleyin</span>
          </p>
        </div>
        <div class="header-actions">
          <BaseButton
            icon="ArrowLeft"
            @click="goBack"
          >
            Geri Dön
          </BaseButton>
          <BaseButton
            v-if="currentAirline"
            icon="View"
            @click="showPreview = true"
          >
            Önizleme
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-section">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-section">
      <el-result
        icon="error"
        title="Veri Yükleme Hatası"
        :sub-title="error"
      >
        <template #extra>
          <BaseButton
            type="primary"
            @click="loadAirline"
          >
            Tekrar Dene
          </BaseButton>
        </template>
      </el-result>
    </div>

    <!-- Form section -->
    <div v-else-if="currentAirline" class="form-section">
      <div class="form-container">
        <!-- Change tracking indicator -->
        <div v-if="hasChanges" class="changes-indicator">
          <el-alert
            type="info"
            show-icon
            :closable="false"
          >
            <template #title>
              Kaydedilmemiş değişiklikler var
              <el-button
                type="primary"
                size="small"
                style="margin-left: 12px"
                @click="saveChanges"
              >
                Kaydet
              </el-button>
            </template>
          </el-alert>
        </div>

        <!-- Form tabs -->
        <el-tabs v-model="activeTab" class="form-tabs">
          <!-- Basic Information Tab -->
          <el-tab-pane label="Temel Bilgiler" name="basic">
            <BaseCard title="Temel Bilgiler" class="form-card">
              <el-form
                ref="basicFormRef"
                :model="formData"
                :rules="basicFormRules"
                label-position="top"
                require-asterisk-position="right"
                @submit.prevent
              >
                <div class="form-grid">
                  <div class="form-row">
                    <el-form-item label="Havayolu Adı" prop="name" class="full-width">
                      <BaseInput
                        v-model="formData.name"
                        placeholder="Örn: Turkish Airlines"
                        maxlength="100"
                        show-counter
                        @change="trackChanges"
                      />
                    </el-form-item>
                  </div>

                  <div class="form-row">
                    <el-form-item label="IATA Kodu" prop="iataCode">
                      <BaseInput
                        v-model="formData.iataCode"
                        placeholder="Örn: TK"
                        maxlength="2"
                        uppercase
                        @input="validateIataCode"
                        @change="trackChanges"
                      />
                      <template #extra>
                        <div class="field-help">
                          2 harfli uluslararası kod
                        </div>
                      </template>
                    </el-form-item>

                    <el-form-item label="ICAO Kodu" prop="icaoCode">
                      <BaseInput
                        v-model="formData.icaoCode"
                        placeholder="Örn: THY"
                        maxlength="3"
                        uppercase
                        @input="validateIcaoCode"
                        @change="trackChanges"
                      />
                      <template #extra>
                        <div class="field-help">
                          3 harfli uluslararası kod
                        </div>
                      </template>
                    </el-form-item>
                  </div>

                  <div class="form-row">
                    <el-form-item label="Ülke" prop="country">
                      <BaseSelect
                        v-model="formData.country"
                        :options="countryOptions"
                        placeholder="Ülke seçin"
                        filterable
                        allow-create
                        @change="trackChanges"
                      />
                    </el-form-item>

                    <el-form-item label="Havayolu Tipi" prop="type">
                      <BaseSelect
                        v-model="formData.type"
                        :options="airlineTypeOptions"
                        placeholder="Tip seçin"
                        @change="trackChanges"
                      />
                    </el-form-item>
                  </div>

                  <div class="form-row">
                    <el-form-item label="Durum" class="full-width">
                      <el-switch
                        v-model="formData.active"
                        active-text="Aktif"
                        inactive-text="Pasif"
                        inline-prompt
                        @change="trackChanges"
                      />
                    </el-form-item>
                  </div>
                </div>
              </el-form>
            </BaseCard>
          </el-tab-pane>

          <!-- Additional Details Tab -->
          <el-tab-pane label="Ek Detaylar" name="details">
            <BaseCard title="Ek Detaylar" class="form-card">
              <el-form
                ref="detailsFormRef"
                :model="formData"
                :rules="detailsFormRules"
                label-position="top"
                @submit.prevent
              >
                <div class="form-grid">
                  <div class="form-row">
                    <el-form-item label="Website" prop="website">
                      <BaseInput
                        v-model="formData.website"
                        placeholder="https://www.example.com"
                        prefix-icon="Link"
                        @change="trackChanges"
                      />
                    </el-form-item>

                    <el-form-item label="İletişim E-posta" prop="contactEmail">
                      <BaseInput
                        v-model="formData.contactEmail"
                        placeholder="info@example.com"
                        prefix-icon="Message"
                        @change="trackChanges"
                      />
                    </el-form-item>
                  </div>

                  <div class="form-row">
                    <el-form-item label="Telefon" prop="phone">
                      <BaseInput
                        v-model="formData.phone"
                        placeholder="+90 212 123 45 67"
                        prefix-icon="Phone"
                        @change="trackChanges"
                      />
                    </el-form-item>

                    <el-form-item label="Kuruluş Yılı" prop="foundedYear">
                      <BaseInput
                        v-model.number="formData.foundedYear"
                        type="number"
                        placeholder="1933"
                        :min="1900"
                        :max="new Date().getFullYear()"
                        @change="trackChanges"
                      />
                    </el-form-item>
                  </div>

                  <div class="form-row">
                    <el-form-item label="Merkez Ofis" prop="headquarters">
                      <BaseInput
                        v-model="formData.headquarters"
                        placeholder="İstanbul, Türkiye"
                        prefix-icon="Location"
                        @change="trackChanges"
                      />
                    </el-form-item>

                    <el-form-item label="Logo URL" prop="logoUrl">
                      <BaseInput
                        v-model="formData.logoUrl"
                        placeholder="https://example.com/logo.png"
                        prefix-icon="Picture"
                        @change="trackChanges"
                      />
                    </el-form-item>
                  </div>

                  <div class="form-row">
                    <el-form-item label="Açıklama" class="full-width">
                      <el-input
                        v-model="formData.description"
                        type="textarea"
                        placeholder="Havayolu hakkında kısa açıklama..."
                        :rows="3"
                        maxlength="500"
                        show-word-limit
                        @change="trackChanges"
                      />
                    </el-form-item>
                  </div>

                  <!-- Logo preview -->
                  <div v-if="formData.logoUrl" class="form-row">
                    <div class="logo-preview-section">
                      <label class="preview-label">Logo Önizleme</label>
                      <div class="logo-preview">
                        <img
                          :src="formData.logoUrl"
                          alt="Logo önizleme"
                          class="preview-image"
                          @error="handleLogoError"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </el-form>
            </BaseCard>
          </el-tab-pane>

          <!-- Statistics Tab -->
          <el-tab-pane label="İstatistikler" name="statistics">
            <BaseCard title="Havayolu İstatistikleri" class="form-card">
              <AirlineStatistics
                :airline="currentAirline"
                :loading="statisticsLoading"
                @refresh="loadStatistics"
              />
            </BaseCard>
          </el-tab-pane>

          <!-- History Tab -->
          <el-tab-pane label="Değişiklik Geçmişi" name="history">
            <BaseCard title="Değişiklik Geçmişi" class="form-card">
              <AirlineHistory
                :airline-id="airlineId"
                :loading="historyLoading"
              />
            </BaseCard>
          </el-tab-pane>
        </el-tabs>

        <!-- Action buttons -->
        <div class="form-actions">
          <BaseButton
            @click="resetForm"
            :disabled="!hasChanges"
          >
            Değişiklikleri Geri Al
          </BaseButton>

          <div class="action-spacer" />

          <BaseButton
            type="danger"
            icon="Delete"
            @click="confirmDelete"
          >
            Sil
          </BaseButton>

          <BaseButton
            type="primary"
            icon="Check"
            :loading="saving"
            :disabled="!hasChanges"
            @click="saveChanges"
          >
            Kaydet
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <BaseModal
      v-model="showPreview"
      title="Havayolu Önizleme"
      width="800px"
    >
      <AirlinePreview
        v-if="currentAirline"
        :airline="formData"
        :original="currentAirline"
        :is-edit="true"
        @close="showPreview = false"
      />
    </BaseModal>

    <BaseModal
      v-model="showDeleteModal"
      title="Havayolu Silme Onayı"
      width="500px"
    >
      <div class="delete-confirmation">
        <el-alert
          v-if="deleteCheckResult?.canDelete === false"
          type="warning"
          :title="deleteCheckResult.message"
          show-icon
          :closable="false"
        />

        <p class="delete-message">
          <strong>{{ currentAirline?.name }}</strong> havayolunu silmek istediğinizden emin misiniz?
        </p>

        <div v-if="deleteCheckResult?.dependencies" class="dependencies-info">
          <h4>Bu havayoluna bağlı veriler:</h4>
          <ul>
            <li v-if="deleteCheckResult.dependencies.flights > 0">
              {{ deleteCheckResult.dependencies.flights }} uçuş
            </li>
            <li v-if="deleteCheckResult.dependencies.aircraft > 0">
              {{ deleteCheckResult.dependencies.aircraft }} uçak
            </li>
          </ul>
        </div>
      </div>

      <template #footer>
        <div class="modal-footer">
          <BaseButton @click="showDeleteModal = false">
            İptal
          </BaseButton>
          <BaseButton
            v-if="deleteCheckResult?.canDelete !== false"
            type="danger"
            :loading="deleting"
            @click="deleteAirline"
          >
            Sil
          </BaseButton>
          <BaseButton
            v-else
            type="danger"
            :loading="deleting"
            @click="forceDeleteAirline"
          >
            Zorla Sil
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import AirlinePreview from '@/components/reference/AirlinePreview.vue'
import AirlineStatistics from '@/components/reference/AirlineStatistics.vue'
import AirlineHistory from '@/components/reference/AirlineHistory.vue'

import { useReferenceStore } from '@/stores/reference.js'
import { airlineFormRules } from '@/utils/validation.js'
import { AIRLINE_TYPE } from '@/utils/constants.js'
import { deepClone, deepEqual } from '@/utils/helpers.js'

// Composables
const route = useRoute()
const router = useRouter()
const referenceStore = useReferenceStore()

// Form refs
const basicFormRef = ref(null)
const detailsFormRef = ref(null)

// Reactive state
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const error = ref(null)
const activeTab = ref('basic')
const showPreview = ref(false)
const showDeleteModal = ref(false)
const deleteCheckResult = ref(null)
const statisticsLoading = ref(false)
const historyLoading = ref(false)
const logoError = ref(false)

// Form data
const formData = ref({
  name: '',
  iataCode: '',
  icaoCode: '',
  country: '',
  type: '',
  active: true,
  website: '',
  contactEmail: '',
  phone: '',
  foundedYear: null,
  headquarters: '',
  logoUrl: '',
  description: ''
})

const originalData = ref(null)

// Props
const airlineId = computed(() => parseInt(route.params.id))

// Computed properties
const currentAirline = computed(() => referenceStore.currentAirline)

const hasChanges = computed(() => {
  if (!originalData.value) return false
  return !deepEqual(formData.value, originalData.value)
})

const airlineTypeOptions = computed(() => [
  { label: 'Tam Hizmet', value: AIRLINE_TYPE.FULL_SERVICE },
  { label: 'Düşük Maliyet', value: AIRLINE_TYPE.LOW_COST },
  { label: 'Kargo', value: AIRLINE_TYPE.CARGO },
  { label: 'Charter', value: AIRLINE_TYPE.CHARTER }
])

const countryOptions = computed(() => [
  { label: 'Türkiye', value: 'Turkey' },
  { label: 'Amerika Birleşik Devletleri', value: 'United States' },
  { label: 'Almanya', value: 'Germany' },
  { label: 'Fransa', value: 'France' },
  { label: 'İngiltere', value: 'United Kingdom' },
  { label: 'İtalya', value: 'Italy' },
  { label: 'Hollanda', value: 'Netherlands' },
  { label: 'İspanya', value: 'Spain' }
])

// Form validation rules
const basicFormRules = {
  ...airlineFormRules,
  iataCode: [
    ...airlineFormRules.iataCode,
    { validator: validateUniqueIataCode, trigger: 'blur' }
  ],
  icaoCode: [
    ...airlineFormRules.icaoCode,
    { validator: validateUniqueIcaoCode, trigger: 'blur' }
  ]
}

const detailsFormRules = {
  website: [
    { type: 'url', message: 'Geçerli bir URL girin', trigger: 'blur' }
  ],
  contactEmail: [
    { type: 'email', message: 'Geçerli bir e-posta adresi girin', trigger: 'blur' }
  ],
  foundedYear: [
    { type: 'number', min: 1900, max: new Date().getFullYear(), message: 'Geçerli bir yıl girin', trigger: 'blur' }
  ]
}

// Methods
const loadAirline = async () => {
  loading.value = true
  error.value = null

  try {
    await referenceStore.getAirlineById(airlineId.value)

    if (currentAirline.value) {
      initializeFormData()
    } else {
      error.value = 'Havayolu bulunamadı'
    }
  } catch (err) {
    console.error('Error loading airline:', err)
    error.value = err.message || 'Havayolu yüklenirken hata oluştu'
  } finally {
    loading.value = false
  }
}

const initializeFormData = () => {
  if (!currentAirline.value) return

  // Initialize form data from current airline
  Object.keys(formData.value).forEach(key => {
    formData.value[key] = currentAirline.value[key] || formData.value[key]
  })

  // Store original data for change detection
  originalData.value = deepClone(formData.value)
}

const trackChanges = () => {
  // This method is called on form field changes to trigger reactivity
  // The hasChanges computed property will automatically update
}

const validateIataCode = (value) => {
  if (value && !/^[A-Z]{2}$/.test(value)) {
    ElMessage.warning('IATA kodu 2 büyük harf olmalıdır')
  }
}

const validateIcaoCode = (value) => {
  if (value && !/^[A-Z]{3,4}$/.test(value)) {
    ElMessage.warning('ICAO kodu 3-4 büyük harf olmalıdır')
  }
}

const validateUniqueIataCode = async (rule, value, callback) => {
  if (!value) return callback()

  try {
    // Check if IATA code already exists (excluding current airline)
    const existingAirline = referenceStore.airlines.find(
      airline => airline.iataCode === value && airline.id !== airlineId.value
    )

    if (existingAirline) {
      callback(new Error('Bu IATA kodu zaten kullanılıyor'))
    } else {
      callback()
    }
  } catch (error) {
    callback()
  }
}

const validateUniqueIcaoCode = async (rule, value, callback) => {
  if (!value) return callback()

  try {
    // Check if ICAO code already exists (excluding current airline)
    const existingAirline = referenceStore.airlines.find(
      airline => airline.icaoCode === value && airline.id !== airlineId.value
    )

    if (existingAirline) {
      callback(new Error('Bu ICAO kodu zaten kullanılıyor'))
    } else {
      callback()
    }
  } catch (error) {
    callback()
  }
}

const saveChanges = async () => {
  if (!hasChanges.value) return

  saving.value = true

  try {
    // Validate all forms
    const basicValid = await basicFormRef.value?.validate().catch(() => false)
    const detailsValid = await detailsFormRef.value?.validate().catch(() => false)

    if (basicValid === false || detailsValid === false) {
      ElMessage.error('Lütfen form hatalarını düzeltin')
      return
    }

    // Prepare data for API
    const updateData = {
      ...formData.value,
      foundedYear: formData.value.foundedYear || undefined
    }

    // Remove empty optional fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '' || updateData[key] === null) {
        delete updateData[key]
      }
    })

    await referenceStore.updateAirline(airlineId.value, updateData)

    // Update original data to new values
    originalData.value = deepClone(formData.value)

    ElMessage.success('Havayolu başarıyla güncellendi')

  } catch (error) {
    console.error('Error updating airline:', error)
  } finally {
    saving.value = false
  }
}

const resetForm = () => {
  if (!originalData.value) return

  ElMessageBox.confirm(
    'Kaydedilmemiş değişiklikler kaybolacak. Devam etmek istiyor musunuz?',
    'Değişiklikleri Geri Al',
    {
      type: 'warning',
      confirmButtonText: 'Evet',
      cancelButtonText: 'Hayır'
    }
  ).then(() => {
    formData.value = deepClone(originalData.value)
    ElMessage.success('Değişiklikler geri alındı')
  }).catch(() => {
    // User cancelled
  })
}

const confirmDelete = async () => {
  try {
    deleteCheckResult.value = await referenceStore.checkAirlineDeletion(airlineId.value)
    showDeleteModal.value = true
  } catch (error) {
    ElMessage.error('Silme kontrolü yapılırken hata oluştu')
  }
}

const deleteAirline = async () => {
  deleting.value = true

  try {
    await referenceStore.deleteAirline(airlineId.value)
    ElMessage.success('Havayolu başarıyla silindi')
    router.push({ name: 'AirlineManagement' })
  } catch (error) {
    console.error('Error deleting airline:', error)
  } finally {
    deleting.value = false
    showDeleteModal.value = false
  }
}

const forceDeleteAirline = async () => {
  try {
    await ElMessageBox.confirm(
      'Bu işlem geri alınamaz ve tüm bağlı verileri silecektir!',
      'Zorla Silme Onayı',
      {
        type: 'error',
        confirmButtonText: 'Zorla Sil',
        cancelButtonText: 'İptal'
      }
    )

    deleting.value = true
    await referenceStore.deleteAirline(airlineId.value, true)
    ElMessage.success('Havayolu zorla silindi')
    router.push({ name: 'AirlineManagement' })

  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error force deleting airline:', error)
    }
  } finally {
    deleting.value = false
    showDeleteModal.value = false
  }
}

const loadStatistics = async () => {
  // Load airline statistics
  statisticsLoading.value = true
  try {
    // Mock statistics loading
    await new Promise(resolve => setTimeout(resolve, 1000))
  } catch (error) {
    console.error('Error loading statistics:', error)
  } finally {
    statisticsLoading.value = false
  }
}

const goBack = () => {
  if (hasChanges.value) {
    ElMessageBox.confirm(
      'Kaydedilmemiş değişiklikler var. Sayfadan çıkmak istiyor musunuz?',
      'Kaydedilmemiş Değişiklikler',
      {
        type: 'warning',
        confirmButtonText: 'Çık',
        cancelButtonText: 'Kal'
      }
    ).then(() => {
      router.back()
    }).catch(() => {
      // User cancelled
    })
  } else {
    router.back()
  }
}

const handleLogoError = () => {
  logoError.value = true
  ElMessage.warning('Logo yüklenemedi')
}

// Auto-save functionality
let autoSaveTimer = null
const setupAutoSave = () => {
  autoSaveTimer = setInterval(() => {
    if (hasChanges.value && !saving.value) {
      // Auto-save draft (could save to localStorage)
      console.log('Auto-saving draft...')
    }
  }, 30000) // Every 30 seconds
}

const cleanupAutoSave = () => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}

// Keyboard shortcuts
const handleKeydown = (event) => {
  // Ctrl/Cmd + S to save
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    if (hasChanges.value) {
      saveChanges()
    }
  }

  // Escape to reset
  if (event.key === 'Escape' && hasChanges.value) {
    resetForm()
  }
}

// Route leave guard
onBeforeRouteLeave((to, from, next) => {
  if (hasChanges.value) {
    ElMessageBox.confirm(
      'Kaydedilmemiş değişiklikler var. Sayfadan çıkmak istiyor musunuz?',
      'Kaydedilmemiş Değişiklikler',
      {
        type: 'warning',
        confirmButtonText: 'Çık',
        cancelButtonText: 'Kal'
      }
    ).then(() => {
      next()
    }).catch(() => {
      next(false)
    })
  } else {
    next()
  }
})

// Lifecycle
onMounted(async () => {
  await loadAirline()
  setupAutoSave()
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  cleanupAutoSave()
  document.removeEventListener('keydown', handleKeydown)
})

// Watch for route changes
watch(() => route.params.id, async (newId) => {
  if (newId && newId !== airlineId.value) {
    await loadAirline()
  }
})

// Page meta
definePageMeta({
  title: 'Havayolu Düzenle',
  breadcrumb: 'Havayolu Düzenle',
  requiresAuth: true,
  permissions: ['ADMIN']
})
</script>

<style scoped>
.airline-edit {
  padding: 0;
  max-width: 1200px;
  margin: 0 auto;
}

/* Page header */
.page-header {
  background: linear-gradient(135deg, var(--el-color-warning-light-3), var(--el-color-warning));
  color: white;
  padding: 32px 24px;
  margin: -24px -24px 32px -24px;
  border-radius: 0 0 16px 16px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
}

.header-info {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.page-description {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
  line-height: 1.4;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

/* Loading and error states */
.loading-section,
.error-section {
  padding: 0 24px;
}

/* Form section */
.form-section {
  padding: 0 24px;
}

.form-container {
  max-width: 900px;
  margin: 0 auto;
}

/* Changes indicator */
.changes-indicator {
  margin-bottom: 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}

/* Form tabs */
.form-tabs {
  margin-bottom: 32px;
}

.form-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 0;
}

/* Form layout */
.form-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}

.form-row .full-width {
  grid-column: span 2;
}

.field-help {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-top: 4px;
}

/* Logo preview */
.logo-preview-section {
  grid-column: span 2;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.logo-preview {
  padding: 16px;
  border: 2px dashed var(--el-border-color);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100px;
  background: var(--el-fill-color-extra-light);
}

.preview-image {
  max-width: 120px;
  max-height: 80px;
  object-fit: contain;
}

/* Form actions */
.form-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 0;
  border-top: 1px solid var(--el-border-color-light);
  position: sticky;
  bottom: 0;
  background: var(--el-bg-color);
  margin: 0 -24px;
  padding-left: 24px;
  padding-right: 24px;
}

.action-spacer {
  flex: 1;
}

/* Modal content */
.delete-confirmation {
  padding: 16px 0;
}

.delete-message {
  margin: 16px 0;
  font-size: 14px;
  line-height: 1.5;
}

.dependencies-info {
  margin-top: 16px;
  padding: 12px;
  background: var(--el-color-warning-light-9);
  border-radius: 4px;
}

.dependencies-info h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--el-color-warning-dark-2);
}

.dependencies-info ul {
  margin: 0;
  padding-left: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Tab styling */
:deep(.el-tabs__header) {
  margin-bottom: 24px;
}

:deep(.el-tabs__nav-wrap) {
  padding: 0 24px;
  background: var(--el-fill-color-extra-light);
  border-radius: 8px;
}

:deep(.el-tabs__item) {
  padding: 16px 24px;
  font-weight: 500;
}

:deep(.el-tabs__item.is-active) {
  color: var(--el-color-primary);
}

/* Alert styling */
:deep(.changes-indicator .el-alert) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Responsive design */
@media (max-width: 768px) {
  .airline-edit {
    padding: 0;
  }

  .page-header {
    padding: 24px 16px;
    margin: -24px -16px 24px -16px;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .header-actions {
    justify-content: center;
  }

  .loading-section,
  .error-section,
  .form-section {
    padding: 0 16px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .form-row .full-width {
    grid-column: span 1;
  }

  .logo-preview-section {
    grid-column: span 1;
  }

  .form-actions {
    flex-direction: column-reverse;
    gap: 12px;
    margin: 0 -16px;
    padding-left: 16px;
    padding-right: 16px;
  }

  .action-spacer {
    display: none;
  }

  .form-actions .el-button {
    width: 100%;
  }

  :deep(.el-tabs__nav-wrap) {
    padding: 0 16px;
  }

  :deep(.el-tabs__item) {
    padding: 12px 16px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 20px;
  }

  .header-actions {
    flex-direction: column;
  }

  :deep(.el-tabs__item) {
    padding: 10px 12px;
    font-size: 13px;
  }
}

/* Form validation states */
:deep(.el-form-item.is-error .el-input__wrapper) {
  border-color: var(--el-color-danger);
  box-shadow: 0 0 0 1px var(--el-color-danger-light-8);
}

:deep(.el-form-item.is-success .el-input__wrapper) {
  border-color: var(--el-color-success);
}

/* Loading skeleton */
:deep(.el-skeleton) {
  padding: 24px;
}

:deep(.el-skeleton__item) {
  margin-bottom: 16px;
}

/* Sticky elements */
.changes-indicator {
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  margin: -8px 0 24px 0;
  padding: 8px;
}

.form-actions {
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.95);
  border-top: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

/* Dark mode support */
.dark .changes-indicator {
  background: rgba(0, 0, 0, 0.95);
}

.dark .form-actions {
  background: rgba(0, 0, 0, 0.95);
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .form-card {
    border: 2px solid var(--el-border-color);
  }

  .logo-preview {
    border-width: 3px;
  }

  .changes-indicator {
    border: 2px solid var(--el-color-info);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .changes-indicator,
  .form-actions,
  .logo-preview {
    transition: none;
  }

  :deep(.el-tabs__item) {
    transition: none;
  }
}

/* Print styles */
@media print {
  .page-header {
    background: white !important;
    color: black !important;
    border-bottom: 2px solid black;
  }

  .header-actions,
  .changes-indicator,
  .form-actions {
    display: none;
  }

  :deep(.el-tabs__header) {
    display: none;
  }

  .form-card {
    box-shadow: none;
    border: 1px solid black;
  }
}

/* Focus states */
:deep(.el-input__wrapper:focus-within) {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

:deep(.el-select:focus-within .el-input__wrapper) {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

/* Animation for changes indicator */
.changes-indicator {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Smooth transitions */
.form-section,
.form-card {
  transition: all 0.3s ease;
}

/* Auto-save indicator */
.auto-save-indicator {
  position: fixed;
  top: 80px;
  right: 24px;
  background: var(--el-color-success);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 1000;
  transform: translateX(100%);
  transition: transform 0.3s ease;
}

.auto-save-indicator.show {
  transform: translateX(0);
}
</style>

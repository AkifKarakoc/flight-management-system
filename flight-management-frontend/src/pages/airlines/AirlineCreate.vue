<template>
  <div class="airline-create">
    <!-- Page header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">
            {{ isDuplicate ? 'Havayolu Kopyala' : 'Yeni Havayolu' }}
          </h1>
          <p class="page-description">
            {{ isDuplicate ? 'Mevcut havayolundan yeni havayolu oluşturun' : 'Yeni havayolu şirketi bilgilerini girin' }}
          </p>
        </div>
        <div class="header-actions">
          <BaseButton
            icon="ArrowLeft"
            @click="goBack"
          >
            Geri Dön
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Form section -->
    <div class="form-section">
      <div class="form-container">
        <!-- Progress indicator -->
        <div class="progress-section">
          <el-steps :active="currentStep" align-center>
            <el-step title="Temel Bilgiler" icon="InfoFilled" />
            <el-step title="Detaylar" icon="Document" />
            <el-step title="Önizleme" icon="View" />
          </el-steps>
        </div>

        <!-- Form content -->
        <div class="form-content">
          <!-- Step 1: Basic Information -->
          <div v-show="currentStep === 0" class="form-step">
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
                        @blur="generateCodes"
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
                      />
                    </el-form-item>

                    <el-form-item label="Havayolu Tipi" prop="type">
                      <BaseSelect
                        v-model="formData.type"
                        :options="airlineTypeOptions"
                        placeholder="Tip seçin"
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
                      />
                    </el-form-item>
                  </div>
                </div>
              </el-form>
            </BaseCard>
          </div>

          <!-- Step 2: Additional Details -->
          <div v-show="currentStep === 1" class="form-step">
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
                      />
                    </el-form-item>

                    <el-form-item label="İletişim E-posta" prop="contactEmail">
                      <BaseInput
                        v-model="formData.contactEmail"
                        placeholder="info@example.com"
                        prefix-icon="Message"
                      />
                    </el-form-item>
                  </div>

                  <div class="form-row">
                    <el-form-item label="Telefon" prop="phone">
                      <BaseInput
                        v-model="formData.phone"
                        placeholder="+90 212 123 45 67"
                        prefix-icon="Phone"
                      />
                    </el-form-item>

                    <el-form-item label="Kuruluş Yılı" prop="foundedYear">
                      <BaseInput
                        v-model.number="formData.foundedYear"
                        type="number"
                        placeholder="1933"
                        :min="1900"
                        :max="new Date().getFullYear()"
                      />
                    </el-form-item>
                  </div>

                  <div class="form-row">
                    <el-form-item label="Merkez Ofis" prop="headquarters">
                      <BaseInput
                        v-model="formData.headquarters"
                        placeholder="İstanbul, Türkiye"
                        prefix-icon="Location"
                      />
                    </el-form-item>

                    <el-form-item label="Logo URL" prop="logoUrl">
                      <BaseInput
                        v-model="formData.logoUrl"
                        placeholder="https://example.com/logo.png"
                        prefix-icon="Picture"
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
          </div>

          <!-- Step 3: Preview -->
          <div v-show="currentStep === 2" class="form-step">
            <BaseCard title="Önizleme ve Onay" class="form-card">
              <AirlinePreview
                :airline="formData"
                :is-create="true"
                @edit-basic="currentStep = 0"
                @edit-details="currentStep = 1"
              />
            </BaseCard>
          </div>
        </div>

        <!-- Navigation buttons -->
        <div class="form-navigation">
          <BaseButton
            v-if="currentStep > 0"
            icon="ArrowLeft"
            @click="previousStep"
          >
            Önceki
          </BaseButton>

          <div class="nav-spacer" />

          <BaseButton
            v-if="currentStep < 2"
            type="primary"
            icon="ArrowRight"
            :disabled="!canProceed"
            @click="nextStep"
          >
            Sonraki
          </BaseButton>

          <BaseButton
            v-if="currentStep === 2"
            type="success"
            icon="Check"
            :loading="creating"
            @click="createAirline"
          >
            {{ isDuplicate ? 'Kopyala' : 'Oluştur' }}
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import AirlinePreview from '@/components/reference/AirlinePreview.vue'

import { useReferenceStore } from '@/stores/reference'
import { airlineFormRules } from '@/utils/validation'
import { AIRLINE_TYPE } from '@/utils/constants'

// Composables
const route = useRoute()
const router = useRouter()
const referenceStore = useReferenceStore()

// Form refs
const basicFormRef = ref(null)
const detailsFormRef = ref(null)

// Reactive state
const currentStep = ref(0)
const creating = ref(false)
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

// Computed properties
const isDuplicate = computed(() => !!route.query.duplicate)

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

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0:
      return formData.value.name &&
        formData.value.iataCode &&
        formData.value.icaoCode &&
        formData.value.country &&
        formData.value.type
    case 1:
      return true // Details are optional
    case 2:
      return true
    default:
      return false
  }
})

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
const generateCodes = () => {
  if (!formData.value.name) return

  const name = formData.value.name.trim()

  // Auto-generate IATA code if empty
  if (!formData.value.iataCode) {
    const words = name.split(' ')
    if (words.length >= 2) {
      formData.value.iataCode = (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
    } else {
      formData.value.iataCode = name.substring(0, 2).toUpperCase()
    }
  }

  // Auto-generate ICAO code if empty
  if (!formData.value.icaoCode) {
    const words = name.split(' ')
    if (words.length >= 2) {
      formData.value.icaoCode = words[0].substring(0, 3).toUpperCase()
    } else {
      formData.value.icaoCode = name.substring(0, 3).toUpperCase()
    }
  }
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
    // Check if IATA code already exists
    const existingAirline = referenceStore.airlines.find(
      airline => airline.iataCode === value
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
    // Check if ICAO code already exists
    const existingAirline = referenceStore.airlines.find(
      airline => airline.icaoCode === value
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

const nextStep = async () => {
  let isValid = false

  if (currentStep.value === 0) {
    isValid = await basicFormRef.value?.validate().catch(() => false)
  } else if (currentStep.value === 1) {
    isValid = await detailsFormRef.value?.validate().catch(() => false)
  }

  if (isValid !== false) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const createAirline = async () => {
  creating.value = true

  try {
    // Final validation
    const basicValid = await basicFormRef.value?.validate().catch(() => false)
    const detailsValid = await detailsFormRef.value?.validate().catch(() => false)

    if (basicValid === false || detailsValid === false) {
      ElMessage.error('Lütfen form hatalarını düzeltin')
      return
    }

    // Prepare data for API
    const airlineData = {
      ...formData.value,
      foundedYear: formData.value.foundedYear || undefined
    }

    // Remove empty optional fields
    Object.keys(airlineData).forEach(key => {
      if (airlineData[key] === '' || airlineData[key] === null) {
        delete airlineData[key]
      }
    })

    await referenceStore.createAirline(airlineData)

    ElMessage.success('Havayolu başarıyla oluşturuldu')
    router.push({ name: 'AirlineManagement' })

  } catch (error) {
    console.error('Error creating airline:', error)
  } finally {
    creating.value = false
  }
}

const goBack = () => {
  router.back()
}

const handleLogoError = () => {
  logoError.value = true
  ElMessage.warning('Logo yüklenemedi')
}

// Initialize form data from duplicate query
const initializeFormData = () => {
  if (isDuplicate.value && route.query.duplicate) {
    try {
      const duplicateData = JSON.parse(route.query.duplicate)
      Object.assign(formData.value, duplicateData)
    } catch (error) {
      console.error('Error parsing duplicate data:', error)
    }
  }
}

// Lifecycle
onMounted(() => {
  initializeFormData()
})

// Page meta
definePageMeta({
  title: 'Yeni Havayolu',
  breadcrumb: 'Yeni Havayolu',
  requiresAuth: true,
  permissions: ['ADMIN']
})
</script>

<style scoped>
.airline-create {
  padding: 0;
  max-width: 1200px;
  margin: 0 auto;
}

/* Page header */
.page-header {
  background: linear-gradient(135deg, var(--el-color-success-light-3), var(--el-color-success));
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
  flex-shrink: 0;
}

/* Form section */
.form-section {
  padding: 0 24px;
}

.form-container {
  max-width: 800px;
  margin: 0 auto;
}

/* Progress */
.progress-section {
  margin-bottom: 32px;
}

/* Form content */
.form-content {
  margin-bottom: 32px;
}

.form-step {
  min-height: 400px;
}

.form-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
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

/* Navigation */
.form-navigation {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 0;
  border-top: 1px solid var(--el-border-color-light);
}

.nav-spacer {
  flex: 1;
}

/* Responsive design */
@media (max-width: 768px) {
  .airline-create {
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

  .form-navigation {
    flex-direction: column-reverse;
    gap: 12px;
  }

  .nav-spacer {
    display: none;
  }

  .form-navigation .el-button {
    width: 100%;
  }
}

/* Form validation styles */
:deep(.el-form-item.is-error .el-input__wrapper) {
  border-color: var(--el-color-danger);
}

:deep(.el-form-item.is-success .el-input__wrapper) {
  border-color: var(--el-color-success);
}

/* Steps styling */
:deep(.el-steps) {
  margin-bottom: 0;
}

:deep(.el-step__title) {
  font-size: 14px;
  line-height: 1.4;
}

/* High contrast mode */
@media (prefers-contrast: more) {
  .form-card {
    border: 2px solid var(--el-border-color);
  }

  .logo-preview {
    border-width: 3px;
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
  .progress-section,
  .form-navigation {
    display: none;
  }

  .form-step {
    min-height: auto;
  }
}
</style>

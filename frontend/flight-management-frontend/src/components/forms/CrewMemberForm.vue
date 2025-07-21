<template>
  <div class="crew-member-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="140px"
      label-position="left"
      class="form-container"
      @submit.prevent="handleSubmit"
    >
      <!-- Personal Information -->
      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Avatar /></el-icon>
            <span>Kişisel Bilgiler</span>
          </div>
        </template>

        <div class="form-grid">
          <!-- Employee ID -->
          <el-form-item label="Çalışan No" prop="employeeId">
            <el-input
              v-model="formData.employeeId"
              placeholder="Örn: EMP001, CR2024001"
              maxlength="20"
              show-word-limit
              :disabled="submitting"
              @input="formatEmployeeId"
            >
              <template #prefix>
                <el-icon><Document /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- License Number -->
          <el-form-item label="Lisans No" prop="licenseNumber">
            <el-input
              v-model="formData.licenseNumber"
              placeholder="Pilot/Kabin lisans numarası"
              maxlength="30"
              show-word-limit
              :disabled="submitting"
            >
              <template #prefix>
                <el-icon><Ticket /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- First Name -->
          <el-form-item label="Ad" prop="firstName">
            <el-input
              v-model="formData.firstName"
              placeholder="Ad"
              maxlength="50"
              :disabled="submitting"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- Last Name -->
          <el-form-item label="Soyad" prop="lastName">
            <el-input
              v-model="formData.lastName"
              placeholder="Soyad"
              maxlength="50"
              :disabled="submitting"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- Birth Date -->
          <el-form-item label="Doğum Tarihi" prop="birthDate">
            <el-date-picker
              v-model="formData.birthDate"
              type="date"
              placeholder="Doğum tarihi seçin"
              :disabled="submitting"
              :disabled-date="disabledBirthDate"
              class="full-width"
              format="DD.MM.YYYY"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>

          <!-- Nationality -->
          <el-form-item label="Uyruk" prop="nationality">
            <el-select
              v-model="formData.nationality"
              placeholder="Uyruk seçin"
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
        </div>
      </el-card>

      <!-- Professional Information -->
      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Briefcase /></el-icon>
            <span>Mesleki Bilgiler</span>
          </div>
        </template>

        <div class="form-grid">
          <!-- Role -->
          <el-form-item label="Görev" prop="role">
            <el-select
              v-model="formData.role"
              placeholder="Görev seçin"
              :disabled="submitting"
              class="full-width"
              @change="handleRoleChange"
            >
              <el-option label="Kaptan Pilot" value="CAPTAIN">
                <div class="role-option">
                  <span class="role-name">Kaptan Pilot</span>
                  <span class="role-desc">Ana pilot, uçuş sorumlusu</span>
                </div>
              </el-option>
              <el-option label="Yardımcı Pilot" value="FIRST_OFFICER">
                <div class="role-option">
                  <span class="role-name">Yardımcı Pilot</span>
                  <span class="role-desc">İkinci pilot</span>
                </div>
              </el-option>
              <el-option label="Uçuş Mühendisi" value="FLIGHT_ENGINEER">
                <div class="role-option">
                  <span class="role-name">Uçuş Mühendisi</span>
                  <span class="role-desc">Teknik sistem sorumlusu</span>
                </div>
              </el-option>
              <el-option label="Kabin Görevlisi" value="CABIN_CREW">
                <div class="role-option">
                  <span class="role-name">Kabin Görevlisi</span>
                  <span class="role-desc">Yolcu hizmetleri</span>
                </div>
              </el-option>
            </el-select>
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

          <!-- Experience Years -->
          <el-form-item label="Deneyim (Yıl)" prop="experienceYears">
            <el-input-number
              v-model="formData.experienceYears"
              :min="0"
              :max="50"
              :precision="1"
              placeholder="Yıl"
              :disabled="submitting"
              class="full-width"
            />
          </el-form-item>

          <!-- Total Flight Hours -->
          <el-form-item label="Toplam Uçuş Saati" prop="totalFlightHours">
            <el-input-number
              v-model="formData.totalFlightHours"
              :min="0"
              :precision="1"
              placeholder="Saat"
              :disabled="submitting"
              class="full-width"
            />
          </el-form-item>

          <!-- Hire Date -->
          <el-form-item label="İşe Giriş Tarihi" prop="hireDate">
            <el-date-picker
              v-model="formData.hireDate"
              type="date"
              placeholder="İşe giriş tarihi seçin"
              :disabled="submitting"
              :disabled-date="disabledHireDate"
              class="full-width"
              format="DD.MM.YYYY"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>

          <!-- Employment Status -->
          <el-form-item label="İstihdam Durumu" prop="employmentStatus">
            <el-select
              v-model="formData.employmentStatus"
              placeholder="İstihdam durumu seçin"
              :disabled="submitting"
              class="full-width"
            >
              <el-option label="Aktif" value="ACTIVE" />
              <el-option label="İzinli" value="ON_LEAVE" />
              <el-option label="Askıda" value="SUSPENDED" />
              <el-option label="Emekli" value="RETIRED" />
              <el-option label="İstifa" value="RESIGNED" />
            </el-select>
          </el-form-item>
        </div>
      </el-card>

      <!-- Qualifications and Certifications -->
      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Medal /></el-icon>
            <span>Yeterlilikler ve Sertifikalar</span>
          </div>
        </template>

        <div class="form-grid">
          <!-- Aircraft Types -->
          <el-form-item label="Uçak Tipleri" prop="qualifiedAircraftTypes" class="form-item-full">
            <el-select
              v-model="formData.qualifiedAircraftTypes"
              multiple
              filterable
              placeholder="Nitelikli olduğu uçak tiplerini seçin"
              :disabled="submitting"
              class="full-width"
            >
              <el-option
                v-for="type in aircraftTypes"
                :key="type.code"
                :label="`${type.code} - ${type.name}`"
                :value="type.code"
              />
            </el-select>
            <div class="help-text">Bu kişinin uçurabileceği/görev yapabileceği uçak tipleri</div>
          </el-form-item>

          <!-- Languages -->
          <el-form-item label="Diller" prop="languages" class="form-item-full">
            <el-select
              v-model="formData.languages"
              multiple
              filterable
              allow-create
              placeholder="Konuştuğu dilleri seçin/ekleyin"
              :disabled="submitting"
              class="full-width"
            >
              <el-option label="Türkçe" value="TR" />
              <el-option label="İngilizce" value="EN" />
              <el-option label="Almanca" value="DE" />
              <el-option label="Fransızca" value="FR" />
              <el-option label="İspanyolca" value="ES" />
              <el-option label="İtalyanca" value="IT" />
              <el-option label="Rusça" value="RU" />
              <el-option label="Arapça" value="AR" />
              <el-option label="Çince" value="ZH" />
              <el-option label="Japonca" value="JA" />
            </el-select>
          </el-form-item>

          <!-- Medical Certificate Expiry -->
          <el-form-item label="Sağlık Raporu Geçerlilik" prop="medicalCertificateExpiry">
            <el-date-picker
              v-model="formData.medicalCertificateExpiry"
              type="date"
              placeholder="Sağlık raporu bitiş tarihi"
              :disabled="submitting"
              class="full-width"
              format="DD.MM.YYYY"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>

          <!-- License Expiry -->
          <el-form-item label="Lisans Geçerlilik" prop="licenseExpiry">
            <el-date-picker
              v-model="formData.licenseExpiry"
              type="date"
              placeholder="Lisans bitiş tarihi"
              :disabled="submitting"
              class="full-width"
              format="DD.MM.YYYY"
              value-format="YYYY-MM-DD"
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
          <!-- Email -->
          <el-form-item label="E-posta" prop="email">
            <el-input
              v-model="formData.email"
              type="email"
              placeholder="ornek@havayolu.com"
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
              placeholder="+90 555 123 45 67"
              :disabled="submitting"
            >
              <template #prefix>
                <el-icon><Phone /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- Emergency Contact -->
          <el-form-item label="Acil Durum İletişim" prop="emergencyContact" class="form-item-full">
            <el-input
              v-model="formData.emergencyContact"
              placeholder="Acil durum iletişim kişisi ve telefonu"
              :disabled="submitting"
            >
              <template #prefix>
                <el-icon><Warning /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- Address -->
          <el-form-item label="Adres" prop="address" class="form-item-full">
            <el-input
              v-model="formData.address"
              type="textarea"
              :rows="2"
              placeholder="Ev adresi"
              maxlength="200"
              show-word-limit
              :disabled="submitting"
            />
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
          <!-- Active Status -->
          <el-form-item label="Aktif Durum" prop="active">
            <el-switch
              v-model="formData.active"
              active-text="Aktif"
              inactive-text="Pasif"
              :disabled="submitting"
            />
          </el-form-item>

          <!-- Notes -->
          <el-form-item label="Notlar" prop="notes" class="form-item-full">
            <el-input
              v-model="formData.notes"
              type="textarea"
              :rows="3"
              placeholder="Mürettebat üyesi hakkında ek notlar..."
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
  Avatar,
  Document,
  Ticket,
  User,
  Briefcase,
  Medal,
  Phone,
  Message,
  Warning,
  InfoFilled
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
const airlinesLoading = ref(false)

// Form data
const formData = reactive({
  employeeId: '',
  licenseNumber: '',
  firstName: '',
  lastName: '',
  birthDate: '',
  nationality: 'TR',
  role: '',
  airlineId: null,
  experienceYears: null,
  totalFlightHours: null,
  hireDate: '',
  employmentStatus: 'ACTIVE',
  qualifiedAircraftTypes: [],
  languages: ['TR', 'EN'],
  medicalCertificateExpiry: '',
  licenseExpiry: '',
  email: '',
  phone: '',
  emergencyContact: '',
  address: '',
  active: true,
  notes: '',
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
  { code: 'CA', name: 'Kanada', flag: '🇨🇦' },
  { code: 'AU', name: 'Avustralya', flag: '🇦🇺' }
])

const aircraftTypes = ref([
  { code: 'A320', name: 'Airbus A320' },
  { code: 'A321', name: 'Airbus A321' },
  { code: 'A330', name: 'Airbus A330' },
  { code: 'A340', name: 'Airbus A340' },
  { code: 'A350', name: 'Airbus A350' },
  { code: 'A380', name: 'Airbus A380' },
  { code: 'B737', name: 'Boeing 737' },
  { code: 'B747', name: 'Boeing 747' },
  { code: 'B777', name: 'Boeing 777' },
  { code: 'B787', name: 'Boeing 787' },
  { code: 'ATR72', name: 'ATR 72' },
  { code: 'DHC8', name: 'Bombardier Dash 8' }
])

// Computed
const airlines = computed(() => {
  return referenceStore.airlines
})

// Form validation rules
const formRules = {
  employeeId: [
    { required: true, message: 'Çalışan numarası gereklidir', trigger: 'blur' },
    { min: 3, max: 20, message: '3-20 karakter arasında olmalıdır', trigger: 'blur' }
  ],
  firstName: [
    { required: true, message: 'Ad gereklidir', trigger: 'blur' },
    { min: 2, max: 50, message: '2-50 karakter arasında olmalıdır', trigger: 'blur' }
  ],
  lastName: [
    { required: true, message: 'Soyad gereklidir', trigger: 'blur' },
    { min: 2, max: 50, message: '2-50 karakter arasında olmalıdır', trigger: 'blur' }
  ],
  birthDate: [
    { required: true, message: 'Doğum tarihi gereklidir', trigger: 'change' }
  ],
  nationality: [
    { required: true, message: 'Uyruk seçimi gereklidir', trigger: 'change' }
  ],
  role: [
    { required: true, message: 'Görev seçimi gereklidir', trigger: 'change' }
  ],
  airlineId: [
    { required: true, message: 'Havayolu seçimi gereklidir', trigger: 'change' }
  ],
  email: [
    { type: 'email', message: 'Geçerli bir e-posta adresi girin', trigger: 'blur' }
  ],
  experienceYears: [
    { type: 'number', min: 0, message: 'Geçerli bir deneyim süresi girin', trigger: 'blur' }
  ],
  totalFlightHours: [
    { type: 'number', min: 0, message: 'Geçerli bir uçuş saati girin', trigger: 'blur' }
  ]
}

// Methods
function formatEmployeeId() {
  formData.employeeId = formData.employeeId.toUpperCase()
}

function handleRoleChange(role) {
  // Auto-suggest qualified aircraft types based on role
  if (role === 'CABIN_CREW') {
    // Cabin crew can work on most aircraft types
    formData.qualifiedAircraftTypes = ['A320', 'A321', 'B737']
  } else if (role === 'CAPTAIN' || role === 'FIRST_OFFICER') {
    // Pilots typically start with smaller aircraft
    formData.qualifiedAircraftTypes = ['A320']
  }
}

// Date validation functions
function disabledBirthDate(time) {
  const today = new Date()
  const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
  const seventyYearsAgo = new Date(today.getFullYear() - 70, today.getMonth(), today.getDate())

  return time > eighteenYearsAgo || time < seventyYearsAgo
}

function disabledHireDate(time) {
  const today = new Date()
  const fiftyYearsAgo = new Date(today.getFullYear() - 50, today.getMonth(), today.getDate())

  return time > today || time < fiftyYearsAgo
}

async function handleSubmit() {
  if (!formRef.value) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    // Additional validation
    const birthDate = new Date(formData.birthDate)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()

    if (age < 18) {
      ElMessage.error('Mürettebat üyesi en az 18 yaşında olmalıdır')
      return
    }

    if (age > 65) {
      ElMessage.error('Mürettebat üyesi 65 yaşından büyük olamaz')
      return
    }

    // Check license and medical certificate expiry dates
    if (formData.licenseExpiry && new Date(formData.licenseExpiry) < today) {
      ElMessage.warning('Lisans geçerlilik tarihi geçmiş')
    }

    if (formData.medicalCertificateExpiry && new Date(formData.medicalCertificateExpiry) < today) {
      ElMessage.warning('Sağlık raporu geçerlilik tarihi geçmiş')
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

  // Focus first input
  setTimeout(() => {
    const firstInput = document.querySelector('.crew-member-form input')
    if (firstInput) {
      firstInput.focus()
    }
  }, 100)
})
</script>

<style scoped lang="scss">
.crew-member-form {
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

  .role-option {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    .role-name {
      font-weight: 600;
      color: #303133;
    }

    .role-desc {
      font-size: 0.875rem;
      color: #909399;
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
  .crew-member-form {
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

// Input styling
:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-date-editor) {
  width: 100%;
}

:deep(.el-select) {
  width: 100%;
}

// Select dropdown styling for roles
:deep(.el-select-dropdown__item) {
  padding: 12px 20px;
  line-height: 1.4;
}

// Multi-select styling
:deep(.el-select .el-select__tags) {
  max-height: 80px;
  overflow-y: auto;
}

// Textarea styling
:deep(.el-textarea .el-textarea__inner) {
  resize: vertical;
  min-height: 60px;
}

// Switch styling
:deep(.el-switch) {
  &.is-checked .el-switch__core {
    background-color: #67c23a;
  }
}

// Form item label styling
:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

// Error message styling
:deep(.el-form-item__error) {
  font-size: 0.75rem;
  color: #f56c6c;
  margin-top: 0.25rem;
}
</style>

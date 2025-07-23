<template>
  <div class="flight-upload">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="page-title">
          <el-icon size="28"><Upload /></el-icon>
          <h1>Toplu Uçuş Yükleme</h1>
          <el-tag type="info" size="large">CSV Dosyası</el-tag>
        </div>

        <div class="header-actions">
          <el-button @click="goBack" :disabled="uploading">
            <el-icon><ArrowLeft /></el-icon>
            Geri Dön
          </el-button>

          <el-button
            @click="downloadTemplate"
            :disabled="uploading"
            :loading="templateLoading"
          >
            <el-icon><Download /></el-icon>
            Şablon İndir
          </el-button>

          <el-dropdown @command="handleQuickAction">
            <el-button :disabled="uploading">
              <el-icon><MoreFilled /></el-icon>
              Yardım
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="guide" :icon="Document">
                  Kullanım Kılavuzu
                </el-dropdown-item>
                <el-dropdown-item command="examples" :icon="View">
                  Örnek Veriler
                </el-dropdown-item>
                <el-dropdown-item command="validation" :icon="CircleCheck">
                  Doğrulama Kuralları
                </el-dropdown-item>
                <el-dropdown-item command="clear" :icon="Delete">
                  Formu Temizle
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- Upload Statistics -->
      <div v-if="uploadResult" class="upload-stats">
        <div class="stat-card success">
          <div class="stat-icon">
            <el-icon><Check /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ uploadResult.successCount || 0 }}</div>
            <div class="stat-label">Başarılı</div>
          </div>
        </div>

        <div class="stat-card error">
          <div class="stat-icon">
            <el-icon><Close /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ uploadResult.errorCount || 0 }}</div>
            <div class="stat-label">Hatalı</div>
          </div>
        </div>

        <div class="stat-card total">
          <div class="stat-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ uploadResult.totalCount || 0 }}</div>
            <div class="stat-label">Toplam</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Steps -->
    <div class="upload-steps">
      <el-steps :active="currentStep" finish-status="success" align-center>
        <el-step title="Dosya Seçimi" :icon="Upload" />
        <el-step title="Doğrulama" :icon="CircleCheck" />
        <el-step title="Yükleme" :icon="Loading" />
        <el-step title="Sonuç" :icon="Check" />
      </el-steps>
    </div>

    <!-- Step 1: File Selection -->
    <div v-show="currentStep === 0" class="step-container">
      <el-card class="upload-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Upload /></el-icon>
            <span>CSV Dosyası Seçin</span>
          </div>
        </template>

        <div class="upload-area">
          <el-upload
            ref="uploadRef"
            class="upload-dragger"
            drag
            :auto-upload="false"
            :show-file-list="false"
            accept=".csv"
            :on-change="handleFileSelect"
            :disabled="uploading"
          >
            <div class="upload-content">
              <el-icon class="upload-icon"><UploadFilled /></el-icon>
              <div class="upload-text">
                <p>Dosyayı buraya sürükleyin veya <em>tıklayarak seçin</em></p>
                <p class="upload-hint">Sadece .csv dosyaları kabul edilir</p>
              </div>
            </div>
          </el-upload>

          <!-- Selected File Info -->
          <div v-if="selectedFile" class="file-info">
            <el-alert
              :title="`Seçilen Dosya: ${selectedFile.name}`"
              type="success"
              :closable="false"
              show-icon
            >
              <template #default>
                <div class="file-details">
                  <span>Boyut: {{ formatFileSize(selectedFile.size) }}</span>
                  <span>Tarih: {{ formatDate(selectedFile.lastModified) }}</span>
                </div>
              </template>
            </el-alert>
          </div>

          <!-- Upload Options -->
          <div v-if="selectedFile" class="upload-options">
            <el-form :model="uploadOptions" label-width="150px">
              <el-form-item label="Doğrulama Atla">
                <el-switch
                  v-model="uploadOptions.skipValidation"
                  active-text="Evet"
                  inactive-text="Hayır"
                />
                <div class="option-help">
                  Doğrulama atlanırsa hatalı veriler de yüklenebilir
                </div>
              </el-form-item>

              <el-form-item label="Mevcut Üzerine Yaz">
                <el-switch
                  v-model="uploadOptions.overwriteExisting"
                  active-text="Evet"
                  inactive-text="Hayır"
                />
                <div class="option-help">
                  Aynı uçuş numarası ve tarihte kayıt varsa üzerine yaz
                </div>
              </el-form-item>

              <el-form-item label="Test Modu">
                <el-switch
                  v-model="uploadOptions.testMode"
                  active-text="Evet"
                  inactive-text="Hayır"
                />
                <div class="option-help">
                  Test modunda veriler gerçekten kaydedilmez
                </div>
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="step-actions">
          <el-button
            type="primary"
            @click="validateFile"
            :disabled="!selectedFile || uploading"
            :loading="validating"
          >
            Dosyayı Doğrula
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- Step 2: Validation -->
    <div v-show="currentStep === 1" class="step-container">
      <el-card class="validation-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><CircleCheck /></el-icon>
            <span>Doğrulama Sonuçları</span>
          </div>
        </template>

        <div v-if="validating" class="validation-loading">
          <el-skeleton animated :rows="5" />
          <div class="loading-text">Dosya doğrulanıyor...</div>
        </div>

        <div v-else-if="validationResult" class="validation-results">
          <!-- Summary -->
          <div class="validation-summary">
            <el-alert
              :title="`${validationResult.validRows} geçerli, ${validationResult.invalidRows} geçersiz kayıt`"
              :type="validationResult.invalidRows === 0 ? 'success' : 'warning'"
              :closable="false"
              show-icon
            />
          </div>

          <!-- Errors -->
          <div v-if="validationResult.errors.length > 0" class="validation-errors">
            <h4>Hatalar</h4>
            <el-table :data="validationResult.errors" style="width: 100%" max-height="300">
              <el-table-column prop="row" label="Satır" width="80" />
              <el-table-column prop="field" label="Alan" width="120" />
              <el-table-column prop="message" label="Hata Mesajı" />
              <el-table-column prop="value" label="Değer" width="150" />
            </el-table>
          </div>

          <!-- Warnings -->
          <div v-if="validationResult.warnings.length > 0" class="validation-warnings">
            <h4>Uyarılar</h4>
            <el-table :data="validationResult.warnings" style="width: 100%" max-height="200">
              <el-table-column prop="row" label="Satır" width="80" />
              <el-table-column prop="message" label="Uyarı Mesajı" />
            </el-table>
          </div>

          <!-- Sample Data Preview -->
          <div v-if="validationResult.sampleData.length > 0" class="sample-preview">
            <h4>Örnek Veriler (İlk 5 Kayıt)</h4>
            <el-table :data="validationResult.sampleData" style="width: 100%" size="small">
              <el-table-column prop="flightNumber" label="Uçuş No" width="100" />
              <el-table-column prop="airline" label="Havayolu" width="120" />
              <el-table-column prop="route" label="Rota" width="150" />
              <el-table-column prop="date" label="Tarih" width="100" />
              <el-table-column prop="departure" label="Kalkış" width="80" />
              <el-table-column prop="arrival" label="Varış" width="80" />
            </el-table>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="step-actions">
          <el-button @click="previousStep" :disabled="uploading">
            <el-icon><ArrowLeft /></el-icon>
            Önceki
          </el-button>

          <el-button
            type="primary"
            @click="startUpload"
            :disabled="!canProceedUpload || uploading"
            :loading="uploading"
          >
            Yüklemeyi Başlat
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- Step 3: Upload Progress -->
    <div v-show="currentStep === 2" class="step-container">
      <el-card class="upload-progress-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Loading /></el-icon>
            <span>Yükleme İşlemi</span>
          </div>
        </template>

        <div class="upload-progress">
          <div class="progress-info">
            <h3>{{ uploadOptions.testMode ? 'Test' : 'Yükleme' }} İşlemi Devam Ediyor...</h3>
            <p>Lütfen bu sayfayı kapatmayın</p>
          </div>

          <el-progress
            :percentage="uploadProgress"
            :status="uploadStatus"
            stroke-width="12"
            text-inside
          />

          <div class="progress-details">
            <div class="detail-item">
              <span class="label">İşlenen:</span>
              <span class="value">{{ processedCount }} / {{ totalCount }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Başarılı:</span>
              <span class="value success">{{ successCount }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Hatalı:</span>
              <span class="value error">{{ errorCount }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Kalan Süre:</span>
              <span class="value">{{ estimatedTime }}</span>
            </div>
          </div>

          <!-- Live Log -->
          <div class="upload-log">
            <h4>İşlem Günlüğü</h4>
            <div class="log-container">
              <div
                v-for="(log, index) in uploadLogs"
                :key="index"
                :class="['log-entry', log.type]"
              >
                <span class="log-time">{{ formatTime(log.timestamp) }}</span>
                <span class="log-message">{{ log.message }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Step 4: Results -->
    <div v-show="currentStep === 3" class="step-container">
      <el-card class="results-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Check /></el-icon>
            <span>Yükleme Tamamlandı</span>
          </div>
        </template>

        <div v-if="uploadResult" class="upload-results">
          <!-- Success Message -->
          <div class="result-summary">
            <el-result
              :icon="uploadResult.errorCount === 0 ? 'success' : 'warning'"
              :title="uploadResult.errorCount === 0 ? 'Tüm kayıtlar başarıyla yüklendi!' : 'Yükleme kısmen başarılı'"
              :sub-title="`${uploadResult.successCount} başarılı, ${uploadResult.errorCount} hatalı kayıt`"
            >
              <template #extra>
                <div class="result-actions">
                  <el-button type="primary" @click="viewUploadedFlights">
                    Yüklenen Uçuşları Gör
                  </el-button>
                  <el-button @click="downloadReport">
                    Rapor İndir
                  </el-button>
                  <el-button @click="startNewUpload">
                    Yeni Yükleme
                  </el-button>
                </div>
              </template>
            </el-result>
          </div>

          <!-- Error Details -->
          <div v-if="uploadResult.errors?.length > 0" class="error-details">
            <h4>Hatalı Kayıtlar</h4>
            <el-table :data="uploadResult.errors" style="width: 100%" max-height="300">
              <el-table-column prop="row" label="Satır" width="80" />
              <el-table-column prop="flightNumber" label="Uçuş No" width="100" />
              <el-table-column prop="error" label="Hata" />
            </el-table>
          </div>

          <!-- Success Summary -->
          <div v-if="uploadResult.successCount > 0" class="success-summary">
            <h4>Başarılı İşlemler</h4>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="Yüklenen Uçuş Sayısı">
                {{ uploadResult.successCount }}
              </el-descriptions-item>
              <el-descriptions-item label="İşlem Süresi">
                {{ formatDuration(uploadResult.duration) }}
              </el-descriptions-item>
              <el-descriptions-item label="Ortalama Hız">
                {{ Math.round(uploadResult.successCount / (uploadResult.duration / 1000)) }} kayıt/sn
              </el-descriptions-item>
              <el-descriptions-item label="Dosya Boyutu">
                {{ formatFileSize(selectedFile?.size || 0) }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Help & Guide Dialog -->
    <el-dialog
      v-model="guideDialogVisible"
      title="Kullanım Kılavuzu"
      width="800px"
    >
      <div class="guide-content">
        <el-tabs v-model="activeGuideTab">
          <el-tab-pane label="Genel Bilgiler" name="general">
            <div class="guide-section">
              <h3>CSV Dosyası Formatı</h3>
              <p>Yükleme işlemi için CSV dosyanızın aşağıdaki formatta olması gerekmektedir:</p>

              <el-table :data="csvFormat" style="width: 100%" size="small">
                <el-table-column prop="field" label="Alan Adı" width="150" />
                <el-table-column prop="type" label="Veri Tipi" width="100" />
                <el-table-column prop="required" label="Zorunlu" width="80" />
                <el-table-column prop="example" label="Örnek" />
                <el-table-column prop="description" label="Açıklama" />
              </el-table>
            </div>
          </el-tab-pane>

          <el-tab-pane label="Örnekler" name="examples">
            <div class="guide-section">
              <h3>Örnek CSV Verisi</h3>
              <pre class="csv-example">{{ csvExample }}</pre>

              <h3>Sık Karşılaşılan Hatalar</h3>
              <ul class="error-list">
                <li><strong>Geçersiz tarih formatı:</strong> Tarihler YYYY-MM-DD formatında olmalıdır</li>
                <li><strong>Eksik uçak kayıtları:</strong> Belirtilen uçak sistemde mevcut olmalıdır</li>
                <li><strong>Havaalanı kodu hatası:</strong> IATA kodları 3 karakter olmalıdır</li>
                <li><strong>Zaman çakışması:</strong> Aynı uçak için çakışan zamanlar</li>
              </ul>
            </div>
          </el-tab-pane>

          <el-tab-pane label="Kurallar" name="rules">
            <div class="guide-section">
              <h3>Doğrulama Kuralları</h3>
              <el-alert
                title="Önemli Notlar"
                description="Bu kurallar dosyanız yüklenirken kontrol edilir"
                type="info"
                :closable="false"
                show-icon
              />

              <div class="rules-list">
                <div class="rule-item">
                  <el-icon><Check /></el-icon>
                  <span>Uçuş numaraları benzersiz olmalıdır (aynı tarih için)</span>
                </div>
                <div class="rule-item">
                  <el-icon><Check /></el-icon>
                  <span>Varış zamanı kalkış zamanından sonra olmalıdır</span>
                </div>
                <div class="rule-item">
                  <el-icon><Check /></el-icon>
                  <span>Yolcu sayısı uçak kapasitesini aşmamalıdır</span>
                </div>
                <div class="rule-item">
                  <el-icon><Check /></el-icon>
                  <span>Havaalanı kodları sistemde kayıtlı olmalıdır</span>
                </div>
                <div class="rule-item">
                  <el-icon><Check /></el-icon>
                  <span>Uçuş tarihi geçmiş bir tarih olmamalıdır</span>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <template #footer>
        <el-button @click="guideDialogVisible = false">Kapat</el-button>
        <el-button type="primary" @click="downloadTemplate">
          Şablon İndir
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Upload,
  ArrowLeft,
  ArrowRight,
  Download,
  MoreFilled,
  Document,
  View,
  CircleCheck,
  Delete,
  Check,
  Close,
  Loading,
  UploadFilled
} from '@element-plus/icons-vue'
import { useFlightStore } from '@/stores/flight'
import dayjs from 'dayjs'

// Router and stores
const router = useRouter()
const flightStore = useFlightStore()

// Refs
const uploadRef = ref(null)

// State
const currentStep = ref(0)
const uploading = ref(false)
const validating = ref(false)
const templateLoading = ref(false)

// File and upload data
const selectedFile = ref(null)
const validationResult = ref(null)
const uploadResult = ref(null)

// Upload options
const uploadOptions = reactive({
  skipValidation: false,
  overwriteExisting: false,
  testMode: false
})

// Progress tracking
const uploadProgress = ref(0)
const uploadStatus = ref('')
const processedCount = ref(0)
const totalCount = ref(0)
const successCount = ref(0)
const errorCount = ref(0)
const estimatedTime = ref('--:--')
const uploadLogs = ref([])

// Dialog states
const guideDialogVisible = ref(false)
const activeGuideTab = ref('general')

// CSV format definition
const csvFormat = ref([
  {
    field: 'flightNumber',
    type: 'String',
    required: 'Evet',
    example: 'TK101',
    description: 'Benzersiz uçuş numarası'
  },
  {
    field: 'airlineCode',
    type: 'String',
    required: 'Evet',
    example: 'TK',
    description: 'Havayolu IATA kodu'
  },
  {
    field: 'aircraftRegistration',
    type: 'String',
    required: 'Evet',
    example: 'TC-JRO',
    description: 'Uçak kuyruk numarası'
  },
  {
    field: 'originAirport',
    type: 'String',
    required: 'Evet',
    example: 'IST',
    description: 'Kalkış havaalanı IATA kodu'
  },
  {
    field: 'destinationAirport',
    type: 'String',
    required: 'Evet',
    example: 'ESB',
    description: 'Varış havaalanı IATA kodu'
  },
  {
    field: 'flightDate',
    type: 'Date',
    required: 'Evet',
    example: '2025-07-21',
    description: 'Uçuş tarihi (YYYY-MM-DD)'
  },
  {
    field: 'scheduledDeparture',
    type: 'DateTime',
    required: 'Evet',
    example: '2025-07-21 08:30',
    description: 'Planlanan kalkış zamanı'
  },
  {
    field: 'scheduledArrival',
    type: 'DateTime',
    required: 'Evet',
    example: '2025-07-21 10:00',
    description: 'Planlanan varış zamanı'
  },
  {
    field: 'flightType',
    type: 'String',
    required: 'Evet',
    example: 'PASSENGER',
    description: 'PASSENGER, CARGO, DOMESTIC, INTERNATIONAL'
  },
  {
    field: 'passengerCount',
    type: 'Number',
    required: 'Hayır',
    example: '180',
    description: 'Yolcu sayısı (yolcu uçuşları için)'
  },
  {
    field: 'cargoWeight',
    type: 'Number',
    required: 'Hayır',
    example: '5000',
    description: 'Kargo ağırlığı kg (kargo uçuşları için)'
  },
  {
    field: 'notes',
    type: 'String',
    required: 'Hayır',
    example: 'Özel notlar',
    description: 'Ek bilgiler'
  }
])

const csvExample = `flightNumber,airlineCode,aircraftRegistration,originAirport,destinationAirport,flightDate,scheduledDeparture,scheduledArrival,flightType,passengerCount,cargoWeight,notes
TK101,TK,TC-JRO,IST,ESB,2025-07-21,2025-07-21 08:30,2025-07-21 10:00,PASSENGER,180,,İstanbul-Ankara sefer
TK201,TK,TC-JRO,ESB,IST,2025-07-21,2025-07-21 14:00,2025-07-21 15:30,PASSENGER,175,,Ankara-İstanbul dönüş
PC101,PC,TC-DCB,IST,AYT,2025-07-21,2025-07-21 09:00,2025-07-21 10:30,DOMESTIC,189,,İstanbul-Antalya`

// Computed
const canProceedUpload = computed(() => {
  return validationResult.value &&
    (uploadOptions.skipValidation || validationResult.value.invalidRows === 0)
})

// Methods
function goBack() {
  router.push('/flights')
}

async function downloadTemplate() {
  templateLoading.value = true

  try {
    await flightStore.downloadTemplate()
  } catch (error) {
    ElMessage.error('Şablon dosyası indirilirken hata oluştu')
  } finally {
    templateLoading.value = false
  }
}

function handleQuickAction(command) {
  switch (command) {
    case 'guide':
      guideDialogVisible.value = true
      break
    case 'examples':
      guideDialogVisible.value = true
      activeGuideTab.value = 'examples'
      break
    case 'validation':
      guideDialogVisible.value = true
      activeGuideTab.value = 'rules'
      break
    case 'clear':
      clearForm()
      break
  }
}

function clearForm() {
  selectedFile.value = null
  validationResult.value = null
  uploadResult.value = null
  currentStep.value = 0
  resetProgress()
  ElMessage.success('Form temizlendi')
}

function handleFileSelect(file) {
  if (file.raw.type !== 'text/csv') {
    ElMessage.error('Sadece CSV dosyaları kabul edilir')
    return
  }

  if (file.raw.size > 10 * 1024 * 1024) { // 10MB limit
    ElMessage.error('Dosya boyutu 10MB\'dan büyük olamaz')
    return
  }

  selectedFile.value = file.raw
  validationResult.value = null
  uploadResult.value = null
  ElMessage.success('Dosya seçildi')
}

async function validateFile() {
  if (!selectedFile.value) {
    ElMessage.error('Lütfen dosya seçin')
    return
  }

  validating.value = true

  try {
    // Simulate file validation
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Mock validation result
    validationResult.value = {
      validRows: 145,
      invalidRows: 5,
      totalRows: 150,
      errors: [
        { row: 12, field: 'flightDate', message: 'Geçersiz tarih formatı', value: '2025/07/21' },
        { row: 25, field: 'aircraftRegistration', message: 'Uçak bulunamadı', value: 'TC-XXX' },
        { row: 48, field: 'passengerCount', message: 'Kapasite aşıldı', value: '250' },
        { row: 67, field: 'originAirport', message: 'Geçersiz havaalanı kodu', value: 'XYZ' },
        { row: 89, field: 'scheduledArrival', message: 'Varış kalkıştan önce', value: '07:30' }
      ],
      warnings: [
        { row: 34, message: 'Aynı uçuş numarası farklı tarihte mevcut' },
        { row: 78, message: 'Kısa mesafe için uzun uçuş süresi' }
      ],
      sampleData: [
        {
          flightNumber: 'TK101',
          airline: 'Turkish Airlines',
          route: 'IST → ESB',
          date: '21.07.2025',
          departure: '08:30',
          arrival: '10:00'
        },
        {
          flightNumber: 'PC202',
          airline: 'Pegasus',
          route: 'ESB → AYT',
          date: '21.07.2025',
          departure: '11:15',
          arrival: '12:45'
        }
      ]
    }

    currentStep.value = 1

    if (validationResult.value.invalidRows === 0) {
      ElMessage.success('Dosya başarıyla doğrulandı!')
    } else {
      ElMessage.warning(`${validationResult.value.invalidRows} hatalı kayıt tespit edildi`)
    }

  } catch (error) {
    ElMessage.error('Doğrulama sırasında hata oluştu')
  } finally {
    validating.value = false
  }
}

async function startUpload() {
  if (!canProceedUpload.value) {
    ElMessage.error('Doğrulama hatalarını düzeltin veya doğrulamayı atlayın')
    return
  }

  uploading.value = true
  currentStep.value = 2
  resetProgress()

  try {
    totalCount.value = validationResult.value.validRows

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      if (processedCount.value < totalCount.value) {
        processedCount.value += Math.floor(Math.random() * 3) + 1

        if (Math.random() > 0.8) { // 20% chance of error
          errorCount.value++
          addLog('error', `Satır ${processedCount.value}: Yükleme hatası`)
        } else {
          successCount.value++
          if (processedCount.value % 10 === 0) {
            addLog('info', `${processedCount.value} kayıt işlendi`)
          }
        }

        uploadProgress.value = Math.min(100, (processedCount.value / totalCount.value) * 100)

        const remaining = totalCount.value - processedCount.value
        const avgSpeed = processedCount.value / ((Date.now() - startTime) / 1000)
        const remainingSeconds = remaining / avgSpeed
        estimatedTime.value = formatSeconds(remainingSeconds)

        if (processedCount.value >= totalCount.value) {
          clearInterval(progressInterval)
          completeUpload()
        }
      }
    }, 100)

    const startTime = Date.now()
    addLog('info', `${uploadOptions.testMode ? 'Test' : 'Yükleme'} işlemi başlatıldı`)

  } catch (error) {
    ElMessage.error('Yükleme sırasında hata oluştu')
    uploading.value = false
  }
}

function completeUpload() {
  uploadStatus.value = errorCount.value === 0 ? 'success' : 'warning'

  uploadResult.value = {
    successCount: successCount.value,
    errorCount: errorCount.value,
    totalCount: totalCount.value,
    duration: 5000, // Mock duration
    errors: errorCount.value > 0 ? [
      { row: 12, flightNumber: 'TK205', error: 'Çakışan zaman dilimi' },
      { row: 25, flightNumber: 'PC301', error: 'Geçersiz uçak kayıtı' }
    ] : []
  }

  currentStep.value = 3
  uploading.value = false

  addLog('success', `İşlem tamamlandı: ${successCount.value} başarılı, ${errorCount.value} hatalı`)

  if (errorCount.value === 0) {
    ElMessage.success('Tüm kayıtlar başarıyla yüklendi!')
  } else {
    ElMessage.warning('Yükleme kısmen başarılı')
  }
}

function previousStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function resetProgress() {
  uploadProgress.value = 0
  uploadStatus.value = ''
  processedCount.value = 0
  successCount.value = 0
  errorCount.value = 0
  estimatedTime.value = '--:--'
  uploadLogs.value = []
}

function addLog(type, message) {
  uploadLogs.value.push({
    type,
    message,
    timestamp: new Date()
  })

  // Keep only last 20 logs
  if (uploadLogs.value.length > 20) {
    uploadLogs.value = uploadLogs.value.slice(-20)
  }
}

function viewUploadedFlights() {
  router.push('/flights')
}

function downloadReport() {
  // Generate and download report
  const report = generateReport()
  downloadFile(report, 'upload_report.csv')
  ElMessage.success('Rapor indirildi')
}

function startNewUpload() {
  clearForm()
}

function generateReport() {
  if (!uploadResult.value) return ''

  let csv = 'Durum,Uçuş Numarası,Hata\n'

  // Add successful entries
  for (let i = 0; i < uploadResult.value.successCount; i++) {
    csv += `Başarılı,SAMPLE${i + 1},\n`
  }

  // Add error entries
  uploadResult.value.errors?.forEach(error => {
    csv += `Hata,${error.flightNumber},"${error.error}"\n`
  })

  return csv
}

function downloadFile(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Helper functions
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(timestamp) {
  return dayjs(timestamp).format('DD.MM.YYYY')
}

function formatTime(date) {
  return dayjs(date).format('HH:mm:ss')
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}s ${minutes % 60}d ${seconds % 60}sn`
  } else if (minutes > 0) {
    return `${minutes}d ${seconds % 60}sn`
  } else {
    return `${seconds}sn`
  }
}

function formatSeconds(seconds) {
  if (isNaN(seconds) || seconds === Infinity) return '--:--'

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// onMounted içinde değiştirin
onMounted(() => {
  document.title = 'Toplu Uçuş Yükleme - Flight Management System'  // appStore.setPageTitle yerine
})
</script>

<style scoped lang="scss">
.flight-upload {
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

    .upload-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;

      .stat-card {
        background: white;
        border-radius: 8px;
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        &.success .stat-icon {
          background: #67c23a;
        }

        &.error .stat-icon {
          background: #f56c6c;
        }

        &.total .stat-icon {
          background: #409eff;
        }

        .stat-content {
          .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #303133;
            line-height: 1;
          }

          .stat-label {
            font-size: 0.875rem;
            color: #606266;
            margin-top: 0.25rem;
          }
        }
      }
    }
  }

  .upload-steps {
    background: white;
    border-radius: 8px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }

  .step-container {
    .upload-card,
    .validation-card,
    .upload-progress-card,
    .results-card {
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

      .card-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        color: #303133;
      }
    }

    .upload-area {
      .upload-dragger {
        width: 100%;

        :deep(.el-upload-dragger) {
          padding: 3rem 2rem;
          border: 2px dashed #d9d9d9;
          border-radius: 8px;
          background: #fafafa;
          transition: all 0.3s ease;

          &:hover {
            border-color: #409eff;
            background: #f0f9ff;
          }
        }

        .upload-content {
          text-align: center;

          .upload-icon {
            font-size: 3rem;
            color: #409eff;
            margin-bottom: 1rem;
          }

          .upload-text {
            p {
              margin: 0.5rem 0;
              font-size: 1rem;

              em {
                color: #409eff;
                font-style: normal;
                font-weight: 500;
              }
            }

            .upload-hint {
              font-size: 0.875rem;
              color: #909399;
            }
          }
        }
      }

      .file-info {
        margin-top: 1.5rem;

        .file-details {
          display: flex;
          gap: 2rem;
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: #606266;
        }
      }

      .upload-options {
        margin-top: 2rem;
        padding: 1.5rem;
        background: #f8f9fa;
        border-radius: 8px;

        .option-help {
          font-size: 0.75rem;
          color: #909399;
          margin-top: 0.25rem;
        }
      }
    }

    .step-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #ebeef5;
    }

    .validation-loading {
      text-align: center;
      padding: 2rem;

      .loading-text {
        margin-top: 1rem;
        color: #606266;
        font-size: 0.875rem;
      }
    }

    .validation-results {
      .validation-summary {
        margin-bottom: 2rem;
      }

      .validation-errors,
      .validation-warnings,
      .sample-preview {
        margin-bottom: 2rem;

        h4 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #303133;
        }
      }
    }

    .upload-progress {
      text-align: center;

      .progress-info {
        margin-bottom: 2rem;

        h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #303133;
        }

        p {
          margin: 0;
          color: #606266;
          font-size: 0.875rem;
        }
      }

      .progress-details {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        margin: 2rem 0;

        .detail-item {
          text-align: center;

          .label {
            display: block;
            font-size: 0.75rem;
            color: #909399;
            margin-bottom: 0.25rem;
          }

          .value {
            font-size: 1.25rem;
            font-weight: 600;
            color: #303133;

            &.success {
              color: #67c23a;
            }

            &.error {
              color: #f56c6c;
            }
          }
        }
      }

      .upload-log {
        margin-top: 2rem;
        text-align: left;

        h4 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #303133;
        }

        .log-container {
          height: 200px;
          overflow-y: auto;
          background: #f8f9fa;
          border-radius: 4px;
          padding: 1rem;

          .log-entry {
            display: flex;
            gap: 1rem;
            margin-bottom: 0.5rem;
            font-size: 0.75rem;
            line-height: 1.4;

            .log-time {
              color: #909399;
              min-width: 60px;
            }

            .log-message {
              color: #606266;
            }

            &.error .log-message {
              color: #f56c6c;
            }

            &.success .log-message {
              color: #67c23a;
            }

            &.info .log-message {
              color: #409eff;
            }
          }
        }
      }
    }

    .upload-results {
      .result-summary {
        text-align: center;
        margin-bottom: 2rem;

        .result-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
      }

      .error-details,
      .success-summary {
        margin-bottom: 2rem;

        h4 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #303133;
        }
      }
    }
  }

  .guide-content {
    .guide-section {
      h3 {
        margin: 0 0 1rem 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #303133;
      }

      p {
        margin-bottom: 1rem;
        color: #606266;
        line-height: 1.6;
      }

      .csv-example {
        background: #f8f9fa;
        border: 1px solid #ebeef5;
        border-radius: 4px;
        padding: 1rem;
        font-size: 0.75rem;
        overflow-x: auto;
        white-space: pre;
        margin-bottom: 1.5rem;
      }

      .error-list {
        margin: 1rem 0;
        padding-left: 1.5rem;

        li {
          margin-bottom: 0.5rem;
          color: #606266;
          line-height: 1.5;

          strong {
            color: #f56c6c;
          }
        }
      }

      .rules-list {
        margin-top: 1.5rem;

        .rule-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          color: #606266;

          .el-icon {
            color: #67c23a;
            font-size: 1rem;
          }
        }
      }
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .flight-upload {
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

      .upload-stats {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }
    }

    .step-container {
      .upload-area {
        .upload-dragger {
          :deep(.el-upload-dragger) {
            padding: 2rem 1rem;
          }
        }

        .upload-options {
          padding: 1rem;

          :deep(.el-form) {
            .el-form-item {
              margin-bottom: 1.5rem;
            }
          }
        }
      }

      .upload-progress {
        .progress-details {
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
      }

      .upload-results {
        .result-actions {
          flex-direction: column;
          gap: 0.75rem;

          .el-button {
            width: 100%;
          }
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .flight-upload {
    .page-header {
      .header-actions {
        flex-direction: column;
        gap: 0.5rem;

        .el-button {
          width: 100%;
        }
      }

      .upload-stats {
        .stat-card {
          padding: 1rem;

          .stat-icon {
            width: 40px;
            height: 40px;
          }

          .stat-content {
            .stat-value {
              font-size: 1.25rem;
            }

            .stat-label {
              font-size: 0.75rem;
            }
          }
        }
      }
    }

    .step-container {
      .upload-progress {
        .progress-details {
          grid-template-columns: 1fr;
        }

        .upload-log {
          .log-container {
            height: 150px;
            padding: 0.75rem;
          }
        }
      }
    }

    .guide-content {
      .guide-section {
        .csv-example {
          font-size: 0.625rem;
          padding: 0.75rem;
        }

        .error-list {
          font-size: 0.875rem;
        }
      }
    }
  }
}

// Animation for steps
.step-enter-active,
.step-leave-active {
  transition: all 0.3s ease;
}

.step-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.step-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

// Upload dragger animation
:deep(.el-upload-dragger) {
  transition: all 0.3s ease;
}

// Progress animations
:deep(.el-progress-bar__outer) {
  transition: all 0.3s ease;
}

// Table hover effects
:deep(.el-table__row) {
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f5f7fa;
  }
}

// Dialog animations
:deep(.el-dialog) {
  .el-dialog__header {
    border-bottom: 1px solid #ebeef5;
  }

  .el-dialog__body {
    padding-top: 1rem;
  }
}

// Step indicator customization
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

    .el-step__icon {
      background-color: #67c23a;
      border-color: #67c23a;
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

// Alert customization
:deep(.el-alert) {
  .el-alert__content {
    .el-alert__title {
      font-weight: 600;
    }
  }
}

// Result component customization
:deep(.el-result) {
  .el-result__title {
    font-size: 1.25rem;
    font-weight: 600;
  }

  .el-result__subtitle {
    font-size: 1rem;
    margin-top: 0.5rem;
  }
}

// Skeleton loading customization
:deep(.el-skeleton) {
  .el-skeleton__item {
    background: linear-gradient(90deg, #f2f2f2 25%, #e6e6e6 37%, #f2f2f2 63%);
    background-size: 400% 100%;
    animation: skeleton-loading 1.4s ease infinite;
  }
}

@keyframes skeleton-loading {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

// Upload icon animation
.upload-icon {
  animation: upload-bounce 2s infinite;
}

@keyframes upload-bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

// Log entry animation
.log-entry {
  animation: log-fade-in 0.3s ease;
}

@keyframes log-fade-in {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// Success/error color variables for consistent theming
:root {
  --upload-success-color: #67c23a;
  --upload-error-color: #f56c6c;
  --upload-warning-color: #e6a23c;
  --upload-info-color: #409eff;
}
</style>

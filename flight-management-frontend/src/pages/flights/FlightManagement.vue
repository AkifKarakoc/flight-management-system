<template>
  <div class="page-container">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <h2>Uçuş Yönetimi</h2>
          <div class="header-actions">
            <el-button
              v-if="authStore.isAdmin"
              type="primary"
              @click="showCreateDialog = true"
            >
              <el-icon><Plus /></el-icon>
              Yeni Uçuş
            </el-button>
            <el-button
              v-if="authStore.isAdmin"
              type="success"
              @click="showUploadDialog = true"
            >
              <el-icon><Upload /></el-icon>
              CSV Yükle
            </el-button>
            <el-button @click="refreshData">
              <el-icon><Refresh /></el-icon>
              Yenile
            </el-button>
          </div>
        </div>
      </template>

      <!-- Search & Filters -->
      <div class="search-section">
        <el-row :gutter="16">
          <el-col :xs="24" :sm="6" :md="4">
            <el-input
              v-model="searchQuery"
              placeholder="Uçuş numarası ara..."
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :xs="24" :sm="8" :md="6">
            <el-select
              v-model="filterAirline"
              placeholder="Havayolu"
              clearable
              filterable
              @change="handleSearch"
            >
              <el-option
                v-for="airline in airlineOptions"
                :key="airline.value"
                :label="airline.label"
                :value="airline.value"
              />
            </el-select>
          </el-col>
          <el-col :xs="24" :sm="6" :md="4">
            <el-select
              v-model="filterStatus"
              placeholder="Durum"
              clearable
              multiple
              @change="handleSearch"
            >
              <el-option
                v-for="(label, value) in FLIGHT_STATUS_LABELS"
                :key="value"
                :label="label"
                :value="value"
              />
            </el-select>
          </el-col>
          <el-col :xs="24" :sm="6" :md="4">
            <el-date-picker
              v-model="filterDate"
              type="date"
              placeholder="Tarih seç"
              format="DD.MM.YYYY"
              value-format="YYYY-MM-DD"
              @change="handleSearch"
            />
          </el-col>
          <el-col :xs="24" :sm="12" :md="4">
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              Ara
            </el-button>
          </el-col>
          <el-col :xs="24" :sm="12" :md="4">
            <el-button @click="handleClearFilters">
              <el-icon><RefreshRight /></el-icon>
              Temizle
            </el-button>
          </el-col>
        </el-row>

        <!-- Quick Filters -->
        <div class="quick-filters">
          <el-button-group>
            <el-button :type="filterDate === today ? 'primary' : ''" @click="setTodayFilter">
              Bugün
            </el-button>
            <el-button :type="filterStatus.includes('DELAYED') ? 'warning' : ''" @click="setDelayedFilter">
              Gecikmeli
            </el-button>
            <el-button :type="filterStatus.includes('SCHEDULED') ? 'info' : ''" @click="setScheduledFilter">
              Planlanmış
            </el-button>
          </el-button-group>
        </div>
      </div>

      <!-- Flights Table -->
      <div class="table-section">
        <el-table
          v-loading="flightStore.loading"
          :data="flightStore.flights"
          stripe
          class="data-table"
          @sort-change="handleSortChange"
        >
          <el-table-column label="#" width="60">
            <template #default="{ $index }">
              {{ (flightStore.pagination.page * flightStore.pagination.size) + $index + 1 }}
            </template>
          </el-table-column>

          <el-table-column
            prop="flightNumber"
            label="Uçuş No"
            width="120"
            sortable="custom"
          >
            <template #default="{ row }">
              <strong class="flight-number">{{ row.flightNumber }}</strong>
            </template>
          </el-table-column>

          <el-table-column label="Rota" min-width="200">
            <template #default="{ row }">
              <div class="route-info">
                <div class="route-path">
                  {{ getRouteDisplay(row) }}
                </div>
                <div class="route-time text-xs text-gray-500">
                  {{ formatTime(row.scheduledDeparture) }} - {{ formatTime(row.scheduledArrival) }}
                </div>
              </div>
            </template>
          </el-table-column>

          <!-- Havayolu sütunu -->
          <el-table-column label="Havayolu" width="120">
            <template #default="{ row }">
              <div class="airline-info">
                <div class="airline-name">{{ getAirlineName(row.airlineId) }}</div>
                <div class="airline-code text-xs text-gray-500">{{ getAirlineCode(row.airlineId) }}</div>
              </div>
            </template>
          </el-table-column>

          <el-table-column
            prop="flightDate"
            label="Tarih"
            width="120"
            sortable="custom"
          >
            <template #default="{ row }">
              {{ formatDate(row.flightDate) }}
            </template>
          </el-table-column>

          <el-table-column
            prop="status"
            label="Durum"
            width="120"
          >
            <template #default="{ row }">
              <el-tag :type="FLIGHT_STATUS_COLORS[row.status]">
                {{ FLIGHT_STATUS_LABELS[row.status] || row.status }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column
            prop="type"
            label="Tip"
            width="100"
          >
            <template #default="{ row }">
              <el-tag :type="getFlightTypeColor(row.type)" size="small">
                {{ FLIGHT_TYPE_LABELS[row.type] || row.type }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column
            label="İşlemler"
            width="280"
            fixed="right"
          >
            <template #default="{ row }">
              <el-button
                size="small"
                @click="viewFlight(row)"
              >
                <el-icon><View /></el-icon>
                Görüntüle
              </el-button>

              <el-button
                v-if="canUpdateStatus(row)"
                size="small"
                type="warning"
                @click="showStatusDialog(row)"
              >
                <el-icon><Clock /></el-icon>
                Durum
              </el-button>

              <el-button
                v-if="authStore.isAdmin"
                size="small"
                type="primary"
                @click="editFlight(row)"
              >
                <el-icon><Edit /></el-icon>
                Düzenle
              </el-button>

              <el-button
                v-if="authStore.isAdmin"
                size="small"
                type="danger"
                @click="deleteFlight(row)"
              >
                <el-icon><Delete /></el-icon>
                Sil
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- Pagination -->
        <div class="pagination-section">
          <el-pagination
            v-model:current-page="currentPageForDisplay"
            v-model:page-size="flightStore.pagination.size"
            :total="flightStore.pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </el-card>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingFlight ? 'Uçuş Düzenle' : 'Yeni Uçuş'"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="flightFormRef"
        :model="flightForm"
        :rules="flightRules"
        label-width="140px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Uçuş Numarası" prop="flightNumber">
              <el-input v-model="flightForm.flightNumber" placeholder="TK100" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Uçuş Tarihi" prop="flightDate">
              <el-date-picker
                v-model="flightForm.flightDate"
                type="date"
                placeholder="Tarih seç"
                format="DD.MM.YYYY"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Havayolu" prop="airlineId">
              <el-select
                v-model="flightForm.airlineId"
                placeholder="Havayolu seçin"
                filterable
              >
                <el-option
                  v-for="airline in airlineOptions"
                  :key="airline.value"
                  :label="airline.label"
                  :value="airline.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Uçak" prop="aircraftId">
              <el-select
                v-model="flightForm.aircraftId"
                placeholder="Uçak seçin"
                filterable
              >
                <el-option
                  v-for="aircraft in aircraftOptions"
                  :key="aircraft.value"
                  :label="aircraft.label"
                  :value="aircraft.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Kalkış Havalimanı" prop="originAirportId">
              <el-select
                v-model="flightForm.originAirportId"
                placeholder="Kalkış havalimanı seçin"
                filterable
              >
                <el-option
                  v-for="airport in airportOptions"
                  :key="airport.value"
                  :label="airport.label"
                  :value="airport.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Varış Havalimanı" prop="destinationAirportId">
              <el-select
                v-model="flightForm.destinationAirportId"
                placeholder="Varış havalimanı seçin"
                filterable
              >
                <el-option
                  v-for="airport in airportOptions"
                  :key="airport.value"
                  :label="airport.label"
                  :value="airport.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Planlı Kalkış" prop="scheduledDeparture">
              <el-date-picker
                v-model="flightForm.scheduledDeparture"
                type="datetime"
                placeholder="Kalkış zamanı"
                format="DD.MM.YYYY HH:mm"
                value-format="YYYY-MM-DD HH:mm"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Planlı Varış" prop="scheduledArrival">
              <el-date-picker
                v-model="flightForm.scheduledArrival"
                type="datetime"
                placeholder="Varış zamanı"
                format="DD.MM.YYYY HH:mm"
                value-format="YYYY-MM-DD HH:mm"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="Uçuş Tipi" prop="type">
              <el-select v-model="flightForm.type" placeholder="Tip seçiniz">
                <el-option
                  v-for="(label, value) in FLIGHT_TYPE_LABELS"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Yolcu Sayısı" v-if="showPassengerCount">
              <el-input-number
                v-model="flightForm.passengerCount"
                :min="0"
                :max="1000"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Kargo Ağırlığı (kg)" v-if="showCargoWeight">
              <el-input-number
                v-model="flightForm.cargoWeight"
                :min="0"
                :max="100000"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Notlar">
          <el-input
            v-model="flightForm.notes"
            type="textarea"
            placeholder="Opsiyonel notlar..."
            :rows="3"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">İptal</el-button>
        <el-button
          type="primary"
          :loading="loading"
          @click="handleSubmit"
        >
          {{ editingFlight ? 'Güncelle' : 'Kaydet' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Status Update Dialog -->
    <el-dialog
      v-model="showStatusUpdateDialog"
      title="Uçuş Durumu Güncelle"
      width="500px"
    >
      <div v-if="selectedFlight" class="status-update-content">
        <div class="flight-info">
          <h4>{{ selectedFlight.flightNumber }}</h4>
          <p>{{ getAirportCode(selectedFlight.originAirportId) }} → {{ getAirportCode(selectedFlight.destinationAirportId) }}</p>
          <p>Mevcut Durum:
            <el-tag :type="FLIGHT_STATUS_COLORS[selectedFlight.status]">
              {{ FLIGHT_STATUS_LABELS[selectedFlight.status] }}
            </el-tag>
          </p>
        </div>

        <el-form label-width="120px">
          <el-form-item label="Yeni Durum">
            <el-select v-model="newStatus" placeholder="Durum seçiniz">
              <el-option
                v-for="status in getAvailableStatusTransitions(selectedFlight.status)"
                :key="status"
                :label="FLIGHT_STATUS_LABELS[status]"
                :value="status"
              />
            </el-select>
          </el-form-item>

          <div v-if="newStatus === 'DELAYED'">
            <el-form-item label="Gecikme (dk)">
              <el-input-number
                v-model="delayMinutes"
                :min="1"
                :max="1440"
                placeholder="30"
              />
            </el-form-item>
            <el-form-item label="Gecikme Nedeni">
              <el-input
                v-model="delayReason"
                type="textarea"
                placeholder="Hava koşulları, teknik arıza, vb."
                :rows="3"
              />
            </el-form-item>
          </div>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="showStatusUpdateDialog = false">İptal</el-button>
        <el-button
          type="primary"
          :loading="loading"
          @click="handleStatusUpdate"
        >
          Güncelle
        </el-button>
      </template>
    </el-dialog>

    <!-- CSV Upload Dialog -->
    <el-dialog
      v-model="showUploadDialog"
      title="CSV Uçuş Yükleme"
      width="600px"
    >
      <div class="upload-content">
        <el-alert
          title="CSV Format Bilgisi"
          type="info"
          :closable="false"
          show-icon
        >
          <p>CSV dosyanızda şu sütunlar olmalıdır:</p>
          <code>flightNumber,airlineId,aircraftId,originAirportId,destinationAirportId,flightDate,scheduledDeparture,scheduledArrival,type,passengerCount,cargoWeight,notes</code>
        </el-alert>

        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :limit="1"
          accept=".csv"
          drag
          class="upload-area"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            CSV dosyasını buraya sürükleyin veya <em>seçmek için tıklayın</em>
          </div>
        </el-upload>

        <div v-if="uploadResult" class="upload-result">
          <el-alert
            :title="uploadResult.success ? 'Yükleme Başarılı' : 'Yükleme Hatası'"
            :type="uploadResult.success ? 'success' : 'error'"
            :closable="false"
            show-icon
          >
            <div v-if="uploadResult.success">
              <p>{{ uploadResult.successCount }} uçuş başarıyla yüklendi.</p>
              <p v-if="uploadResult.failureCount > 0">
                {{ uploadResult.failureCount }} uçuş yüklenemedi.
              </p>
            </div>
            <div v-if="uploadResult.errors && uploadResult.errors.length > 0">
              <p><strong>Hatalar:</strong></p>
              <ul>
                <li v-for="error in uploadResult.errors.slice(0, 5)" :key="error">
                  {{ error }}
                </li>
                <li v-if="uploadResult.errors.length > 5">
                  ... ve {{ uploadResult.errors.length - 5 }} hata daha
                </li>
              </ul>
            </div>
          </el-alert>
        </div>
      </div>

      <template #footer>
        <el-button @click="showUploadDialog = false">İptal</el-button>
        <el-button
          type="primary"
          :loading="uploadLoading"
          @click="handleUpload"
        >
          Yükle
        </el-button>
      </template>
    </el-dialog>

    <!-- View Dialog -->
    <el-dialog
      v-model="showViewDialog"
      title="Uçuş Detayları"
      width="700px"
    >
      <div v-if="viewingFlight" class="flight-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Uçuş Numarası">{{ viewingFlight.flightNumber }}</el-descriptions-item>
          <el-descriptions-item label="Durum">
            <el-tag :type="FLIGHT_STATUS_COLORS[viewingFlight.status]">
              {{ FLIGHT_STATUS_LABELS[viewingFlight.status] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Havayolu">{{ getAirlineName(viewingFlight.airlineId) }}</el-descriptions-item>
          <el-descriptions-item label="Uçuş Tipi">
            <el-tag :type="getFlightTypeColor(viewingFlight.type)" size="small">
              {{ FLIGHT_TYPE_LABELS[viewingFlight.type] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Kalkış">{{ getAirportName(viewingFlight.originAirportId) }}</el-descriptions-item>
          <el-descriptions-item label="Varış">{{ getAirportName(viewingFlight.destinationAirportId) }}</el-descriptions-item>
          <el-descriptions-item label="Uçuş Tarihi">{{ formatDate(viewingFlight.flightDate) }}</el-descriptions-item>
          <el-descriptions-item label="Süre">{{ calculateFlightDuration(viewingFlight) }}</el-descriptions-item>
          <el-descriptions-item label="Planlı Kalkış">{{ formatDateTime(viewingFlight.scheduledDeparture) }}</el-descriptions-item>
          <el-descriptions-item label="Planlı Varış">{{ formatDateTime(viewingFlight.scheduledArrival) }}</el-descriptions-item>
          <el-descriptions-item v-if="viewingFlight.actualDeparture" label="Gerçek Kalkış">
            {{ formatDateTime(viewingFlight.actualDeparture) }}
          </el-descriptions-item>
          <el-descriptions-item v-if="viewingFlight.actualArrival" label="Gerçek Varış">
            {{ formatDateTime(viewingFlight.actualArrival) }}
          </el-descriptions-item>
          <el-descriptions-item v-if="viewingFlight.passengerCount" label="Yolcu Sayısı">
            {{ viewingFlight.passengerCount }}
          </el-descriptions-item>
          <el-descriptions-item v-if="viewingFlight.cargoWeight" label="Kargo Ağırlığı">
            {{ viewingFlight.cargoWeight }} kg
          </el-descriptions-item>
          <el-descriptions-item v-if="viewingFlight.notes" label="Notlar" :span="2">
            {{ viewingFlight.notes }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Refresh,
  Search,
  RefreshRight,
  View,
  Edit,
  Delete,
  Clock,
  Upload,
  Right,
  UploadFilled
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useFlightStore } from '@/stores/flights'
import { useReferenceStore } from '@/stores/reference'
import {
  FLIGHT_STATUS_LABELS,
  FLIGHT_STATUS_COLORS,
  FLIGHT_TYPE_LABELS
} from '@/utils/constants'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const flightStore = useFlightStore()
const referenceStore = useReferenceStore()

// State
const loading = ref(false)
const uploadLoading = ref(false)
const searchQuery = ref('')
const filterAirline = ref(null)
const filterStatus = ref([])
const filterDate = ref('')

// Dialogs
const showCreateDialog = ref(false)
const showViewDialog = ref(false)
const showStatusUpdateDialog = ref(false)
const showUploadDialog = ref(false)
const editingFlight = ref(null)
const viewingFlight = ref(null)
const selectedFlight = ref(null)

// Status Update
const newStatus = ref('')
const delayMinutes = ref(null)
const delayReason = ref('')

// Upload
const uploadRef = ref()
const uploadResult = ref(null)

// Form
const flightFormRef = ref()
const flightForm = reactive({
  flightNumber: '',
  airlineId: null,
  aircraftId: null,
  originAirportId: null,
  destinationAirportId: null,
  flightDate: '',
  scheduledDeparture: '',
  scheduledArrival: '',
  type: '',
  passengerCount: null,
  cargoWeight: null,
  notes: ''
})

const flightRules = {
  flightNumber: [
    { required: true, message: 'Uçuş numarası gereklidir', trigger: 'blur' },
    { min: 2, message: 'Uçuş numarası en az 2 karakter olmalıdır', trigger: 'blur' }
  ],
  airlineId: [
    { required: true, message: 'Havayolu seçimi gereklidir', trigger: 'change' }
  ],
  aircraftId: [
    { required: true, message: 'Uçak seçimi gereklidir', trigger: 'change' }
  ],
  originAirportId: [
    { required: true, message: 'Kalkış havalimanı seçimi gereklidir', trigger: 'change' }
  ],
  destinationAirportId: [
    { required: true, message: 'Varış havalimanı seçimi gereklidir', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (value === flightForm.originAirportId) {
          callback(new Error('Kalkış ve varış havalimanı aynı olamaz'))
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
    { required: true, message: 'Planlı kalkış zamanı gereklidir', trigger: 'change' }
  ],
  scheduledArrival: [
    { required: true, message: 'Planlı varış zamanı gereklidir', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (value && flightForm.scheduledDeparture) {
          const departure = dayjs(flightForm.scheduledDeparture)
          const arrival = dayjs(value)
          if (arrival.isBefore(departure) || arrival.isSame(departure)) {
            callback(new Error('Varış zamanı kalkış zamanından sonra olmalıdır'))
          } else {
            callback()
          }
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  type: [
    { required: true, message: 'Uçuş tipi seçimi gereklidir', trigger: 'change' }
  ]
}

// Computed
const today = computed(() => dayjs().format('YYYY-MM-DD'))

const availableAircraft = computed(() => {
  if (!flightForm.airlineId) return []
  return referenceStore.getAircraftByAirline(flightForm.airlineId)
})

const showPassengerCount = computed(() => {
  return ['PASSENGER', 'MIXED'].includes(flightForm.type)
})

const showCargoWeight = computed(() => {
  return ['CARGO', 'MIXED'].includes(flightForm.type)
})

// Methods
const loadData = async () => {
  await Promise.all([
    referenceStore.loadAllReferenceData(),
    flightStore.loadFlights()
  ])
}

const refreshData = async () => {
  try {
    console.log('refreshData called')
    await flightStore.refreshFlights()
    ElMessage.success('Veriler yenilendi')
  } catch (error) {
    console.error('Refresh error:', error)
    ElMessage.error('Yenileme sırasında hata oluştu')
  }
}

const handleSearch = async () => {
  try {
    loading.value = true

    const filters = {}

    if (searchQuery.value) filters.flightNumber = searchQuery.value
    if (filterAirline.value) filters.airlineId = filterAirline.value
    if (filterStatus.value?.length > 0) filters.status = filterStatus.value.join(',')
    if (filterDate.value) filters.flightDate = filterDate.value

    flightStore.setFilters(filters)
    flightStore.setPage(0) // Reset to first page
    await flightStore.searchFlights(filters)
  } catch (error) {
    console.error('Search error:', error)
    ElMessage.error('Arama sırasında hata oluştu')
  } finally {
    loading.value = false
  }
}

const handleClearFilters = () => {
  searchQuery.value = ''
  filterAirline.value = null
  filterStatus.value = []
  filterDate.value = ''

  // Store'daki filtreleri temizle
  flightStore.clearFilters()

  // İlk sayfaya dön ve tüm uçuşları yükle
  flightStore.setPage(0)
  flightStore.loadFlights()
}

const handleSortChange = async ({ prop, order }) => {
  try {
    let sortParam = prop
    if (order === 'descending') {
      sortParam = `-${prop}`
    }
    await flightStore.loadFlights({ sort: sortParam })
  } catch (error) {
    console.error('Sort error:', error)
  }
}

const handlePageChange = async (page) => {
  try {
    console.log('handlePageChange called with page:', page)
    // Element Plus uses 1-based, backend uses 0-based
    await flightStore.setPage(page - 1)
    console.log('Page change completed')
  } catch (error) {
    console.error('Page change error:', error)
  }
}

const handleSizeChange = async (size) => {
  try {
    await flightStore.setPageSize(size)
  } catch (error) {
    console.error('Size change error:', error)
  }
}

const currentPageForDisplay = computed({
  get: () => flightStore.pagination.page + 1,
  set: (value) => {
    // Bu setter pagination component tarafından kullanılacak
    handlePageChange(value)
  }
})

// Quick Filters
const setTodayFilter = () => {
  filterDate.value = today.value
  handleSearch()
}

const setDelayedFilter = () => {
  filterStatus.value = ['DELAYED']
  handleSearch()
}

const setScheduledFilter = () => {
  filterStatus.value = ['SCHEDULED']
  handleSearch()
}

// Helper Methods

const getRouteDisplay = (flight) => {
  const originCode = getAirportCode(flight.originAirportId)
  const destCode = getAirportCode(flight.destinationAirportId)

  if (originCode === 'N/A' || destCode === 'N/A') {
    return `${flight.originAirportId || 'Bilinmiyor'} → ${flight.destinationAirportId || 'Bilinmiyor'}`
  }

  return `${originCode} → ${destCode}`
}

const getAirportCode = (airportId) => {
  if (!airportId) return 'N/A'
  const airport = referenceStore.airports.find(a => a.id === airportId)
  return airport?.iataCode || 'N/A'
}

const getAirportName = (airportId) => {
  if (!airportId) return 'N/A'
  const airport = referenceStore.airports.find(a => a.id === airportId)
  return airport?.name || 'N/A'
}

const getAirlineName = (airlineId) => {
  if (!airlineId) return 'N/A'
  const airline = referenceStore.airlines.find(a => a.id === airlineId)
  return airline?.name || 'N/A'
}

const getAirlineCode = (airlineId) => {
  if (!airlineId) return 'N/A'
  const airline = referenceStore.airlines.find(a => a.id === airlineId)
  return airline?.iataCode || 'N/A'
}

const getFlightTypeColor = (type) => {
  const colorMap = {
    'PASSENGER': 'primary',
    'CARGO': 'warning',
    'MIXED': 'success'
  }
  return colorMap[type] || 'info'
}

const formatDate = (date) => {
  return dayjs(date).format('DD.MM.YYYY')
}

const formatTime = (datetime) => {
  return dayjs(datetime).format('HH:mm')
}

const formatDateTime = (datetime) => {
  return dayjs(datetime).format('DD.MM.YYYY HH:mm')
}

const calculateFlightDuration = (flight) => {
  if (!flight.scheduledDeparture || !flight.scheduledArrival) return 'N/A'
  const departure = dayjs(flight.scheduledDeparture)
  const arrival = dayjs(flight.scheduledArrival)
  const duration = arrival.diff(departure, 'minute')
  const hours = Math.floor(duration / 60)
  const minutes = duration % 60
  return `${hours}s ${minutes}dk`
}

// CRUD Operations
const resetForm = () => {
  Object.assign(flightForm, {
    flightNumber: '',
    airlineId: null,
    aircraftId: null,
    originAirportId: null,
    destinationAirportId: null,
    flightDate: '',
    scheduledDeparture: '',
    scheduledArrival: '',
    type: '',
    passengerCount: null,
    cargoWeight: null,
    notes: ''
  })
  editingFlight.value = null
  flightFormRef.value?.clearValidate()
}

const viewFlight = (flight) => {
  viewingFlight.value = flight
  showViewDialog.value = true
}

const editFlight = async (flight) => {
  try {
    // Load current flight details first
    await flightStore.loadFlightById(flight.id)
    editingFlight.value = flight

    // Pre-fill form with current values
    Object.assign(flightForm, {
      flightNumber: flight.flightNumber || '',
      airlineId: flight.airlineId || null,
      aircraftId: flight.aircraftId || null,
      originAirportId: flight.originAirportId || null,
      destinationAirportId: flight.destinationAirportId || null,
      flightDate: flight.flightDate || '',
      scheduledDeparture: flight.scheduledDeparture || '',
      scheduledArrival: flight.scheduledArrival || '',
      type: flight.type || 'PASSENGER',
      passengerCount: flight.passengerCount || 0,
      cargoWeight: flight.cargoWeight || 0,
      notes: flight.notes || ''
    })

    showCreateDialog.value = true
  } catch (error) {
    console.error('Error loading flight for edit:', error)
    ElMessage.error('Uçuş bilgileri yüklenirken hata oluştu')
  }
}

const handleAirlineChange = () => {
  // Reset aircraft when airline changes
  flightForm.aircraftId = null
}

const handleSubmit = async () => {
  if (!flightFormRef.value) return

  try {
    await flightFormRef.value.validate()
    loading.value = true

    // Validate based on flight type
    if (showPassengerCount.value && !flightForm.passengerCount) {
      ElMessage.error('Yolcu uçuşları için yolcu sayısı gereklidir')
      return
    }

    if (showCargoWeight.value && !flightForm.cargoWeight) {
      ElMessage.error('Kargo uçuşları için kargo ağırlığı gereklidir')
      return
    }

    if (editingFlight.value) {
      await flightStore.updateFlight(editingFlight.value.id, flightForm)
      ElMessage.success('Uçuş başarıyla güncellendi')
    } else {
      await flightStore.createFlight(flightForm)
      ElMessage.success('Uçuş başarıyla oluşturuldu')
    }

    showCreateDialog.value = false
    resetForm()
  } catch (error) {
    console.error('Submit error:', error)
  } finally {
    loading.value = false
  }
}

const deleteFlight = async (flight) => {
  try {
    await ElMessageBox.confirm(
      `"${flight.flightNumber}" uçuşunu silmek istediğinizden emin misiniz?`,
      'Uçuş Sil',
      {
        confirmButtonText: 'Evet',
        cancelButtonText: 'İptal',
        type: 'warning'
      }
    )

    await flightStore.deleteFlight(flight.id)
    ElMessage.success('Uçuş başarıyla silindi')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete error:', error)
    }
  }
}

// Status Management
const canUpdateStatus = (flight) => {
  if (authStore.isAdmin) return true
  // User can update status of flights from their airline
  // This would need airline-user relationship in real implementation
  return true
}

const showStatusDialog = (flight) => {
  selectedFlight.value = flight
  newStatus.value = ''
  delayMinutes.value = null
  delayReason.value = ''
  showStatusUpdateDialog.value = true
}

const getAvailableStatusTransitions = (currentStatus) => {
  const transitions = {
    'SCHEDULED': ['BOARDING', 'DELAYED', 'CANCELLED'],
    'BOARDING': ['DEPARTED', 'DELAYED', 'CANCELLED'],
    'DEPARTED': ['ARRIVED'],
    'DELAYED': ['BOARDING', 'DEPARTED', 'CANCELLED'],
    'ARRIVED': [],
    'CANCELLED': []
  }
  return transitions[currentStatus] || []
}

const handleStatusUpdate = async () => {
  if (!newStatus.value || !selectedFlight.value) return

  try {
    loading.value = true

    if (newStatus.value === 'DELAYED') {
      if (!delayMinutes.value) {
        ElMessage.error('Gecikme süresi gereklidir')
        return
      }
      await flightStore.recordFlightDelay(
        selectedFlight.value.id,
        delayMinutes.value,
        delayReason.value
      )
    } else {
      await flightStore.updateFlightStatus(selectedFlight.value.id, newStatus.value)
    }

    ElMessage.success('Uçuş durumu başarıyla güncellendi')
    showStatusUpdateDialog.value = false
  } catch (error) {
    console.error('Status update error:', error)
  } finally {
    loading.value = false
  }
}

// CSV Upload
const handleUpload = async () => {
  const files = uploadRef.value?.uploadFiles
  if (!files || files.length === 0) {
    ElMessage.error('Lütfen bir CSV dosyası seçin')
    return
  }

  const file = files[0].raw
  uploadLoading.value = true
  uploadResult.value = null

  try {
    const result = await flightStore.uploadFlightsCSV(file)
    uploadResult.value = {
      success: result.successCount > 0,
      successCount: result.successCount,
      failureCount: result.failureCount,
      errors: result.errors
    }

    if (result.successCount > 0) {
      await flightStore.loadFlights() // Refresh the list
    }
  } catch (error) {
    console.error('Upload error:', error)
    uploadResult.value = {
      success: false,
      errors: ['Dosya yükleme hatası: ' + error.message]
    }
  } finally {
    uploadLoading.value = false
  }
}

// Reference data computed properties
const airlineOptions = computed(() => {
  return referenceStore.airlines.map(airline => ({
    label: `${airline.name} (${airline.iataCode})`,
    value: airline.id
  }))
})

const airportOptions = computed(() => {
  return referenceStore.airports.map(airport => ({
    label: `${airport.name} (${airport.iataCode}) - ${airport.city}`,
    value: airport.id
  }))
})

const aircraftOptions = computed(() => {
  // Aircraft servisini daha sonra ekleyebiliriz
  return []

  // Eğer referenceStore'da aircrafts varsa:
  // return referenceStore.aircrafts?.map(aircraft => ({
  //   label: `${aircraft.model} - ${aircraft.registration}`,
  //   value: aircraft.id
  // })) || []
})

// Watchers
watch(showCreateDialog, (newVal) => {
  if (!newVal) {
    resetForm()
  }
})

// Debug için - geçici olarak ekle
watch(() => flightStore.pagination.page, (newPage) => {
  console.log('Page changed to:', newPage, 'Current filters:', flightStore.filters)
})

watch(showUploadDialog, (newVal) => {
  if (!newVal) {
    uploadResult.value = null
    uploadRef.value?.clearFiles()
  }
})

watch(filterAirline, (newValue) => {
  if (newValue !== null) {
    handleSearch()
  }
})

// Lifecycle
onMounted(async () => {
  try {
    console.log('onMounted starting...')

    // Reference data'yı önce yükle (loadAircrafts'ı kaldır)
    await Promise.all([
      referenceStore.loadAirlines(true),
      referenceStore.loadAirports(true)
      // referenceStore.loadAircrafts(true) - Bu satırı kaldır
    ])

    console.log('Reference data loaded')
    console.log('Airlines:', referenceStore.airlines.length)
    console.log('Airports:', referenceStore.airports.length)

    // Filtreleri temizle ve flights'ı yükle
    await flightStore.refreshFlights()

    console.log('Flights loaded')

    await flightStore.loadDashboardKPIs()

    console.log('Dashboard KPIs loaded')
  } catch (error) {
    console.error('Error loading initial data:', error)
    ElMessage.error('Veriler yüklenirken hata oluştu: ' + error.message)
  }
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h2 {
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.search-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.quick-filters {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.table-section {
  margin-top: 16px;
}

.flight-number {
  font-size: 14px;
  color: #409eff;
}

.route-info {
  padding: 4px 0;
}

.route-path {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.airport-code {
  font-weight: 600;
  font-size: 13px;
  color: #303133;
}

.route-arrow {
  color: #909399;
  font-size: 12px;
}

.route-time {
  font-size: 12px;
  color: #606266;
}

.airline-info strong {
  font-size: 13px;
  color: #303133;
}

.status-update-content {
  padding: 16px 0;
}

.flight-info {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
}

.flight-info h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.flight-info p {
  margin: 4px 0;
  color: #606266;
}

.upload-content {
  padding: 16px 0;
}

.upload-area {
  margin: 20px 0;
}

.upload-result {
  margin-top: 20px;
}

.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.flight-details {
  padding: 16px 0;
}

/* Responsive */
@media (max-width: 768px) {
  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions .el-button {
    margin-bottom: 8px;
  }

  .search-section .el-col {
    margin-bottom: 8px;
  }

  .quick-filters {
    justify-content: flex-start;
    overflow-x: auto;
  }

  .data-table {
    font-size: 12px;
  }

  .route-path {
    flex-direction: column;
    gap: 4px;
  }

  .flight-info {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .route-time {
    display: none;
  }
}
</style>

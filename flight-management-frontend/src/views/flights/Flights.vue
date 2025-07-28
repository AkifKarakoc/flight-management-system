<template>
  <AppLayout>
    <PageHeader title="Uçuşlar" description="Uçuş operasyonları yönetimi">
      <template #actions>
        <el-button
            v-if="auth.isAdmin"
            type="primary"
            @click="openModal()"
        >
          <el-icon><Plus /></el-icon>
          Yeni Uçuş
        </el-button>
        <el-button
            v-if="auth.isAdmin"
            type="success"
            @click="showCSVUpload = true"
        >
          <el-icon><Upload /></el-icon>
          CSV Yükle
        </el-button>
      </template>
    </PageHeader>

    <!-- Filters -->
    <el-card style="margin-bottom: 20px;">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-select v-model="filters.status" placeholder="Durum" clearable @change="fetchFlights">
            <el-option value="SCHEDULED" label="Planlandı" />
            <el-option value="DEPARTED" label="Kalktı" />
            <el-option value="ARRIVED" label="Vardı" />
            <el-option value="CANCELLED" label="İptal" />
            <el-option value="DELAYED" label="Gecikmeli" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="filters.type" placeholder="Tür" clearable @change="fetchFlights">
            <el-option value="PASSENGER" label="Yolcu" />
            <el-option value="CARGO" label="Kargo" />
            <el-option value="MIXED" label="Karma" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-input
              v-model="filters.flightNumber"
              placeholder="Uçuş No"
              clearable
              @keyup.enter="fetchFlights"
          />
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="fetchFlights">Filtrele</el-button>
          <el-button @click="clearFilters">Temizle</el-button>
        </el-col>
      </el-row>
    </el-card>

    <DataTable
        :data="flights"
        :loading="loading"
        :total="total"
        :current-page="currentPage"
        :page-size="pageSize"
        @current-change="changePage"
        @size-change="changeSize"
    >
      <el-table-column prop="flightNumber" label="Uçuş No" width="120" />
      <el-table-column prop="airline.name" label="Havayolu" width="150" />
      <el-table-column prop="aircraft.registrationNumber" label="Uçak" width="120" />
      <el-table-column label="Güzergah" width="200">
        <template #default="{ row }">
          {{ row.route?.routePath || `${row.originAirport?.iataCode} → ${row.destinationAirport?.iataCode}` || 'N/A' }}
        </template>
      </el-table-column>
      <el-table-column prop="flightDate" label="Tarih" width="120">
        <template #default="{ row }">
          {{ formatDate(row.flightDate) }}
        </template>
      </el-table-column>
      <el-table-column prop="scheduledDeparture" label="STD" width="80">
        <template #default="{ row }">
          {{ formatTime(row.scheduledDeparture) }}
        </template>
      </el-table-column>
      <el-table-column prop="scheduledArrival" label="STA" width="80">
        <template #default="{ row }">
          {{ formatTime(row.scheduledArrival) }}
        </template>
      </el-table-column>
      <el-table-column prop="type" label="Tür" width="100">
        <template #default="{ row }">
          <el-tag :type="getFlightTypeColor(row.type)">
            {{ getFlightTypeLabel(row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="Durum" width="120">
        <template #default="{ row }">
          <el-tag :type="getStatusColor(row.status)">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="İşlemler" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
              v-if="auth.isAdmin"
              size="small"
              @click="openModal(row)"
          >
            Düzenle
          </el-button>
          <el-button
              v-if="auth.isAdmin"
              size="small"
              type="danger"
              @click="deleteFlight(row)"
          >
            Sil
          </el-button>
        </template>
      </el-table-column>
    </DataTable>

    <!-- Flight Form Modal -->
    <FormModal
        v-model="modalVisible"
        :title="isEdit ? 'Uçuş Düzenle' : 'Yeni Uçuş'"
        :form="form"
        :rules="formRules"
        :loading="saving"
        @submit="saveFlight"
        @close="closeModal"
    >
      <!-- Existing flight form fields here -->
    </FormModal>

    <!-- CSV Upload Modal - GÜNCELLENMIŞ -->
    <el-dialog
        v-model="showCSVUpload"
        :title="csvStep === 'upload' ? 'CSV Dosyası Yükle' : 'CSV Önizleme'"
        width="80%"
        :close-on-click-modal="false"
    >
      <!-- Step 1: File Upload -->
      <div v-if="csvStep === 'upload'">
        <el-upload
            drag
            :auto-upload="false"
            :on-change="handleCSVSelect"
            :file-list="csvFileList"
            accept=".csv"
            :limit="1"
        >
          <el-icon class="el-icon--upload"><Upload /></el-icon>
          <div class="el-upload__text">
            CSV dosyasını sürükleyin veya <em>tıklayarak seçin</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              <el-link @click="downloadTemplate" type="primary">CSV Template İndir</el-link> |
              Route: sayı (örn: 5) veya IATA kodları (örn: IST-ANK)
            </div>
          </template>
        </el-upload>

        <template #footer>
          <el-button @click="closeCSVModal">İptal</el-button>
          <el-button
              type="primary"
              :loading="csvUploading"
              :disabled="csvFileList.length === 0"
              @click="previewCSV"
          >
            Önizle
          </el-button>
        </template>
      </div>

      <!-- Step 2: Preview & Confirm -->
      <div v-if="csvStep === 'preview' && csvPreview && csvPreview.totalRows" style="max-height: 600px; overflow-y: auto;">
        <!-- Summary Stats -->
        <el-row :gutter="20" style="margin-bottom: 20px;">
          <el-col :span="6">
            <el-statistic title="Toplam Satır" :value="csvPreview.totalRows || 0" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="Geçerli" :value="csvPreview.validRows || 0" value-style="color: #67C23A" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="Hatalı" :value="csvPreview.invalidRows || 0" value-style="color: #F56C6C" />
          </el-col>
          <el-col :span="6">
            <el-alert
                :title="csvPreview.readyForImport ? 'İçe aktarılabilir' : 'Hatalar mevcut'"
                :type="csvPreview.readyForImport ? 'success' : 'warning'"
                show-icon
                :closable="false"
            />
          </el-col>
        </el-row>

        <!-- Preview Table -->
        <el-table :data="csvPreview.previewData || []" style="width: 100%" size="small">
          <el-table-column prop="rowNumber" label="Satır" width="60" align="center" />

          <el-table-column label="Durum" width="80" align="center">
            <template #default="{ row }">
              <el-icon v-if="row.valid" color="#67C23A" size="16"><Check /></el-icon>
              <el-icon v-else color="#F56C6C" size="16"><Close /></el-icon>
            </template>
          </el-table-column>

          <el-table-column prop="parsedData.flightNumber" label="Uçuş No" width="100" />

          <el-table-column label="Havayolu" width="80">
            <template #default="{ row }">
              {{ row.parsedData?.airlineId || '' }}
            </template>
          </el-table-column>

          <el-table-column label="Uçak" width="80">
            <template #default="{ row }">
              {{ row.parsedData?.aircraftId || '' }}
            </template>
          </el-table-column>

          <el-table-column label="Güzergah" width="150">
            <template #default="{ row }">
              <el-tag
                  :type="(row.parsedData?.creationMode === 'ROUTE') ? 'primary' : 'success'"
                  size="small"
                  v-if="row.parsedData"
              >
                {{ row.parsedData?.routeInfo || row.parsedData?.routeInput || '' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Tarih" width="100">
            <template #default="{ row }">
              {{ formatArrayDate(row.parsedData?.flightDate) }}
            </template>
          </el-table-column>

          <el-table-column label="STD" width="80">
            <template #default="{ row }">
              {{ formatArrayTime(row.parsedData?.scheduledDeparture) }}
            </template>
          </el-table-column>

          <el-table-column label="STA" width="80">
            <template #default="{ row }">
              {{ formatArrayTime(row.parsedData?.scheduledArrival) }}
            </template>
          </el-table-column>

          <el-table-column prop="parsedData.type" label="Tür" width="100" />

          <el-table-column label="Hatalar" min-width="200">
            <template #default="{ row }">
              <div v-if="!row.valid">
                <el-tag
                    v-for="(error, field) in row.fieldErrors"
                    :key="field"
                    type="danger"
                    size="small"
                    style="margin: 2px;"
                >
                  {{ field }}: {{ error }}
                </el-tag>
              </div>
              <div v-if="row.warnings && row.warnings.length > 0">
                <el-tag
                    v-for="warning in row.warnings"
                    :key="warning"
                    type="warning"
                    size="small"
                    style="margin: 2px;"
                >
                  {{ warning }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <template #footer>
          <el-button @click="csvStep = 'upload'">Geri</el-button>
          <el-button @click="closeCSVModal">İptal</el-button>
          <el-button
              type="primary"
              :loading="csvConfirming"
              :disabled="!csvPreview.readyForImport"
              @click="confirmCSVUpload"
          >
            {{ csvPreview.validRows || 0 }} Uçuşu İçe Aktar
          </el-button>
        </template>
      </div>
    </el-dialog>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Location, Position, Check, Close } from '@element-plus/icons-vue'
import AppLayout from '@/components/common/AppLayout.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import DataTable from '@/components/tables/DataTable.vue'
import FormModal from '@/components/forms/FormModal.vue'
import { flightAPI, referenceAPI } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { usePagination, useLoading, rules, formatDate, formatTime } from '@/utils'

const auth = useAuthStore()
const { loading, withLoading } = useLoading()

const {
  data: flights,
  total,
  currentPage,
  pageSize,
  fetch: fetchFlights,
  changePage
} = usePagination(flightAPI.getFlights)

const modalVisible = ref(false)
const saving = ref(false)
const isEdit = ref(false)
const showCSVUpload = ref(false)
const csvUploading = ref(false)
const csvFileList = ref([])

// YENİ CSV DEĞİŞKENLERİ
const csvStep = ref('upload') // 'upload' | 'preview'
const csvPreview = ref({
  totalRows: 0,
  validRows: 0,
  invalidRows: 0,
  previewData: [],
  globalErrors: [],
  readyForImport: false
})
const csvConfirming = ref(false)

// Reference data
const airlines = ref([])
const allAircraft = ref([])
const allRoutes = ref([])
const airports = ref([])
const airlinesLoading = ref(false)
const aircraftLoading = ref(false)
const routesLoading = ref(false)
const airportsLoading = ref(false)

// Filtered data based on selected airline
const aircraft = computed(() => {
  if (!form.airlineId) return []
  return allAircraft.value.filter(ac => ac.airlineId === form.airlineId)
})

const routes = computed(() => {
  if (!form.airlineId) return []
  return allRoutes.value.filter(route => route.airlineId === form.airlineId)
})

// Filters
const filters = reactive({
  status: '',
  type: '',
  flightNumber: ''
})

// Form
const form = reactive({
  id: null,
  flightNumber: '',
  airlineId: null,
  aircraftId: null,
  creationMode: 'ROUTE',
  routeId: null,
  originAirportId: null,
  destinationAirportId: null,
  flightDate: '',
  scheduledDeparture: '',
  scheduledArrival: '',
  type: 'PASSENGER',
  status: 'SCHEDULED',
  passengerCount: null,
  cargoWeight: null,
  notes: '',
  active: true
})

// Form validation rules
const formRules = {
  flightNumber: [rules.required],
  airlineId: [rules.required],
  aircraftId: [rules.required],
  flightDate: [rules.required],
  scheduledDeparture: [rules.required],
  scheduledArrival: [rules.required],
  type: [rules.required]
}

// Load reference data
const loadReferenceData = async () => {
  try {
    const [airlinesRes, aircraftRes, routesRes] = await Promise.all([
      referenceAPI.getAirlines({ page: 0, size: 1000 }),
      referenceAPI.getAircrafts({ page: 0, size: 1000 }),
      referenceAPI.getRoutes({ page: 0, size: 1000 })
    ])

    airlines.value = airlinesRes.data.content || []
    allAircraft.value = aircraftRes.data.content || []
    allRoutes.value = routesRes.data.content || []
  } catch (error) {
    console.error('Reference data loading error:', error)
    ElMessage.error('Referans veriler yüklenemedi')
  }
}

const loadAirports = async () => {
  try {
    const response = await referenceAPI.getAirports({ page: 0, size: 1000 })
    airports.value = response.data.content || []
  } catch (error) {
    console.error('Airports loading error:', error)
    ElMessage.error('Havaalanları yüklenemedi')
  }
}

// Utility functions
const getStatusColor = (status) => {
  const colors = {
    'SCHEDULED': '',
    'DEPARTED': 'success',
    'ARRIVED': 'info',
    'CANCELLED': 'danger',
    'DELAYED': 'warning'
  }
  return colors[status] || ''
}

const getStatusLabel = (status) => {
  const labels = {
    'SCHEDULED': 'Planlandı',
    'DEPARTED': 'Kalktı',
    'ARRIVED': 'Vardı',
    'CANCELLED': 'İptal',
    'DELAYED': 'Gecikmeli'
  }
  return labels[status] || status
}

const getFlightTypeColor = (type) => {
  const colors = {
    'PASSENGER': 'success',
    'CARGO': 'warning',
    'MIXED': 'info'
  }
  return colors[type] || ''
}

const getFlightTypeLabel = (type) => {
  const labels = {
    'PASSENGER': 'Yolcu',
    'CARGO': 'Kargo',
    'MIXED': 'Karma'
  }
  return labels[type] || type
}

const extractTimeFromDateTime = (dateTimeString) => {
  if (!dateTimeString) return ''
  return dateTimeString.split(' ')[1] || ''
}

const resetForm = () => {
  Object.assign(form, {
    id: null,
    flightNumber: '',
    airlineId: null,
    aircraftId: null,
    creationMode: 'ROUTE',
    routeId: null,
    originAirportId: null,
    destinationAirportId: null,
    flightDate: '',
    scheduledDeparture: '',
    scheduledArrival: '',
    type: 'PASSENGER',
    status: 'SCHEDULED',
    passengerCount: null,
    cargoWeight: null,
    notes: '',
    active: true
  })
}

const clearFilters = () => {
  Object.assign(filters, {
    status: '',
    type: '',
    flightNumber: ''
  })
  fetchFlights()
}

const changeSize = (size) => {
  pageSize.value = size
  fetchFlights()
}

const openModal = async (flight = null) => {
  isEdit.value = !!flight

  await Promise.all([
    loadReferenceData(),
    loadAirports()
  ])

  if (flight) {
    Object.assign(form, {
      id: flight.id,
      flightNumber: flight.flightNumber,
      airlineId: flight.airline?.id,
      aircraftId: flight.aircraft?.id,
      creationMode: flight.route ? 'ROUTE' : 'AIRPORTS',
      routeId: flight.route?.id,
      originAirportId: flight.originAirport?.id,
      destinationAirportId: flight.destinationAirport?.id,
      flightDate: flight.flightDate,
      scheduledDeparture: extractTimeFromDateTime(flight.scheduledDeparture),
      scheduledArrival: extractTimeFromDateTime(flight.scheduledArrival),
      type: flight.type,
      status: flight.status,
      passengerCount: flight.passengerCount,
      cargoWeight: flight.cargoWeight,
      notes: flight.notes,
      active: flight.active ?? true
    })
  } else {
    resetForm()
  }

  modalVisible.value = true
}

const closeModal = () => {
  modalVisible.value = false
}

const saveFlight = async () => {
  saving.value = true
  try {
    const payload = { ...form }

    if (form.creationMode === 'ROUTE') {
      delete payload.originAirportId
      delete payload.destinationAirportId
    } else if (form.creationMode === 'AIRPORTS') {
      delete payload.routeId
    }

    if (isEdit.value) {
      await flightAPI.updateFlight(form.id, payload)
      ElMessage.success('Uçuş güncellendi')
    } else {
      await flightAPI.createFlight(payload)
      ElMessage.success('Uçuş oluşturuldu')
    }
    closeModal()
    fetchFlights()
  } catch (error) {
    console.error('Save error:', error)
    ElMessage.error(isEdit.value ? 'Güncelleme başarısız' : 'Oluşturma başarısız')
  } finally {
    saving.value = false
  }
}

const deleteFlight = async (flight) => {
  try {
    await ElMessageBox.confirm('Bu uçuşu silmek istediğinizden emin misiniz?', 'Dikkat', {
      type: 'warning'
    })

    await flightAPI.deleteFlight(flight.id)
    ElMessage.success('Uçuş silindi')
    fetchFlights()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete error:', error)
      ElMessage.error('Silme işlemi başarısız')
    }
  }
}

// YENİ CSV METODLARI
const handleCSVSelect = (file, fileList) => {
  csvFileList.value = fileList
}

const downloadTemplate = async () => {
  try {
    const response = await flightAPI.downloadCSVTemplate()
    const blob = new Blob([response.data], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'flight_upload_template.csv')
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Template download error:', error)
    ElMessage.error('Template indirilemedi')
  }
}

const previewCSV = async () => {
  if (csvFileList.value.length === 0) {
    ElMessage.warning('Lütfen bir CSV dosyası seçin')
    return
  }

  csvUploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', csvFileList.value[0].raw)

    const response = await flightAPI.previewCSV(formData)
    csvPreview.value = response.data
    csvStep.value = 'preview'

    ElMessage.success(`${response.data.totalRows} satır analiz edildi`)
  } catch (error) {
    console.error('CSV preview error:', error)
    ElMessage.error('CSV önizleme başarısız: ' + (error.response?.data?.message || error.message))
  } finally {
    csvUploading.value = false
  }
}

const confirmCSVUpload = async () => {
  csvConfirming.value = true
  try {
    const validRows = csvPreview.value.previewData.filter(row => row.valid)

    const response = await flightAPI.confirmCSVUpload(validRows)

    ElMessage.success(`${response.data.successCount} uçuş başarıyla içe aktarıldı`)

    if (response.data.failureCount > 0) {
      ElMessage.warning(`${response.data.failureCount} uçuş içe aktarılamadı`)
    }

    closeCSVModal()
    fetchFlights()

  } catch (error) {
    console.error('CSV confirm error:', error)
    ElMessage.error('İçe aktarma başarısız: ' + (error.response?.data?.message || error.message))
  } finally {
    csvConfirming.value = false
  }
}

const closeCSVModal = () => {
  showCSVUpload.value = false
  csvStep.value = 'upload'
  csvFileList.value = []
  csvPreview.value = {}
}

const formatArrayDate = (dateArray) => {
  if (!dateArray || !Array.isArray(dateArray)) return ''
  return `${dateArray[0]}-${String(dateArray[1]).padStart(2, '0')}-${String(dateArray[2]).padStart(2, '0')}`
}

const formatArrayTime = (timeArray) => {
  if (!timeArray || !Array.isArray(timeArray)) return ''
  return `${String(timeArray[3]).padStart(2, '0')}:${String(timeArray[4]).padStart(2, '0')}`
}

// Initialize
onMounted(() => {
  fetchFlights()
})
</script>

<style scoped>
.creation-mode-selector {
  width: 100%;
}

.creation-mode-selector .el-radio-button {
  flex: 1;
}

.creation-mode-selector .el-radio-button__inner {
  width: 100%;
  text-align: center;
  padding: 12px 20px;
}

.el-divider {
  margin: 20px 0 15px 0;
}

.el-divider--horizontal {
  font-weight: 500;
  color: #606266;
}
</style>

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
          {{ row.route?.routePath || 'N/A' }}
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
          <el-tag :type="getTypeColor(row.type)">
            {{ getTypeLabel(row.type) }}
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
      <el-table-column label="İşlemler" width="180">
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
      width="800px"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="Uçuş No" prop="flightNumber">
            <el-input v-model="form.flightNumber" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Havayolu" prop="airlineId">
            <el-select
              v-model="form.airlineId"
              style="width: 100%"
              filterable
              :loading="airlinesLoading"
              @change="onAirlineChange"
            >
              <el-option
                v-for="airline in airlines"
                :key="airline.id"
                :label="airline.name"
                :value="airline.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="Uçak" prop="aircraftId">
            <el-select
              v-model="form.aircraftId"
              style="width: 100%"
              filterable
              :loading="aircraftLoading"
              :disabled="!form.airlineId"
              placeholder="Önce havayolu seçin"
            >
              <el-option
                v-for="aircraftItem in aircraft"
                :key="aircraftItem.id"
                :label="`${aircraftItem.registrationNumber} (${aircraftItem.aircraftType})`"
                :value="aircraftItem.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Rota" prop="routeId">
            <el-select
              v-model="form.routeId"
              style="width: 100%"
              filterable
              :loading="routesLoading"
              :disabled="!form.airlineId"
              placeholder="Önce havayolu seçin"
            >
              <el-option
                v-for="route in routes"
                :key="route.id"
                :label="`${route.routeCode} - ${route.routePath}`"
                :value="route.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="Uçuş Tarihi" prop="flightDate">
            <el-input
              v-model="form.flightDate"
              type="date"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="STD" prop="scheduledDeparture">
            <el-input
              v-model="form.scheduledDeparture"
              type="time"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="STA" prop="scheduledArrival">
            <el-input
              v-model="form.scheduledArrival"
              type="time"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="Uçuş Türü" prop="type">
            <el-select v-model="form.type" style="width: 100%">
              <el-option value="PASSENGER" label="Yolcu" />
              <el-option value="CARGO" label="Kargo" />
              <el-option value="MIXED" label="Karma" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="Yolcu Sayısı" prop="passengerCount">
            <el-input-number v-model="form.passengerCount" :min="0" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="Durum" prop="status">
            <el-select v-model="form.status" style="width: 100%">
              <el-option value="SCHEDULED" label="Planlandı" />
              <el-option value="DEPARTED" label="Kalktı" />
              <el-option value="ARRIVED" label="Vardı" />
              <el-option value="CANCELLED" label="İptal" />
              <el-option value="DELAYED" label="Gecikmeli" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </FormModal>

    <!-- CSV Upload Modal -->
    <el-dialog v-model="showCSVUpload" title="CSV Dosyası Yükle" width="500px">
      <el-upload
        drag
        :auto-upload="false"
        :on-change="handleCSVSelect"
        :file-list="csvFileList"
        accept=".csv"
      >
        <el-icon class="el-icon--upload"><Upload /></el-icon>
        <div class="el-upload__text">
          CSV dosyasını sürükleyin veya <em>tıklayarak seçin</em>
        </div>
      </el-upload>

      <template #footer>
        <el-button @click="showCSVUpload = false">İptal</el-button>
        <el-button
          type="primary"
          :loading="csvUploading"
          @click="uploadCSV"
        >
          Yükle
        </el-button>
      </template>
    </el-dialog>
  </AppLayout>
</template>

<script setup>
import { Plus, Upload } from '@element-plus/icons-vue'
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

// Reference data
const airlines = ref([])
const allAircraft = ref([])
const allRoutes = ref([])
const airlinesLoading = ref(false)
const aircraftLoading = ref(false)
const routesLoading = ref(false)

// Filtered data based on selected airline
const aircraft = computed(() => {
  if (!form.airlineId) return []
  return allAircraft.value.filter(a => a.airline?.id === form.airlineId)
})

const routes = computed(() => {
  if (!form.airlineId) return []
  return allRoutes.value.filter(r =>
    r.airlineId === form.airlineId || r.visibility === 'SHARED' || r.visibility === 'PUBLIC'
  )
})

// Filters
const filters = reactive({
  status: '',
  type: '',
  flightNumber: ''
})

const form = reactive({
  id: null,
  flightNumber: '',
  airlineId: null,
  aircraftId: null,
  routeId: null,
  flightDate: '',
  scheduledDeparture: '',
  scheduledArrival: '',
  type: 'PASSENGER',
  passengerCount: 0,
  status: 'SCHEDULED'
})

const formRules = {
  flightNumber: [rules.required, rules.flightNumber],
  airlineId: [rules.required],
  aircraftId: [rules.required],
  routeId: [rules.required],
  flightDate: [rules.required],
  scheduledDeparture: [rules.required],
  scheduledArrival: [rules.required],
  type: [rules.required],
  status: [rules.required]
}

const changeSize = (size) => {
  pageSize.value = size
  fetchFlights()
}

const clearFilters = () => {
  Object.assign(filters, {
    status: '',
    type: '',
    flightNumber: ''
  })
  fetchFlights()
}

const loadReferenceData = async () => {
  try {
    const [airlinesRes, aircraftRes, routesRes] = await Promise.all([
      referenceAPI.getAirlines({ page: 0, size: 1000 }),
      referenceAPI.getAircraft({ page: 0, size: 1000 }),
      referenceAPI.getRoutes({ page: 0, size: 1000 })
    ])

    airlines.value = airlinesRes.content || []
    allAircraft.value = aircraftRes.content || []
    allRoutes.value = Array.isArray(routesRes) ? routesRes : (routesRes.content || [])
  } catch (error) {
    console.error('Reference data yüklenirken hata:', error)
  }
}

// Havayolu değiştiğinde uçak ve rotayı sıfırla
const onAirlineChange = () => {
  form.aircraftId = null
  form.routeId = null
}

const openModal = async (flight = null) => {
  isEdit.value = !!flight

  // Önce reference data yükle
  await loadReferenceData()

  if (flight) {
    // Edit mode - mevcut flight verilerini set et
    form.id = flight.id
    form.flightNumber = flight.flightNumber || ''
    form.airlineId = flight.airline?.id || null
    form.aircraftId = flight.aircraft?.id || null
    form.routeId = flight.route?.id || null
    form.flightDate = flight.flightDate || ''
    form.type = flight.type || 'PASSENGER'
    form.passengerCount = flight.passengerCount || 0
    form.status = flight.status || 'SCHEDULED'
    form.scheduledDeparture = extractTimeFromDateTime(flight.scheduledDeparture)
    form.scheduledArrival = extractTimeFromDateTime(flight.scheduledArrival)
  } else {
    // Create mode - boş form
    form.id = null
    form.flightNumber = ''
    form.airlineId = null
    form.aircraftId = null
    form.routeId = null
    form.flightDate = ''
    form.scheduledDeparture = ''
    form.scheduledArrival = ''
    form.type = 'PASSENGER'
    form.passengerCount = 0
    form.status = 'SCHEDULED'
  }

  modalVisible.value = true
}

// Helper function to extract time from datetime
const extractTimeFromDateTime = (datetime) => {
  if (!datetime) return ''

  try {
    // Eğer T içeriyorsa datetime formatında
    if (datetime.includes('T')) {
      return datetime.split('T')[1]?.substring(0, 5) || ''
    }

    // Eğer sadece time formatında ise (HH:mm:ss)
    if (datetime.includes(':')) {
      return datetime.substring(0, 5)
    }

    return datetime
  } catch (error) {
    console.error('Time parsing error:', error)
    return ''
  }
}

const closeModal = () => {
  modalVisible.value = false
}

const saveFlight = async () => {
  saving.value = true
  try {
    if (isEdit.value) {
      await flightAPI.updateFlight(form.id, form)
      ElMessage.success('Uçuş güncellendi')
    } else {
      await flightAPI.createFlight(form)
      ElMessage.success('Uçuş oluşturuldu')
    }
    closeModal()
    fetchFlights()
  } catch (error) {
    ElMessage.error(isEdit.value ? 'Güncelleme başarısız' : 'Oluşturma başarısız')
  } finally {
    saving.value = false
  }
}

const deleteFlight = async (flight) => {
  try {
    await ElMessageBox.confirm('Bu uçuşu silmek istediğinizden emin misiniz?', 'Uyarı', {
      type: 'warning'
    })

    await flightAPI.deleteFlight(flight.id)
    ElMessage.success('Uçuş silindi')
    fetchFlights()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Silme işlemi başarısız')
    }
  }
}

const handleCSVSelect = (file) => {
  csvFileList.value = [file]
}

const uploadCSV = async () => {
  if (csvFileList.value.length === 0) {
    ElMessage.error('Lütfen bir CSV dosyası seçin')
    return
  }

  csvUploading.value = true
  try {
    await flightAPI.uploadCSV(csvFileList.value[0].raw)
    ElMessage.success('CSV dosyası başarıyla yüklendi')
    showCSVUpload.value = false
    csvFileList.value = []
    fetchFlights()
  } catch (error) {
    ElMessage.error('CSV yükleme başarısız')
  } finally {
    csvUploading.value = false
  }
}

const getTypeLabel = (type) => {
  const labels = {
    'PASSENGER': 'Yolcu',
    'CARGO': 'Kargo',
    'MIXED': 'Karma'
  }
  return labels[type] || type
}

const getTypeColor = (type) => {
  const colors = {
    'PASSENGER': 'success',
    'CARGO': 'warning',
    'MIXED': 'info'
  }
  return colors[type] || 'info'
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

const getStatusColor = (status) => {
  const colors = {
    'SCHEDULED': 'info',
    'DEPARTED': 'success',
    'ARRIVED': 'success',
    'CANCELLED': 'danger',
    'DELAYED': 'warning'
  }
  return colors[status] || 'info'
}

onMounted(() => {
  withLoading(fetchFlights)
})
</script>

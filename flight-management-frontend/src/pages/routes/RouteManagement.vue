<template>
  <div class="route-management">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1>Route Yönetimi</h1>
        <p>Uçuş rotalarını yönetin</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="openCreateDialog" :icon="Plus">
          Yeni Route
        </el-button>
        <el-button @click="loadRoutes" :icon="Refresh" :loading="loading">
          Yenile
        </el-button>
      </div>
    </div>

    <!-- Route Table Component -->
    <RouteTable
      :routes="routes"
      :loading="loading"
      :current-page="currentPage"
      :page-size="pageSize"
      :total="total"
      @view="viewRoute"
      @edit="editRoute"
      @delete="deleteRoute"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    />

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingRoute ? 'Route Düzenle' : 'Yeni Route'"
      width="600px"
      :close-on-click-modal="false"
    >
      <RouteForm
        ref="routeFormRef"
        v-model="routeForm"
      />

      <template #footer>
        <el-button @click="showCreateDialog = false">İptal</el-button>
        <el-button
          type="primary"
          :loading="loading"
          @click="handleSubmit"
        >
          {{ editingRoute ? 'Güncelle' : 'Oluştur' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- View Dialog -->
    <el-dialog
      v-model="showViewDialog"
      title="Route Detayları"
      width="600px"
    >
      <div v-if="viewingRoute" class="route-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Güzergah">
            <el-tag type="info">{{ getRouteDisplay(viewingRoute) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Mesafe">
            {{ viewingRoute.distance ? `${viewingRoute.distance} km` : 'N/A' }}
          </el-descriptions-item>
          <el-descriptions-item label="Tahmini Süre">
            {{ viewingRoute.estimatedFlightTime ? `${viewingRoute.estimatedFlightTime} dk` : 'N/A' }}
          </el-descriptions-item>
          <el-descriptions-item label="Route Tipi">
            <el-tag :type="viewingRoute.routeType === 'DOMESTIC' ? 'success' : 'warning'">
              {{ ROUTE_TYPE_LABELS[viewingRoute.routeType] || viewingRoute.routeType }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Görünürlük">
            <el-tag>
              {{ ROUTE_VISIBILITY_LABELS[viewingRoute.visibility] || viewingRoute.visibility }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Durum">
            <el-tag :type="viewingRoute.active ? 'success' : 'danger'">
              {{ viewingRoute.active ? 'Aktif' : 'Pasif' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- Airport Details -->
        <div v-if="viewingRoute.originAirport || viewingRoute.destinationAirport"
             style="margin-top: 20px;">
          <h4>Havalimanı Detayları</h4>
          <el-row :gutter="20">
            <el-col :span="12" v-if="viewingRoute.originAirport">
              <el-card header="Kalkış Havalimanı">
                <p><strong>Kod:</strong> {{ viewingRoute.originAirport.iataCode }}</p>
                <p><strong>Ad:</strong> {{ viewingRoute.originAirport.name }}</p>
                <p><strong>Şehir:</strong> {{ viewingRoute.originAirport.city }}</p>
              </el-card>
            </el-col>
            <el-col :span="12" v-if="viewingRoute.destinationAirport">
              <el-card header="Varış Havalimanı">
                <p><strong>Kod:</strong> {{ viewingRoute.destinationAirport.iataCode }}</p>
                <p><strong>Ad:</strong> {{ viewingRoute.destinationAirport.name }}</p>
                <p><strong>Şehir:</strong> {{ viewingRoute.destinationAirport.city }}</p>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { useReferenceStore } from '@/stores/reference'
import RouteTable from '@/components/tables/RouteTable.vue'
import RouteForm from '@/components/forms/RouteForm.vue'
import { ROUTE_TYPE_LABELS, ROUTE_VISIBILITY_LABELS } from '@/utils/constants'

const referenceStore = useReferenceStore()

// Reactive Data
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// Dialogs
const showCreateDialog = ref(false)
const showViewDialog = ref(false)
const editingRoute = ref(null)
const viewingRoute = ref(null)

// Form
const routeFormRef = ref()
const routeForm = reactive({
  originAirportId: null,
  destinationAirportId: null,
  distance: null,
  estimatedFlightTime: null,
  routeType: 'DOMESTIC',
  visibility: 'PRIVATE',
  active: true
})

// Computed
const routes = computed(() => referenceStore.userRoutes || [])

// Methods
const loadRoutes = async () => {
  try {
    loading.value = true
    await referenceStore.loadUserRoutes(true)
    total.value = routes.value.length
  } catch (error) {
    console.error('Error loading routes:', error)
    ElMessage.error('Route\'lar yüklenirken hata oluştu')
  } finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  editingRoute.value = null
  resetForm()
  showCreateDialog.value = true
}

const viewRoute = (route) => {
  viewingRoute.value = route
  showViewDialog.value = true
}

const editRoute = (route) => {
  editingRoute.value = route
  Object.assign(routeForm, {
    originAirportId: route.originAirportId,
    destinationAirportId: route.destinationAirportId,
    distance: route.distance,
    estimatedFlightTime: route.estimatedFlightTime,
    routeType: route.routeType,
    visibility: route.visibility,
    active: route.active
  })
  showCreateDialog.value = true
}

const deleteRoute = async (route) => {
  try {
    await ElMessageBox.confirm(
      `"${getRouteDisplay(route)}" route'unu silmek istediğinizden emin misiniz?`,
      'Route Sil',
      {
        confirmButtonText: 'Sil',
        cancelButtonText: 'İptal',
        type: 'warning'
      }
    )

    loading.value = true
    await referenceStore.deleteRoute(route.id)
    ElMessage.success('Route başarıyla silindi')
    await loadRoutes()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting route:', error)
      ElMessage.error('Route silinirken hata oluştu')
    }
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!routeFormRef.value) return

  try {
    await routeFormRef.value.validate()
    loading.value = true

    if (editingRoute.value) {
      await referenceStore.updateRoute(editingRoute.value.id, routeForm)
      ElMessage.success('Route başarıyla güncellendi')
    } else {
      await referenceStore.createRoute(routeForm)
      ElMessage.success('Route başarıyla oluşturuldu')
    }

    showCreateDialog.value = false
    await loadRoutes()
  } catch (error) {
    console.error('Error saving route:', error)
    ElMessage.error('Route kaydedilirken hata oluştu')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page) => {
  currentPage.value = page
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const resetForm = () => {
  Object.assign(routeForm, {
    originAirportId: null,
    destinationAirportId: null,
    distance: null,
    estimatedFlightTime: null,
    routeType: 'DOMESTIC',
    visibility: 'PRIVATE',
    active: true
  })
  editingRoute.value = null
  routeFormRef.value?.clearValidate()
}

const getRouteDisplay = (route) => {
  if (route.originAirport && route.destinationAirport) {
    return `${route.originAirport.iataCode} → ${route.destinationAirport.iataCode}`
  }
  return 'N/A'
}

// Lifecycle
onMounted(() => {
  loadRoutes()
})
</script>

<style scoped>
.route-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h1 {
  margin: 0;
  color: #303133;
  font-size: 24px;
}

.page-header p {
  margin: 5px 0 0 0;
  color: #909399;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.route-details h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.route-details p {
  margin: 8px 0;
  font-size: 14px;
}
</style>

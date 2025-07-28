<template>
  <AppLayout>
    <PageHeader title="Uçaklar" description="Uçak filosu yönetimi">
      <template #actions>
        <el-button
          v-if="auth.isAdmin"
          type="primary"
          @click="openModal()"
        >
          <el-icon><Plus /></el-icon>
          Yeni Uçak
        </el-button>
      </template>
    </PageHeader>

    <DataTable
      :data="aircraft"
      :loading="loading"
      :total="total"
      :current-page="currentPage"
      :page-size="pageSize"
      @current-change="changePage"
      @size-change="changeSize"
    >
      <el-table-column prop="registration" label="Kayıt No" width="120" />
      <el-table-column prop="aircraftType" label="Uçak Tipi" width="120" />
      <el-table-column prop="manufacturer" label="Üretici" width="120" />
      <el-table-column prop="model" label="Model" width="120" />
      <el-table-column prop="airline.name" label="Havayolu" />
      <el-table-column prop="capacity" label="Kapasite" width="100" />
      <el-table-column prop="yearOfManufacture" label="Üretim Yılı" width="100" />
      <el-table-column prop="active" label="Durum" width="100">
        <template #default="{ row }">
          <el-tag :type="row.active ? 'success' : 'danger'">
            {{ row.active ? 'Aktif' : 'Pasif' }}
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
            @click="deleteAircraft(row)"
          >
            Sil
          </el-button>
        </template>
      </el-table-column>
    </DataTable>

    <FormModal
      v-model="modalVisible"
      :title="isEdit ? 'Uçak Düzenle' : 'Yeni Uçak'"
      :form="form"
      :rules="formRules"
      :loading="saving"
      @submit="saveAircraft"
      @close="closeModal"
      width="700px"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="Kayıt No" prop="registration">
            <el-input v-model="form.registration" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Uçak Tipi" prop="aircraftType">
            <el-select v-model="form.aircraftType" style="width: 100%">
              <el-option label="Passenger" value="PASSENGER" />
              <el-option label="Cargo" value="CARGO" />
              <el-option label="Mixed" value="MIXED" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="Üretici" prop="manufacturer">
            <el-select v-model="form.manufacturer" style="width: 100%" filterable>
              <el-option label="Boeing" value="BOEING" />
              <el-option label="Airbus" value="AIRBUS" />
              <el-option label="Embraer" value="EMBRAER" />
              <el-option label="Bombardier" value="BOMBARDIER" />
              <el-option label="ATR" value="ATR" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Model" prop="model">
            <el-input v-model="form.model" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="Havayolu" prop="airlineId">
            <el-select
              v-model="form.airlineId"
              style="width: 100%"
              filterable
              :loading="airlinesLoading"
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
        <el-col :span="12">
          <el-form-item label="Kapasite" prop="capacity">
            <el-input-number v-model="form.capacity" :min="1" :max="1000" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="Üretim Yılı" prop="yearOfManufacture">
            <el-input-number
              v-model="form.yearOfManufacture"
              :min="1950"
              :max="new Date().getFullYear()"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Durum">
            <el-switch v-model="form.active" />
          </el-form-item>
        </el-col>
      </el-row>
    </FormModal>
  </AppLayout>
</template>

<script setup>
import { Plus } from '@element-plus/icons-vue'
import AppLayout from '@/components/common/AppLayout.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import DataTable from '@/components/tables/DataTable.vue'
import FormModal from '@/components/forms/FormModal.vue'
import { referenceAPI } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { usePagination, useLoading, rules } from '@/utils'

const auth = useAuthStore()
const { loading, withLoading } = useLoading()

const {
  data: aircraft,
  total,
  currentPage,
  pageSize,
  fetch: fetchAircraft,
  changePage
} = usePagination(referenceAPI.getAircraft)

const modalVisible = ref(false)
const saving = ref(false)
const isEdit = ref(false)
const airlines = ref([])
const airlinesLoading = ref(false)

const form = reactive({
  id: null,
  registration: '',
  aircraftType: 'PASSENGER',
  manufacturer: '',
  model: '',
  airlineId: null,
  capacity: 150,
  yearOfManufacture: new Date().getFullYear(),
  active: true
})

const formRules = {
  registration: [rules.required],
  aircraftType: [rules.required],
  manufacturer: [rules.required],
  model: [rules.required],
  airlineId: [rules.required],
  capacity: [rules.required],
  yearOfManufacture: [rules.required]
}

const changeSize = (size) => {
  pageSize.value = size
  fetchAircraft()
}

const loadAirlines = async () => {
  airlinesLoading.value = true
  try {
    const response = await referenceAPI.getAirlines({ page: 0, size: 1000 })
    airlines.value = response.content || []
  } catch (error) {
    console.error('Havayolları yüklenirken hata:', error)
  } finally {
    airlinesLoading.value = false
  }
}

const openModal = async (aircraftItem = null) => {
  isEdit.value = !!aircraftItem
  if (aircraftItem) {
    Object.assign(form, {
      ...aircraftItem,
      airlineId: aircraftItem.airline?.id
    })
  } else {
    Object.assign(form, {
      id: null,
      registration: '',
      aircraftType: 'PASSENGER',
      manufacturer: '',
      model: '',
      airlineId: null,
      capacity: 150,
      yearOfManufacture: new Date().getFullYear(),
      active: true
    })
  }

  await loadAirlines()
  modalVisible.value = true
}

const closeModal = () => {
  modalVisible.value = false
}

const saveAircraft = async () => {
  saving.value = true
  try {
    const payload = { ...form }
    delete payload.airline // Backend'e airline object'i değil airlineId gönderiyoruz

    if (isEdit.value) {
      await referenceAPI.updateAircraft(form.id, payload)
      ElMessage.success('Uçak güncellendi')
    } else {
      await referenceAPI.createAircraft(payload)
      ElMessage.success('Uçak oluşturuldu')
    }
    closeModal()
    fetchAircraft()
  } catch (error) {
    ElMessage.error(isEdit.value ? 'Güncelleme başarısız' : 'Oluşturma başarısız')
  } finally {
    saving.value = false
  }
}

const deleteAircraft = async (aircraftItem) => {
  try {
    await ElMessageBox.confirm('Bu uçağı silmek istediğinizden emin misiniz?', 'Uyarı', {
      type: 'warning'
    })

    await referenceAPI.deleteAircraft(aircraftItem.id)
    ElMessage.success('Uçak silindi')
    fetchAircraft()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Silme işlemi başarısız')
    }
  }
}

onMounted(() => {
  withLoading(fetchAircraft)
})
</script>

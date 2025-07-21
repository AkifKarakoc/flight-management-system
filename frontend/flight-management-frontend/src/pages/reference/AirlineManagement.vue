<template>
  <div class="airline-management">
    <div class="page-header">
      <h1 class="page-title">Havayolu Yönetimi</h1>
      <p class="page-subtitle">Havayolu şirketlerini yönetin</p>
    </div>

    <DataTable
      :data="referenceStore.airlines"
      :columns="columns"
      :loading="referenceStore.loading.airlines"
      :total="referenceStore.airlines.length"
      @create="handleCreate"
      @edit="handleEdit"
      @delete="handleDelete"
      @refresh="handleRefresh"
    />

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'Havayolu Düzenle' : 'Yeni Havayolu'"
      width="600px"
      :close-on-click-modal="false"
      @closed="handleDialogClosed"
    >
      <AirlineForm
        ref="formRef"
        :model-value="currentItem"
        :is-edit="isEdit"
        @submit="handleSubmit"
        @cancel="dialogVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useReferenceStore } from '@/stores/reference'
import DataTable from '@/components/tables/DataTable.vue'
import AirlineForm from '@/components/forms/AirlineForm.vue'
import { formatDate, formatStatus, getStatusType } from '@/utils/formatters'

const referenceStore = useReferenceStore()

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const currentItem = ref({})

// Table columns configuration
const columns = [
  {
    prop: 'iataCode',
    label: 'IATA Kodu',
    width: 100,
    sortable: true
  },
  {
    prop: 'icaoCode',
    label: 'ICAO Kodu',
    width: 110,
    sortable: true
  },
  {
    prop: 'name',
    label: 'Havayolu Adı',
    minWidth: 200,
    sortable: true
  },
  {
    prop: 'country',
    label: 'Ülke',
    width: 120,
    sortable: true
  },
  {
    prop: 'active',
    label: 'Durum',
    width: 100,
    type: 'tag',
    tagMap: {
      true: { text: 'Aktif', type: 'success' },
      false: { text: 'Pasif', type: 'danger' }
    }
  },
  {
    prop: 'createdAt',
    label: 'Oluşturma Tarihi',
    width: 150,
    formatter: (value) => formatDate(value),
    sortable: true
  }
]

// Methods
const handleCreate = () => {
  isEdit.value = false
  currentItem.value = {
    iataCode: '',
    icaoCode: '',
    name: '',
    country: '',
    website: '',
    contactEmail: '',
    contactPhone: '',
    active: true
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  currentItem.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await referenceStore.deleteAirline(row.id)
  } catch (error) {
    console.error('Delete error:', error)
  }
}

const handleRefresh = async () => {
  try {
    await referenceStore.fetchAirlines(true)
  } catch (error) {
    console.error('Refresh error:', error)
  }
}

const handleSubmit = async (formData) => {
  try {
    if (isEdit.value) {
      await referenceStore.updateAirline(currentItem.value.id, formData)
    } else {
      await referenceStore.createAirline(formData)
    }
    dialogVisible.value = false
  } catch (error) {
    console.error('Submit error:', error)
  }
}

const handleDialogClosed = () => {
  currentItem.value = {}
  if (formRef.value) {
    formRef.value.resetForm()
  }
}

// Load data on mount
onMounted(async () => {
  await referenceStore.fetchAirlines()
})
</script>

<style scoped>
.airline-management {
  padding: 0;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 16px;
  color: #606266;
  margin: 0;
}
</style>

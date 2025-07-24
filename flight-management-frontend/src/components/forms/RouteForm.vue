<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="140px"
  >
    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item label="Kalkış Havalimanı" prop="originAirportId">
          <el-select
            v-model="form.originAirportId"
            placeholder="Kalkış seçiniz"
            filterable
            style="width: 100%"
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
            v-model="form.destinationAirportId"
            placeholder="Varış seçiniz"
            filterable
            style="width: 100%"
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
      <el-col :span="8">
        <el-form-item label="Mesafe (km)" prop="distance">
          <el-input-number
            v-model="form.distance"
            :min="0"
            :max="50000"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="Tahmini Süre (dk)" prop="estimatedFlightTime">
          <el-input-number
            v-model="form.estimatedFlightTime"
            :min="0"
            :max="2000"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="Route Tipi" prop="routeType">
          <el-select
            v-model="form.routeType"
            placeholder="Tip seçiniz"
            style="width: 100%"
          >
            <el-option
              v-for="(label, value) in ROUTE_TYPE_LABELS"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item label="Durum">
      <el-switch
        v-model="form.active"
        active-text="Aktif"
        inactive-text="Pasif"
      />
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useReferenceStore } from '@/stores/reference'
import { ROUTE_TYPE_LABELS } from '@/utils/constants'

const referenceStore = useReferenceStore()

// Props & Emits
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  editMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

// Refs
const formRef = ref()
const airportOptions = ref([])

// Form Data
const form = reactive({
  originAirportId: null,
  destinationAirportId: null,
  distance: null,
  estimatedFlightTime: null,
  routeType: 'DOMESTIC',
  active: true
})

// Validation Rules
const rules = {
  originAirportId: [
    { required: true, message: 'Kalkış havalimanı seçimi gereklidir', trigger: 'change' }
  ],
  destinationAirportId: [
    { required: true, message: 'Varış havalimanı seçimi gereklidir', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (value === form.originAirportId) {
          callback(new Error('Kalkış ve varış havalimanı aynı olamaz'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  distance: [
    { required: true, message: 'Mesafe gereklidir', trigger: 'change' }
  ],
  estimatedFlightTime: [
    { required: true, message: 'Tahmini süre gereklidir', trigger: 'change' }
  ],
  routeType: [
    { required: true, message: 'Route tipi seçimi gereklidir', trigger: 'change' }
  ]
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue && typeof newValue === 'object') {
    Object.assign(form, {
      originAirportId: newValue.originAirportId || null,
      destinationAirportId: newValue.destinationAirportId || null,
      distance: newValue.distance || null,
      estimatedFlightTime: newValue.estimatedFlightTime || null,
      routeType: newValue.routeType || 'DOMESTIC',
      active: newValue.active !== undefined ? newValue.active : true
    })
  }
}, { immediate: true, deep: true })

watch(form, (newValue) => {
  emit('update:modelValue', { ...newValue })
}, { deep: true })

// Methods
const validate = async () => {
  return await formRef.value.validate()
}

const clearValidate = () => {
  formRef.value?.clearValidate()
}

const resetForm = () => {
  Object.assign(form, {
    originAirportId: null,
    destinationAirportId: null,
    distance: null,
    estimatedFlightTime: null,
    routeType: 'DOMESTIC',
    active: true
  })
  clearValidate()
}

// Expose methods
defineExpose({
  validate,
  clearValidate,
  resetForm
})

// Lifecycle
onMounted(async () => {
  await referenceStore.loadAirports()
  airportOptions.value = referenceStore.airportOptions
})
</script>

<style scoped>
.el-form {
  max-width: 100%;
}
</style>

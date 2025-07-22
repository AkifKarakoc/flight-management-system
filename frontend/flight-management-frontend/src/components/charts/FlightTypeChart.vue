<template>
  <div class="flight-type-chart">
    <div v-if="loading" class="chart-loading">
      <el-skeleton animated>
        <template #template>
          <el-skeleton-item variant="circle" style="width: 200px; height: 200px; margin: 0 auto" />
          <div style="margin-top: 20px;">
            <el-skeleton-item variant="text" style="width: 60%; margin: 10px auto" />
            <el-skeleton-item variant="text" style="width: 80%; margin: 10px auto" />
            <el-skeleton-item variant="text" style="width: 40%; margin: 10px auto" />
          </div>
        </template>
      </el-skeleton>
    </div>

    <div v-else-if="!error" class="chart-content">
      <div ref="chartContainer" class="chart-container"></div>

      <!-- Chart Legend and Statistics -->
      <div class="chart-stats">
        <div class="stats-grid">
          <div
            v-for="item in chartData"
            :key="item.name"
            class="stat-item"
            :style="{ borderLeftColor: item.itemStyle.color }"
          >
            <div class="stat-info">
              <span class="stat-label">{{ item.name }}</span>
              <span class="stat-value">{{ item.value }}</span>
            </div>
            <div class="stat-percentage">
              {{ getPercentage(item.value) }}%
            </div>
          </div>
        </div>

        <div class="total-info">
          <el-divider />
          <div class="total-item">
            <span class="total-label">Toplam Uçuş:</span>
            <span class="total-value">{{ totalFlights }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="chart-error">
      <el-empty description="Grafik yüklenirken hata oluştu">
        <el-button type="primary" @click="fetchChartData">
          Tekrar Dene
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import apiService from '@/services/api.js'

const props = defineProps({
  height: {
    type: String,
    default: '300px'
  },
  showLegend: {
    type: Boolean,
    default: true
  },
  animationDuration: {
    type: Number,
    default: 1000
  }
})

const emit = defineEmits(['dataLoaded', 'error', 'chartClick'])

const chartContainer = ref(null)
const loading = ref(true)
const error = ref(false)
let chartInstance = null

const chartData = reactive([])

// Computed properties
const totalFlights = computed(() => {
  return chartData.reduce((sum, item) => sum + item.value, 0)
})

const getPercentage = (value) => {
  return totalFlights.value > 0 ? ((value / totalFlights.value) * 100).toFixed(1) : 0
}

// Chart configuration
const chartOptions = reactive({
  title: {
    text: 'Uçuş Türü Dağılımı',
    left: 'center',
    top: '5%',
    textStyle: {
      fontSize: 16,
      fontWeight: 'normal',
      color: '#303133'
    }
  },
  tooltip: {
    trigger: 'item',
    formatter: function(params) {
      return `
        <div style="font-weight: bold; margin-bottom: 5px;">${params.name}</div>
        <div style="display: flex; align-items: center;">
          <span style="display: inline-block; width: 10px; height: 10px; background-color: ${params.color}; border-radius: 50%; margin-right: 8px;"></span>
          <span>Uçuş Sayısı: <strong>${params.value}</strong></span>
        </div>
        <div style="margin-top: 3px; color: #666;">
          Yüzde: <strong>${params.percent}%</strong>
        </div>
      `
    }
  },
  legend: {
    show: props.showLegend,
    orient: 'horizontal',
    bottom: '5%',
    left: 'center',
    textStyle: {
      color: '#606266',
      fontSize: 12
    },
    itemWidth: 12,
    itemHeight: 12
  },
  series: [
    {
      name: 'Uçuş Türleri',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        position: 'outside',
        formatter: '{b}: {c}',
        fontSize: 12,
        color: '#606266'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold'
        },
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      labelLine: {
        show: true,
        length: 15,
        length2: 8
      },
      data: []
    }
  ],
  animationDuration: props.animationDuration,
  animationEasing: 'cubicOut'
})

// Predefined colors for different flight types
const flightTypeColors = {
  'PASSENGER': '#409eff',
  'CARGO': '#67c23a',
  'DOMESTIC': '#e6a23c',
  'INTERNATIONAL': '#f56c6c',
  'CHARTER': '#909399',
  'PRIVATE': '#c397d8'
}

const flightTypeLabels = {
  'PASSENGER': 'Yolcu Uçuşu',
  'CARGO': 'Kargo Uçuşu',
  'DOMESTIC': 'İç Hat',
  'INTERNATIONAL': 'Dış Hat',
  'CHARTER': 'Charter',
  'PRIVATE': 'Özel Jet'
}

// Fetch chart data from API
const fetchChartData = async () => {
  loading.value = true
  error.value = false

  try {
    // Gerçek backend'den veri çek
    const data = await apiService.getFlightTypeDistribution()

    // Transform data for chart
    chartData.length = 0 // Clear existing data
    data.forEach(item => {
      chartData.push({
        name: flightTypeLabels[item.type] || item.type,
        value: item.count,
        type: item.type,
        itemStyle: {
          color: flightTypeColors[item.type] || '#909399'
        }
      })
    })

    updateChart()
    emit('dataLoaded', chartData)

  } catch (err) {
    console.error('Error fetching flight type data:', err)
    error.value = true
    emit('error', err)
  } finally {
    loading.value = false
  }
}

// Update chart with new data
const updateChart = () => {
  if (!chartInstance) return

  const newOptions = {
    series: [{
      data: chartData
    }]
  }

  chartInstance.setOption(newOptions)
}

// Initialize chart
const initChart = async () => {
  await nextTick()
  if (!chartContainer.value) return

  chartInstance = echarts.init(chartContainer.value)
  chartInstance.setOption(chartOptions)

  // Handle chart click events
  chartInstance.on('click', (params) => {
    emit('chartClick', {
      type: params.data.type,
      name: params.data.name,
      value: params.data.value
    })
  })

  // Handle resize
  window.addEventListener('resize', handleResize)
}

// Handle window resize
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

// Cleanup
const cleanup = () => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  window.removeEventListener('resize', handleResize)
}

// Lifecycle hooks
onMounted(async () => {
  await initChart()
  await fetchChartData()
})

onUnmounted(() => {
  cleanup()
})

// Expose methods for parent component
defineExpose({
  refreshData: fetchChartData,
  exportChart: () => {
    if (chartInstance) {
      const dataURL = chartInstance.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff'
      })
      return dataURL
    }
    return null
  },
  highlightData: (dataIndex) => {
    if (chartInstance) {
      chartInstance.dispatchAction({
        type: 'highlight',
        seriesIndex: 0,
        dataIndex: dataIndex
      })
    }
  },
  downplayData: () => {
    if (chartInstance) {
      chartInstance.dispatchAction({
        type: 'downplay',
        seriesIndex: 0
      })
    }
  }
})
</script>

<style scoped>
.flight-type-chart {
  width: 100%;
  height: 100%;
}

.chart-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chart-container {
  flex: 1;
  min-height: v-bind(height);
}

.chart-loading {
  padding: 20px;
  text-align: center;
}

.chart-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
}

.chart-stats {
  margin-top: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #ddd;
  transition: all 0.3s ease;
}

.stat-item:hover {
  background: #f0f2f5;
  transform: translateY(-1px);
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.stat-percentage {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
  padding: 4px 8px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 4px;
}

.total-info {
  margin-top: 16px;
}

.total-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.total-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.total-value {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

@media (max-width: 768px) {
  .chart-container {
    min-height: 250px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .stat-item {
    padding: 10px 12px;
  }

  .stat-value {
    font-size: 14px;
  }

  .stat-percentage {
    font-size: 12px;
  }
}
</style>

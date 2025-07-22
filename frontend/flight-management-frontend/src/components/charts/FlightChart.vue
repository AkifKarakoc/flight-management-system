<template>
  <div class="flight-chart">
    <div v-if="loading" class="chart-loading">
      <el-skeleton animated>
        <template #template>
          <el-skeleton-item variant="rect" style="width: 100%; height: 300px" />
        </template>
      </el-skeleton>
    </div>

    <div v-else ref="chartContainer" class="chart-container"></div>

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
import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import apiService from '@/services/api.js'

const props = defineProps({
  period: {
    type: String,
    default: '7d',
    validator: (value) => ['7d', '30d', '90d'].includes(value)
  },
  height: {
    type: String,
    default: '300px'
  }
})

const emit = defineEmits(['dataLoaded', 'error'])

const chartContainer = ref(null)
const loading = ref(true)
const error = ref(false)
let chartInstance = null

const chartData = reactive({
  dates: [],
  scheduled: [],
  completed: [],
  cancelled: [],
  delayed: []
})

// Chart configuration
const chartOptions = reactive({
  title: {
    text: 'Günlük Uçuş Dağılımı',
    left: 'center',
    textStyle: {
      fontSize: 16,
      fontWeight: 'normal',
      color: '#303133'
    }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      label: {
        backgroundColor: '#6a7985'
      }
    },
    formatter: function (params) {
      let result = `<div style="font-weight: bold; margin-bottom: 5px;">${params[0].axisValue}</div>`
      params.forEach(param => {
        result += `
          <div style="display: flex; align-items: center; margin: 2px 0;">
            <span style="display: inline-block; width: 10px; height: 10px; background-color: ${param.color}; border-radius: 50%; margin-right: 8px;"></span>
            <span style="flex: 1;">${param.seriesName}:</span>
            <span style="font-weight: bold; margin-left: 8px;">${param.value}</span>
          </div>
        `
      })
      return result
    }
  },
  legend: {
    data: ['Planlanmış', 'Tamamlanmış', 'İptal', 'Gecikmeli'],
    bottom: 10,
    textStyle: {
      color: '#606266'
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    top: '15%',
    containLabel: true
  },
  toolbox: {
    feature: {
      saveAsImage: {
        title: 'Resim Olarak Kaydet',
        name: 'flight-chart'
      },
      dataZoom: {
        title: {
          zoom: 'Yakınlaştır',
          back: 'Sıfırla'
        }
      }
    }
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: [],
    axisLabel: {
      color: '#606266',
      formatter: function (value) {
        return new Date(value).toLocaleDateString('tr-TR', {
          month: 'short',
          day: 'numeric'
        })
      }
    }
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      color: '#606266'
    },
    splitLine: {
      lineStyle: {
        color: '#f0f0f0'
      }
    }
  },
  series: [
    {
      name: 'Planlanmış',
      type: 'line',
      stack: 'Total',
      areaStyle: {
        opacity: 0.3
      },
      emphasis: {
        focus: 'series'
      },
      data: [],
      itemStyle: {
        color: '#409eff'
      }
    },
    {
      name: 'Tamamlanmış',
      type: 'line',
      stack: 'Total',
      areaStyle: {
        opacity: 0.3
      },
      emphasis: {
        focus: 'series'
      },
      data: [],
      itemStyle: {
        color: '#67c23a'
      }
    },
    {
      name: 'İptal',
      type: 'line',
      stack: 'Total',
      areaStyle: {
        opacity: 0.3
      },
      emphasis: {
        focus: 'series'
      },
      data: [],
      itemStyle: {
        color: '#f56c6c'
      }
    },
    {
      name: 'Gecikmeli',
      type: 'line',
      stack: 'Total',
      areaStyle: {
        opacity: 0.3
      },
      emphasis: {
        focus: 'series'
      },
      data: [],
      itemStyle: {
        color: '#e6a23c'
      }
    }
  ]
})

// Fetch chart data from API
const fetchChartData = async () => {
  loading.value = true
  error.value = false

  try {
    // Gerçek backend'den veri çek
    const data = await apiService.getFlightChartData(props.period)

    // Update chart data
    chartData.dates = data.dates
    chartData.scheduled = data.scheduled
    chartData.completed = data.completed
    chartData.cancelled = data.cancelled
    chartData.delayed = data.delayed

    updateChart()
    emit('dataLoaded', chartData)

  } catch (err) {
    console.error('Error fetching chart data:', err)
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
    xAxis: {
      data: chartData.dates
    },
    series: [
      { data: chartData.scheduled },
      { data: chartData.completed },
      { data: chartData.cancelled },
      { data: chartData.delayed }
    ]
  }

  chartInstance.setOption(newOptions)
}

// Initialize chart
const initChart = async () => {
  await nextTick()
  if (!chartContainer.value) return

  chartInstance = echarts.init(chartContainer.value)
  chartInstance.setOption(chartOptions)

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

// Watch for period changes
watch(() => props.period, () => {
  fetchChartData()
}, { immediate: false })

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
  }
})
</script>

<style scoped>
.flight-chart {
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  height: v-bind(height);
  min-height: 300px;
}

.chart-loading {
  padding: 20px;
}

.chart-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
}

@media (max-width: 768px) {
  .chart-container {
    height: 250px;
    min-height: 250px;
  }
}
</style>

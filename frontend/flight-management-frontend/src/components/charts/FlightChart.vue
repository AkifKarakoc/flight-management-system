<template>
  <div class="flight-chart">
    <div v-if="loading" class="chart-loading">
      <el-skeleton animated>
        <template #template>
          <div style="height: 300px; display: flex; align-items: center; justify-content: center;">
            <el-skeleton-item variant="text" style="width: 200px; height: 20px;" />
          </div>
        </template>
      </el-skeleton>
    </div>

    <div v-else ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  period: {
    type: String,
    default: '7d',
    validator: (value) => ['7d', '30d'].includes(value)
  }
})

const chartContainer = ref(null)
const loading = ref(true)
let chartInstance = null

// Mock data generation
const generateMockData = (period) => {
  const days = period === '7d' ? 7 : 30
  const data = []
  const categories = []

  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    categories.push(date.toLocaleDateString('tr-TR', {
      month: 'short',
      day: 'numeric'
    }))

    // Generate random flight counts with some realistic patterns
    const baseFlights = Math.floor(Math.random() * 50) + 20
    const weekendMultiplier = date.getDay() === 0 || date.getDay() === 6 ? 1.3 : 1
    data.push(Math.floor(baseFlights * weekendMultiplier))
  }

  return { data, categories }
}

const initChart = async () => {
  loading.value = true

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))

    const mockData = generateMockData(props.period)

    await nextTick()

    if (!chartContainer.value) return

    // Dispose existing chart
    if (chartInstance) {
      chartInstance.dispose()
    }

    chartInstance = echarts.init(chartContainer.value)

    const option = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(50, 50, 50, 0.9)',
        borderColor: '#409eff',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
          fontSize: 12
        },
        formatter: (params) => {
          const data = params[0]
          return `
            <div style="font-weight: 600; margin-bottom: 4px;">${data.name}</div>
            <div style="display: flex; align-items: center;">
              <span style="display: inline-block; width: 8px; height: 8px; background: ${data.color}; border-radius: 50%; margin-right: 6px;"></span>
              <span>Uçuş Sayısı: <strong>${data.value}</strong></span>
            </div>
          `
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: mockData.categories,
        axisLine: {
          lineStyle: {
            color: '#e4e7ed'
          }
        },
        axisTick: {
          lineStyle: {
            color: '#e4e7ed'
          }
        },
        axisLabel: {
          color: '#606266',
          fontSize: 11
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: '#606266',
          fontSize: 11
        },
        splitLine: {
          lineStyle: {
            color: '#f5f7fa',
            type: 'dashed'
          }
        }
      },
      series: [
        {
          name: 'Uçuş Sayısı',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 3,
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#409eff' },
              { offset: 1, color: '#67c23a' }
            ])
          },
          itemStyle: {
            color: '#409eff',
            borderColor: '#fff',
            borderWidth: 2
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
            ])
          },
          data: mockData.data,
          emphasis: {
            focus: 'series',
            itemStyle: {
              color: '#409eff',
              borderColor: '#fff',
              borderWidth: 3,
              shadowColor: 'rgba(64, 158, 255, 0.5)',
              shadowBlur: 10
            }
          }
        }
      ]
    }

    chartInstance.setOption(option)

    // Handle resize
    const handleResize = () => {
      if (chartInstance) {
        chartInstance.resize()
      }
    }

    window.addEventListener('resize', handleResize)

    // Store resize handler for cleanup
    chartInstance._resizeHandler = handleResize

  } catch (error) {
    console.error('Error initializing flight chart:', error)
  } finally {
    loading.value = false
  }
}

// Watch for period changes
watch(() => props.period, () => {
  initChart()
}, { immediate: false })

onMounted(() => {
  initChart()
})

onUnmounted(() => {
  if (chartInstance) {
    if (chartInstance._resizeHandler) {
      window.removeEventListener('resize', chartInstance._resizeHandler)
    }
    chartInstance.dispose()
    chartInstance = null
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
  height: 300px;
}

.chart-loading {
  width: 100%;
  height: 300px;
}

@media (max-width: 768px) {
  .chart-container {
    height: 250px;
  }

  .chart-loading {
    height: 250px;
  }
}
</style>

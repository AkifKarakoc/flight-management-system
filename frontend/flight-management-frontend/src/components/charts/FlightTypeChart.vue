<template>
  <div class="flight-type-chart">
    <div v-if="loading" class="chart-loading">
      <el-skeleton animated>
        <template #template>
          <div style="height: 300px; display: flex; align-items: center; justify-content: center;">
            <el-skeleton-item variant="circle" style="width: 120px; height: 120px;" />
          </div>
        </template>
      </el-skeleton>
    </div>

    <div v-else ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'

const chartContainer = ref(null)
const loading = ref(true)
let chartInstance = null

// Mock data for flight types
const generateMockData = () => {
  return [
    { name: 'İç Hat', value: 65, color: '#409eff' },
    { name: 'Dış Hat', value: 25, color: '#67c23a' },
    { name: 'Kargo', value: 8, color: '#e6a23c' },
    { name: 'Özel', value: 2, color: '#f56c6c' }
  ]
}

const initChart = async () => {
  loading.value = true

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600))

    const mockData = generateMockData()

    await nextTick()

    if (!chartContainer.value) return

    // Dispose existing chart
    if (chartInstance) {
      chartInstance.dispose()
    }

    chartInstance = echarts.init(chartContainer.value)

    const option = {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(50, 50, 50, 0.9)',
        borderColor: '#409eff',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
          fontSize: 12
        },
        formatter: (params) => {
          return `
            <div style="font-weight: 600; margin-bottom: 4px;">${params.name}</div>
            <div style="display: flex; align-items: center;">
              <span style="display: inline-block; width: 8px; height: 8px; background: ${params.color}; border-radius: 50%; margin-right: 6px;"></span>
              <span>Oran: <strong>${params.percent}%</strong></span>
            </div>
            <div style="margin-top: 2px; color: #ccc; font-size: 11px;">
              Toplam: ${params.value} uçuş
            </div>
          `
        }
      },
      legend: {
        orient: 'horizontal',
        bottom: '0%',
        left: 'center',
        textStyle: {
          color: '#606266',
          fontSize: 12
        },
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 20,
        formatter: (name) => {
          const item = mockData.find(d => d.name === name)
          return `${name} (${item ? item.value : 0}%)`
        }
      },
      series: [
        {
          name: 'Uçuş Türleri',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            position: 'outside',
            fontSize: 12,
            fontWeight: 600,
            color: '#303133',
            formatter: '{b}\n{c}%',
            lineHeight: 16
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
              shadowColor: 'rgba(0, 0, 0, 0.3)'
            }
          },
          labelLine: {
            show: true,
            length: 15,
            length2: 10,
            smooth: 0.2,
            lineStyle: {
              color: '#909399'
            }
          },
          data: mockData.map(item => ({
            value: item.value,
            name: item.name,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: item.color },
                { offset: 1, color: adjustBrightness(item.color, -20) }
              ])
            }
          }))
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

    // Add click event for interactivity
    chartInstance.on('click', (params) => {
      console.log('Flight type clicked:', params.name, params.value)
      // Here you could emit an event or navigate to detailed view
    })

  } catch (error) {
    console.error('Error initializing flight type chart:', error)
  } finally {
    loading.value = false
  }
}

// Helper function to adjust color brightness
const adjustBrightness = (color, amount) => {
  const usePound = color[0] === '#'
  const col = usePound ? color.slice(1) : color
  const num = parseInt(col, 16)
  const r = Math.max(0, Math.min(255, (num >> 16) + amount))
  const g = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amount))
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount))
  return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0')
}

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
.flight-type-chart {
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

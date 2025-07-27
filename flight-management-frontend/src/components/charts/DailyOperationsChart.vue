<template>
  <BaseCard>
    <template #header>
      <div class="flex justify-between items-center">
        <h3 class="font-semibold text-lg">Günlük Operasyon Grafiği</h3>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="-"
          start-placeholder="Başlangıç"
          end-placeholder="Bitiş"
          size="small"
          style="width: 220px;"
          @change="handleDateChange"
        />
      </div>
    </template>
    <div v-if="loading" class="flex justify-center items-center h-80">
      <font-awesome-icon :icon="['fas', 'spinner']" spin size="2x" />
    </div>
    <v-chart v-else class="chart" :option="chartOption" autoresize />
  </BaseCard>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  ToolboxComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';
import BaseCard from '@/components/ui/BaseCard.vue';
import { ElDatePicker } from 'element-plus';
import dayjs from 'dayjs';

// ECharts için gerekli bileşenleri yükle
use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  ToolboxComponent,
]);

const props = defineProps({
  chartData: {
    type: Array,
    required: true,
    default: () => [] // Örnek veri: [{ date: '2023-01-01', scheduled: 150, completed: 145, delayed: 5 }, ...]
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['date-range-change']);

const dateRange = ref([
  dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
  dayjs().format('YYYY-MM-DD')
]);

// Grafik seçeneklerini (options) oluşturan computed property
const chartOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['Planlanan', 'Tamamlanan', 'Rötarlı']
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  toolbox: {
    feature: {
      saveAsImage: { title: 'Resim olarak kaydet' }
    }
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: props.chartData.map(item => item.date) // Tarihler
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: 'Planlanan',
      type: 'line',
      smooth: true,
      data: props.chartData.map(item => item.scheduled),
      itemStyle: { color: '#409EFF' }
    },
    {
      name: 'Tamamlanan',
      type: 'line',
      smooth: true,
      data: props.chartData.map(item => item.completed),
      itemStyle: { color: '#67C23A' }
    },
    {
      name: 'Rötarlı',
      type: 'line',
      smooth: true,
      data: props.chartData.map(item => item.delayed),
      itemStyle: { color: '#E6A23C' }
    }
  ]
}));

const handleDateChange = (newDates) => {
  emit('date-range-change', newDates);
};

// Prop değiştiğinde grafiği güncellemek için (opsiyonel)
watch(() => props.chartData, () => {
  // vue-echarts reaktiviteyi kendi yönetir, genellikle ek bir şey yapmaya gerek kalmaz.
}, { deep: true });
</script>

<style scoped>
.chart {
  height: 350px;
}
</style>

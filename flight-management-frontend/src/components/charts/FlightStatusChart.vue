<template>
  <BaseCard>
    <template #header>
      <div class="flex justify-between items-center">
        <h3 class="font-semibold text-lg">Uçuş Durum Dağılımı</h3>
        <BaseButton circle size="small" @click="$emit('refresh')" :loading="loading">
          <font-awesome-icon :icon="['fas', 'sync']" />
        </BaseButton>
      </div>
    </template>
    <div v-if="loading" class="flex justify-center items-center h-72">
      <font-awesome-icon :icon="['fas', 'spinner']" spin size="2x" />
    </div>
    <v-chart v-else class="chart" :option="chartOption" autoresize />
  </BaseCard>
</template>

<script setup>
import { computed } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';
import BaseCard from '@/components/ui/BaseCard.vue';
import BaseButton from '@/components/ui/BaseButton.vue';

// ECharts için gerekli bileşenleri yükle
use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
]);

const props = defineProps({
  chartData: {
    type: Array,
    required: true,
    // Örnek veri formatı: [{ value: 10, name: 'Planlandı' }, { value: 5, name: 'Kalkış Yaptı' }]
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

defineEmits(['refresh']);

// Renk paleti API dökümanındaki durumlarla eşleşiyor
const colorPalette = {
  SCHEDULED: '#5470C6',
  BOARDING: '#91CC75',
  DEPARTED: '#67C23A',
  ARRIVED: '#3BA272',
  CANCELLED: '#F56C6C',
  DELAYED: '#FAC858',
  DIVERTED: '#EE6666',
  RETURNING: '#FC8452',
};

// Grafik seçeneklerini (options) oluşturan computed property
const chartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)' // Örn: Uçuş Durumu <br/>Planlandı: 10 (%25)
  },
  legend: {
    orient: 'vertical',
    left: 'left',
    top: 'middle',
    data: props.chartData.map(item => item.name)
  },
  series: [
    {
      name: 'Uçuş Durumu',
      type: 'pie',
      radius: ['50%', '70%'], // Donut chart için iç ve dış yarıçap
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2,
        // Duruma göre renk atama
        color: (params) => {
          const statusKey = Object.keys(statusNameMap).find(key => statusNameMap[key] === params.name);
          return colorPalette[statusKey] || '#ccc';
        }
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '20',
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: props.chartData
    }
  ]
}));

// API'den gelen durum isimlerini (örn: SCHEDULED) kullanıcı dostu isimlere çevir
const statusNameMap = {
  SCHEDULED: 'Planlandı',
  BOARDING: 'Yolcu Alıyor',
  DEPARTED: 'Kalkış Yaptı',
  ARRIVED: 'Varış Yaptı',
  CANCELLED: 'İptal',
  DELAYED: 'Rötarlı',
  DIVERTED: 'Yönlendirildi',
  RETURNING: 'Geri Dönüyor',
};

</script>

<style scoped>
.chart {
  height: 320px;
}
</style>

<template>
  <el-row :gutter="20" class="performance-metrics">
    <el-col :span="8">
      <BaseCard class="metric-card text-center">
        <div class="text-sm font-medium text-gray-500 mb-2">Zamanında Kalkış Performansı</div>
        <el-progress
          type="dashboard"
          :percentage="metrics.onTimePerformance || 0"
          :color="onTimePerformanceColor"
          :width="120"
        >
          <template #default="{ percentage }">
            <span class="percentage-value">{{ percentage }}%</span>
          </template>
        </el-progress>
      </BaseCard>
    </el-col>

    <el-col :span="8">
      <BaseCard class="metric-card text-center">
        <div class="text-sm font-medium text-gray-500 mb-2">İptal Oranı</div>
        <el-progress
          type="dashboard"
          :percentage="metrics.cancellationRate || 0"
          :color="cancellationRateColor"
          :width="120"
        >
          <template #default="{ percentage }">
            <span class="percentage-value">{{ percentage }}%</span>
          </template>
        </el-progress>
      </BaseCard>
    </el-col>

    <el-col :span="8">
      <BaseCard class="metric-card text-center">
        <div class="text-sm font-medium text-gray-500 mb-2">Rötarlı Uçuş Sayısı</div>
        <div class="flex items-center justify-center mt-4">
          <el-icon class="text-4xl text-yellow-500"><Clock /></el-icon>
          <el-statistic :value="metrics.delayedFlights || 0" class="ml-4" />
        </div>
      </BaseCard>
    </el-col>

    <el-col :span="8" class="mt-5">
      <BaseCard class="metric-card">
        <div class="flex items-center">
          <el-icon class="text-2xl text-blue-500 mr-4"><Calendar /></el-icon>
          <div>
            <div class="text-sm text-gray-500">Planlanan Uçuşlar</div>
            <el-statistic :value="metrics.scheduledFlights || 0" />
          </div>
        </div>
      </BaseCard>
    </el-col>
    <el-col :span="8" class="mt-5">
      <BaseCard class="metric-card">
        <div class="flex items-center">
         <el-icon class="text-2xl text-green-500 mr-4"><Promotion /></el-icon>
          <div>
            <div class="text-sm text-gray-500">Aktif Uçuşlar</div>
            <el-statistic :value="metrics.activeFlights || 0" />
          </div>
        </div>
      </BaseCard>
    </el-col>
    <el-col :span="8" class="mt-5">
      <BaseCard class="metric-card">
        <div class="flex items-center">
          <el-icon class="text-2xl text-indigo-500 mr-4"><SuccessFilled /></el-icon>
          <div>
            <div class="text-sm text-gray-500">Tamamlanan Uçuşlar</div>
            <el-statistic :value="metrics.completedFlights || 0" />
          </div>
        </div>
      </BaseCard>
    </el-col>
  </el-row>
</template>

<script setup>
import { computed } from 'vue';
import BaseCard from '@/components/ui/BaseCard.vue';
import { ElRow, ElCol, ElStatistic, ElProgress, ElIcon } from 'element-plus';
import { Clock, Calendar, Promotion, SuccessFilled } from '@element-plus/icons-vue';

const props = defineProps({
  metrics: {
    type: Object,
    required: true,
    default: () => ({
      onTimePerformance: 0,
      cancellationRate: 0,
      delayedFlights: 0,
      scheduledFlights: 0,
      activeFlights: 0,
      completedFlights: 0,
    })
  }
});

// Performansa göre renk belirleme mantığı
const onTimePerformanceColor = computed(() => {
  const perf = props.metrics.onTimePerformance;
  if (perf >= 90) return '#67C23A'; // Yeşil
  if (perf >= 75) return '#E6A23C'; // Sarı
  return '#F56C6C'; // Kırmızı
});

const cancellationRateColor = computed(() => {
  const rate = props.metrics.cancellationRate;
  if (rate <= 2) return '#67C23A';
  if (rate <= 5) return '#E6A23C';
  return '#F56C6C';
});
</script>

<style scoped>
.performance-metrics {
  width: 100%;
}
.metric-card {
  transition: all 0.3s ease;
  height: 100%;
}
.metric-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}
.percentage-value {
  display: block;
  font-size: 24px;
  font-weight: 600;
  margin-top: 10px;
}
:deep(.el-statistic__content) {
  font-size: 28px;
  font-weight: 700;
}
</style>

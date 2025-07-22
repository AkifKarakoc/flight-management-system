<template>
  <div class="kpi-card" :class="{ loading }">
    <div class="kpi-icon" :style="{ backgroundColor: color }">
      <el-icon :size="24" :color="'white'">
        <component :is="iconComponent" />
      </el-icon>
    </div>

    <div class="kpi-content">
      <div class="kpi-value">
        <span v-if="loading" class="loading-placeholder">---</span>
        <span v-else>{{ formattedValue }}</span>
      </div>
      <div class="kpi-title">{{ title }}</div>
      <div v-if="subtitle" class="kpi-subtitle">{{ subtitle }}</div>
    </div>

    <div v-if="trend" class="kpi-trend">
      <el-icon :color="trendColor">
        <component :is="trendIcon" />
      </el-icon>
      <span :style="{ color: trendColor }">{{ trend }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatNumber } from '@/utils/formatters.js'
import {
  Position, Ship, MapLocation, Promotion, Avatar,
  Monitor, TrendCharts, ArrowUp, ArrowDown
} from '@element-plus/icons-vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    default: 0
  },
  icon: {
    type: String,
    default: 'TrendCharts'
  },
  color: {
    type: String,
    default: '#409eff'
  },
  loading: {
    type: Boolean,
    default: false
  },
  subtitle: {
    type: String,
    default: ''
  },
  trend: {
    type: String,
    default: ''
  },
  trendType: {
    type: String,
    default: 'up',
    validator: (value) => ['up', 'down'].includes(value)
  }
})

const iconMap = {
  Position,
  Ship,
  MapLocation,
  Promotion,
  Avatar,
  Monitor,
  TrendCharts
}

const iconComponent = computed(() => iconMap[props.icon] || TrendCharts)

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return formatNumber(props.value)
  }
  return props.value
})

const trendIcon = computed(() => {
  return props.trendType === 'up' ? ArrowUp : ArrowDown
})

const trendColor = computed(() => {
  return props.trendType === 'up' ? '#67c23a' : '#f56c6c'
})
</script>

<style scoped>
.kpi-card {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  gap: 16px;
  min-height: 120px;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.15);
}

.kpi-card.loading {
  opacity: 0.7;
}

.kpi-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-content {
  flex: 1;
  min-width: 0;
}

.kpi-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
  margin-bottom: 4px;
}

.loading-placeholder {
  background: #f0f0f0;
  border-radius: 4px;
  display: inline-block;
  width: 60px;
  height: 28px;
  animation: pulse 1.5s ease-in-out infinite;
}

.kpi-title {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  margin-bottom: 2px;
}

.kpi-subtitle {
  font-size: 12px;
  color: #909399;
}

.kpi-trend {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@media (max-width: 768px) {
  .kpi-card {
    padding: 16px;
    min-height: 100px;
  }

  .kpi-icon {
    width: 48px;
    height: 48px;
  }

  .kpi-value {
    font-size: 24px;
  }

  .kpi-title {
    font-size: 13px;
  }
}
</style>

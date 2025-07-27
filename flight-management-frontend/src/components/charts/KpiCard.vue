<template>
  <BaseCard class="kpi-card" :class="{ 'has-link': !!$attrs.onClick }" @click="handleClick">
    <div v-if="loading" class="skeleton-loader">
      <div class="skeleton skeleton-icon"></div>
      <div class="skeleton-text-group">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-value"></div>
        <div class="skeleton skeleton-change"></div>
      </div>
    </div>

    <div v-else class="flex items-center">
      <div class="icon-wrapper mr-4 rounded-full flex items-center justify-center" :style="{ backgroundColor: color }">
        <font-awesome-icon :icon="icon" class="text-white text-xl" />
      </div>

      <div class="content">
        <div class="title text-sm font-medium text-gray-500">{{ title }}</div>
        <div class="value-container flex items-baseline space-x-2">
          <el-statistic :value="value" class="value" />
          <span v-if="changeText" class="change-indicator text-xs font-semibold" :class="changeColor">
            <font-awesome-icon :icon="changeIcon" />
            {{ changeText }}
          </span>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

<script setup>
import { computed } from 'vue';
import BaseCard from '@/components/ui/BaseCard.vue';
import { ElStatistic } from 'element-plus';

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: [Number, String],
    required: true,
  },
  change: {
    type: [Number, String],
    default: null,
  },
  icon: {
    type: [String, Array],
    required: true,
  },
  color: {
    type: String,
    default: '#409EFF', // Element Plus'ın ana mavi rengi
  },
  loading: {
    type: Boolean,
    default: false
  },
});

const emit = defineEmits(['click']);

const isPositiveChange = computed(() => {
  if (typeof props.change === 'string') {
    return props.change.startsWith('+');
  }
  return typeof props.change === 'number' && props.change > 0;
});

const isNegativeChange = computed(() => {
  if (typeof props.change === 'string') {
    return props.change.startsWith('-');
  }
  return typeof props.change === 'number' && props.change < 0;
});

const changeText = computed(() => {
  if (props.change === null || props.change === undefined) return '';
  if (typeof props.change === 'number') {
    return `${Math.abs(props.change)}%`;
  }
  return props.change.replace(/[+-]/, '') + '%';
});

const changeColor = computed(() => {
  if (isPositiveChange.value) return 'text-green-500';
  if (isNegativeChange.value) return 'text-red-500';
  return 'text-gray-500';
});

const changeIcon = computed(() => {
  if (isPositiveChange.value) return ['fas', 'arrow-up'];
  if (isNegativeChange.value) return ['fas', 'arrow-down'];
  return null;
});

const handleClick = () => {
  emit('click');
};
</script>

<style scoped>
.kpi-card {
  transition: all 0.3s ease;
}

.kpi-card.has-link {
  cursor: pointer;
}

.kpi-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
}

.icon-wrapper {
  width: 50px;
  height: 50px;
  flex-shrink: 0;
}

.value-container .value {
  color: #303133;
}

.value-container :deep(.el-statistic__content) {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
}

/* Skeleton Loading Stilleri */
.skeleton-loader {
  display: flex;
  align-items: center;
}
.skeleton {
  background-color: #e5e7eb;
  border-radius: 4px;
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
.skeleton-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
}
.skeleton-text-group {
  margin-left: 16px;
  flex-grow: 1;
}
.skeleton-title {
  width: 60%;
  height: 14px;
  margin-bottom: 8px;
}
.skeleton-value {
  width: 40%;
  height: 24px;
  margin-bottom: 8px;
}
.skeleton-change {
  width: 25%;
  height: 12px;
}

@keyframes pulse {
  50% {
    opacity: 0.5;
  }
}
</style>

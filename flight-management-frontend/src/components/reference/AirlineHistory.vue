<template>
  <div class="airline-history">
    <el-timeline>
      <el-timeline-item
        v-for="(activity, index) in history"
        :key="index"
        :timestamp="formatDateTime(activity.timestamp)"
        :type="getTimelineItemType(activity.type)"
      >
        <h4>{{ activity.title }}</h4>
        <p>{{ activity.description }}</p>
        <p v-if="activity.user" class="user-info">
          <small>İşlemi yapan: {{ activity.user }}</small>
        </p>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<script setup>
import { formatDateTime } from '@/utils/formatters'

defineProps({
  history: {
    type: Array,
    default: () => []
  }
})

const getTimelineItemType = (type) => {
  switch (type) {
    case 'create': return 'success'
    case 'update': return 'primary'
    case 'delete': return 'danger'
    default: return 'info'
  }
}
</script>

<style scoped>
.airline-history {
  padding: 16px;
}

.user-info {
  color: #666;
  margin-top: 8px;
}
</style> 
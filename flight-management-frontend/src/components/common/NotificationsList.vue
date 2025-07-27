<template>
  <div class="notifications-list">
    <div class="header p-3 flex justify-between items-center border-b">
      <h3 class="font-semibold">Bildirimler</h3>
      <BaseButton v-if="notifications.length > 0" link size="small" @click="handleClearAll">
        Tümünü Temizle
      </BaseButton>
    </div>

    <div v-if="loading" class="p-8 text-center text-gray-500">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      <span class="ml-2">Yükleniyor...</span>
    </div>

    <el-scrollbar v-else-if="notifications.length > 0" height="300px">
      <ul>
        <li
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item p-3 flex items-start border-b hover:bg-gray-50 transition-colors"
          :class="{ 'unread': !notification.isRead }"
        >
          <div class="icon-container mr-3 mt-1">
            <el-icon :size="20" :class="notificationColor(notification.type)">
              <component :is="notificationIcon(notification.type)" />
            </el-icon>
          </div>

          <div class="content-container flex-grow">
            <p class="message text-sm text-gray-800">{{ notification.message }}</p>
            <span class="timestamp text-xs text-gray-400">{{ formatRelativeTime(notification.timestamp) }}</span>
          </div>

          <el-tooltip content="Okundu olarak işaretle" placement="top">
            <BaseButton
              v-if="!notification.isRead"
              variant="ghost"
              size="small"
              circle
              class="ml-2"
              @click.stop="handleMarkAsRead(notification.id)"
            >
              <el-icon><Check /></el-icon>
            </BaseButton>
          </el-tooltip>
        </li>
      </ul>
    </el-scrollbar>

    <div v-else class="p-8 text-center text-gray-500">
      <el-icon :size="24" class="mb-2"><Bell /></el-icon>
      <p>Yeni bildirim yok.</p>
    </div>
  </div>
</template>

<script setup>
import { shallowRef } from 'vue';
import { useFormatters } from '@/composables/useFormatters';
import BaseButton from '@/components/ui/BaseButton.vue';
import { ElScrollbar, ElTooltip, ElIcon } from 'element-plus';
import {
  Loading,
  CircleCheck,
  InfoFilled,
  Warning,
  CircleClose,
  Promotion,
  Bell,
  Check
} from '@element-plus/icons-vue';

const props = defineProps({
  notifications: {
    type: Array,
    required: true,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['mark-as-read', 'clear-all']);

const { formatRelativeTime } = useFormatters();

// Bildirim tipine göre ikon belirleme
const notificationIcon = (type) => {
  switch (type) {
    case 'success': return shallowRef(CircleCheck);
    case 'info': return shallowRef(InfoFilled);
    case 'warning': return shallowRef(Warning);
    case 'error': return shallowRef(CircleClose);
    case 'flight_status_change': return shallowRef(Promotion);
    default: return shallowRef(Bell);
  }
};

const notificationColor = (type) => {
  switch (type) {
    case 'success': return 'text-green-500';
    case 'info': return 'text-blue-500';
    case 'warning': return 'text-yellow-500';
    case 'error': return 'text-red-500';
    default: return 'text-gray-500';
  }
};

const handleMarkAsRead = (id) => {
  emit('mark-as-read', id);
};

const handleClearAll = () => {
  emit('clear-all');
};
</script>

<style scoped>
.notifications-list {
  width: 350px;
}
.notification-item.unread {
  background-color: #ecf5ff;
}
.icon-container {
  font-size: 1.2rem;
}
</style>

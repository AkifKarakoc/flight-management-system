<template>
  <el-tag
    v-if="statusInfo"
    :type="statusInfo.type"
    :size="size"
    effect="light"
    class="status-badge"
  >
    <font-awesome-icon v-if="statusInfo.icon" :icon="['fas', statusInfo.icon]" class="mr-1.5" />
    {{ statusInfo.text }}
  </el-tag>
  <el-tag v-else type="info" :size="size" effect="light">
    Bilinmiyor
  </el-tag>
</template>

<script setup>
import { computed } from 'vue';
import { ElTag } from 'element-plus';

const props = defineProps({
  /**
   * Gösterilecek durumun ham değeri (örn: 'SCHEDULED', 'ACTIVE').
   */
  status: {
    type: String,
    required: true,
  },
  /**
   * Durumları metin, tip (renk) ve ikona eşleyen nesne.
   * Örn: { SCHEDULED: { text: 'Planlandı', type: 'info', icon: 'clock' } }
   */
  statusMap: {
    type: Object,
    required: true,
  },
  /**
   * Badge boyutu ('large', 'default', 'small').
   */
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['large', 'default', 'small'].includes(value),
  },
});

// Gelen 'status' prop'una göre haritadan doğru metin ve tipi bulan computed property.
const statusInfo = computed(() => {
  const info = props.statusMap[props.status];

  if (info) {
    // Eğer sadece bir string ise (örn: 'success'), onu tip olarak kullan.
    if (typeof info === 'string') {
      return { text: props.status, type: info };
    }
    // Değilse, nesne olarak kabul et.
    return {
      text: info.text || props.status,
      type: info.type || 'info',
      icon: info.icon || null,
    };
  }

  return null; // Haritada durum bulunamazsa null döndür.
});
</script>

<style scoped>
.status-badge {
  font-weight: 600;
  border-radius: 6px;
  padding: 0 10px;
  line-height: 22px;
}
</style>s

<template>
  <div class="footer-wrapper">
    <div class="footer-left">
      <span class="copyright">
        &copy; {{ currentYear }} Uçuş Yönetim Sistemi. Tüm hakları saklıdır.
      </span>
    </div>

    <div class="footer-right">
      <span class="version">v{{ appVersion }}</span>
      <el-divider direction="vertical" />
      <el-button type="text" size="small" @click="showAbout">
        Hakkında
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'

// Computed
const currentYear = computed(() => new Date().getFullYear())
const appVersion = computed(() => import.meta.env.VITE_APP_VERSION || '1.0.0')

// Methods
const showAbout = () => {
  ElMessage.info('Uçuş Yönetim Sistemi - Stajyer Projesi')
}
</script>

<style scoped>
.footer-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 24px;
  background: #fff;
}

.footer-left .copyright {
  font-size: 12px;
  color: #909399;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.version {
  font-size: 12px;
  color: #C0C4CC;
}

/* Responsive */
@media (max-width: 768px) {
  .footer-wrapper {
    padding: 0 16px;
  }

  .footer-left .copyright {
    font-size: 11px;
  }

  .version {
    display: none;
  }
}
</style>

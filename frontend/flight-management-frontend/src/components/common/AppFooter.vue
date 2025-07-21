<template>
  <footer class="app-footer">
    <div class="footer-content">
      <div class="footer-left">
        <span class="copyright">© 2025 Flight Management System</span>
      </div>

      <div class="footer-right">
        <span class="version">v1.0.0</span>
        <el-divider direction="vertical" />
        <span class="build-info">Build: {{ buildDate }}</span>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'

const buildDate = computed(() => {
  const date = new Date()
  return date.toLocaleDateString('tr-TR')
})
</script>

<style scoped>
.app-footer {
  height: 50px;
  background: white;
  border-top: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  margin-top: auto;
}

.footer-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
}

.footer-left, .footer-right {
  display: flex;
  align-items: center;
}

.footer-right {
  gap: 8px;
}

.copyright, .version, .build-info {
  font-size: 12px;
  color: #909399;
}

@media (max-width: 768px) {
  .footer-content {
    padding: 0 16px;
  }

  .build-info {
    display: none;
  }
}
</style>

<template>
  <div v-if="error" class="error-boundary">
    <div class="error-content">
      <el-icon :size="48" color="#f56c6c">
        <Warning />
      </el-icon>
      <h3>Bir hata oluştu</h3>
      <p>{{ error.message || 'Beklenmeyen bir hata oluştu.' }}</p>
      <div class="error-actions">
        <el-button type="primary" @click="retry">
          <el-icon><Refresh /></el-icon>
          Tekrar Dene
        </el-button>
        <el-button @click="goHome">
          <el-icon><House /></el-icon>
          Ana Sayfaya Dön
        </el-button>
      </div>
      <details v-if="showDetails" class="error-details">
        <summary>Hata Detayları</summary>
        <pre>{{ error.stack }}</pre>
      </details>
    </div>
  </div>
  <slot v-else />
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'
import { Warning, Refresh, House } from '@element-plus/icons-vue'

const props = defineProps({
  showDetails: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()
const error = ref(null)

onErrorCaptured((err, instance, info) => {
  console.error('ErrorBoundary caught error:', {
    error: err,
    component: instance?.$options?.name || 'Unknown',
    info
  })
  
  error.value = err
  return false // Prevent error from propagating
})

const retry = () => {
  error.value = null
  window.location.reload()
}

const goHome = () => {
  error.value = null
  router.push('/')
}
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
  background-color: #fafafa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.error-content {
  text-align: center;
  max-width: 500px;
}

.error-content h3 {
  margin: 1rem 0 0.5rem 0;
  color: #303133;
  font-size: 1.5rem;
}

.error-content p {
  margin: 0 0 1.5rem 0;
  color: #606266;
  font-size: 1rem;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.error-details {
  margin-top: 1rem;
  text-align: left;
}

.error-details summary {
  cursor: pointer;
  color: #409eff;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.error-details pre {
  background-color: #f5f7fa;
  padding: 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #606266;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}
</style> 
<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-illustration">
        <el-icon :size="120" color="#C0C4CC">
          <QuestionFilled />
        </el-icon>
      </div>

      <h1 class="error-title">404</h1>
      <h2 class="error-subtitle">Sayfa Bulunamadı</h2>
      <p class="error-description">
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </p>

      <div class="error-actions">
        <el-button type="primary" size="large" @click="goHome">
          <el-icon><HomeFilled /></el-icon>
          Ana Sayfaya Dön
        </el-button>
        <el-button size="large" @click="goBack">
          <el-icon><Back /></el-icon>
          Geri Git
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { QuestionFilled, HomeFilled, Back } from '@element-plus/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/dashboard')
}

const goBack = () => {
  router.go(-1)
}
</script>

<style scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  padding: 20px;
}

.not-found-content {
  text-align: center;
  max-width: 500px;
}

.error-illustration {
  margin-bottom: 32px;
}

.error-title {
  font-size: 72px;
  font-weight: 700;
  color: #C0C4CC;
  margin: 0 0 16px 0;
}

.error-subtitle {
  font-size: 24px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 16px 0;
}

.error-description {
  font-size: 16px;
  color: #909399;
  margin: 0 0 32px 0;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

@media (max-width: 768px) {
  .error-actions {
    flex-direction: column;
    align-items: center;
  }

  .error-actions button {
    width: 200px;
  }
}
</style>

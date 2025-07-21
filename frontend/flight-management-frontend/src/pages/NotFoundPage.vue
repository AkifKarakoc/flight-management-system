<template>
  <div class="not-found-page">
    <div class="not-found-container">
      <div class="not-found-icon">
        <el-icon :size="120" color="#c0c4cc">
          <Warning />
        </el-icon>
      </div>

      <div class="not-found-content">
        <h1 class="error-code">404</h1>
        <h2 class="error-title">Sayfa Bulunamadı</h2>
        <p class="error-description">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>

        <div class="error-actions">
          <el-button type="primary" @click="goHome">
            <el-icon><House /></el-icon>
            Ana Sayfaya Dön
          </el-button>
          <el-button @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            Geri Git
          </el-button>
        </div>
      </div>
    </div>

    <div class="helpful-links">
      <h3>Yararlı Bağlantılar</h3>
      <div class="links-grid">
        <router-link to="/dashboard" class="help-link">
          <el-icon><Monitor /></el-icon>
          <span>Dashboard</span>
        </router-link>
        <router-link to="/flights" class="help-link">
          <el-icon><Position /></el-icon>
          <span>Uçuş Yönetimi</span>
        </router-link>
        <router-link to="/airlines" class="help-link">
          <el-icon><Ship /></el-icon>
          <span>Havayolları</span>
        </router-link>
        <router-link to="/airports" class="help-link">
          <el-icon><MapLocation /></el-icon>
          <span>Havaalanları</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import {
  Warning, House, ArrowLeft, Monitor,
  Position, Ship, MapLocation
} from '@element-plus/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/dashboard')
}

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/dashboard')
  }
}
</script>

<style scoped>
.not-found-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.not-found-container {
  text-align: center;
  max-width: 500px;
  margin-bottom: 60px;
}

.not-found-icon {
  margin-bottom: 24px;
}

.error-code {
  font-size: 72px;
  font-weight: 700;
  color: #409eff;
  margin: 0 0 16px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.error-title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
}

.error-description {
  font-size: 16px;
  color: #606266;
  margin: 0 0 32px 0;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.helpful-links {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
}

.helpful-links h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px 0;
  text-align: center;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.help-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-radius: 8px;
  background: #f8f9fa;
  color: #606266;
  text-decoration: none;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.help-link:hover {
  background: #409eff;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.help-link span {
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

@media (max-width: 768px) {
  .error-code {
    font-size: 56px;
  }

  .error-title {
    font-size: 24px;
  }

  .error-actions {
    flex-direction: column;
    align-items: center;
  }

  .links-grid {
    grid-template-columns: 1fr;
  }
}
</style>

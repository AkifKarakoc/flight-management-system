<template>
  <div class="auth-layout">
    <div class="auth-container">
      <div class="auth-card">
        <!-- Logo/Brand -->
        <div class="brand-section">
          <div class="logo">
            <el-icon :size="40" color="#409eff">
              <Position />
            </el-icon>
          </div>
          <h1 class="brand-title">Flight Management</h1>
          <p class="brand-subtitle">Uçuş Yönetim Sistemi</p>
        </div>

        <!-- Auth Content -->
        <div class="auth-content">
          <router-view />
        </div>
      </div>
    </div>

    <!-- Background -->
    <div class="auth-background"></div>
  </div>
</template>

<script setup>
import { Position } from '@element-plus/icons-vue'
</script>

<style scoped>
.auth-layout {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

.auth-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.auth-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
  padding: 20px;
}

.auth-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.brand-section {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  margin-bottom: 16px;
}

.brand-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.brand-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.auth-content {
  width: 100%;
}

@media (max-width: 480px) {
  .auth-container {
    max-width: 100%;
    padding: 16px;
  }

  .auth-card {
    padding: 24px;
  }
}
</style>

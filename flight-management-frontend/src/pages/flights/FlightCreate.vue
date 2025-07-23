<template>
  <div class="page-container">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <h2>Flight Create</h2>
          <div class="header-actions">
            <el-button v-if="authStore.isAdmin" type="primary" @click="$router.push('/flights/create')">
              <el-icon><Plus /></el-icon>
              Yeni Uçuş
            </el-button>
            <el-button v-if="authStore.isAdmin" @click="$router.push('/flights/upload')">
              <el-icon><Upload /></el-icon>
              CSV Yükleme
            </el-button>
          </div>
        </div>
      </template>

      <div class="coming-soon">
        <el-icon :size="80" color="#C0C4CC">
          <Construction />
        </el-icon>
        <h3>Yakında Gelecek</h3>
        <p>Uçuş listesi ve yönetim özellikleri yakında eklenecek.</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { Plus, Upload, Construction } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h2 {
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.coming-soon {
  text-align: center;
  padding: 60px 20px;
}

.coming-soon h3 {
  font-size: 24px;
  color: #303133;
  margin: 20px 0 12px 0;
}

.coming-soon p {
  color: #909399;
  font-size: 16px;
  margin: 0;
}
</style>

<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h2>Flight Management System</h2>
        <p>Uçuş yönetim sistemine hoş geldiniz</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="credentials"
        :rules="rules"
        @submit.prevent="handleLogin"
        size="large"
      >
        <el-form-item prop="username">
          <el-input
            v-model="credentials.username"
            placeholder="Kullanıcı Adı"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="credentials.password"
            type="password"
            placeholder="Şifre"
            :prefix-icon="Lock"
            show-password
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            @click="handleLogin"
            :loading="loading"
            style="width: 100%"
          >
            {{ loading ? 'Giriş yapılıyor...' : 'Giriş Yap' }}
          </el-button>
        </el-form-item>
      </el-form>

      <!-- Backend durumu göster -->
      <div class="backend-status">
        <el-alert
          v-if="backendError"
          :title="backendError"
          type="error"
          show-icon
          :closable="false"
        />
        <div v-else class="status-indicators">
          <el-tag
            v-for="service in backendStatus"
            :key="service.name"
            :type="service.status === 'UP' ? 'success' : 'danger'"
            size="small"
          >
            {{ service.name }}: {{ service.status }}
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import authService from '@/services/authService'
import apiService from '@/services/api'
import type { LoginCredentials } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const loginFormRef = ref<FormInstance>()
const loading = ref(false)
const backendStatus = ref<any[]>([])
const backendError = ref('')

const credentials = reactive<LoginCredentials>({
  username: '',
  password: ''
})

const rules = reactive<FormRules>({
  username: [
    { required: true, message: 'Kullanıcı adı gerekli', trigger: 'blur' },
    { min: 3, max: 20, message: 'Kullanıcı adı 3-20 karakter olmalı', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Şifre gerekli', trigger: 'blur' },
    { min: 6, message: 'Şifre en az 6 karakter olmalı', trigger: 'blur' }
  ]
})

const checkBackendServices = async () => {
  console.log('🔍 Backend servisleri kontrol ediliyor...')

  const services = [
    { name: 'Reference Manager', url: import.meta.env.VITE_REFERENCE_MANAGER_URL },
    { name: 'Flight Service', url: import.meta.env.VITE_FLIGHT_SERVICE_URL },
    { name: 'Archive Service', url: import.meta.env.VITE_ARCHIVE_SERVICE_URL }
  ]

  const results = []

  try {
    for (const service of services) {
      console.log(`Checking ${service.name}...`)
      try {
        const response = await fetch(`${service.url}/actuator/health`, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/json'
          }
        })

        results.push({
          name: service.name,
          status: response.ok ? 'UP' : 'DOWN',
          url: service.url
        })

        console.log(`✅ ${service.name}: UP`)
      } catch (error: any) {
        console.log(`❌ ${service.name}: DOWN - ${error.message}`)
        results.push({
          name: service.name,
          status: 'DOWN',
          url: service.url,
          error: error.message
        })
      }
    }

    backendStatus.value = results

    const downServices = results.filter(s => s.status === 'DOWN')
    if (downServices.length > 0) {
      backendError.value = `Backend servisleri çalışmıyor: ${downServices.map(s => s.name).join(', ')}`
    }

  } catch (error) {
    console.error('Backend kontrol hatası:', error)
    backendError.value = 'Backend servisleri kontrol edilemiyor'
  }
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    const valid = await loginFormRef.value.validate()
    if (!valid) return
  } catch (error) {
    return
  }

  loading.value = true
  backendError.value = ''

  try {
    console.log('🔑 Login deneniyor:', credentials.username)

    // Auth store'un login metodunu kullan
    await authStore.login(credentials)

    // Login başarılı - auth store zaten yönlendirme yapacak

  } catch (error: any) {
    console.error('❌ Login hatası:', error)

    let errorMessage = 'Giriş hatası'

    if (error.code === 'ERR_NETWORK') {
      errorMessage = 'Sunucuya bağlanılamıyor. Backend servisleri çalışıyor mu?'
      await checkBackendServices()
    } else if (error.response?.status === 401) {
      errorMessage = 'Kullanıcı adı veya şifre hatalı'
    } else if (error.response?.status === 403) {
      errorMessage = 'Bu işlem için yetkiniz bulunmuyor'
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    } else {
      errorMessage = 'Bilinmeyen hata oluştu'
    }

    ElMessage.error(errorMessage)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Sayfa yüklendiğinde backend'leri kontrol et
  checkBackendServices()
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  color: #303133;
  margin-bottom: 8px;
  font-weight: 600;
}

.login-header p {
  color: #606266;
  font-size: 14px;
}

.backend-status {
  margin-top: 20px;
}

.status-indicators {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

@media (max-width: 480px) {
  .login-container {
    padding: 30px 20px;
  }
}
</style>

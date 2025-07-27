<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Logo ve Başlık -->
      <div class="login-header">
        <div class="logo">
          <el-icon :size="48" color="#409eff">
            <Ship />
          </el-icon>
        </div>
        <h1 class="title">Uçuş Yönetim Sistemi</h1>
        <p class="subtitle">Sisteme giriş yapın</p>
      </div>

      <!-- Login Form -->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="Kullanıcı Adı"
            size="large"
            :prefix-icon="User"
            :disabled="loading"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="Şifre"
            size="large"
            :prefix-icon="Lock"
            :disabled="loading"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-button"
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? 'Giriş Yapılıyor...' : 'Giriş Yap' }}
          </el-button>
        </el-form-item>
      </el-form>

      <!-- Test Kullanıcıları -->
      <div class="test-users">
        <el-divider>Test Kullanıcıları</el-divider>
        <div class="test-user-buttons">
          <el-button
            size="small"
            type="success"
            plain
            :disabled="loading"
            @click="fillCredentials('admin', 'admin123')"
          >
            Admin Girişi
          </el-button>
          <el-button
            size="small"
            type="info"
            plain
            :disabled="loading"
            @click="fillCredentials('user', 'user123')"
          >
            Kullanıcı Girişi
          </el-button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="login-footer">
      <p>&copy; 2024 Uçuş Yönetim Sistemi. Tüm hakları saklıdır.</p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Ship } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Form ref
const loginFormRef = ref()

// Loading state
const loading = ref(false)

// Form data
const loginForm = reactive({
  username: '',
  password: ''
})

// Form validation rules
const loginRules = {
  username: [
    { required: true, message: 'Kullanıcı adı gereklidir', trigger: 'blur' },
    { min: 3, message: 'Kullanıcı adı en az 3 karakter olmalıdır', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Şifre gereklidir', trigger: 'blur' },
    { min: 6, message: 'Şifre en az 6 karakter olmalıdır', trigger: 'blur' }
  ]
}

// Handle login
const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    // Form validation
    await loginFormRef.value.validate()

    loading.value = true

    // Login API call
    await authStore.login({
      username: loginForm.username,
      password: loginForm.password
    })

    ElMessage.success('Giriş başarılı!')

    // Redirect to intended page or dashboard
    const redirectPath = route.query.redirect || { name: 'Dashboard' }
    router.replace(redirectPath)

  } catch (error) {
    console.error('Login error:', error)
    // Error message is handled by API service
  } finally {
    loading.value = false
  }
}

// Fill test credentials
const fillCredentials = (username, password) => {
  loginForm.username = username
  loginForm.password = password
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  margin-bottom: 16px;
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.subtitle {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.login-form {
  margin-bottom: 24px;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
}

.test-users {
  text-align: center;
}

.test-user-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
}

.login-footer {
  margin-top: 32px;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

/* Responsive */
@media (max-width: 480px) {
  .login-card {
    padding: 24px;
    margin: 16px;
  }

  .test-user-buttons {
    flex-direction: column;
  }
}
</style>

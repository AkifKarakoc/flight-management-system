<template>
  <div class="login-page">
    <el-form
      ref="formRef"
      :model="loginForm"
      :rules="rules"
      size="large"
      @submit.prevent="handleSubmit"
    >
      <el-form-item prop="username">
        <el-input
          v-model="loginForm.username"
          placeholder="Kullanıcı adı"
          :prefix-icon="User"
          clearable
          :disabled="loading"
          @keyup.enter="handleSubmit"
        />
      </el-form-item>

      <el-form-item prop="password">
        <el-input
          v-model="loginForm.password"
          type="password"
          placeholder="Şifre"
          :prefix-icon="Lock"
          show-password
          clearable
          :disabled="loading"
          @keyup.enter="handleSubmit"
        />
      </el-form-item>

      <el-form-item>
        <div class="form-options">
          <el-checkbox v-model="loginForm.rememberMe" :disabled="loading">
            Beni hatırla
          </el-checkbox>
          <el-link type="primary" :underline="false" @click="showForgotPassword">
            Şifremi unuttum
          </el-link>
        </div>
      </el-form-item>

      <el-form-item>
        <el-button
          type="primary"
          size="large"
          style="width: 100%"
          :loading="loading"
          @click="handleSubmit"
        >
          {{ loading ? 'Giriş yapılıyor...' : 'Giriş Yap' }}
        </el-button>
      </el-form-item>
    </el-form>

    <!-- Development Mode Quick Login -->
    <div v-if="isDevelopment" class="dev-login">
      <el-divider>Geliştirici Modu</el-divider>
      <div class="quick-login-buttons">
        <el-button size="small" @click="quickLogin('admin')">
          Admin Girişi
        </el-button>
        <el-button size="small" @click="quickLogin('user')">
          Kullanıcı Girişi
        </el-button>
      </div>
    </div>

    <!-- Forgot Password Dialog -->
    <el-dialog
      v-model="forgotPasswordVisible"
      title="Şifre Sıfırlama"
      width="400px"
      center
    >
      <el-form :model="forgotPasswordForm" :rules="forgotPasswordRules">
        <el-form-item prop="email">
          <el-input
            v-model="forgotPasswordForm.email"
            placeholder="E-posta adresinizi girin"
            :prefix-icon="Message"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="forgotPasswordVisible = false">İptal</el-button>
        <el-button type="primary" @click="handleForgotPassword">
          Gönder
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Message } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref()
const loading = ref(false)
const forgotPasswordVisible = ref(false)
const isDevelopment = import.meta.env.DEV

const loginForm = reactive({
  username: '',
  password: '',
  rememberMe: false
})

const forgotPasswordForm = reactive({
  email: ''
})

const rules = {
  username: [
    { required: true, message: 'Kullanıcı adı gereklidir', trigger: 'blur' },
    { min: 3, message: 'En az 3 karakter olmalıdır', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Şifre gereklidir', trigger: 'blur' },
    { min: 6, message: 'En az 6 karakter olmalıdır', trigger: 'blur' }
  ]
}

const forgotPasswordRules = {
  email: [
    { required: true, message: 'E-posta gereklidir', trigger: 'blur' },
    { type: 'email', message: 'Geçerli bir e-posta adresi girin', trigger: 'blur' }
  ]
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    await authStore.login({
      username: loginForm.username,
      password: loginForm.password,
      rememberMe: loginForm.rememberMe
    })

    ElMessage.success('Başarıyla giriş yapıldı')
    router.push('/dashboard')
  } catch (error) {
    if (error?.response?.status === 401) {
      ElMessage.error('Kullanıcı adı veya şifre hatalı')
    } else {
      ElMessage.error('Giriş yapılırken hata oluştu')
    }
  } finally {
    loading.value = false
  }
}

const quickLogin = async (type) => {
  const credentials = {
    admin: { username: 'admin', password: 'admin123' },
    user: { username: 'user', password: 'user123' }
  }

  Object.assign(loginForm, credentials[type])
  await handleSubmit()
}

const showForgotPassword = () => {
  forgotPasswordVisible.value = true
}

const handleForgotPassword = () => {
  ElMessage.info('Şifre sıfırlama özelliği yakında eklenecek')
  forgotPasswordVisible.value = false
}
</script>

<style scoped>
.login-page {
  width: 100%;
}

.form-options {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dev-login {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
}

.quick-login-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

:deep(.el-input__inner) {
  height: 40px;
}

:deep(.el-button--large) {
  height: 40px;
}
</style>

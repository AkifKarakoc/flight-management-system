<template>
  <div class="login-page">
    <div class="login-header">
      <h2 class="login-title">Giriş Yap</h2>
      <p class="login-subtitle">Hesabınıza erişim sağlayın</p>
    </div>

    <el-form
      ref="loginFormRef"
      :model="loginForm"
      :rules="loginRules"
      class="login-form"
      @submit.prevent="handleLogin"
    >
      <!-- Username Field -->
      <el-form-item prop="username">
        <el-input
          v-model="loginForm.username"
          :prefix-icon="User"
          placeholder="Kullanıcı Adı"
          size="large"
          clearable
          :disabled="loginLoading"
          @keyup.enter="handleLogin"
        />
      </el-form-item>

      <!-- Password Field -->
      <el-form-item prop="password">
        <el-input
          v-model="loginForm.password"
          type="password"
          :prefix-icon="Lock"
          placeholder="Şifre"
          size="large"
          show-password
          clearable
          :disabled="loginLoading"
          @keyup.enter="handleLogin"
        />
      </el-form-item>

      <!-- Remember Me -->
      <el-form-item class="remember-me">
        <el-checkbox v-model="loginForm.rememberMe" :disabled="loginLoading">
          Beni hatırla
        </el-checkbox>
        <el-link
          type="primary"
          :underline="false"
          @click="showForgotPassword"
        >
          Şifrenizi mi unuttunuz?
        </el-link>
      </el-form-item>

      <!-- Login Button -->
      <el-form-item class="login-button-container">
        <el-button
          type="primary"
          size="large"
          :loading="loginLoading"
          :disabled="loginLoading"
          class="login-button"
          @click="handleLogin"
        >
          <template v-if="!loginLoading">
            <el-icon class="mr-2">
              <Right />
            </el-icon>
            Giriş Yap
          </template>
          <template v-else>
            Giriş yapılıyor...
          </template>
        </el-button>
      </el-form-item>
    </el-form>

    <!-- Demo Accounts Info -->
    <div class="demo-accounts" v-if="showDemoAccounts">
      <el-divider>Demo Hesaplar</el-divider>
      <div class="demo-cards">
        <el-card class="demo-card" shadow="hover" @click="fillAdminCredentials">
          <div class="demo-card-header">
            <el-icon color="#409EFF">
              <UserFilled />
            </el-icon>
            <span class="demo-role">Admin</span>
          </div>
          <div class="demo-credentials">
            <p><strong>Kullanıcı:</strong> admin</p>
            <p><strong>Şifre:</strong> admin123</p>
          </div>
        </el-card>

        <el-card class="demo-card" shadow="hover" @click="fillUserCredentials">
          <div class="demo-card-header">
            <el-icon color="#67C23A">
              <User />
            </el-icon>
            <span class="demo-role">Kullanıcı</span>
          </div>
          <div class="demo-credentials">
            <p><strong>Kullanıcı:</strong> user</p>
            <p><strong>Şifre:</strong> user123</p>
          </div>
        </el-card>
      </div>
    </div>

    <!-- Forgot Password Dialog -->
    <el-dialog
      v-model="forgotPasswordVisible"
      title="Şifre Sıfırlama"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form ref="forgotFormRef" :model="forgotForm" :rules="forgotRules">
        <el-form-item prop="email">
          <el-input
            v-model="forgotForm.email"
            :prefix-icon="Message"
            placeholder="E-posta adresiniz"
            size="large"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="forgotPasswordVisible = false">İptal</el-button>
        <el-button
          type="primary"
          :loading="forgotLoading"
          @click="handleForgotPassword"
        >
          Sıfırlama Bağlantısı Gönder
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Right, UserFilled, Message } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

// Router
const router = useRouter()
const route = useRoute()

// Store
const authStore = useAuthStore()

// Reactive state
const loginFormRef = ref(null)
const forgotFormRef = ref(null)
const loginLoading = ref(false)
const forgotLoading = ref(false)
const forgotPasswordVisible = ref(false)
const showDemoAccounts = ref(true) // Show in development

// Form data
const loginForm = reactive({
  username: '',
  password: '',
  rememberMe: false
})

const forgotForm = reactive({
  email: ''
})

// Validation rules
const loginRules = {
  username: [
    { required: true, message: 'Kullanıcı adı gereklidir', trigger: 'blur' },
    { min: 3, message: 'En az 3 karakter olmalıdır', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Şifre gereklidir', trigger: 'blur' },
    { min: 6, message: 'En az 6 karakter olmalıdır', trigger: 'blur' }
  ]
}

const forgotRules = {
  email: [
    { required: true, message: 'E-posta adresi gereklidir', trigger: 'blur' },
    { type: 'email', message: 'Geçerli bir e-posta adresi girin', trigger: 'blur' }
  ]
}

// Methods
async function handleLogin() {
  if (!loginFormRef.value) return

  try {
    // Validate form
    const valid = await loginFormRef.value.validate()
    if (!valid) return

    loginLoading.value = true

    // Attempt login
    await authStore.login({
      username: loginForm.username,
      password: loginForm.password,
      rememberMe: loginForm.rememberMe
    })

    // Success message and redirect handled in store
  } catch (error) {
    console.error('Login failed:', error)
    // Error message handled in store
  } finally {
    loginLoading.value = false
  }
}

function showForgotPassword() {
  forgotPasswordVisible.value = true
  forgotForm.email = ''
}

async function handleForgotPassword() {
  if (!forgotFormRef.value) return

  try {
    const valid = await forgotFormRef.value.validate()
    if (!valid) return

    forgotLoading.value = true

    // TODO: Implement forgot password API call
    // await authService.forgotPassword(forgotForm.email)

    ElMessage.success('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi')
    forgotPasswordVisible.value = false
  } catch (error) {
    console.error('Forgot password failed:', error)
    ElMessage.error('Şifre sıfırlama isteği gönderilirken hata oluştu')
  } finally {
    forgotLoading.value = false
  }
}

function fillAdminCredentials() {
  loginForm.username = 'admin'
  loginForm.password = 'admin123'
}

function fillUserCredentials() {
  loginForm.username = 'user'
  loginForm.password = 'user123'
}

// Lifecycle
onMounted(() => {
  // Clear any existing auth state
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
    return
  }

  // Check if there's a redirect message
  if (route.query.message === 'session_expired') {
    ElMessage.warning('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.')
  }

  // Focus username field
  setTimeout(() => {
    const usernameInput = document.querySelector('input[placeholder="Kullanıcı Adı"]')
    if (usernameInput) {
      usernameInput.focus()
    }
  }, 100)
})
</script>

<style scoped lang="scss">
.login-page {
  width: 100%;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;

  .login-title {
    font-size: 1.8rem;
    font-weight: 600;
    color: #303133;
    margin-bottom: 0.5rem;
  }

  .login-subtitle {
    color: #606266;
    font-size: 0.95rem;
    margin-bottom: 0;
  }
}

.login-form {
  .el-form-item {
    margin-bottom: 1.5rem;

    &.remember-me {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;

      :deep(.el-form-item__content) {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }
    }

    &.login-button-container {
      margin-bottom: 0;
    }
  }

  .login-button {
    width: 100%;
    height: 48px;
    font-size: 1rem;
    font-weight: 600;

    .mr-2 {
      margin-right: 0.5rem;
    }
  }
}

.demo-accounts {
  margin-top: 2rem;

  .demo-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-top: 1rem;
  }

  .demo-card {
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
    }

    .demo-card-header {
      display: flex;
      align-items: center;
      margin-bottom: 0.5rem;

      .el-icon {
        margin-right: 0.5rem;
      }

      .demo-role {
        font-weight: 600;
        color: #303133;
      }
    }

    .demo-credentials {
      font-size: 0.85rem;
      color: #606266;

      p {
        margin: 0.25rem 0;
      }
    }
  }
}

// Responsive
@media (max-width: 480px) {
  .login-header {
    .login-title {
      font-size: 1.5rem;
    }
  }

  .demo-accounts {
    .demo-cards {
      grid-template-columns: 1fr;
    }
  }
}

// Form focus styles
:deep(.el-input__wrapper) {
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 0 0 1px #c0c4cc inset;
  }

  &.is-focus {
    box-shadow: 0 0 0 1px #409eff inset;
  }
}

// Button loading animation
:deep(.el-button.is-loading) {
  .el-icon {
    animation: rotating 2s linear infinite;
  }
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>

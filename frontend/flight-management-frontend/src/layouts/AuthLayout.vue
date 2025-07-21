<template>
  <div class="auth-layout">
    <!-- Background Pattern -->
    <div class="auth-background">
      <div class="background-pattern"></div>
      <div class="background-overlay"></div>
    </div>

    <!-- Main Content -->
    <div class="auth-container">
      <!-- Left Side - Branding -->
      <div class="auth-branding">
        <div class="branding-content">
          <div class="logo-section">
            <div class="logo">
              <el-icon size="48" color="#409EFF">
                <Position />
              </el-icon>
            </div>
            <h1 class="brand-title">Flight Management</h1>
            <p class="brand-subtitle">Uçuş Yönetim Sistemi</p>
          </div>

          <div class="features-list">
            <div class="feature-item">
              <el-icon color="#67C23A">
                <Check />
              </el-icon>
              <span>Uçuş Planlama ve Yönetimi</span>
            </div>
            <div class="feature-item">
              <el-icon color="#67C23A">
                <Check />
              </el-icon>
              <span>Gerçek Zamanlı Takip</span>
            </div>
            <div class="feature-item">
              <el-icon color="#67C23A">
                <Check />
              </el-icon>
              <span>Kapsamlı Raporlama</span>
            </div>
            <div class="feature-item">
              <el-icon color="#67C23A">
                <Check />
              </el-icon>
              <span>Güvenli Veri Yönetimi</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side - Form -->
      <div class="auth-form-container">
        <div class="auth-form-wrapper">
          <!-- Loading Overlay -->
          <div v-if="globalLoading" class="auth-loading">
            <el-loading
              text="Yükleniyor..."
              background="rgba(255, 255, 255, 0.9)"
            />
          </div>

          <!-- Form Content -->
          <div class="auth-form-content">
            <router-view v-slot="{ Component, route }">
              <transition name="fade" mode="out-in">
                <component :is="Component" :key="route.path" />
              </transition>
            </router-view>
          </div>
        </div>

        <!-- Footer -->
        <div class="auth-footer">
          <p>&copy; {{ currentYear }} Flight Management System. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Position, Check } from '@element-plus/icons-vue'

// Reactive state
const globalLoading = ref(false)

// Computed
const currentYear = computed(() => new Date().getFullYear())

// Lifecycle
onMounted(() => {
  // Any initialization logic for auth layout
  document.title = 'Giriş - Flight Management System'
})
</script>

<style scoped lang="scss">
.auth-layout {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.auth-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;

  .background-pattern {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image:
        radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 2px, transparent 2px),
        radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 2px, transparent 2px);
      background-size: 50px 50px;
      animation: backgroundMove 20s linear infinite;
    }
  }

  .background-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.1);
  }
}

@keyframes backgroundMove {
  0% { background-position: 0 0, 25px 25px; }
  100% { background-position: 50px 50px, 75px 75px; }
}

.auth-container {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  display: flex;
}

.auth-branding {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: white;

  .branding-content {
    max-width: 500px;
    text-align: center;
  }

  .logo-section {
    margin-bottom: 3rem;

    .logo {
      margin-bottom: 1.5rem;
    }

    .brand-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .brand-subtitle {
      font-size: 1.2rem;
      opacity: 0.9;
      margin-bottom: 0;
    }
  }

  .features-list {
    .feature-item {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
      font-size: 1.1rem;

      .el-icon {
        margin-right: 1rem;
        flex-shrink: 0;
      }

      span {
        opacity: 0.95;
      }
    }
  }
}

.auth-form-container {
  flex: 1;
  background: white;
  display: flex;
  flex-direction: column;
  position: relative;
}

.auth-form-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
}

.auth-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
}

.auth-form-content {
  width: 100%;
  max-width: 400px;
}

.auth-footer {
  padding: 1.5rem 2rem;
  text-align: center;
  border-top: 1px solid #eee;
  color: #666;
  font-size: 0.9rem;
}

// Transitions
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// Responsive Design
@media (max-width: 768px) {
  .auth-container {
    flex-direction: column;
  }

  .auth-branding {
    flex: none;
    min-height: 40vh;
    padding: 1rem;

    .branding-content {
      .logo-section {
        margin-bottom: 1.5rem;

        .brand-title {
          font-size: 2rem;
        }

        .brand-subtitle {
          font-size: 1rem;
        }
      }

      .features-list {
        display: none;
      }
    }
  }

  .auth-form-container {
    flex: 1;
    min-height: 60vh;
  }

  .auth-form-wrapper {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .auth-branding {
    min-height: 30vh;

    .brand-title {
      font-size: 1.8rem;
    }
  }

  .auth-form-container {
    min-height: 70vh;
  }
}
</style>

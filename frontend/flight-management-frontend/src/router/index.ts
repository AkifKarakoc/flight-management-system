import { createRouter, createWebHistory, type Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import authService from '@/services/authService'
import { ElMessage } from 'element-plus'

// Lazy import components
const AuthLayout = () => import('@/layouts/AuthLayout.vue')
const MainLayout = () => import('@/layouts/MainLayout.vue')
const LoginPage = () => import('@/pages/auth/LoginPage.vue')
const DashboardPage = () => import('@/pages/dashboard/DashboardPage.vue')
const NotFoundPage = () => import('@/pages/NotFoundPage.vue')

// Reference Management Pages
const AirlineManagement = () => import('@/pages/reference/AirlineManagement.vue')
const AirportManagement = () => import('@/pages/reference/AirportManagement.vue')
const AircraftManagement = () => import('@/pages/reference/AircraftManagement.vue')
const RouteManagement = () => import('@/pages/reference/RouteManagement.vue')
const CrewManagement = () => import('@/pages/reference/CrewManagement.vue')

// Flight Management Pages
const FlightManagement = () => import('@/pages/flights/FlightManagement.vue')
const FlightCreate = () => import('@/pages/flights/FlightCreate.vue')
const FlightEdit = () => import('@/pages/flights/FlightEdit.vue')
const FlightUpload = () => import('@/pages/flights/FlightUpload.vue')

const routes = [
  // Auth Routes
  {
    path: '/auth',
    component: AuthLayout,
    meta: { requiresAuth: false },
    children: [
      {
        path: '',
        redirect: '/auth/login'
      },
      {
        path: 'login',
        name: 'Login',
        component: LoginPage,
        meta: {
          title: 'Giriş Yap',
          requiresAuth: false
        }
      }
    ]
  },

  // Main App Routes
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: DashboardPage,
        meta: {
          title: 'Dashboard',
          requiresAuth: true
        }
      },

      // Reference Management Routes
      {
        path: 'airlines',
        name: 'Airlines',
        component: AirlineManagement,
        meta: {
          title: 'Havayolları',
          requiresAuth: true,
          roles: ['ADMIN', 'USER'] // Bu sayfaya hangi roller erişebilir
        }
      },
      {
        path: 'airports',
        name: 'Airports',
        component: AirportManagement,
        meta: {
          title: 'Havaalanları',
          requiresAuth: true,
          roles: ['ADMIN', 'USER']
        }
      },
      {
        path: 'aircrafts',
        name: 'Aircrafts',
        component: AircraftManagement,
        meta: {
          title: 'Uçaklar',
          requiresAuth: true,
          roles: ['ADMIN', 'USER']
        }
      },
      {
        path: 'routes',
        name: 'Routes',
        component: RouteManagement,
        meta: {
          title: 'Rotalar',
          requiresAuth: true,
          roles: ['ADMIN', 'USER']
        }
      },
      {
        path: 'crew',
        name: 'CrewMembers',
        component: CrewManagement,
        meta: {
          title: 'Ekip Üyeleri',
          requiresAuth: true,
          roles: ['ADMIN']
        }
      },

      // Flight Management Routes
      {
        path: 'flights',
        name: 'Flights',
        component: FlightManagement,
        meta: {
          title: 'Uçuşlar',
          requiresAuth: true,
          roles: ['ADMIN', 'USER']
        }
      },
      {
        path: 'flights/create',
        name: 'FlightCreate',
        component: FlightCreate,
        meta: {
          title: 'Yeni Uçuş',
          requiresAuth: true,
          roles: ['ADMIN']
        }
      },
      {
        path: 'flights/edit/:id',
        name: 'FlightEdit',
        component: FlightEdit,
        meta: {
          title: 'Uçuş Düzenle',
          requiresAuth: true,
          roles: ['ADMIN']
        }
      },
      {
        path: 'flights/upload',
        name: 'FlightUpload',
        component: FlightUpload,
        meta: {
          title: 'Uçuş Yükle',
          requiresAuth: true,
          roles: ['ADMIN']
        }
      },
      {
        path: 'flights/active',
        name: 'FlightActive',
        component: () => import('@/pages/flights/FlightActive.vue'),
        meta: {
          title: 'Aktif Uçuşlar',
          requiresAuth: true,
          roles: ['ADMIN', 'USER']
        }
      },

      // Reports Routes
      {
        path: 'reports',
        name: 'Reports',
        redirect: '/reports/flights'
      },
      {
        path: 'reports/flights',
        name: 'ReportsFlights',
        component: () => import('@/pages/reports/FlightReports.vue'),
        meta: {
          title: 'Uçuş Raporları',
          requiresAuth: true,
          roles: ['ADMIN', 'USER']
        }
      },
      {
        path: 'reports/kpi',
        name: 'ReportsKPI',
        component: () => import('@/pages/reports/KPIReports.vue'),
        meta: {
          title: 'KPI Raporları',
          requiresAuth: true,
          roles: ['ADMIN', 'USER']
        }
      },
      {
        path: 'reports/analytics',
        name: 'ReportsAnalytics',
        component: () => import('@/pages/reports/Analytics.vue'),
        meta: {
          title: 'Veri Analizi',
          requiresAuth: true,
          roles: ['ADMIN', 'USER']
        }
      },

      // System Management Routes (Admin Only)
      {
        path: 'system',
        name: 'System',
        redirect: '/system/health'
      },
      {
        path: 'system/health',
        name: 'SystemHealth',
        component: () => import('@/pages/system/SystemHealth.vue'),
        meta: {
          title: 'Sistem Durumu',
          requiresAuth: true,
          roles: ['ADMIN']
        }
      },
      {
        path: 'system/logs',
        name: 'SystemLogs',
        component: () => import('@/pages/system/SystemLogs.vue'),
        meta: {
          title: 'Sistem Logları',
          requiresAuth: true,
          roles: ['ADMIN']
        }
      },
      {
        path: 'system/settings',
        name: 'SystemSettings',
        component: () => import('@/pages/system/SystemSettings.vue'),
        meta: {
          title: 'Sistem Ayarları',
          requiresAuth: true,
          roles: ['ADMIN']
        }
      }
    ]
  },

  // 404 Route
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundPage,
    meta: {
      title: 'Sayfa Bulunamadı',
      requiresAuth: false
    }
  }
]

const router: Router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Enhanced Navigation Guards with Security
router.beforeEach(async (to, from, next) => {
  console.log(`🔍 Navigation: ${from.path} → ${to.path}`)

  const authStore = useAuthStore()

  // Set page title
  if (to.meta?.title) {
    document.title = `${to.meta.title} - Flight Management System`
  } else {
    document.title = 'Flight Management System'
  }

  // 1. Auth pages kontrolü - authenticated user auth'a gitmeye çalışıyorsa
  if (to.path.startsWith('/auth')) {
    if (authStore.isAuthenticated) {
      console.log('✅ Already authenticated, redirecting to dashboard')
      next('/dashboard')
      return
    }
    // Auth sayfalarına devam et
    next()
    return
  }

  // 2. Protected route kontrolü
  if (to.meta?.requiresAuth !== false) {
    // Session validation yap
    if (!authService.validateSession()) {
      console.log('❌ Session invalid, redirecting to login')
      ElMessage.warning('Oturumunuz geçersiz. Lütfen tekrar giriş yapın.')
      authStore.clearSessionTimeout()

      next({
        path: '/auth/login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // Store'dan auth durumunu kontrol et
    if (!authStore.isAuthenticated) {
      console.log('❌ Not authenticated, redirecting to login')
      ElMessage.warning('Bu sayfaya erişmek için giriş yapmalısınız')

      next({
        path: '/auth/login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // 3. Role-based access control
    if (to.meta?.roles && Array.isArray(to.meta.roles)) {
      const userRoles = authStore.userRoles
      const hasRequiredRole = to.meta.roles.some(role =>
        userRoles.includes(role) ||
        userRoles.includes(`ROLE_${role}`) ||
        authService.hasRole(role)
      )

      if (!hasRequiredRole) {
        console.log('❌ Insufficient permissions for route:', to.path)
        ElMessage.error('Bu sayfaya erişim yetkiniz bulunmuyor')

        // Dashboard'a yönlendir veya önceki sayfaya geri dön
        next(from.path === '/auth/login' ? '/dashboard' : from.path || '/dashboard')
        return
      }
    }

    // 4. Permission-based access control (opsiyonel)
    if (to.meta?.permissions && Array.isArray(to.meta.permissions)) {
      const hasRequiredPermission = to.meta.permissions.some(permission =>
        authService.hasPermission(permission)
      )

      if (!hasRequiredPermission) {
        console.log('❌ Insufficient permissions for route:', to.path)
        ElMessage.error('Bu işlem için yetkiniz bulunmuyor')
        next(from.path || '/dashboard')
        return
      }
    }

    // 5. Token expiry check ve refresh
    if (authService.isTokenExpiringSoon()) {
      console.log('⚠️ Token expiring soon, attempting refresh...')
      try {
        await authStore.refreshAuthToken()
        console.log('✅ Token refreshed successfully')
      } catch (error) {
        console.error('❌ Token refresh failed:', error)
        ElMessage.error('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.')
        await authStore.logout()
        next('/auth/login')
        return
      }
    }

    console.log('✅ Auth check passed, proceeding to route')
  }

  // Tüm kontroller geçti
  next()
})

// After each navigation
router.afterEach((to, from, failure) => {
  if (failure) {
    console.error('❌ Navigation failed:', failure)
    return
  }

  console.log(`✅ Navigation completed: ${from.path} → ${to.path}`)

  // Update last activity
  if (to.meta?.requiresAuth !== false) {
    authService.updateLastActivity()
  }
})

// Error handling
router.onError((error: Error) => {
  console.error('❌ Router error:', error)
  ElMessage.error('Sayfa yüklenirken hata oluştu')
})

export default router

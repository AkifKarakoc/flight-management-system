import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
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

  // Redirect root to login if not authenticated, dashboard if authenticated
  {
    path: '/',
    redirect: () => {
      const authStore = useAuthStore()
      return authStore.isAuthenticated ? '/dashboard' : '/auth/login'
    }
  },

  // Main Application Routes
  {
    path: '/dashboard',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: DashboardPage,
        meta: {
          title: 'Dashboard',
          breadcrumb: 'Ana Sayfa',
          keepAlive: true
        }
      }
    ]
  },

  // Reference Management Routes
  {
    path: '/reference',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      // Airlines
      {
        path: 'airlines',
        name: 'Airlines',
        component: AirlineManagement,
        meta: {
          title: 'Havayolu Yönetimi',
          breadcrumb: 'Havayolları',
          keepAlive: true,
          permissions: ['REFERENCE_READ']
        }
      },

      // Airports
      {
        path: 'airports',
        name: 'Airports',
        component: AirportManagement,
        meta: {
          title: 'Havaalanı Yönetimi',
          breadcrumb: 'Havaalanları',
          keepAlive: true,
          permissions: ['REFERENCE_READ']
        }
      },

      // Aircrafts
      {
        path: 'aircrafts',
        name: 'Aircrafts',
        component: AircraftManagement,
        meta: {
          title: 'Uçak Yönetimi',
          breadcrumb: 'Uçaklar',
          keepAlive: true,
          permissions: ['REFERENCE_READ']
        }
      },

      // Routes
      {
        path: 'routes',
        name: 'Routes',
        component: RouteManagement,
        meta: {
          title: 'Rota Yönetimi',
          breadcrumb: 'Rotalar',
          keepAlive: true,
          permissions: ['REFERENCE_READ']
        }
      },

      // Crew Members
      {
        path: 'crew-members',
        name: 'CrewMembers',
        component: CrewManagement,
        meta: {
          title: 'Mürettebat Yönetimi',
          breadcrumb: 'Mürettebat',
          keepAlive: true,
          permissions: ['REFERENCE_READ']
        }
      }
    ]
  },

  // Legacy route redirects for compatibility
  {
    path: '/airlines',
    redirect: '/reference/airlines'
  },
  {
    path: '/airports',
    redirect: '/reference/airports'
  },
  {
    path: '/aircrafts',
    redirect: '/reference/aircrafts'
  },
  {
    path: '/routes',
    redirect: '/reference/routes'
  },
  {
    path: '/crew-members',
    redirect: '/reference/crew-members'
  },

  // Login redirect (legacy)
  {
    path: '/login',
    redirect: '/auth/login'
  },

  // 404 Not Found
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

const router = createRouter({
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

// Global Navigation Guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Set page title
  if (to.meta.title) {
    document.title = `${to.meta.title} - Flight Management System`
  } else {
    document.title = 'Flight Management System'
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth !== false) {
    if (!authStore.isAuthenticated) {
      ElMessage.warning('Bu sayfaya erişmek için giriş yapmalısınız')
      next({
        path: '/auth/login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // Check permissions if specified
    if (to.meta.permissions && to.meta.permissions.length > 0) {
      const hasPermission = to.meta.permissions.some(permission =>
        authStore.hasPermission(permission)
      )

      if (!hasPermission) {
        ElMessage.error('Bu sayfaya erişim yetkiniz bulunmamaktadır')
        next('/dashboard')
        return
      }
    }

    // Check roles if specified
    if (to.meta.roles && to.meta.roles.length > 0) {
      const hasRole = to.meta.roles.some(role =>
        authStore.hasRole(role)
      )

      if (!hasRole) {
        ElMessage.error('Bu sayfaya erişim yetkiniz bulunmamaktadır')
        next('/dashboard')
        return
      }
    }
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (to.path.startsWith('/auth') && authStore.isAuthenticated) {
    next('/dashboard')
    return
  }

  next()
})

router.afterEach((to, from) => {
  // Analytics or other post-navigation logic can go here
  console.log(`Navigation: ${from.path} -> ${to.path}`)
})

// Handle navigation errors
router.onError((error) => {
  console.error('Router error:', error)
  ElMessage.error('Sayfa yüklenirken hata oluştu')
})

export default router

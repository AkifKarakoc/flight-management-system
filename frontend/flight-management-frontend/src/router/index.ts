import { createRouter, createWebHistory, type Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
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
          requiresAuth: true
        }
      },
      {
        path: 'airports',
        name: 'Airports',
        component: AirportManagement,
        meta: {
          title: 'Havaalanları',
          requiresAuth: true
        }
      },
      {
        path: 'aircrafts',
        name: 'Aircrafts',
        component: AircraftManagement,
        meta: {
          title: 'Uçaklar',
          requiresAuth: true
        }
      },
      {
        path: 'routes',
        name: 'Routes',
        component: RouteManagement,
        meta: {
          title: 'Rotalar',
          requiresAuth: true
        }
      },
      {
        path: 'crew-members',
        name: 'CrewMembers',
        component: CrewManagement,
        meta: {
          title: 'Mürettebat',
          requiresAuth: true
        }
      },

      // Flight Management Routes
      {
        path: 'flights',
        name: 'Flights',
        component: FlightManagement,
        meta: {
          title: 'Uçuşlar',
          requiresAuth: true
        }
      },
      {
        path: 'flights/create',
        name: 'FlightCreate',
        component: FlightCreate,
        meta: {
          title: 'Yeni Uçuş',
          requiresAuth: true
        }
      },
      {
        path: 'flights/:id/edit',
        name: 'FlightEdit',
        component: FlightEdit,
        meta: {
          title: 'Uçuş Düzenle',
          requiresAuth: true
        }
      },
      {
        path: 'flights/upload',
        name: 'FlightUpload',
        component: FlightUpload,
        meta: {
          title: 'Toplu Uçuş Yükleme',
          requiresAuth: true
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

// Global Navigation Guards
// Global Navigation Guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  console.log(`Navigating from ${from.path} to ${to.path}`)
  console.log('Is authenticated:', authStore.isAuthenticated)
  console.log('Route requires auth:', to.meta?.requiresAuth)

  // Set page title
  if (to.meta?.title) {
    document.title = `${to.meta.title} - Flight Management System`
  } else {
    document.title = 'Flight Management System'
  }

  // Auth pages'e authenticated user gitmeye çalışıyorsa
  if (to.path.startsWith('/auth') && authStore.isAuthenticated) {
    console.log('Already authenticated, redirecting to dashboard')
    next('/dashboard')
    return
  }

  // Protected route kontrolü
  if (to.meta?.requiresAuth !== false && to.path !== '/auth/login') {
    if (!authStore.isAuthenticated) {
      console.log('Not authenticated, redirecting to login')
      ElMessage.warning('Bu sayfaya erişmek için giriş yapmalısınız')
      next({
        path: '/auth/login',
        query: { redirect: to.fullPath }
      })
      return
    }
  }

  next()
})

router.afterEach((to, from) => {
  console.log(`Navigation: ${from.path} -> ${to.path}`)
})

router.onError((error: Error) => {
  console.error('Router error:', error)
  ElMessage.error('Sayfa yüklenirken hata oluştu')
})

export default router

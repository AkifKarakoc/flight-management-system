import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/auth/LoginPage.vue'),
    meta: {
      requiresAuth: false,
      layout: 'auth',
      title: 'Giriş Yap'
    }
  },
  {
    path: '/',
    redirect: '/dashboard',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/pages/dashboard/DashboardPage.vue'),
        meta: {
          title: 'Dashboard',
          icon: 'Odometer'
        }
      },
      {
        path: 'flights',
        name: 'FlightManagement',
        component: () => import('@/pages/flights/FlightManagement.vue'),
        meta: {
          title: 'Uçuş Yönetimi',
          icon: 'Ship'
        }
      },
      {
        path: 'flights/create',
        name: 'FlightCreate',
        component: () => import('@/pages/flights/FlightCreate.vue'),
        meta: {
          title: 'Uçuş Oluştur',
          requiresAdmin: true,
          breadcrumb: [
            { title: 'Uçuş Yönetimi', to: '/flights' },
            { title: 'Yeni Uçuş' }
          ]
        }
      },
      {
        path: 'flights/:id/edit',
        name: 'FlightEdit',
        component: () => import('@/pages/flights/FlightEdit.vue'),
        meta: {
          title: 'Uçuş Düzenle',
          requiresAdmin: true,
          breadcrumb: [
            { title: 'Uçuş Yönetimi', to: '/flights' },
            { title: 'Uçuş Düzenle' }
          ]
        }
      },
      {
        path: 'flights/upload',
        name: 'FlightUpload',
        component: () => import('@/pages/flights/FlightUpload.vue'),
        meta: {
          title: 'CSV Uçuş Yükleme',
          requiresAdmin: true,
          breadcrumb: [
            { title: 'Uçuş Yönetimi', to: '/flights' },
            { title: 'CSV Yükleme' }
          ]
        }
      },
      {
        path: 'airlines',
        name: 'Airlines',
        component: () => import('@/pages/airlines/AirlineManagement.vue'),
        meta: {
          title: 'Havayolu Yönetimi',
          icon: 'Ship'
        }
      },
      {
        path: 'airports',
        name: 'Airports',
        component: () => import('@/pages/airports/AirportManagement.vue'),
        meta: {
          title: 'Havalimanı Yönetimi',
          icon: 'Place'
        }
      },
      {
        path: 'routes',
        name: 'Routes',
        component: () => import('@/pages/routes/RouteManagement.vue'),
        meta: {
          title: 'Rota Yönetimi',
          icon: 'MapLocation'
        }
      },
      {
        path: 'crew-members',
        name: 'CrewMembers',
        component: () => import('@/pages/crew/CrewManagement.vue'),
        meta: {
          title: 'Mürettebat Yönetimi',
          icon: 'User'
        }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/pages/reports/ArchiveReports.vue'),
        meta: {
          title: 'Raporlar',
          icon: 'DocumentCopy'
        }
      }
    ]
  },
  {
    // 404 page
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/error/NotFound.vue'),
    meta: {
      title: 'Sayfa Bulunamadı'
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

// Global navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Set document title
  const baseTitle = import.meta.env.VITE_APP_TITLE || 'Uçuş Yönetim Sistemi'
  document.title = to.meta.title ? `${to.meta.title} - ${baseTitle}` : baseTitle

  // Check authentication
  if (to.meta.requiresAuth !== false) {
    if (!authStore.isAuthenticated) {
      ElMessage.warning('Bu sayfaya erişmek için giriş yapmalısınız.')
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // Check admin requirement
    if (to.meta.requiresAdmin && !authStore.isAdmin) {
      ElMessage.error('Bu sayfaya erişmek için yönetici yetkisine sahip olmalısınız.')
      next({ name: 'Dashboard' })
      return
    }
  }

  // Redirect to dashboard if already authenticated and trying to access login
  if (to.name === 'Login' && authStore.isAuthenticated) {
    next({ name: 'Dashboard' })
    return
  }

  next()
})

router.afterEach((to, from) => {
  // Page analytics veya diğer tracking kodları buraya eklenebilir
  console.debug(`Navigation: ${from.path} -> ${to.path}`)
})

export default router

import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/auth/LoginPage.vue'),
    meta: {
      layout: 'AuthLayout',
      requiresAuth: false,
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
        meta: { title: 'Dashboard', icon: 'Monitor' }
      },
      {
        path: 'airlines',
        name: 'Airlines',
        component: () => import('@/pages/reference/AirlineManagement.vue'),
        meta: { title: 'Havayolu Yönetimi', icon: 'Ship' }
      },
      {
        path: 'airports',
        name: 'Airports',
        component: () => import('@/pages/reference/AirportManagement.vue'),
        meta: { title: 'Havaalanı Yönetimi', icon: 'MapLocation' }
      },
      {
        path: 'aircrafts',
        name: 'Aircrafts',
        component: () => import('@/pages/reference/AircraftManagement.vue'),
        meta: { title: 'Uçak Yönetimi', icon: 'Promotion' }
      },
      {
        path: 'routes',
        name: 'Routes',
        component: () => import('@/pages/reference/RouteManagement.vue'),
        meta: { title: 'Rota Yönetimi', icon: 'Connection' }
      },
      {
        path: 'crew-members',
        name: 'CrewMembers',
        component: () => import('@/pages/reference/CrewManagement.vue'),
        meta: { title: 'Mürettebat Yönetimi', icon: 'Avatar' }
      },
      {
        path: 'flights',
        name: 'Flights',
        component: () => import('@/pages/flights/FlightManagement.vue'),
        meta: { title: 'Uçuş Yönetimi', icon: 'Position' }
      },
      {
        path: 'flights/create',
        name: 'FlightCreate',
        component: () => import('@/pages/flights/FlightCreate.vue'),
        meta: { title: 'Uçuş Oluştur', icon: 'Plus', breadcrumb: 'Yeni Uçuş' }
      },
      {
        path: 'flights/:id/edit',
        name: 'FlightEdit',
        component: () => import('@/pages/flights/FlightEdit.vue'),
        meta: { title: 'Uçuş Düzenle', breadcrumb: 'Uçuş Düzenle' }
      },
      {
        path: 'flights/upload',
        name: 'FlightUpload',
        component: () => import('@/pages/flights/FlightUpload.vue'),
        meta: { title: 'CSV Uçuş Yükleme', breadcrumb: 'Toplu Yükleme' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/NotFoundPage.vue'),
    meta: { title: '404 - Sayfa Bulunamadı' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Route Guards
router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // Set page title
  document.title = to.meta?.title ? `${to.meta.title} - Flight Management` : 'Flight Management'

  // Auth check
  if (to.meta?.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'Login' }
  }

  if (to.name === 'Login' && authStore.isAuthenticated) {
    return { name: 'Dashboard' }
  }
})

export default router

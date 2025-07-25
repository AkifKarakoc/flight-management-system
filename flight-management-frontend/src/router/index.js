import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { STORAGE_KEYS } from '@/utils/constants'
import { getStorageItem } from '@/utils/helpers'

// Lazy loading için route import'ları
const LoginPage = () => import('@/pages/auth/LoginPage.vue')
const DashboardPage = () => import('@/pages/dashboard/DashboardPage.vue')
const NotFound = () => import('@/pages/errors/NotFound.vue')
const Forbidden = () => import('@/pages/errors/Forbidden.vue')
const ServerError = () => import('@/pages/errors/ServerError.vue')

// Layout imports
const MainLayout = () => import('@/layouts/MainLayout.vue')
const AuthLayout = () => import('@/layouts/AuthLayout.vue')

// Flight Management
const FlightManagement = () => import('@/pages/flights/FlightManagement.vue')
const FlightCreate = () => import('@/pages/flights/FlightCreate.vue')
const FlightEdit = () => import('@/pages/flights/FlightEdit.vue')
const FlightView = () => import('@/pages/flights/FlightView.vue')
const FlightUpload = () => import('@/pages/flights/FlightUpload.vue')

// Reference Data Management
const AirlineManagement = () => import('@/pages/reference/airlines/AirlineManagement.vue')
const AirlineCreate = () => import('@/pages/reference/airlines/AirlineCreate.vue')
const AirlineEdit = () => import('@/pages/reference/airlines/AirlineEdit.vue')

const AirportManagement = () => import('@/pages/reference/airports/AirportManagement.vue')
const AirportCreate = () => import('@/pages/reference/airports/AirportCreate.vue')
const AirportEdit = () => import('@/pages/reference/airports/AirportEdit.vue')

const AircraftManagement = () => import('@/pages/reference/aircraft/AircraftManagement.vue')
const AircraftCreate = () => import('@/pages/reference/aircraft/AircraftCreate.vue')
const AircraftEdit = () => import('@/pages/reference/aircraft/AircraftEdit.vue')

const RouteManagement = () => import('@/pages/reference/routes/RouteManagement.vue')
const RouteCreate = () => import('@/pages/reference/routes/RouteCreate.vue')
const RouteEdit = () => import('@/pages/reference/routes/RouteEdit.vue')

const CrewManagement = () => import('@/pages/reference/crew/CrewManagement.vue')
const CrewCreate = () => import('@/pages/reference/crew/CrewCreate.vue')
const CrewEdit = () => import('@/pages/reference/crew/CrewEdit.vue')

// Reports
const ArchiveReports = () => import('@/pages/reports/ArchiveReports.vue')
const FlightReports = () => import('@/pages/reports/FlightReports.vue')
const KpiReports = () => import('@/pages/reports/KpiReports.vue')

const routes = [
  // Auth routes
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: {
      layout: 'auth',
      requiresAuth: false,
      title: 'Giriş Yap'
    }
  },

  // Main routes with authentication
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      // Dashboard
      {
        path: '',
        name: 'Dashboard',
        component: DashboardPage,
        meta: {
          title: 'Kontrol Paneli',
          breadcrumb: 'Kontrol Paneli'
        }
      },

      // Flight Management Routes
      {
        path: '/flights',
        name: 'FlightManagement',
        component: FlightManagement,
        meta: {
          title: 'Uçuş Yönetimi',
          breadcrumb: 'Uçuş Yönetimi',
          permissions: ['USER', 'ADMIN']
        }
      },
      {
        path: '/flights/create',
        name: 'FlightCreate',
        component: FlightCreate,
        meta: {
          title: 'Yeni Uçuş',
          breadcrumb: 'Yeni Uçuş',
          permissions: ['ADMIN']
        }
      },
      {
        path: '/flights/:id/edit',
        name: 'FlightEdit',
        component: FlightEdit,
        props: true,
        meta: {
          title: 'Uçuş Düzenle',
          breadcrumb: 'Uçuş Düzenle',
          permissions: ['ADMIN']
        }
      },
      {
        path: '/flights/:id',
        name: 'FlightView',
        component: FlightView,
        props: true,
        meta: {
          title: 'Uçuş Detayları',
          breadcrumb: 'Uçuş Detayları',
          permissions: ['USER', 'ADMIN']
        }
      },
      {
        path: '/flights/upload',
        name: 'FlightUpload',
        component: FlightUpload,
        meta: {
          title: 'Uçuş CSV Yükleme',
          breadcrumb: 'CSV Yükleme',
          permissions: ['ADMIN']
        }
      },

      // Reference Data Routes
      {
        path: '/reference',
        meta: {
          title: 'Referans Veriler',
          breadcrumb: 'Referans Veriler'
        },
        children: [
          // Airlines
          {
            path: 'airlines',
            name: 'AirlineManagement',
            component: AirlineManagement,
            meta: {
              title: 'Havayolu Yönetimi',
              breadcrumb: 'Havayolları',
              permissions: ['USER', 'ADMIN']
            }
          },
          {
            path: 'airlines/create',
            name: 'AirlineCreate',
            component: AirlineCreate,
            meta: {
              title: 'Yeni Havayolu',
              breadcrumb: 'Yeni Havayolu',
              permissions: ['ADMIN']
            }
          },
          {
            path: 'airlines/:id/edit',
            name: 'AirlineEdit',
            component: AirlineEdit,
            props: true,
            meta: {
              title: 'Havayolu Düzenle',
              breadcrumb: 'Havayolu Düzenle',
              permissions: ['ADMIN']
            }
          },

          // Airports
          {
            path: 'airports',
            name: 'AirportManagement',
            component: AirportManagement,
            meta: {
              title: 'Havalimanı Yönetimi',
              breadcrumb: 'Havalimanları',
              permissions: ['USER', 'ADMIN']
            }
          },
          {
            path: 'airports/create',
            name: 'AirportCreate',
            component: AirportCreate,
            meta: {
              title: 'Yeni Havalimanı',
              breadcrumb: 'Yeni Havalimanı',
              permissions: ['ADMIN']
            }
          },
          {
            path: 'airports/:id/edit',
            name: 'AirportEdit',
            component: AirportEdit,
            props: true,
            meta: {
              title: 'Havalimanı Düzenle',
              breadcrumb: 'Havalimanı Düzenle',
              permissions: ['ADMIN']
            }
          },

          // Aircraft
          {
            path: 'aircraft',
            name: 'AircraftManagement',
            component: AircraftManagement,
            meta: {
              title: 'Uçak Yönetimi',
              breadcrumb: 'Uçaklar',
              permissions: ['USER', 'ADMIN']
            }
          },
          {
            path: 'aircraft/create',
            name: 'AircraftCreate',
            component: AircraftCreate,
            meta: {
              title: 'Yeni Uçak',
              breadcrumb: 'Yeni Uçak',
              permissions: ['ADMIN']
            }
          },
          {
            path: 'aircraft/:id/edit',
            name: 'AircraftEdit',
            component: AircraftEdit,
            props: true,
            meta: {
              title: 'Uçak Düzenle',
              breadcrumb: 'Uçak Düzenle',
              permissions: ['ADMIN']
            }
          },

          // Routes
          {
            path: 'routes',
            name: 'RouteManagement',
            component: RouteManagement,
            meta: {
              title: 'Rota Yönetimi',
              breadcrumb: 'Rotalar',
              permissions: ['USER', 'ADMIN']
            }
          },
          {
            path: 'routes/create',
            name: 'RouteCreate',
            component: RouteCreate,
            meta: {
              title: 'Yeni Rota',
              breadcrumb: 'Yeni Rota',
              permissions: ['ADMIN']
            }
          },
          {
            path: 'routes/:id/edit',
            name: 'RouteEdit',
            component: RouteEdit,
            props: true,
            meta: {
              title: 'Rota Düzenle',
              breadcrumb: 'Rota Düzenle',
              permissions: ['ADMIN']
            }
          },

          // Crew Members
          {
            path: 'crew',
            name: 'CrewManagement',
            component: CrewManagement,
            meta: {
              title: 'Mürettebat Yönetimi',
              breadcrumb: 'Mürettebat',
              permissions: ['USER', 'ADMIN']
            }
          },
          {
            path: 'crew/create',
            name: 'CrewCreate',
            component: CrewCreate,
            meta: {
              title: 'Yeni Mürettebat',
              breadcrumb: 'Yeni Mürettebat',
              permissions: ['ADMIN']
            }
          },
          {
            path: 'crew/:id/edit',
            name: 'CrewEdit',
            component: CrewEdit,
            props: true,
            meta: {
              title: 'Mürettebat Düzenle',
              breadcrumb: 'Mürettebat Düzenle',
              permissions: ['ADMIN']
            }
          }
        ]
      },

      // Reports Routes
      {
        path: '/reports',
        meta: {
          title: 'Raporlar',
          breadcrumb: 'Raporlar'
        },
        children: [
          {
            path: 'archive',
            name: 'ArchiveReports',
            component: ArchiveReports,
            meta: {
              title: 'Arşiv Raporları',
              breadcrumb: 'Arşiv Raporları',
              permissions: ['USER', 'ADMIN']
            }
          },
          {
            path: 'flights',
            name: 'FlightReports',
            component: FlightReports,
            meta: {
              title: 'Uçuş Raporları',
              breadcrumb: 'Uçuş Raporları',
              permissions: ['USER', 'ADMIN']
            }
          },
          {
            path: 'kpi',
            name: 'KpiReports',
            component: KpiReports,
            meta: {
              title: 'KPI Raporları',
              breadcrumb: 'KPI Raporları',
              permissions: ['ADMIN']
            }
          }
        ]
      }
    ]
  },

  // Error routes
  {
    path: '/403',
    name: 'Forbidden',
    component: Forbidden,
    meta: {
      layout: 'empty',
      title: 'Yetkisiz Erişim'
    }
  },
  {
    path: '/500',
    name: 'ServerError',
    component: ServerError,
    meta: {
      layout: 'empty',
      title: 'Sunucu Hatası'
    }
  },

  // Catch all route - 404
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: {
      layout: 'empty',
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

export default router

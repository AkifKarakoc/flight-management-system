import { useAuthStore } from '@/stores/auth'
import { STORAGE_KEYS, USER_ROLES } from '@/utils/constants'
import { getStorageItem, setStorageItem, logError } from '@/utils/helpers'

/**
 * Authentication guard - Kullanıcının giriş yapıp yapmadığını kontrol eder
 * @param {object} to - Hedef route
 * @param {object} from - Kaynak route
 * @param {Function} next - Next fonksiyonu
 */
export const authGuard = async (to, from, next) => {
  try {
    const authStore = useAuthStore()

    // Route auth gerektirmiyor ve kullanıcı giriş yapmış - dashboard'a yönlendir
    if (!to.meta.requiresAuth && authStore.isAuthenticated) {
      if (to.name === 'Login') {
        next({ name: 'Dashboard' })
        return
      }
    }

    // Route auth gerektiriyor ancak kullanıcı giriş yapmamış
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      // Son ziyaret edilen sayfayı kaydet
      if (to.path !== '/login') {
        setStorageItem(STORAGE_KEYS.LAST_ROUTE, to.fullPath)
      }

      next({ name: 'Login' })
      return
    }

    next()
  } catch (error) {
    logError('authGuard', error, { to: to.path, from: from.path })
    next({ name: 'ServerError' })
  }
}

/**
 * Permission guard - Kullanıcının route için gerekli yetkiye sahip olup olmadığını kontrol eder
 * @param {object} to - Hedef route
 * @param {object} from - Kaynak route
 * @param {Function} next - Next fonksiyonu
 */
export const permissionGuard = (to, from, next) => {
  try {
    const authStore = useAuthStore()

    // Route permission gerektirmiyor
    if (!to.meta.permissions) {
      next()
      return
    }

    // Kullanıcı giriş yapmamış
    if (!authStore.isAuthenticated) {
      next({ name: 'Login' })
      return
    }

    // Kullanıcının rolünü kontrol et
    const userRole = authStore.user?.role
    const requiredPermissions = to.meta.permissions

    if (!userRole || !requiredPermissions.includes(userRole)) {
      next({ name: 'Forbidden' })
      return
    }

    next()
  } catch (error) {
    logError('permissionGuard', error, { to: to.path, from: from.path })
    next({ name: 'ServerError' })
  }
}

/**
 * Title guard - Sayfa başlığını günceller
 * @param {object} to - Hedef route
 * @param {object} from - Kaynak route
 * @param {Function} next - Next fonksiyonu
 */
export const titleGuard = (to, from, next) => {
  try {
    const baseTitle = 'Uçuş Yönetim Sistemi'

    if (to.meta.title) {
      document.title = `${to.meta.title} - ${baseTitle}`
    } else {
      document.title = baseTitle
    }

    next()
  } catch (error) {
    logError('titleGuard', error, { to: to.path, from: from.path })
    next()
  }
}

/**
 * Loading guard - Sayfa geçişlerinde loading durumunu yönetir
 * @param {object} to - Hedef route
 * @param {object} from - Kaynak route
 * @param {Function} next - Next fonksiyonu
 */
export const loadingGuard = (to, from, next) => {
  try {
    // Loading durumunu başlat (global store'da tutulabilir)
    // const loadingStore = useLoadingStore()
    // loadingStore.startPageTransition()

    next()
  } catch (error) {
    logError('loadingGuard', error, { to: to.path, from: from.path })
    next()
  }
}

/**
 * Breadcrumb guard - Breadcrumb verilerini günceller
 * @param {object} to - Hedef route
 * @param {object} from - Kaynak route
 * @param {Function} next - Next fonksiyonu
 */
export const breadcrumbGuard = (to, from, next) => {
  try {
    // Breadcrumb verilerini oluştur
    const breadcrumbs = []

    // Ana sayfa her zaman var
    breadcrumbs.push({
      title: 'Ana Sayfa',
      name: 'Dashboard',
      path: '/'
    })

    // Route hierarchy'sine göre breadcrumb oluştur
    const matchedRoutes = to.matched.filter(route => route.meta.breadcrumb)

    matchedRoutes.forEach((route, index) => {
      const isLast = index === matchedRoutes.length - 1

      breadcrumbs.push({
        title: route.meta.breadcrumb,
        name: route.name,
        path: isLast ? to.path : route.path,
        active: !isLast
      })
    })

    // Breadcrumb verilerini global store'da sakla
    // const breadcrumbStore = useBreadcrumbStore()
    // breadcrumbStore.setBreadcrumbs(breadcrumbs)

    next()
  } catch (error) {
    logError('breadcrumbGuard', error, { to: to.path, from: from.path })
    next()
  }
}

/**
 * Route params validation guard - Route parametrelerini doğrular
 * @param {object} to - Hedef route
 * @param {object} from - Kaynak route
 * @param {Function} next - Next fonksiyonu
 */
export const routeParamsGuard = (to, from, next) => {
  try {
    // ID parametresi olan route'lar için validation
    if (to.params.id) {
      const id = parseInt(to.params.id)

      // ID geçerli bir sayı mı?
      if (isNaN(id) || id <= 0) {
        next({ name: 'NotFound' })
        return
      }

      // ID'yi number olarak set et
      to.params.id = id
    }

    next()
  } catch (error) {
    logError('routeParamsGuard', error, { to: to.path, from: from.path })
    next({ name: 'NotFound' })
  }
}

/**
 * Network guard - Ağ bağlantısını kontrol eder
 * @param {object} to - Hedef route
 * @param {object} from - Kaynak route
 * @param {Function} next - Next fonksiyonu
 */
export const networkGuard = (to, from, next) => {
  try {
    // Online/offline durumunu kontrol et
    if (!navigator.onLine) {
      // Offline sayfasına yönlendir veya bildirim göster
      console.warn('Application is offline')
      // next({ name: 'Offline' })
      // return
    }

    next()
  } catch (error) {
    logError('networkGuard', error, { to: to.path, from: from.path })
    next()
  }
}

/**
 * Development guard - Development ortamında ekstra kontroller
 * @param {object} to - Hedef route
 * @param {object} from - Kaynak route
 * @param {Function} next - Next fonksiyonu
 */
export const developmentGuard = (to, from, next) => {
  try {
    // Sadece development ortamında çalış
    if (import.meta.env.MODE === 'development') {
      // Route timing'i log'la
      console.log(`[Router] Navigating from ${from.path} to ${to.path}`)

      // Route meta verilerini kontrol et
      if (to.meta.requiresAuth === undefined) {
        console.warn(`[Router] Route ${to.path} has no requiresAuth meta defined`)
      }
    }

    next()
  } catch (error) {
    logError('developmentGuard', error, { to: to.path, from: from.path })
    next()
  }
}

/**
 * Tüm guard'ları router'a uygulama - GÜNCELLENMIŞ VERSİYON
 * @param {object} router - Vue Router instance
 */
export const setupRouterGuards = (router) => {
  // Before each navigation
  router.beforeEach(async (to, from, next) => {
    try {
      console.log(`[Router] Navigating from ${from.path} to ${to.path}`) // Debug log

      const authStore = useAuthStore()

      // Auth store initialization'ı bekle
      if (!authStore.initialized) {
        console.log('[Router] Initializing auth store...') // Debug log
        authStore.initialize()
      }

      console.log(`[Router] Auth state - isAuthenticated: ${authStore.isAuthenticated}, route requiresAuth: ${to.meta.requiresAuth}`) // Debug log

      // Route auth gerektirmiyor ve kullanıcı giriş yapmış - dashboard'a yönlendir
      if (!to.meta.requiresAuth && authStore.isAuthenticated) {
        if (to.name === 'Login') {
          console.log('[Router] User authenticated, redirecting to Dashboard') // Debug log
          next({ name: 'Dashboard' })
          return
        }
      }

      // Route auth gerektiriyor ancak kullanıcı giriş yapmamış
      if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        console.log('[Router] Route requires auth but user not authenticated, redirecting to Login') // Debug log

        // Son ziyaret edilen sayfayı kaydet
        if (to.path !== '/login') {
          setStorageItem(STORAGE_KEYS.LAST_ROUTE, to.fullPath)
        }

        next({ name: 'Login' })
        return
      }

      // Title güncelle
      const baseTitle = 'Uçuş Yönetim Sistemi'
      if (to.meta.title) {
        document.title = `${to.meta.title} - ${baseTitle}`
      } else {
        document.title = baseTitle
      }

      console.log('[Router] Navigation allowed, proceeding...') // Debug log
      next()
    } catch (error) {
      console.error('[Router] Navigation error:', error)
      logError('router.beforeEach', error, { to: to.path, from: from.path })
      next({ name: 'ServerError' })
    }
  })

  // After each navigation
  router.afterEach((to, from, failure) => {
    try {
      if (failure) {
        console.error('[Router] Navigation failure:', failure)
        logError('router.afterEach', failure, { to: to.path, from: from.path })
        return
      }

      // Development logging
      if (import.meta.env.MODE === 'development') {
        console.log(`[Router] Navigation completed: ${to.path}`)
      }
    } catch (error) {
      logError('router.afterEach', error, { to: to.path, from: from.path })
    }
  })

  // Router error handler
  router.onError((error) => {
    console.error('[Router] Router error:', error)
    logError('router.onError', error)

    // Kritik hatalarda ana sayfaya yönlendir
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      window.location.reload()
    }
  })
}

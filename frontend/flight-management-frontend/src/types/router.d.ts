import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    breadcrumb?: string
    requiresAuth?: boolean
    keepAlive?: boolean
    permissions?: string[]
    roles?: string[]
  }
}

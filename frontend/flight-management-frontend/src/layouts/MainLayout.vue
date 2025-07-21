import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import AppHeader from '@/components/common/AppHeader.vue'
import AppSidebar from '@/components/common/AppSidebar.vue'
import BreadcrumbNav from '@/components/common/BreadcrumbNav.vue'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

// Computed properties
const sidebarWidth = computed(() => {
return appStore.sidebarCollapsed ? '64px' : '250px'
})

const keepAliveRoutes = computed(() => {
return ['Dashboard', 'Airlines', 'Airports', 'Aircrafts', 'Routes', 'CrewMembers', 'Flights']
})

// Methods
function handleToggleSidebar() {
appStore.toggleSidebar()
}

function handleMenuSelect(index) {
console.log('Menu selected:', index)
}

async function handleLogout() {
await authStore.logout()
}

// Lifecycle
onMounted(() => {
// Initialize app
appStore.initializeApp()
})

onUnmounted(() => {
// Cleanup
appStore.cleanup()
})

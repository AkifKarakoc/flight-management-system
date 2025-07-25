<template>
  <nav v-if="breadcrumbs.length > 0" :class="breadcrumbClass">
    <el-breadcrumb :separator="separator" :separator-icon="separatorIcon">
      <el-breadcrumb-item
        v-for="(item, index) in breadcrumbs"
        :key="item.path || index"
        :to="item.to"
        :class="getBreadcrumbItemClass(item, index)"
      >
        <!-- Icon -->
        <component
          v-if="item.icon && showIcons"
          :is="item.icon"
          class="breadcrumb-icon"
        />

        <!-- Text -->
        <span class="breadcrumb-text">{{ item.title }}</span>

        <!-- Badge -->
        <el-badge
          v-if="item.badge"
          :value="item.badge.value"
          :type="item.badge.type"
          :hidden="!item.badge.show"
          class="breadcrumb-badge"
        />
      </el-breadcrumb-item>
    </el-breadcrumb>

    <!-- Actions -->
    <div v-if="actions.length > 0" class="breadcrumb-actions">
      <BaseButton
        v-for="action in actions"
        :key="action.key"
        :type="action.type || 'default'"
        :size="compact ? 'small' : 'default'"
        :icon="action.icon"
        :loading="action.loading"
        :disabled="action.disabled"
        @click="action.handler"
      >
        {{ action.label }}
      </BaseButton>
    </div>
  </nav>
</template>

<script setup>
import { computed, defineProps } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight } from '@element-plus/icons-vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  // Custom breadcrumbs (overrides auto-generated)
  items: {
    type: Array,
    default: () => []
  },

  // Appearance
  separator: {
    type: String,
    default: '/'
  },
  separatorIcon: {
    type: [String, Object],
    default: null
  },
  compact: {
    type: Boolean,
    default: false
  },
  showIcons: {
    type: Boolean,
    default: true
  },
  showHome: {
    type: Boolean,
    default: true
  },
  maxItems: {
    type: Number,
    default: 0 // 0 means no limit
  },

  // Actions
  actions: {
    type: Array,
    default: () => []
  },

  // Auto-generation settings
  autoGenerate: {
    type: Boolean,
    default: true
  },
  homeRoute: {
    type: Object,
    default: () => ({ name: 'Dashboard', title: 'Ana Sayfa', icon: 'House' })
  }
})

const route = useRoute()
const router = useRouter()

// Computed properties
const breadcrumbClass = computed(() => {
  const classes = ['breadcrumb-nav']

  if (props.compact) {
    classes.push('breadcrumb-compact')
  }

  return classes.join(' ')
})

const breadcrumbs = computed(() => {
  // Use custom items if provided
  if (props.items.length > 0) {
    return processBreadcrumbs(props.items)
  }

  // Auto-generate breadcrumbs from route
  if (props.autoGenerate) {
    return generateBreadcrumbsFromRoute()
  }

  return []
})

// Methods
const generateBreadcrumbsFromRoute = () => {
  const items = []

  // Add home if enabled
  if (props.showHome && route.name !== props.homeRoute.name) {
    items.push({
      title: props.homeRoute.title,
      icon: props.homeRoute.icon,
      to: { name: props.homeRoute.name },
      path: '/'
    })
  }

  // Process matched routes
  const matched = route.matched.filter(record => {
    return record.meta && record.meta.breadcrumb
  })

  matched.forEach((record, index) => {
    const isLast = index === matched.length - 1
    const meta = record.meta

    const breadcrumbItem = {
      title: meta.breadcrumb,
      icon: meta.breadcrumbIcon,
      path: record.path,
      active: isLast
    }

    // Add navigation only if not the current page
    if (!isLast) {
      breadcrumbItem.to = { path: record.path }
    }

    // Add badge from meta
    if (meta.breadcrumbBadge) {
      breadcrumbItem.badge = meta.breadcrumbBadge
    }

    items.push(breadcrumbItem)
  })

  // Handle dynamic route parameters
  if (route.params.id) {
    const dynamicTitle = getDynamicBreadcrumbTitle()
    if (dynamicTitle) {
      const lastItem = items[items.length - 1]
      if (lastItem) {
        lastItem.title = dynamicTitle
      }
    }
  }

  return processBreadcrumbs(items)
}

const processBreadcrumbs = (items) => {
  let processedItems = [...items]

  // Apply max items limit with ellipsis
  if (props.maxItems > 0 && processedItems.length > props.maxItems) {
    const firstItem = processedItems[0]
    const lastItems = processedItems.slice(-(props.maxItems - 2))
    const ellipsisItem = {
      title: '...',
      disabled: true,
      ellipsis: true
    }

    processedItems = [firstItem, ellipsisItem, ...lastItems]
  }

  return processedItems
}

const getDynamicBreadcrumbTitle = () => {
  // Get dynamic title based on route and data
  // This could be enhanced to fetch from stores or APIs
  const routeName = route.name
  const id = route.params.id

  const titleMap = {
    'FlightView': `Uçuş #${id}`,
    'FlightEdit': `Uçuş #${id} Düzenle`,
    'AirlineEdit': `Havayolu #${id} Düzenle`,
    'AirportEdit': `Havalimanı #${id} Düzenle`,
    'AircraftEdit': `Uçak #${id} Düzenle`,
    'RouteEdit': `Rota #${id} Düzenle`,
    'CrewEdit': `Mürettebat #${id} Düzenle`
  }

  return titleMap[routeName] || null
}

const getBreadcrumbItemClass = (item, index) => {
  const classes = ['breadcrumb-item']

  if (item.active) {
    classes.push('breadcrumb-active')
  }

  if (item.disabled) {
    classes.push('breadcrumb-disabled')
  }

  if (item.ellipsis) {
    classes.push('breadcrumb-ellipsis')
  }

  return classes.join(' ')
}
</script>

<style scoped>
.breadcrumb-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  gap: 16px;
  min-height: 44px;
}

.breadcrumb-compact {
  padding: 8px 0;
  min-height: 32px;
}

/* Breadcrumb items */
:deep(.el-breadcrumb) {
  flex: 1;
  font-size: 14px;
}

.breadcrumb-compact :deep(.el-breadcrumb) {
  font-size: 13px;
}

:deep(.el-breadcrumb__item) {
  display: inline-flex;
  align-items: center;
}

:deep(.el-breadcrumb__inner) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  color: var(--el-text-color-regular);
  font-weight: 400;
}

:deep(.el-breadcrumb__inner):hover {
  background-color: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: var(--el-text-color-primary);
  font-weight: 500;
  pointer-events: none;
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner):hover {
  background-color: transparent;
  color: var(--el-text-color-primary);
}

/* Icons */
.breadcrumb-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.breadcrumb-compact .breadcrumb-icon {
  width: 14px;
  height: 14px;
}

/* Text */
.breadcrumb-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.breadcrumb-compact .breadcrumb-text {
  max-width: 150px;
}

/* Badge */
.breadcrumb-badge {
  margin-left: 4px;
}

/* Item states */
.breadcrumb-disabled :deep(.el-breadcrumb__inner) {
  color: var(--el-text-color-disabled);
  cursor: not-allowed;
  pointer-events: none;
}

.breadcrumb-ellipsis :deep(.el-breadcrumb__inner) {
  color: var(--el-text-color-placeholder);
  cursor: default;
  font-weight: bold;
  letter-spacing: 2px;
}

.breadcrumb-ellipsis :deep(.el-breadcrumb__inner):hover {
  background-color: transparent;
  color: var(--el-text-color-placeholder);
}

/* Actions */
.breadcrumb-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* Separator styling */
:deep(.el-breadcrumb__separator) {
  color: var(--el-text-color-placeholder);
  margin: 0 8px;
  font-weight: 400;
}

.breadcrumb-compact :deep(.el-breadcrumb__separator) {
  margin: 0 6px;
  font-size: 12px;
}

/* Custom separator icon */
:deep(.el-breadcrumb__separator.el-icon) {
  font-size: 12px;
}

/* Responsive design */
@media (max-width: 768px) {
  .breadcrumb-nav {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 0;
  }

  .breadcrumb-text {
    max-width: 120px;
  }

  .breadcrumb-actions {
    width: 100%;
    justify-content: flex-end;
  }

  :deep(.el-breadcrumb__separator) {
    margin: 0 4px;
  }
}

@media (max-width: 480px) {
  .breadcrumb-text {
    max-width: 80px;
  }

  .breadcrumb-actions {
    flex-wrap: wrap;
    gap: 4px;
  }

  .breadcrumb-actions .el-button {
    font-size: 12px;
    padding: 4px 8px;
  }
}

/* Animation for dynamic breadcrumbs */
:deep(.el-breadcrumb__item) {
  animation: breadcrumb-enter 0.3s ease;
}

@keyframes breadcrumb-enter {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* High contrast mode */
@media (prefers-contrast: more) {
  :deep(.el-breadcrumb__inner) {
    border: 1px solid transparent;
  }

  :deep(.el-breadcrumb__inner):hover {
    border-color: var(--el-color-primary);
  }

  :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
    border-color: var(--el-text-color-primary);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  :deep(.el-breadcrumb__inner),
  :deep(.el-breadcrumb__item) {
    transition: none;
    animation: none;
  }
}

/* Dark mode adjustments */
.dark :deep(.el-breadcrumb__inner):hover {
  background-color: var(--el-fill-color-dark);
}
</style>

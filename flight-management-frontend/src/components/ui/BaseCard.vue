<template>
  <el-card
    :class="cardClass"
    :shadow="shadow"
    :body-style="computedBodyStyle"
    v-bind="$attrs"
  >
    <!-- Header slot -->
    <template #header v-if="$slots.header || title || actions">
      <div class="card-header">
        <div class="card-header-content">
          <slot name="header">
            <div class="card-title-wrapper">
              <component
                v-if="titleIcon"
                :is="titleIcon"
                class="card-title-icon"
              />
              <h3 v-if="title" class="card-title">{{ title }}</h3>
              <span v-if="subtitle" class="card-subtitle">{{ subtitle }}</span>
            </div>
          </slot>
        </div>

        <!-- Actions -->
        <div v-if="$slots.actions || actions" class="card-actions">
          <slot name="actions">
            <div class="card-actions-buttons">
              <BaseButton
                v-for="action in actions"
                :key="action.key"
                :type="action.type || 'default'"
                :size="action.size || 'small'"
                :icon="action.icon"
                :loading="action.loading"
                :disabled="action.disabled"
                @click="action.handler"
              >
                {{ action.label }}
              </BaseButton>
            </div>
          </slot>
        </div>
      </div>
    </template>

    <!-- Body content -->
    <div :class="bodyClass">
      <slot />
    </div>

    <!-- Footer slot -->
    <template #footer v-if="$slots.footer">
      <div class="card-footer">
        <slot name="footer" />
      </div>
    </template>
  </el-card>
</template>

<script setup>
import { computed, defineProps } from 'vue'
import BaseButton from './BaseButton.vue'

const props = defineProps({
  // Element Plus props
  shadow: {
    type: String,
    default: 'hover',
    validator: (value) => ['always', 'hover', 'never'].includes(value)
  },
  bodyStyle: {
    type: Object,
    default: () => ({})
  },

  // Custom props
  title: {
    type: String,
    default: null
  },
  subtitle: {
    type: String,
    default: null
  },
  titleIcon: {
    type: [String, Object],
    default: null
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'bordered', 'elevated', 'outlined', 'flat'].includes(value)
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['small', 'default', 'large'].includes(value)
  },
  padding: {
    type: String,
    default: 'default',
    validator: (value) => ['none', 'small', 'default', 'large'].includes(value)
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: Boolean,
    default: false
  },
  actions: {
    type: Array,
    default: () => []
  },
  hoverable: {
    type: Boolean,
    default: false
  },
  clickable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

// Computed properties
const cardClass = computed(() => {
  const classes = ['base-card']

  if (props.variant !== 'default') {
    classes.push(`card-${props.variant}`)
  }

  if (props.size !== 'default') {
    classes.push(`card-${props.size}`)
  }

  if (props.loading) {
    classes.push('card-loading')
  }

  if (props.error) {
    classes.push('card-error')
  }

  if (props.hoverable) {
    classes.push('card-hoverable')
  }

  if (props.clickable) {
    classes.push('card-clickable')
  }

  return classes.join(' ')
})

const bodyClass = computed(() => {
  const classes = ['card-body']

  if (props.padding !== 'default') {
    classes.push(`card-body-${props.padding}`)
  }

  return classes.join(' ')
})

const computedBodyStyle = computed(() => {
  const style = { ...props.bodyStyle }

  // Padding based on size
  if (props.padding === 'none') {
    style.padding = '0'
  } else if (props.padding === 'small') {
    style.padding = '12px'
  } else if (props.padding === 'large') {
    style.padding = '32px'
  }

  return style
})

// Methods
const handleClick = (event) => {
  if (props.clickable) {
    emit('click', event)
  }
}
</script>

<style scoped>
.base-card {
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

/* Header styles */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.card-header-content {
  flex: 1;
  min-width: 0;
}

.card-title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.card-title-icon {
  width: 20px;
  height: 20px;
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
  line-height: 1.4;
}

.card-subtitle {
  font-size: 14px;
  color: var(--el-text-color-regular);
  display: block;
  margin-top: 4px;
}

.card-actions {
  flex-shrink: 0;
}

.card-actions-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Body styles */
.card-body {
  position: relative;
}

.card-body-none {
  padding: 0 !important;
}

.card-body-small {
  padding: 12px !important;
}

.card-body-large {
  padding: 32px !important;
}

/* Footer styles */
.card-footer {
  border-top: 1px solid var(--el-border-color-light);
  padding-top: 16px;
  margin-top: 16px;
}

/* Variants */
.card-bordered {
  border: 2px solid var(--el-border-color);
}

.card-elevated {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-outlined {
  border: 1px solid var(--el-color-primary);
}

.card-flat {
  box-shadow: none;
  border: 1px solid var(--el-border-color-light);
}

/* Sizes */
.card-small {
  border-radius: 6px;
}

.card-small .card-title {
  font-size: 16px;
}

.card-large {
  border-radius: 12px;
}

.card-large .card-title {
  font-size: 20px;
}

/* States */
.card-loading {
  position: relative;
  overflow: hidden;
}

.card-loading::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.6),
    transparent
  );
  animation: loading 1.5s infinite;
  z-index: 1;
}

@keyframes loading {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

.card-error {
  border-color: var(--el-color-danger);
  background-color: var(--el-color-danger-light-9);
}

.card-hoverable:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-clickable {
  cursor: pointer;
}

.card-clickable:hover {
  border-color: var(--el-color-primary);
}

.card-clickable:active {
  transform: scale(0.98);
}

/* Responsive design */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .card-actions-buttons {
    justify-content: flex-end;
  }

  .card-title {
    font-size: 16px;
  }

  .card-large .card-title {
    font-size: 18px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .card-elevated {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .card-hoverable:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }
}
</style>

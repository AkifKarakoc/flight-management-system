<template>
  <el-button
    :type="buttonType"
    :size="size"
    :loading="loading"
    :disabled="disabled"
    :icon="iconComponent"
    :circle="circle"
    :round="round"
    :plain="plain"
    :text="text"
    :bg="bg"
    :link="link"
    :color="color"
    :dark="dark"
    :class="buttonClass"
    @click="handleClick"
    v-bind="$attrs"
  >
    <template v-if="$slots.default">
      <slot />
    </template>
    <template v-else-if="label">
      {{ label }}
    </template>
  </el-button>
</template>

<script setup>
import { computed, defineEmits, defineProps } from 'vue'

const props = defineProps({
  // Element Plus props
  type: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'primary', 'success', 'warning', 'danger', 'info'].includes(value)
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['large', 'default', 'small'].includes(value)
  },
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  icon: {
    type: [String, Object],
    default: null
  },
  circle: {
    type: Boolean,
    default: false
  },
  round: {
    type: Boolean,
    default: false
  },
  plain: {
    type: Boolean,
    default: false
  },
  text: {
    type: Boolean,
    default: false
  },
  bg: {
    type: Boolean,
    default: false
  },
  link: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: null
  },
  dark: {
    type: Boolean,
    default: false
  },

  // Custom props
  label: {
    type: String,
    default: null
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'outline', 'ghost', 'gradient'].includes(value)
  },
  block: {
    type: Boolean,
    default: false
  },
  confirm: {
    type: Boolean,
    default: false
  },
  confirmMessage: {
    type: String,
    default: 'Bu işlemi gerçekleştirmek istediğinizden emin misiniz?'
  }
})

const emit = defineEmits(['click', 'confirm'])

// Computed properties
const buttonType = computed(() => {
  if (props.variant === 'outline') {
    return props.type === 'default' ? 'default' : props.type
  }
  return props.type
})

const iconComponent = computed(() => {
  if (typeof props.icon === 'string') {
    // Element Plus icon names
    return props.icon
  }
  return props.icon
})

const buttonClass = computed(() => {
  const classes = []

  if (props.variant === 'outline') {
    classes.push('button-outline')
  } else if (props.variant === 'ghost') {
    classes.push('button-ghost')
  } else if (props.variant === 'gradient') {
    classes.push('button-gradient')
  }

  if (props.block) {
    classes.push('button-block')
  }

  return classes.join(' ')
})

// Methods
const handleClick = async (event) => {
  if (props.disabled || props.loading) {
    return
  }

  if (props.confirm) {
    try {
      await ElMessageBox.confirm(
        props.confirmMessage,
        'Onay',
        {
          type: 'warning',
          confirmButtonText: 'Evet',
          cancelButtonText: 'Hayır'
        }
      )
      emit('confirm', event)
      emit('click', event)
    } catch {
      // User cancelled
    }
  } else {
    emit('click', event)
  }
}
</script>

<style scoped>
.button-outline {
  background: transparent;
  border: 1px solid currentColor;
}

.button-outline:hover {
  background: currentColor;
  color: white;
}

.button-ghost {
  background: transparent;
  border: none;
  color: var(--el-color-primary);
}

.button-ghost:hover {
  background: var(--el-color-primary-light-9);
}

.button-gradient {
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-dark-2));
  border: none;
  color: white;
}

.button-gradient:hover {
  background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
}

.button-block {
  width: 100%;
  display: block;
}

/* Custom button sizes */
.el-button--large {
  padding: 14px 24px;
  font-size: 16px;
}

.el-button--small {
  padding: 6px 12px;
  font-size: 12px;
}

/* Loading state improvements */
.el-button.is-loading {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Focus states */
.el-button:focus {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

/* Responsive design */
@media (max-width: 768px) {
  .el-button {
    padding: 10px 16px;
    font-size: 14px;
  }

  .button-block {
    margin-bottom: 8px;
  }
}
</style>

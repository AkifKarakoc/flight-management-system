import { ElMessage, ElNotification } from 'element-plus'

/**
 * Notification composable for consistent messaging across the application
 */
export function useNotification() {
  /**
   * Show success message
   * @param {string} message - Success message
   * @param {number} duration - Duration in milliseconds (default: 3000)
   */
  const showSuccess = (message, duration = 3000) => {
    ElMessage({
      message,
      type: 'success',
      duration,
      showClose: true
    })
  }

  /**
   * Show error message
   * @param {string} message - Error message
   * @param {number} duration - Duration in milliseconds (default: 5000)
   */
  const showError = (message, duration = 5000) => {
    ElMessage({
      message,
      type: 'error',
      duration,
      showClose: true
    })
  }

  /**
   * Show warning message
   * @param {string} message - Warning message
   * @param {number} duration - Duration in milliseconds (default: 4000)
   */
  const showWarning = (message, duration = 4000) => {
    ElMessage({
      message,
      type: 'warning',
      duration,
      showClose: true
    })
  }

  /**
   * Show info message
   * @param {string} message - Info message
   * @param {number} duration - Duration in milliseconds (default: 3000)
   */
  const showInfo = (message, duration = 3000) => {
    ElMessage({
      message,
      type: 'info',
      duration,
      showClose: true
    })
  }

  /**
   * Show notification (top-right corner)
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, warning, error, info)
   * @param {number} duration - Duration in milliseconds (default: 4500)
   */
  const showNotification = (title, message, type = 'info', duration = 4500) => {
    ElNotification({
      title,
      message,
      type,
      duration,
      showClose: true
    })
  }

  /**
   * Show success notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   */
  const showSuccessNotification = (title, message) => {
    showNotification(title, message, 'success')
  }

  /**
   * Show error notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   */
  const showErrorNotification = (title, message) => {
    showNotification(title, message, 'error')
  }

  /**
   * Show warning notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   */
  const showWarningNotification = (title, message) => {
    showNotification(title, message, 'warning')
  }

  /**
   * Show info notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   */
  const showInfoNotification = (title, message) => {
    showNotification(title, message, 'info')
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNotification,
    showSuccessNotification,
    showErrorNotification,
    showWarningNotification,
    showInfoNotification
  }
}

<template>
  <div class="system-logs-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1>
            <el-icon><Document /></el-icon>
            Sistem Logları
          </h1>
          <p>Sistem eventleri ve hata izleme</p>
        </div>

        <div class="header-actions">
          <el-button-group>
            <el-button :icon="Refresh" @click="refreshLogs" :loading="loading">
              Yenile
            </el-button>
            <el-button :icon="Download" @click="exportLogs">
              Dışa Aktar
            </el-button>
            <el-button :icon="Setting" @click="openLogSettings">
              Ayarlar
            </el-button>
          </el-button-group>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <el-card>
        <el-form :model="filters" :inline="true" size="default">
          <el-form-item label="Servis">
            <el-select v-model="filters.service" placeholder="Servis seçin" style="width: 180px;" @change="applyFilters">
              <el-option label="Tüm Servisler" value="" />
              <el-option label="Reference Manager" value="reference-manager" />
              <el-option label="Flight Service" value="flight-service" />
              <el-option label="Archive Service" value="archive-service" />
            </el-select>
          </el-form-item>

          <el-form-item label="Log Seviyesi">
            <el-select v-model="filters.level" placeholder="Seviye seçin" style="width: 150px;" @change="applyFilters">
              <el-option label="Tümü" value="" />
              <el-option label="ERROR" value="ERROR" />
              <el-option label="WARN" value="WARN" />
              <el-option label="INFO" value="INFO" />
              <el-option label="DEBUG" value="DEBUG" />
            </el-select>
          </el-form-item>

          <el-form-item label="Tarih Aralığı">
            <el-date-picker
              v-model="filters.dateRange"
              type="datetimerange"
              range-separator="→"
              start-placeholder="Başlangıç"
              end-placeholder="Bitiş"
              format="DD.MM.YYYY HH:mm"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 320px;"
              @change="applyFilters"
            />
          </el-form-item>

          <el-form-item label="Arama">
            <el-input
              v-model="filters.search"
              placeholder="Log içeriğinde ara..."
              style="width: 250px;"
              clearable
              @input="debounceSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-button @click="clearFilters">Temizle</el-button>
          </el-form-item>
        </el-form>

        <!-- Quick Filters -->
        <div class="quick-filters">
          <el-tag
            v-for="filter in quickFilters"
            :key="filter.key"
            :type="filter.type"
            :effect="filter.active ? 'dark' : 'plain'"
            @click="toggleQuickFilter(filter)"
            style="cursor: pointer; margin-right: 8px;"
          >
            {{ filter.label }}
          </el-tag>
        </div>
      </el-card>
    </div>

    <!-- Log Statistics -->
    <div class="statistics-section">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="stat-card error">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="24"><CircleClose /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ logStats.error }}</div>
                <div class="stat-label">Hata</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="stat-card warning">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="24"><Warning /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ logStats.warn }}</div>
                <div class="stat-label">Uyarı</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="stat-card info">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="24"><InfoFilled /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ logStats.info }}</div>
                <div class="stat-label">Bilgi</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="stat-card debug">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="24"><Tools /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ logStats.debug }}</div>
                <div class="stat-label">Debug</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- Logs Table -->
    <div class="logs-section">
      <el-card>
        <template #header>
          <div class="table-header">
            <span>Sistem Logları</span>
            <div class="table-actions">
              <el-switch
                v-model="autoRefresh"
                active-text="Otomatik Yenileme"
                @change="toggleAutoRefresh"
              />
              <el-button size="small" @click="clearLogs" type="danger" plain>
                Logları Temizle
              </el-button>
            </div>
          </div>
        </template>

        <el-table
          :data="paginatedLogs"
          v-loading="loading"
          stripe
          style="width: 100%"
          :default-sort="{ prop: 'timestamp', order: 'descending' }"
          @sort-change="handleSortChange"
        >
          <el-table-column prop="timestamp" label="Zaman" width="180" sortable>
            <template #default="scope">
              <span class="timestamp">{{ formatTimestamp(scope.row.timestamp) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="level" label="Seviye" width="100" sortable>
            <template #default="scope">
              <el-tag :type="getLogLevelType(scope.row.level)" size="small">
                {{ scope.row.level }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="service" label="Servis" width="150" sortable>
            <template #default="scope">
              <span class="service-name">{{ scope.row.service }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="logger" label="Logger" width="200" sortable show-overflow-tooltip>
            <template #default="scope">
              <span class="logger-name">{{ scope.row.logger }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="message" label="Mesaj" min-width="300" show-overflow-tooltip>
            <template #default="scope">
              <div class="log-message" :class="scope.row.level.toLowerCase()">
                {{ scope.row.message }}
              </div>
            </template>
          </el-table-column>

          <el-table-column label="İşlemler" width="120" fixed="right">
            <template #default="scope">
              <el-button-group size="small">
                <el-button @click="viewLogDetails(scope.row)" :icon="View" circle />
                <el-button @click="copyLogEntry(scope.row)" :icon="CopyDocument" circle />
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>

        <!-- Pagination -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[20, 50, 100, 200]"
            :total="filteredLogs.length"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- Log Details Dialog -->
    <el-dialog v-model="logDetailsVisible" title="Log Detayları" width="70%">
      <div v-if="selectedLog" class="log-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Zaman">
            {{ formatTimestamp(selectedLog.timestamp) }}
          </el-descriptions-item>
          <el-descriptions-item label="Seviye">
            <el-tag :type="getLogLevelType(selectedLog.level)">
              {{ selectedLog.level }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Servis">
            {{ selectedLog.service }}
          </el-descriptions-item>
          <el-descriptions-item label="Logger">
            {{ selectedLog.logger }}
          </el-descriptions-item>
          <el-descriptions-item label="Thread" v-if="selectedLog.thread">
            {{ selectedLog.thread }}
          </el-descriptions-item>
          <el-descriptions-item label="Request ID" v-if="selectedLog.requestId">
            {{ selectedLog.requestId }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="log-message-detail">
          <h4>Mesaj:</h4>
          <pre class="message-content">{{ selectedLog.message }}</pre>
        </div>

        <div v-if="selectedLog.stackTrace" class="stack-trace">
          <h4>Stack Trace:</h4>
          <pre class="stack-content">{{ selectedLog.stackTrace }}</pre>
        </div>

        <div v-if="selectedLog.context" class="log-context">
          <h4>Bağlam:</h4>
          <pre class="context-content">{{ JSON.stringify(selectedLog.context, null, 2) }}</pre>
        </div>
      </div>
    </el-dialog>

    <!-- Export Dialog -->
    <el-dialog v-model="exportDialogVisible" title="Log Dışa Aktarma" width="500px">
      <el-form :model="exportForm" label-width="120px">
        <el-form-item label="Format">
          <el-radio-group v-model="exportForm.format">
            <el-radio label="csv">CSV</el-radio>
            <el-radio label="json">JSON</el-radio>
            <el-radio label="txt">Text</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="Filtreler">
          <el-switch
            v-model="exportForm.applyFilters"
            active-text="Mevcut filtreleri uygula"
          />
        </el-form-item>
        <el-form-item label="Maksimum Kayıt">
          <el-input-number
            v-model="exportForm.maxRecords"
            :min="100"
            :max="100000"
            :step="100"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exportDialogVisible = false">İptal</el-button>
        <el-button type="primary" @click="confirmExport" :loading="exporting">
          Dışa Aktar
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  Refresh,
  Download,
  Setting,
  Search,
  CircleClose,
  Warning,
  InfoFilled,
  Tools,
  View,
  CopyDocument
} from '@element-plus/icons-vue'

// Reactive data
const loading = ref(false)
const exporting = ref(false)
const autoRefresh = ref(false)
const logDetailsVisible = ref(false)
const exportDialogVisible = ref(false)
const selectedLog = ref(null)
const refreshInterval = ref<number | null>(null)

// Filters
const filters = reactive({
  service: '',
  level: '',
  dateRange: [
    new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
    new Date()
  ],
  search: ''
})

// Quick filters
const quickFilters = reactive([
  { key: 'errors', label: 'Sadece Hatalar', type: 'danger', active: false, filter: { level: 'ERROR' } },
  { key: 'warnings', label: 'Uyarılar', type: 'warning', active: false, filter: { level: 'WARN' } },
  { key: 'last1h', label: 'Son 1 Saat', type: 'info', active: false, filter: { timeRange: '1h' } },
  { key: 'flight-service', label: 'Flight Service', type: '', active: false, filter: { service: 'flight-service' } }
])

// Pagination
const pagination = reactive({
  currentPage: 1,
  pageSize: 50
})

// Log statistics
const logStats = reactive({
  error: 23,
  warn: 156,
  info: 1247,
  debug: 892
})

// Sample log data (will be replaced with backend data)
const logs = reactive([
  {
    id: 1,
    timestamp: new Date(Date.now() - 300000),
    level: 'ERROR',
    service: 'flight-service',
    logger: 'com.flightmanagement.flight.FlightController',
    message: 'Failed to create flight: Invalid aircraft ID TC-XXX',
    thread: 'http-nio-8081-exec-3',
    requestId: 'req-12345',
    stackTrace: 'java.lang.IllegalArgumentException: Invalid aircraft ID\n\tat com.flightmanagement...',
    context: { userId: 'admin', operation: 'CREATE_FLIGHT' }
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 600000),
    level: 'WARN',
    service: 'reference-manager',
    logger: 'com.flightmanagement.reference.AirlineService',
    message: 'Airline cache miss for ID: 999',
    thread: 'http-nio-8080-exec-1',
    requestId: 'req-12344'
  },
  {
    id: 3,
    timestamp: new Date(Date.now() - 900000),
    level: 'INFO',
    service: 'archive-service',
    logger: 'com.flightmanagement.archive.ArchiveConsumer',
    message: 'Successfully archived flight event: FLIGHT_CREATED',
    thread: 'kafka-consumer-1',
    context: { flightId: 'FL001', eventType: 'FLIGHT_CREATED' }
  }
])

// Export form
const exportForm = reactive({
  format: 'csv',
  applyFilters: true,
  maxRecords: 10000
})

// Computed properties
const filteredLogs = computed(() => {
  let filtered = [...logs]

  // Apply service filter
  if (filters.service) {
    filtered = filtered.filter(log => log.service === filters.service)
  }

  // Apply level filter
  if (filters.level) {
    filtered = filtered.filter(log => log.level === filters.level)
  }

  // Apply date range filter
  if (filters.dateRange && filters.dateRange.length === 2) {
    const [start, end] = filters.dateRange
    filtered = filtered.filter(log => {
      const logTime = new Date(log.timestamp)
      return logTime >= new Date(start) && logTime <= new Date(end)
    })
  }

  // Apply search filter
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase()
    filtered = filtered.filter(log =>
      log.message.toLowerCase().includes(searchTerm) ||
      log.logger.toLowerCase().includes(searchTerm)
    )
  }

  return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
})

const paginatedLogs = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredLogs.value.slice(start, end)
})

// Methods
const formatTimestamp = (timestamp: Date): string => {
  return new Date(timestamp).toLocaleString('tr-TR')
}

const getLogLevelType = (level: string): string => {
  switch (level) {
    case 'ERROR':
      return 'danger'
    case 'WARN':
      return 'warning'
    case 'INFO':
      return 'success'
    case 'DEBUG':
      return 'info'
    default:
      return ''
  }
}

const refreshLogs = async () => {
  loading.value = true
  try {
    // Call backend to get fresh logs
    // const newLogs = await logsService.getLogs(filters)
    console.log('Refreshing logs...')
    ElMessage.success('Loglar güncellendi')
  } catch (error) {
    console.error('Error refreshing logs:', error)
    ElMessage.error('Loglar güncellenirken hata oluştu')
  } finally {
    loading.value = false
  }
}

const toggleAutoRefresh = (enabled: boolean) => {
  if (enabled) {
    refreshInterval.value = window.setInterval(refreshLogs, 10000) // 10 seconds
    ElMessage.success('Otomatik yenileme aktif')
  } else {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
      refreshInterval.value = null
    }
    ElMessage.info('Otomatik yenileme durduruldu')
  }
}

const applyFilters = () => {
  pagination.currentPage = 1
  // Backend call would be made here
  console.log('Applying filters:', filters)
}

const clearFilters = () => {
  filters.service = ''
  filters.level = ''
  filters.search = ''
  filters.dateRange = [
    new Date(Date.now() - 24 * 60 * 60 * 1000),
    new Date()
  ]
  quickFilters.forEach(filter => filter.active = false)
  applyFilters()
  ElMessage.success('Filtreler temizlendi')
}

const toggleQuickFilter = (filter: any) => {
  filter.active = !filter.active

  if (filter.active) {
    // Apply quick filter
    if (filter.filter.level) {
      filters.level = filter.filter.level
    }
    if (filter.filter.service) {
      filters.service = filter.filter.service
    }
    if (filter.filter.timeRange === '1h') {
      filters.dateRange = [
        new Date(Date.now() - 60 * 60 * 1000),
        new Date()
      ]
    }
  } else {
    // Remove quick filter
    if (filter.filter.level) {
      filters.level = ''
    }
    if (filter.filter.service) {
      filters.service = ''
    }
  }

  applyFilters()
}

const debounceSearch = (() => {
  let timeout: number
  return () => {
    clearTimeout(timeout)
    timeout = window.setTimeout(applyFilters, 500)
  }
})()

const viewLogDetails = (log: any) => {
  selectedLog.value = log
  logDetailsVisible.value = true
}

const copyLogEntry = async (log: any) => {
  try {
    const logText = `[${formatTimestamp(log.timestamp)}] ${log.level} ${log.service} - ${log.message}`
    await navigator.clipboard.writeText(logText)
    ElMessage.success('Log panoya kopyalandı')
  } catch {
    ElMessage.error('Panoya kopyalama başarısız')
  }
}

const clearLogs = async () => {
  try {
    await ElMessageBox.confirm(
      'Tüm logları temizlemek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      'Logları Temizle',
      {
        type: 'warning',
        confirmButtonText: 'Evet, Temizle',
        cancelButtonText: 'İptal'
      }
    )

    // Call backend to clear logs
    // await logsService.clearLogs()
    logs.splice(0)
    ElMessage.success('Loglar temizlendi')

  } catch {
    // User cancelled
  }
}

const exportLogs = () => {
  exportDialogVisible.value = true
}

const confirmExport = async () => {
  exporting.value = true
  try {
    // Call backend export service
    // await logsService.exportLogs(exportForm)
    console.log('Exporting logs with params:', exportForm)

    // Simulate export
    await new Promise(resolve => setTimeout(resolve, 2000))

    ElMessage.success('Loglar başarıyla dışa aktarıldı')
    exportDialogVisible.value = false

  } catch (error) {
    console.error('Error exporting logs:', error)
    ElMessage.error('Log dışa aktarımında hata oluştu')
  } finally {
    exporting.value = false
  }
}

const openLogSettings = () => {
  ElMessage.info('Log ayarları sayfasına yönlendirilecek')
}

const handleSortChange = (sort: any) => {
  console.log('Sort changed:', sort)
  // Apply sorting
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.currentPage = 1
}

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page
}

const loadLogs = async () => {
  loading.value = true
  try {
    // Load logs from backend
    // const logsData = await logsService.getLogs()
    console.log('Loading logs...')
  } catch (error) {
    console.error('Error loading logs:', error)
    ElMessage.error('Loglar yüklenirken hata oluştu')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadLogs()
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})
</script>

<style scoped lang="scss">
.system-logs-page {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 60px);
}

.page-header {
  background: white;
  padding: 24px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title-section {
    h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    p {
      margin: 0;
      color: #666;
    }
  }
}

.filters-section {
  margin-bottom: 20px;

  .quick-filters {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #eee;
  }
}

.statistics-section {
  margin-bottom: 20px;

  .stat-card {
    &.error {
      border-left: 4px solid #F56C6C;
    }

    &.warning {
      border-left: 4px solid #E6A23C;
    }

    &.info {
      border-left: 4px solid #409EFF;
    }

    &.debug {
      border-left: 4px solid #909399;
    }
  }

  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;

    .stat-card.error & {
      background-color: rgba(245, 108, 108, 0.1);
      color: #F56C6C;
    }

    .stat-card.warning & {
      background-color: rgba(230, 162, 60, 0.1);
      color: #E6A23C;
    }

    .stat-card.info & {
      background-color: rgba(64, 158, 255, 0.1);
      color: #409EFF;
    }

    .stat-card.debug & {
      background-color: rgba(144, 147, 153, 0.1);
      color: #909399;
    }
  }

  .stat-info {
    .stat-number {
      font-size: 24px;
      font-weight: bold;
      color: #303133;
    }

    .stat-label {
      font-size: 14px;
      color: #606266;
    }
  }
}

.logs-section {
  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .table-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }
  }

  .timestamp {
    font-family: monospace;
    font-size: 12px;
  }

  .service-name {
    font-weight: 500;
  }

  .logger-name {
    font-family: monospace;
    font-size: 12px;
    color: #606266;
  }

  .log-message {
    font-family: monospace;
    font-size: 13px;

    &.error {
      color: #F56C6C;
    }

    &.warn {
      color: #E6A23C;
    }

    &.info {
      color: #303133;
    }

    &.debug {
      color: #909399;
    }
  }
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.log-details {
  .log-message-detail,
  .stack-trace,
  .log-context {
    margin-top: 16px;

    h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #606266;
    }

    pre {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      font-size: 12px;
      line-height: 1.5;
      overflow-x: auto;
      white-space: pre-wrap;
    }
  }

  .message-content {
    color: #303133;
  }

  .stack-content {
    color: #F56C6C;
  }

  .context-content {
    color: #606266;
  }
}

:deep(.el-card__body) {
  padding: 16px;
}

:deep(.el-tag) {
  font-family: monospace;
  font-weight: bold;
}

:deep(.el-table .cell) {
  word-break: break-word;
}
</style>

<template>
  <div class="flight-reports-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1>
            <el-icon><Document /></el-icon>
            Uçuş Raporları
          </h1>
          <p>Kapsamlı uçuş analizi ve raporlama sistemi</p>
        </div>

        <div class="header-actions">
          <el-button-group>
            <el-button :icon="Download" @click="exportReport" type="primary">
              Rapor İndir
            </el-button>
            <el-button :icon="Printer" @click="printReport">
              Yazdır
            </el-button>
            <el-button :icon="Share" @click="shareReport">
              Paylaş
            </el-button>
          </el-button-group>
        </div>
      </div>
    </div>

    <!-- Report Filters -->
    <div class="filters-section">
      <el-card>
        <template #header>
          <span>Rapor Filtreleri</span>
        </template>

        <el-form :model="filters" label-width="120px">
          <el-row :gutter="24">
            <el-col :span="8">
              <el-form-item label="Tarih Aralığı:">
                <el-date-picker
                  v-model="filters.dateRange"
                  type="daterange"
                  start-placeholder="Başlangıç"
                  end-placeholder="Bitiş"
                  format="DD/MM/YYYY"
                  value-format="YYYY-MM-DD"
                  @change="updateReport"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="Havayolu:">
                <el-select v-model="filters.airline" placeholder="Havayolu seçin" multiple clearable @change="updateReport">
                  <el-option label="Turkish Airlines" value="TK" />
                  <el-option label="Pegasus" value="PC" />
                  <el-option label="SunExpress" value="XQ" />
                  <el-option label="AtlasGlobal" value="KK" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="Durum:">
                <el-select v-model="filters.status" placeholder="Durum seçin" multiple clearable @change="updateReport">
                  <el-option label="Tamamlandı" value="COMPLETED" />
                  <el-option label="İptal Edildi" value="CANCELLED" />
                  <el-option label="Geciken" value="DELAYED" />
                  <el-option label="Zamanında" value="ON_TIME" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="24">
            <el-col :span="8">
              <el-form-item label="Kalkış Havaalanı:">
                <el-select v-model="filters.origin" placeholder="Kalkış havaalanı" clearable @change="updateReport">
                  <el-option label="İstanbul (IST)" value="IST" />
                  <el-option label="Ankara (ESB)" value="ESB" />
                  <el-option label="İzmir (ADB)" value="ADB" />
                  <el-option label="Antalya (AYT)" value="AYT" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="Rapor Tipi:">
                <el-select v-model="filters.reportType" placeholder="Rapor tipi" @change="updateReport">
                  <el-option label="Özet Rapor" value="summary" />
                  <el-option label="Detaylı Rapor" value="detailed" />
                  <el-option label="Performans Raporu" value="performance" />
                  <el-option label="Mali Rapor" value="financial" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-card>
    </div>

    <!-- Report Summary Cards -->
    <div class="summary-cards">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="summary-card total">
            <div class="card-content">
              <div class="card-icon">
                <el-icon size="32"><TrendCharts /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">{{ reportData.totalFlights }}</div>
                <div class="card-label">Toplam Uçuş</div>
                <div class="card-change positive">
                  <el-icon><ArrowUp /></el-icon>
                  +{{ reportData.flightGrowth }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="summary-card passengers">
            <div class="card-content">
              <div class="card-icon">
                <el-icon size="32"><User /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">{{ formatNumber(reportData.totalPassengers) }}</div>
                <div class="card-label">Toplam Yolcu</div>
                <div class="card-change positive">
                  <el-icon><ArrowUp /></el-icon>
                  +{{ reportData.passengerGrowth }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="summary-card revenue">
            <div class="card-content">
              <div class="card-icon">
                <el-icon size="32"><Money /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">₺{{ formatNumber(reportData.totalRevenue) }}</div>
                <div class="card-label">Toplam Gelir</div>
                <div class="card-change positive">
                  <el-icon><ArrowUp /></el-icon>
                  +{{ reportData.revenueGrowth }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="summary-card efficiency">
            <div class="card-content">
              <div class="card-icon">
                <el-icon size="32"><SuccessFilled /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">{{ reportData.onTimePercentage }}%</div>
                <div class="card-label">Zamanında Kalkış</div>
                <div class="card-change" :class="reportData.efficiencyChange >= 0 ? 'positive' : 'negative'">
                  <el-icon><component :is="reportData.efficiencyChange >= 0 ? ArrowUp : ArrowDown" /></el-icon>
                  {{ Math.abs(reportData.efficiencyChange) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- Charts Section -->
    <div class="charts-section">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>Günlük Uçuş Sayıları</span>
            </template>
            <div ref="dailyFlightsChart" class="chart-container"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>Havayolu Dağılımı</span>
            </template>
            <div ref="airlineDistributionChart" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" style="margin-top: 16px;">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>Gecikme Analizi</span>
            </template>
            <div ref="delayAnalysisChart" class="chart-container"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>Popüler Rotalar</span>
            </template>
            <div ref="routesChart" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- Detailed Data Table -->
    <div class="data-table-section">
      <el-card>
        <template #header>
          <div class="table-header">
            <span>Detaylı Uçuş Verileri</span>
            <div class="table-actions">
              <el-input
                v-model="tableSearch"
                placeholder="Arama..."
                :prefix-icon="Search"
                style="width: 200px;"
                clearable
              />
            </div>
          </div>
        </template>

        <el-table
          :data="filteredTableData"
          :loading="loading"
          height="400"
          stripe
          @sort-change="handleSort"
        >
          <el-table-column prop="flightNumber" label="Uçuş No" width="120" sortable />
          <el-table-column prop="airline" label="Havayolu" width="100" sortable />
          <el-table-column prop="route" label="Rota" width="150" sortable />
          <el-table-column prop="date" label="Tarih" width="120" sortable />
          <el-table-column prop="passengers" label="Yolcu" width="80" sortable />
          <el-table-column prop="revenue" label="Gelir (₺)" width="120" sortable>
            <template #default="{ row }">
              ₺{{ formatNumber(row.revenue) }}
            </template>
          </el-table-column>
          <el-table-column prop="delay" label="Gecikme (dk)" width="100" sortable>
            <template #default="{ row }">
              <el-tag v-if="row.delay > 0" type="warning" size="small">
                +{{ row.delay }}
              </el-tag>
              <el-tag v-else type="success" size="small">
                Zamanında
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="Durum" width="120" sortable>
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="loadFactor" label="Doluluk %" width="100" sortable>
            <template #default="{ row }">
              <el-progress
                :percentage="row.loadFactor"
                :color="getLoadFactorColor(row.loadFactor)"
                :stroke-width="8"
                text-inside
              />
            </template>
          </el-table-column>
        </el-table>

        <!-- Pagination -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="totalRecords"
            :page-sizes="[20, 50, 100, 200]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

// Import icons
import {
  Document, Download, Printer, Share, TrendCharts, User, Money,
  SuccessFilled, ArrowUp, ArrowDown, Search
} from '@element-plus/icons-vue'

// Types
interface ReportFilters {
  dateRange: [string, string] | null
  airline: string[]
  status: string[]
  origin: string
  destination: string
  reportType: string
}

interface FlightData {
  flightNumber: string
  airline: string
  route: string
  date: string
  passengers: number
  revenue: number
  delay: number
  status: string
  loadFactor: number
}

// State
const loading = ref(false)
const tableSearch = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const totalRecords = ref(0)

const filters = ref<ReportFilters>({
  dateRange: [
    dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD')
  ],
  airline: [],
  status: [],
  origin: '',
  destination: '',
  reportType: 'summary'
})

// Mock report data
const reportData = ref({
  totalFlights: 1247,
  flightGrowth: 12.5,
  totalPassengers: 187350,
  passengerGrowth: 8.2,
  totalRevenue: 45670000,
  revenueGrowth: 15.3,
  onTimePercentage: 87.5,
  efficiencyChange: 2.1
})

// Mock table data
const tableData = ref<FlightData[]>([
  {
    flightNumber: 'TK101',
    airline: 'Turkish Airlines',
    route: 'IST-ESB',
    date: '2025-01-20',
    passengers: 150,
    revenue: 45000,
    delay: 5,
    status: 'COMPLETED',
    loadFactor: 85
  },
  {
    flightNumber: 'PC102',
    airline: 'Pegasus',
    route: 'ADB-IST',
    date: '2025-01-20',
    passengers: 180,
    revenue: 32400,
    delay: 0,
    status: 'COMPLETED',
    loadFactor: 92
  },
  {
    flightNumber: 'XQ205',
    airline: 'SunExpress',
    route: 'IST-AYT',
    date: '2025-01-20',
    passengers: 120,
    revenue: 28800,
    delay: 15,
    status: 'DELAYED',
    loadFactor: 75
  }
])

// Computed
const filteredTableData = computed(() => {
  let data = tableData.value

  if (tableSearch.value) {
    data = data.filter(item =>
      item.flightNumber.toLowerCase().includes(tableSearch.value.toLowerCase()) ||
      item.airline.toLowerCase().includes(tableSearch.value.toLowerCase()) ||
      item.route.toLowerCase().includes(tableSearch.value.toLowerCase())
    )
  }

  return data
})

// Methods
function formatNumber(num: number): string {
  return new Intl.NumberFormat('tr-TR').format(num)
}

function getStatusType(status: string): string {
  const types = {
    'COMPLETED': 'success',
    'CANCELLED': 'danger',
    'DELAYED': 'warning',
    'ON_TIME': 'success'
  }
  return types[status] || 'info'
}

function getStatusText(status: string): string {
  const texts = {
    'COMPLETED': 'Tamamlandı',
    'CANCELLED': 'İptal Edildi',
    'DELAYED': 'Geciken',
    'ON_TIME': 'Zamanında'
  }
  return texts[status] || status
}

function getLoadFactorColor(factor: number): string {
  if (factor >= 90) return '#67C23A'
  if (factor >= 70) return '#E6A23C'
  return '#F56C6C'
}

function handleSort(sortData: any) {
  console.log('Sort:', sortData)
  // Implement sorting logic
}

function handleSizeChange(size: number) {
  pageSize.value = size
  updateReport()
}

function handleCurrentChange(page: number) {
  currentPage.value = page
  updateReport()
}

async function updateReport() {
  loading.value = true
  try {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Update charts
    await nextTick()
    initCharts()

    ElMessage.success('Rapor güncellendi')
  } catch (error) {
    ElMessage.error('Rapor güncellenirken hata oluştu')
  } finally {
    loading.value = false
  }
}

function exportReport() {
  ElMessage.success('Rapor Excel formatında indiriliyor...')
}

function printReport() {
  window.print()
}

function shareReport() {
  ElMessage.info('Rapor paylaşım özelliği henüz hazır değil')
}

// Chart initialization (using Chart.js or similar)
function initCharts() {
  // Daily flights chart
  initDailyFlightsChart()
  // Airline distribution chart
  initAirlineDistributionChart()
  // Delay analysis chart
  initDelayAnalysisChart()
  // Routes chart
  initRoutesChart()
}

function initDailyFlightsChart() {
  // Mock chart implementation
  const chartElement = document.querySelector('.chart-container')
  if (chartElement) {
    chartElement.innerHTML = '<div style="height: 300px; display: flex; align-items: center; justify-content: center; color: #909399;">Günlük Uçuş Grafiği</div>'
  }
}

function initAirlineDistributionChart() {
  // Mock chart implementation
}

function initDelayAnalysisChart() {
  // Mock chart implementation
}

function initRoutesChart() {
  // Mock chart implementation
}

// Lifecycle
onMounted(() => {
  updateReport()
  totalRecords.value = tableData.value.length
})
</script>

<style scoped lang="scss">
.flight-reports-page {
  .page-header {
    margin-bottom: 1.5rem;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      .title-section {
        h1 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 0 0.5rem 0;
          color: #303133;
          font-size: 1.8rem;
        }

        p {
          margin: 0;
          color: #606266;
          font-size: 1rem;
        }
      }
    }
  }

  .filters-section {
    margin-bottom: 1.5rem;
  }

  .summary-cards {
    margin-bottom: 1.5rem;

    .summary-card {
      border: none;
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      &.total {
        border-left: 4px solid #409EFF;
      }

      &.passengers {
        border-left: 4px solid #67C23A;
      }

      &.revenue {
        border-left: 4px solid #E6A23C;
      }

      &.efficiency {
        border-left: 4px solid #F56C6C;
      }

      .card-content {
        display: flex;
        align-items: center;
        gap: 1rem;

        .card-icon {
          padding: 1rem;
          border-radius: 12px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          color: #409EFF;
        }

        .card-info {
          flex: 1;

          .card-value {
            font-size: 1.8rem;
            font-weight: bold;
            color: #303133;
            margin-bottom: 0.25rem;
          }

          .card-label {
            font-size: 0.9rem;
            color: #606266;
            margin-bottom: 0.5rem;
          }

          .card-change {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.8rem;
            font-weight: 500;

            &.positive {
              color: #67C23A;
            }

            &.negative {
              color: #F56C6C;
            }
          }
        }
      }
    }
  }

  .charts-section {
    margin-bottom: 1.5rem;

    .chart-container {
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f5f7fa;
      border-radius: 8px;
      color: #909399;
    }
  }

  .data-table-section {
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .pagination-wrapper {
      margin-top: 1rem;
      display: flex;
      justify-content: center;
    }
  }
}

@media (max-width: 768px) {
  .flight-reports-page {
    .page-header .header-content {
      flex-direction: column;
      gap: 1rem;
    }

    .summary-cards {
      :deep(.el-col) {
        margin-bottom: 1rem;
      }
    }

    .charts-section {
      :deep(.el-col) {
        margin-bottom: 1rem;
      }
    }
  }
}

@media print {
  .page-header .header-actions,
  .filters-section,
  .pagination-wrapper {
    display: none !important;
  }
}
</style>

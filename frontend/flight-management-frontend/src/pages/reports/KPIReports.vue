<template>
  <div class="kpi-reports-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1>
            <el-icon><TrendCharts /></el-icon>
            KPI Dashboard
          </h1>
          <p>Anahtar performans göstergeleri ve trend analizi</p>
        </div>

        <div class="header-actions">
          <el-select v-model="selectedPeriod" @change="updateKPIs" style="width: 150px; margin-right: 10px;">
            <el-option label="Son 7 Gün" value="7d" />
            <el-option label="Son 30 Gün" value="30d" />
            <el-option label="Son 3 Ay" value="3m" />
            <el-option label="Son 1 Yıl" value="1y" />
          </el-select>
          <el-button-group>
            <el-button :icon="Refresh" @click="refreshKPIs" :loading="loading">
              Yenile
            </el-button>
            <el-button :icon="Download" @click="exportKPIs">
              Dışa Aktar
            </el-button>
          </el-button-group>
        </div>
      </div>
    </div>

    <!-- KPI Overview Cards -->
    <div class="kpi-overview">
      <el-row :gutter="16">
        <el-col :span="6" v-for="kpi in mainKPIs" :key="kpi.id">
          <el-card class="kpi-card" :class="kpi.status">
            <div class="kpi-content">
              <div class="kpi-header">
                <div class="kpi-icon" :style="{ backgroundColor: kpi.color + '20', color: kpi.color }">
                  <el-icon size="24">
                    <component :is="kpi.icon" />
                  </el-icon>
                </div>
                <div class="kpi-trend" :class="kpi.trend">
                  <el-icon size="16">
                    <component :is="kpi.trend === 'up' ? ArrowUp : kpi.trend === 'down' ? ArrowDown : Minus" />
                  </el-icon>
                  <span>{{ Math.abs(kpi.change) }}%</span>
                </div>
              </div>

              <div class="kpi-main">
                <div class="kpi-value">{{ formatKPIValue(kpi.value, kpi.type) }}</div>
                <div class="kpi-label">{{ kpi.label }}</div>
              </div>

              <div class="kpi-footer">
                <div class="kpi-target">
                  Hedef: {{ formatKPIValue(kpi.target, kpi.type) }}
                </div>
                <div class="kpi-progress">
                  <el-progress
                    :percentage="calculateProgress(kpi.value, kpi.target)"
                    :color="getProgressColor(calculateProgress(kpi.value, kpi.target))"
                    :stroke-width="4"
                    :show-text="false"
                  />
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- KPI Categories -->
    <div class="kpi-categories">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- Operational KPIs -->
        <el-tab-pane label="Operasyonel" name="operational">
          <div class="category-content">
            <el-row :gutter="16">
              <el-col :span="8">
                <el-card>
                  <template #header>
                    <span>Zamanında Kalkış Oranı</span>
                  </template>
                  <div class="metric-container">
                    <div class="metric-chart">
                      <div ref="onTimeChart" class="chart-placeholder">
                        <div class="chart-circle">
                          <el-progress
                            type="circle"
                            :percentage="87.5"
                            :width="120"
                            :stroke-width="8"
                            color="#67C23A"
                          >
                            <template #default>
                              <span class="chart-label">87.5%</span>
                            </template>
                          </el-progress>
                        </div>
                      </div>
                    </div>
                    <div class="metric-stats">
                      <div class="stat-item">
                        <span class="stat-label">Mevcut</span>
                        <span class="stat-value good">87.5%</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">Hedef</span>
                        <span class="stat-value">≥ 85%</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">Önceki Dönem</span>
                        <span class="stat-value">84.2%</span>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="8">
                <el-card>
                  <template #header>
                    <span>Ortalama Gecikme Süresi</span>
                  </template>
                  <div class="metric-container">
                    <div class="metric-chart">
                      <div class="chart-placeholder">
                        <div class="chart-number">
                          <span class="big-number">12.3</span>
                          <span class="unit">dakika</span>
                        </div>
                      </div>
                    </div>
                    <div class="metric-stats">
                      <div class="stat-item">
                        <span class="stat-label">Mevcut</span>
                        <span class="stat-value warning">12.3 dk</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">Hedef</span>
                        <span class="stat-value">≤ 15 dk</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">Önceki Dönem</span>
                        <span class="stat-value">15.8 dk</span>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="8">
                <el-card>
                  <template #header>
                    <span>İptal Oranı</span>
                  </template>
                  <div class="metric-container">
                    <div class="metric-chart">
                      <div class="chart-placeholder">
                        <div class="chart-circle">
                          <el-progress
                            type="circle"
                            :percentage="2.1"
                            :width="120"
                            :stroke-width="8"
                            color="#F56C6C"
                          >
                            <template #default>
                              <span class="chart-label">2.1%</span>
                            </template>
                          </el-progress>
                        </div>
                      </div>
                    </div>
                    <div class="metric-stats">
                      <div class="stat-item">
                        <span class="stat-label">Mevcut</span>
                        <span class="stat-value good">2.1%</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">Hedef</span>
                        <span class="stat-value">< 3%</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">Önceki Dönem</span>
                        <span class="stat-value">2.8%</span>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <!-- Detailed Operational Metrics -->
            <el-row :gutter="16" style="margin-top: 16px;">
              <el-col :span="12">
                <el-card>
                  <template #header>
                    <span>Günlük Operasyonel Trend</span>
                  </template>
                  <div class="large-chart-placeholder">
                    <el-table :data="operationalTrendData" style="width: 100%" size="small">
                      <el-table-column prop="date" label="Tarih" width="100" />
                      <el-table-column prop="flights" label="Uçuş" width="80" />
                      <el-table-column prop="onTime" label="Zamanında %" width="100" />
                      <el-table-column prop="delayed" label="Geciken" width="80" />
                      <el-table-column prop="cancelled" label="İptal" width="80" />
                    </el-table>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="12">
                <el-card>
                  <template #header>
                    <span>Performans Karşılaştırması</span>
                  </template>
                  <div class="large-chart-placeholder">
                    <div class="comparison-metrics">
                      <div class="metric-row">
                        <span class="metric-name">Bu Ay vs Geçen Ay</span>
                        <el-tag type="success">+3.2% İyileşme</el-tag>
                      </div>
                      <div class="metric-row">
                        <span class="metric-name">Bu Yıl vs Geçen Yıl</span>
                        <el-tag type="success">+7.8% İyileşme</el-tag>
                      </div>
                      <div class="metric-row">
                        <span class="metric-name">Sektör Ortalaması</span>
                        <el-tag type="warning">+2.1% Üstünde</el-tag>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <!-- Financial KPIs -->
        <el-tab-pane label="Mali" name="financial">
          <div class="category-content">
            <el-row :gutter="16">
              <el-col :span="8">
                <el-card class="financial-metric">
                  <div class="financial-content">
                    <div class="financial-icon">
                      <el-icon size="32" color="#409EFF"><Money /></el-icon>
                    </div>
                    <div class="financial-data">
                      <div class="financial-value">₺2.8M</div>
                      <div class="financial-label">Aylık Gelir</div>
                      <div class="financial-change up">+12.5%</div>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="8">
                <el-card class="financial-metric">
                  <div class="financial-content">
                    <div class="financial-icon">
                      <el-icon size="32" color="#67C23A"><TrendCharts /></el-icon>
                    </div>
                    <div class="financial-data">
                      <div class="financial-value">₺1.9M</div>
                      <div class="financial-label">Operasyonel Maliyet</div>
                      <div class="financial-change down">-3.2%</div>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="8">
                <el-card class="financial-metric">
                  <div class="financial-content">
                    <div class="financial-icon">
                      <el-icon size="32" color="#E6A23C"><PieChart /></el-icon>
                    </div>
                    <div class="financial-data">
                      <div class="financial-value">32.1%</div>
                      <div class="financial-label">Kar Marjı</div>
                      <div class="financial-change up">+5.8%</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="16" style="margin-top: 16px;">
              <el-col :span="12">
                <el-card>
                  <template #header>
                    <span>Gelir Trendi (Son 12 Ay)</span>
                  </template>
                  <div class="large-chart-placeholder">
                    <el-table :data="revenueData" style="width: 100%" size="small">
                      <el-table-column prop="month" label="Ay" width="120" />
                      <el-table-column prop="revenue" label="Gelir (₺)" width="150" />
                      <el-table-column prop="growth" label="Büyüme %" width="100" />
                    </el-table>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="12">
                <el-card>
                  <template #header>
                    <span>Maliyet Dağılımı</span>
                  </template>
                  <div class="large-chart-placeholder">
                    <div class="cost-breakdown">
                      <div class="cost-item">
                        <span class="cost-label">Yakıt</span>
                        <div class="cost-bar">
                          <div class="cost-progress" style="width: 45%; background-color: #409EFF;"></div>
                        </div>
                        <span class="cost-value">45%</span>
                      </div>
                      <div class="cost-item">
                        <span class="cost-label">Personel</span>
                        <div class="cost-bar">
                          <div class="cost-progress" style="width: 28%; background-color: #67C23A;"></div>
                        </div>
                        <span class="cost-value">28%</span>
                      </div>
                      <div class="cost-item">
                        <span class="cost-label">Bakım</span>
                        <div class="cost-bar">
                          <div class="cost-progress" style="width: 15%; background-color: #E6A23C;"></div>
                        </div>
                        <span class="cost-value">15%</span>
                      </div>
                      <div class="cost-item">
                        <span class="cost-label">Diğer</span>
                        <div class="cost-bar">
                          <div class="cost-progress" style="width: 12%; background-color: #F56C6C;"></div>
                        </div>
                        <span class="cost-value">12%</span>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <!-- Customer KPIs -->
        <el-tab-pane label="Müşteri" name="customer">
          <div class="category-content">
            <el-row :gutter="16">
              <el-col :span="6">
                <el-card class="customer-metric">
                  <div class="metric-header">
                    <el-icon size="24" color="#409EFF"><User /></el-icon>
                    <span>Yolcu Memnuniyeti</span>
                  </div>
                  <div class="metric-value large">8.7/10</div>
                  <div class="metric-trend up">+0.3</div>
                </el-card>
              </el-col>

              <el-col :span="6">
                <el-card class="customer-metric">
                  <div class="metric-header">
                    <el-icon size="24" color="#67C23A"><Star /></el-icon>
                    <span>NPS Skoru</span>
                  </div>
                  <div class="metric-value large">72</div>
                  <div class="metric-trend up">+5</div>
                </el-card>
              </el-col>

              <el-col :span="6">
                <el-card class="customer-metric">
                  <div class="metric-header">
                    <el-icon size="24" color="#E6A23C"><Phone /></el-icon>
                    <span>Şikayet Oranı</span>
                  </div>
                  <div class="metric-value large">2.1%</div>
                  <div class="metric-trend down">-0.4%</div>
                </el-card>
              </el-col>

              <el-col :span="6">
                <el-card class="customer-metric">
                  <div class="metric-header">
                    <el-icon size="24" color="#F56C6C"><MessageBox /></el-icon>
                    <span>Tekrar Rezervasyon</span>
                  </div>
                  <div class="metric-value large">68%</div>
                  <div class="metric-trend up">+2%</div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="16" style="margin-top: 16px;">
              <el-col :span="24">
                <el-card>
                  <template #header>
                    <span>Müşteri Geri Bildirimi Kategorileri</span>
                  </template>
                  <div class="feedback-categories">
                    <el-table :data="feedbackData" style="width: 100%">
                      <el-table-column prop="category" label="Kategori" width="200" />
                      <el-table-column prop="positive" label="Pozitif" width="100">
                        <template #default="scope">
                          <el-tag type="success">{{ scope.row.positive }}%</el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column prop="neutral" label="Nötr" width="100">
                        <template #default="scope">
                          <el-tag type="info">{{ scope.row.neutral }}%</el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column prop="negative" label="Negatif" width="100">
                        <template #default="scope">
                          <el-tag type="danger">{{ scope.row.negative }}%</el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column prop="trend" label="Trend" width="150">
                        <template #default="scope">
                          <el-icon v-if="scope.row.trend === 'up'" color="#67C23A"><ArrowUp /></el-icon>
                          <el-icon v-else-if="scope.row.trend === 'down'" color="#F56C6C"><ArrowDown /></el-icon>
                          <el-icon v-else color="#909399"><Minus /></el-icon>
                          <span :class="scope.row.trend">{{ scope.row.trendValue }}</span>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <!-- Efficiency KPIs -->
        <el-tab-pane label="Verimlilik" name="efficiency">
          <div class="category-content">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-card>
                  <template #header>
                    <span>Uçak Kullanım Oranı</span>
                  </template>
                  <div class="efficiency-chart">
                    <div class="efficiency-gauge">
                      <el-progress
                        type="circle"
                        :percentage="78.5"
                        :width="150"
                        :stroke-width="12"
                        color="#409EFF"
                      >
                        <template #default>
                          <span class="gauge-value">78.5%</span>
                        </template>
                      </el-progress>
                    </div>
                    <div class="efficiency-details">
                      <div class="detail-item">
                        <span class="label">Günlük Ortalama</span>
                        <span class="value">12.2 saat</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">Hedef</span>
                        <span class="value">≥ 75%</span>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="12">
                <el-card>
                  <template #header>
                    <span>Fuel Efficiency (L/100km)</span>
                  </template>
                  <div class="efficiency-chart">
                    <div class="fuel-metrics">
                      <div class="fuel-item">
                        <span class="fuel-label">Mevcut</span>
                        <span class="fuel-value good">3.2</span>
                      </div>
                      <div class="fuel-item">
                        <span class="fuel-label">Hedef</span>
                        <span class="fuel-value">≤ 3.5</span>
                      </div>
                      <div class="fuel-item">
                        <span class="fuel-label">Sektör Ort.</span>
                        <span class="fuel-value">3.8</span>
                      </div>
                    </div>
                    <div class="fuel-savings">
                      <el-tag type="success" size="large">
                        %15 Tasarruf
                      </el-tag>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="16" style="margin-top: 16px;">
              <el-col :span="24">
                <el-card>
                  <template #header>
                    <span>Verimlilik Trendleri</span>
                  </template>
                  <div class="efficiency-trends">
                    <el-table :data="efficiencyTrendData" style="width: 100%">
                      <el-table-column prop="metric" label="Metrik" width="200" />
                      <el-table-column prop="current" label="Mevcut" width="120" />
                      <el-table-column prop="target" label="Hedef" width="120" />
                      <el-table-column prop="achievement" label="Başarı %" width="120">
                        <template #default="scope">
                          <el-progress
                            :percentage="scope.row.achievement"
                            :color="getProgressColor(scope.row.achievement)"
                            :show-text="false"
                            :stroke-width="8"
                          />
                          <span style="margin-left: 10px;">{{ scope.row.achievement }}%</span>
                        </template>
                      </el-table-column>
                      <el-table-column prop="status" label="Durum" width="120">
                        <template #default="scope">
                          <el-tag :type="scope.row.status === 'good' ? 'success' : scope.row.status === 'warning' ? 'warning' : 'danger'">
                            {{ scope.row.statusText }}
                          </el-tag>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- Export Loading Dialog -->
    <el-dialog v-model="exportLoading" title="Rapor Dışa Aktarılıyor" :close-on-click-modal="false" width="400px">
      <div class="export-progress">
        <el-progress :percentage="exportProgress" :show-text="false" />
        <p style="text-align: center; margin-top: 10px;">{{ exportStatus }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  TrendCharts,
  Refresh,
  Download,
  ArrowUp,
  ArrowDown,
  Minus,
  Money,
  PieChart,
  User,
  Star,
  Phone,
  MessageBox
} from '@element-plus/icons-vue'

// Reactive data
const loading = ref(false)
const exportLoading = ref(false)
const exportProgress = ref(0)
const exportStatus = ref('')
const selectedPeriod = ref('30d')
const activeTab = ref('operational')

// Main KPIs
const mainKPIs = reactive([
  {
    id: 'ontime',
    label: 'Zamanında Kalkış',
    value: 87.5,
    target: 85,
    type: 'percentage',
    trend: 'up',
    change: 3.3,
    status: 'good',
    color: '#67C23A',
    icon: TrendCharts
  },
  {
    id: 'delay',
    label: 'Ortalama Gecikme',
    value: 12.3,
    target: 15,
    type: 'minutes',
    trend: 'down',
    change: -3.5,
    status: 'good',
    color: '#409EFF',
    icon: TrendCharts
  },
  {
    id: 'cancellation',
    label: 'İptal Oranı',
    value: 2.1,
    target: 3,
    type: 'percentage',
    trend: 'down',
    change: -0.7,
    status: 'good',
    color: '#E6A23C',
    icon: TrendCharts
  },
  {
    id: 'satisfaction',
    label: 'Müşteri Memnuniyeti',
    value: 8.7,
    target: 8.5,
    type: 'score',
    trend: 'up',
    change: 0.3,
    status: 'excellent',
    color: '#67C23A',
    icon: Star
  }
])

// Sample data
const operationalTrendData = reactive([
  { date: '20.07', flights: 145, onTime: '87%', delayed: 18, cancelled: 1 },
  { date: '21.07', flights: 152, onTime: '89%', delayed: 16, cancelled: 1 },
  { date: '22.07', flights: 138, onTime: '85%', delayed: 21, cancelled: 0 },
  { date: '23.07', flights: 149, onTime: '88%', delayed: 17, cancelled: 1 }
])

const revenueData = reactive([
  { month: 'Oca 2025', revenue: '₺2.1M', growth: '+5.2%' },
  { month: 'Şub 2025', revenue: '₺2.3M', growth: '+9.5%' },
  { month: 'Mar 2025', revenue: '₺2.6M', growth: '+13.0%' },
  { month: 'Nis 2025', revenue: '₺2.8M', growth: '+7.7%' }
])

const feedbackData = reactive([
  { category: 'Uçuş Deneyimi', positive: 78, neutral: 15, negative: 7, trend: 'up', trendValue: '+2%' },
  { category: 'Kabin Hizmeti', positive: 85, neutral: 12, negative: 3, trend: 'up', trendValue: '+5%' },
  { category: 'Zamanında Varış', positive: 82, neutral: 10, negative: 8, trend: 'down', trendValue: '-1%' },
  { category: 'Bagaj Hizmeti', positive: 75, neutral: 18, negative: 7, trend: 'up', trendValue: '+3%' }
])

const efficiencyTrendData = reactive([
  { metric: 'Uçak Kullanım Oranı', current: '78.5%', target: '75%', achievement: 105, status: 'good', statusText: 'Hedef Üstü' },
  { metric: 'Yakıt Verimliliği', current: '3.2 L/100km', target: '3.5 L/100km', achievement: 109, status: 'good', statusText: 'Hedef Üstü' },
  { metric: 'Kabin Doluluk Oranı', current: '82%', target: '80%', achievement: 103, status: 'good', statusText: 'Hedef Üstü' },
  { metric: 'Turnaround Süresi', current: '45 dk', target: '50 dk', achievement: 90, status: 'warning', statusText: 'Geliştirilmeli' }
])

// Methods
const formatKPIValue = (value: number, type: string): string => {
  switch (type) {
    case 'percentage':
      return `${value}%`
    case 'minutes':
      return `${value} dk`
    case 'score':
      return `${value}/10`
    default:
      return value.toString()
  }
}

const calculateProgress = (current: number, target: number): number => {
  return Math.min(Math.round((current / target) * 100), 100)
}

const getProgressColor = (percentage: number): string => {
  if (percentage >= 90) return '#67C23A'
  if (percentage >= 70) return '#E6A23C'
  return '#F56C6C'
}

const handleTabChange = (tabName: string) => {
  console.log('Tab changed to:', tabName)
  // Load data for specific tab if needed
}

const updateKPIs = async () => {
  loading.value = true
  try {
    // API call to backend for KPI data based on selected period
    // await kpiService.getKPIs(selectedPeriod.value)
    console.log('Updating KPIs for period:', selectedPeriod.value)
    ElMessage.success('KPI verileri güncellendi')
  } catch (error) {
    console.error('Error updating KPIs:', error)
    ElMessage.error('KPI verileri güncellenirken hata oluştu')
  } finally {
    loading.value = false
  }
}

const refreshKPIs = async () => {
  loading.value = true
  try {
    // Refresh all KPI data from backend
    // await Promise.all([
    //   kpiService.getOperationalKPIs(),
    //   kpiService.getFinancialKPIs(),
    //   kpiService.getCustomerKPIs(),
    //   kpiService.getEfficiencyKPIs()
    // ])
    console.log('Refreshing all KPI data')
    ElMessage.success('Tüm KPI verileri yenilendi')
  } catch (error) {
    console.error('Error refreshing KPIs:', error)
    ElMessage.error('KPI verileri yenilenirken hata oluştu')
  } finally {
    loading.value = false
  }
}

const exportKPIs = async () => {
  try {
    const result = await ElMessageBox.confirm(
      'KPI raporunu hangi formatta dışa aktarmak istiyorsunuz?',
      'Rapor Dışa Aktarma',
      {
        distinguishCancelAndClose: true,
        confirmButtonText: 'Excel',
        cancelButtonText: 'PDF',
        type: 'question'
      }
    )

    exportLoading.value = true
    exportProgress.value = 0
    exportStatus.value = 'Rapor hazırlanıyor...'

    // Simulate export progress
    const progressInterval = setInterval(() => {
      exportProgress.value += 10
      if (exportProgress.value >= 100) {
        clearInterval(progressInterval)
        exportLoading.value = false
        ElMessage.success('Rapor başarıyla dışa aktarıldı')
      }
    }, 200)

    // Call backend export service
    // const format = result === 'confirm' ? 'excel' : 'pdf'
    // await exportService.exportKPIReport(format, selectedPeriod.value)

  } catch (action) {
    if (action === 'cancel') {
      // PDF export
      exportKPIs()
    }
  }
}

// Load initial data
const loadKPIData = async () => {
  loading.value = true
  try {
    // Load KPI data from backend APIs
    // This would call actual backend services:
    // const [operational, financial, customer, efficiency] = await Promise.all([
    //   archiveService.getOperationalKPIs(selectedPeriod.value),
    //   archiveService.getFinancialKPIs(selectedPeriod.value),
    //   archiveService.getCustomerKPIs(selectedPeriod.value),
    //   archiveService.getEfficiencyKPIs(selectedPeriod.value)
    // ])

    console.log('Loading KPI data from backend...')

    // Update mainKPIs with real data
    // mainKPIs[0].value = operational.onTimePerformance
    // mainKPIs[1].value = operational.averageDelayMinutes
    // mainKPIs[2].value = operational.cancellationRate
    // etc...

  } catch (error) {
    console.error('Error loading KPI data:', error)
    ElMessage.error('KPI verileri yüklenirken hata oluştu')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadKPIData()
})
</script>

<style scoped lang="scss">
.kpi-reports-page {
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

.kpi-overview {
  margin-bottom: 20px;

  .kpi-card {
    height: 180px;

    &.good {
      border-left: 4px solid #67C23A;
    }

    &.warning {
      border-left: 4px solid #E6A23C;
    }

    &.danger {
      border-left: 4px solid #F56C6C;
    }

    &.excellent {
      border-left: 4px solid #409EFF;
    }
  }

  .kpi-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .kpi-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .kpi-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .kpi-trend {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;

    &.up {
      color: #67C23A;
    }

    &.down {
      color: #F56C6C;
    }

    &.stable {
      color: #909399;
    }
  }

  .kpi-main {
    text-align: center;
    margin: 12px 0;
  }

  .kpi-value {
    font-size: 32px;
    font-weight: bold;
    color: #303133;
    margin-bottom: 4px;
  }

  .kpi-label {
    font-size: 14px;
    color: #606266;
  }

  .kpi-footer {
    .kpi-target {
      font-size: 12px;
      color: #909399;
      margin-bottom: 8px;
    }
  }
}

.kpi-categories {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.category-content {
  margin-top: 20px;
}

.metric-container {
  .chart-placeholder {
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed #ddd;
    border-radius: 4px;
    margin-bottom: 16px;

    .chart-circle {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chart-number {
      text-align: center;

      .big-number {
        font-size: 36px;
        font-weight: bold;
        color: #303133;
        display: block;
      }

      .unit {
        font-size: 14px;
        color: #909399;
      }
    }
  }

  .metric-stats {
    display: flex;
    justify-content: space-between;

    .stat-item {
      text-align: center;

      .stat-label {
        display: block;
        font-size: 12px;
        color: #909399;
        margin-bottom: 4px;
      }

      .stat-value {
        font-size: 14px;
        font-weight: bold;

        &.good {
          color: #67C23A;
        }

        &.warning {
          color: #E6A23C;
        }

        &.danger {
          color: #F56C6C;
        }
      }
    }
  }
}

.large-chart-placeholder {
  min-height: 200px;
  padding: 16px;
}

.comparison-metrics {
  .metric-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #eee;

    &:last-child {
      border-bottom: none;
    }

    .metric-name {
      font-weight: 500;
    }
  }
}

.financial-metric {
  .financial-content {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 0;
  }

  .financial-data {
    flex: 1;

    .financial-value {
      font-size: 24px;
      font-weight: bold;
      color: #303133;
      margin-bottom: 4px;
    }

    .financial-label {
      font-size: 14px;
      color: #606266;
      margin-bottom: 8px;
    }

    .financial-change {
      font-size: 12px;
      font-weight: bold;

      &.up {
        color: #67C23A;
      }

      &.down {
        color: #F56C6C;
      }
    }
  }
}

.cost-breakdown {
  .cost-item {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    .cost-label {
      width: 80px;
      font-size: 14px;
    }

    .cost-bar {
      flex: 1;
      height: 8px;
      background-color: #f0f0f0;
      border-radius: 4px;
      overflow: hidden;

      .cost-progress {
        height: 100%;
        transition: width 0.3s ease;
      }
    }

    .cost-value {
      width: 40px;
      text-align: right;
      font-size: 12px;
      font-weight: bold;
    }
  }
}

.customer-metric {
  text-align: center;

  .metric-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;

    span {
      font-size: 14px;
      color: #606266;
    }
  }

  .metric-value {
    font-size: 28px;
    font-weight: bold;
    color: #303133;
    margin-bottom: 8px;

    &.large {
      font-size: 32px;
    }
  }

  .metric-trend {
    font-size: 12px;
    font-weight: bold;

    &.up {
      color: #67C23A;
    }

    &.down {
      color: #F56C6C;
    }
  }
}

.efficiency-chart {
  padding: 20px;
  text-align: center;

  .efficiency-gauge {
    margin-bottom: 20px;

    .gauge-value {
      font-size: 20px;
      font-weight: bold;
    }
  }

  .efficiency-details {
    .detail-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;

      .label {
        color: #606266;
      }

      .value {
        font-weight: bold;
      }
    }
  }

  .fuel-metrics {
    display: flex;
    justify-content: space-around;
    margin-bottom: 20px;

    .fuel-item {
      text-align: center;

      .fuel-label {
        display: block;
        font-size: 12px;
        color: #909399;
        margin-bottom: 4px;
      }

      .fuel-value {
        font-size: 20px;
        font-weight: bold;

        &.good {
          color: #67C23A;
        }
      }
    }
  }
}

.export-progress {
  text-align: center;
  padding: 20px;
}

:deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}

:deep(.el-card__body) {
  padding: 16px;
}
</style>

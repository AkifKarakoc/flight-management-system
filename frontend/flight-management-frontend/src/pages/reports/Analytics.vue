<template>
  <div class="analytics-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1>
            <el-icon><PieChart /></el-icon>
            Veri Analizi
          </h1>
          <p>İleri düzey uçuş veri analizi ve öngörüler</p>
        </div>

        <div class="header-actions">
          <el-select v-model="selectedTimeframe" @change="updateAnalytics" style="width: 150px; margin-right: 10px;">
            <el-option label="Son 7 Gün" value="7d" />
            <el-option label="Son 30 Gün" value="30d" />
            <el-option label="Son 3 Ay" value="3m" />
            <el-option label="Son 1 Yıl" value="1y" />
          </el-select>
          <el-button-group>
            <el-button :icon="Refresh" @click="refreshAnalytics" :loading="loading">
              Yenile
            </el-button>
            <el-button :icon="Download" @click="exportAnalytics">
              Rapor İndir
            </el-button>
          </el-button-group>
        </div>
      </div>
    </div>

    <!-- Analytics Tabs -->
    <div class="analytics-content">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">

        <!-- Flight Patterns Analysis -->
        <el-tab-pane label="Uçuş Desenleri" name="patterns">
          <div class="tab-content">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-card>
                  <template #header>
                    <span>Havayolu Bazlı Dağılım</span>
                  </template>
                  <div class="chart-container">
                    <div ref="airlineDistributionChart" class="chart-placeholder">
                      <!-- Backend'den gelen verilerle grafik oluşturulacak -->
                      <div class="placeholder-content">
                        <el-icon size="48" color="#C0C4CC"><PieChart /></el-icon>
                        <p>Havayolu dağılım grafiği yüklenecek</p>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="12">
                <el-card>
                  <template #header>
                    <span>En Popüler Rotalar</span>
                  </template>
                  <div class="chart-container">
                    <div ref="popularRoutesChart" class="chart-placeholder">
                      <div class="placeholder-content">
                        <el-icon size="48" color="#C0C4CC"><TrendCharts /></el-icon>
                        <p>Popüler rotalar analizi yüklenecek</p>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20" style="margin-top: 20px;">
              <el-col :span="24">
                <el-card>
                  <template #header>
                    <span>Günlük Uçuş Trendi</span>
                  </template>
                  <div class="chart-container large">
                    <div ref="dailyFlightTrendChart" class="chart-placeholder">
                      <div class="placeholder-content">
                        <el-icon size="48" color="#C0C4CC"><DataLine /></el-icon>
                        <p>Günlük uçuş trend analizi yüklenecek</p>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <!-- Performance Analysis -->
        <el-tab-pane label="Performans Analizi" name="performance">
          <div class="tab-content">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-card class="metric-card">
                  <div class="metric-header">
                    <el-icon size="24" color="#67C23A"><Timer /></el-icon>
                    <span>Zamanında Kalkış</span>
                  </div>
                  <div class="metric-value">
                    <span class="big-number">87.5</span>
                    <span class="unit">%</span>
                  </div>
                  <div class="metric-trend up">
                    <el-icon><ArrowUp /></el-icon>
                    <span>+2.3% bu ay</span>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="8">
                <el-card class="metric-card">
                  <div class="metric-header">
                    <el-icon size="24" color="#E6A23C"><Clock /></el-icon>
                    <span>Ortalama Gecikme</span>
                  </div>
                  <div class="metric-value">
                    <span class="big-number">12.3</span>
                    <span class="unit">dk</span>
                  </div>
                  <div class="metric-trend down">
                    <el-icon><ArrowDown /></el-icon>
                    <span>-1.8% bu ay</span>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="8">
                <el-card class="metric-card">
                  <div class="metric-header">
                    <el-icon size="24" color="#F56C6C"><Close /></el-icon>
                    <span>İptal Oranı</span>
                  </div>
                  <div class="metric-value">
                    <span class="big-number">2.1</span>
                    <span class="unit">%</span>
                  </div>
                  <div class="metric-trend down">
                    <el-icon><ArrowDown /></el-icon>
                    <span>-0.5% bu ay</span>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20" style="margin-top: 20px;">
              <el-col :span="12">
                <el-card>
                  <template #header>
                    <span>Havayolu Performans Karşılaştırması</span>
                  </template>
                  <div class="chart-container">
                    <div ref="airlinePerformanceChart" class="chart-placeholder">
                      <div class="placeholder-content">
                        <el-icon size="48" color="#C0C4CC"><DataBar /></el-icon>
                        <p>Havayolu performans karşılaştırması yüklenecek</p>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="12">
                <el-card>
                  <template #header>
                    <span>Gecikme Sebepleri</span>
                  </template>
                  <div class="chart-container">
                    <div ref="delayReasonsChart" class="chart-placeholder">
                      <div class="placeholder-content">
                        <el-icon size="48" color="#C0C4CC"><PieChart /></el-icon>
                        <p>Gecikme sebepleri analizi yüklenecek</p>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <!-- Capacity Analysis -->
        <el-tab-pane label="Kapasite Analizi" name="capacity">
          <div class="tab-content">
            <el-row :gutter="20">
              <el-col :span="24">
                <el-card>
                  <template #header>
                    <div class="card-header">
                      <span>Uçak Kullanım Oranları</span>
                      <el-select v-model="selectedAircraftType" size="small" style="width: 200px;">
                        <el-option label="Tüm Uçaklar" value="all" />
                        <el-option label="Boeing 737" value="boeing737" />
                        <el-option label="Airbus A320" value="airbusa320" />
                        <el-option label="Boeing 777" value="boeing777" />
                      </el-select>
                    </div>
                  </template>
                  <div class="chart-container large">
                    <div ref="aircraftUtilizationChart" class="chart-placeholder">
                      <div class="placeholder-content">
                        <el-icon size="48" color="#C0C4CC"><DataLine /></el-icon>
                        <p>Uçak kullanım oranı analizi yüklenecek</p>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20" style="margin-top: 20px;">
              <el-col :span="12">
                <el-card>
                  <template #header>
                    <span>Yolcu Doluluk Oranı</span>
                  </template>
                  <div class="chart-container">
                    <div ref="passengerLoadChart" class="chart-placeholder">
                      <div class="placeholder-content">
                        <el-icon size="48" color="#C0C4CC"><User /></el-icon>
                        <p>Yolcu doluluk analizi yüklenecek</p>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="12">
                <el-card>
                  <template #header>
                    <span>Kargo Kapasitesi</span>
                  </template>
                  <div class="chart-container">
                    <div ref="cargoCapacityChart" class="chart-placeholder">
                      <div class="placeholder-content">
                        <el-icon size="48" color="#C0C4CC"><Box /></el-icon>
                        <p>Kargo kapasite analizi yüklenecek</p>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <!-- Predictive Analytics -->
        <el-tab-pane label="Öngörü Analizi" name="predictive">
          <div class="tab-content">
            <el-row :gutter="20">
              <el-col :span="24">
                <el-card>
                  <template #header>
                    <div class="card-header">
                      <span>Gelecek Dönem Tahminleri</span>
                      <el-radio-group v-model="predictionPeriod" size="small">
                        <el-radio-button label="week">Haftalık</el-radio-button>
                        <el-radio-button label="month">Aylık</el-radio-button>
                        <el-radio-button label="quarter">Çeyreklik</el-radio-button>
                      </el-radio-group>
                    </div>
                  </template>
                  <div class="prediction-grid">
                    <div class="prediction-card">
                      <div class="prediction-title">Uçuş Sayısı Tahmini</div>
                      <div class="prediction-value">
                        <span class="predicted-number">1,240</span>
                        <span class="confidence">±85 (%92 güven)</span>
                      </div>
                      <div class="prediction-trend">
                        <el-icon color="#67C23A"><TrendCharts /></el-icon>
                        <span>%8.5 artış bekleniyor</span>
                      </div>
                    </div>

                    <div class="prediction-card">
                      <div class="prediction-title">Gecikme Riski</div>
                      <div class="prediction-value">
                        <span class="predicted-number">14.2%</span>
                        <span class="confidence">±2.1% (%88 güven)</span>
                      </div>
                      <div class="prediction-trend">
                        <el-icon color="#E6A23C"><Warning /></el-icon>
                        <span>Hava durumu faktörü</span>
                      </div>
                    </div>

                    <div class="prediction-card">
                      <div class="prediction-title">Kapasite Kullanımı</div>
                      <div class="prediction-value">
                        <span class="predicted-number">82.1%</span>
                        <span class="confidence">±3.5% (%90 güven)</span>
                      </div>
                      <div class="prediction-trend">
                        <el-icon color="#67C23A"><ArrowUp /></el-icon>
                        <span>Optimum seviyede</span>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20" style="margin-top: 20px;">
              <el-col :span="12">
                <el-card>
                  <template #header>
                    <span>Risk Analizi</span>
                  </template>
                  <div class="risk-analysis">
                    <div class="risk-item">
                      <div class="risk-indicator high"></div>
                      <div class="risk-content">
                        <div class="risk-title">Yüksek Risk</div>
                        <div class="risk-description">Hava durumu nedeniyle gecikme riski</div>
                        <div class="risk-probability">%23 olasılık</div>
                      </div>
                    </div>

                    <div class="risk-item">
                      <div class="risk-indicator medium"></div>
                      <div class="risk-content">
                        <div class="risk-title">Orta Risk</div>
                        <div class="risk-description">Teknik bakım kaynaklı iptal</div>
                        <div class="risk-probability">%8 olasılık</div>
                      </div>
                    </div>

                    <div class="risk-item">
                      <div class="risk-indicator low"></div>
                      <div class="risk-content">
                        <div class="risk-title">Düşük Risk</div>
                        <div class="risk-description">Personel eksikliği</div>
                        <div class="risk-probability">%3 olasılık</div>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="12">
                <el-card>
                  <template #header>
                    <span>Öneriler</span>
                  </template>
                  <div class="recommendations">
                    <div class="recommendation-item">
                      <el-icon color="#67C23A"><CircleCheck /></el-icon>
                      <div class="recommendation-content">
                        <div class="recommendation-title">Kapasite Optimizasyonu</div>
                        <div class="recommendation-text">
                          İstanbul-Ankara hattında ek sefer planlanabilir
                        </div>
                      </div>
                    </div>

                    <div class="recommendation-item">
                      <el-icon color="#E6A23C"><Warning /></el-icon>
                      <div class="recommendation-content">
                        <div class="recommendation-title">Gecikme Önlemi</div>
                        <div class="recommendation-text">
                          Hava durumu takibi artırılmalı ve alternatif planlar hazırlanmalı
                        </div>
                      </div>
                    </div>

                    <div class="recommendation-item">
                      <el-icon color="#409EFF"><Tools /></el-icon>
                      <div class="recommendation-content">
                        <div class="recommendation-title">Bakım Planlaması</div>
                        <div class="recommendation-text">
                          Uçak TC-JRG için önleyici bakım zamanı gelmiş
                        </div>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

      </el-tabs>
    </div>

    <!-- Export Dialog -->
    <el-dialog v-model="exportDialogVisible" title="Analiz Raporu Dışa Aktarma" width="500px">
      <el-form :model="exportForm" label-width="120px">
        <el-form-item label="Rapor Türü">
          <el-select v-model="exportForm.reportType" placeholder="Rapor türü seçin">
            <el-option label="Uçuş Desenleri" value="patterns" />
            <el-option label="Performans Analizi" value="performance" />
            <el-option label="Kapasite Analizi" value="capacity" />
            <el-option label="Öngörü Analizi" value="predictive" />
            <el-option label="Tam Rapor" value="complete" />
          </el-select>
        </el-form-item>
        <el-form-item label="Format">
          <el-radio-group v-model="exportForm.format">
            <el-radio label="pdf">PDF</el-radio>
            <el-radio label="excel">Excel</el-radio>
            <el-radio label="csv">CSV</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="Grafikleri Dahil Et">
          <el-switch v-model="exportForm.includeCharts" />
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  PieChart,
  TrendCharts,
  DataLine,
  DataBar,
  Refresh,
  Download,
  Timer,
  Clock,
  Close,
  ArrowUp,
  ArrowDown,
  User,
  Box,
  Warning,
  CircleCheck,
  Tools
} from '@element-plus/icons-vue'

// Reactive data
const loading = ref(false)
const exporting = ref(false)
const exportDialogVisible = ref(false)
const selectedTimeframe = ref('30d')
const activeTab = ref('patterns')
const selectedAircraftType = ref('all')
const predictionPeriod = ref('month')

// Export form
const exportForm = reactive({
  reportType: 'complete',
  format: 'pdf',
  includeCharts: true
})

// Methods
const updateAnalytics = async () => {
  loading.value = true
  try {
    // Call backend analytics API with new timeframe
    // await analyticsService.getAnalytics(selectedTimeframe.value)
    console.log('Updating analytics for timeframe:', selectedTimeframe.value)
    ElMessage.success('Analiz verileri güncellendi')
  } catch (error) {
    console.error('Error updating analytics:', error)
    ElMessage.error('Analiz verileri güncellenirken hata oluştu')
  } finally {
    loading.value = false
  }
}

const refreshAnalytics = async () => {
  loading.value = true
  try {
    // Refresh all analytics data from backend
    // await Promise.all([
    //   analyticsService.getFlightPatterns(),
    //   analyticsService.getPerformanceMetrics(),
    //   analyticsService.getCapacityAnalysis(),
    //   analyticsService.getPredictiveAnalytics()
    // ])
    console.log('Refreshing all analytics data')
    ElMessage.success('Tüm analiz verileri yenilendi')
  } catch (error) {
    console.error('Error refreshing analytics:', error)
    ElMessage.error('Analiz verileri yenilenirken hata oluştu')
  } finally {
    loading.value = false
  }
}

const exportAnalytics = () => {
  exportDialogVisible.value = true
}

const confirmExport = async () => {
  exporting.value = true
  try {
    // Call backend export service for analytics
    // await analyticsService.exportAnalytics(exportForm)
    console.log('Exporting analytics with params:', exportForm)

    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000))

    ElMessage.success('Analiz raporu başarıyla dışa aktarıldı')
    exportDialogVisible.value = false

  } catch (error) {
    console.error('Error exporting analytics:', error)
    ElMessage.error('Rapor dışa aktarımında hata oluştu')
  } finally {
    exporting.value = false
  }
}

const handleTabChange = (tabName: string) => {
  console.log('Analytics tab changed to:', tabName)
  // Load specific analytics data for the selected tab
  // loadTabData(tabName)
}

const loadAnalyticsData = async () => {
  loading.value = true
  try {
    // Load initial analytics data from backend
    // const analyticsData = await analyticsService.getAnalyticsData()
    console.log('Loading analytics data...')

    // Update charts and metrics with real data
    // updateCharts(analyticsData)

  } catch (error) {
    console.error('Error loading analytics data:', error)
    ElMessage.error('Analiz verileri yüklenirken hata oluştu')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAnalyticsData()
})
</script>

<style scoped lang="scss">
.analytics-page {
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

.analytics-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.tab-content {
  margin-top: 20px;
}

.chart-container {
  height: 300px;

  &.large {
    height: 400px;
  }

  .chart-placeholder {
    height: 100%;
    border: 1px dashed #ddd;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;

    .placeholder-content {
      text-align: center;
      color: #909399;

      p {
        margin: 10px 0 0 0;
        font-size: 14px;
      }
    }
  }
}

.metric-card {
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
      font-weight: 500;
    }
  }

  .metric-value {
    margin-bottom: 12px;

    .big-number {
      font-size: 36px;
      font-weight: bold;
      color: #303133;
    }

    .unit {
      font-size: 18px;
      color: #909399;
      margin-left: 4px;
    }
  }

  .metric-trend {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 12px;

    &.up {
      color: #67C23A;
    }

    &.down {
      color: #F56C6C;
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.prediction-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 16px;
}

.prediction-card {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 20px;
  background: #fafafa;

  .prediction-title {
    font-size: 14px;
    color: #606266;
    margin-bottom: 12px;
  }

  .prediction-value {
    margin-bottom: 12px;

    .predicted-number {
      font-size: 28px;
      font-weight: bold;
      color: #303133;
      display: block;
    }

    .confidence {
      font-size: 12px;
      color: #909399;
    }
  }

  .prediction-trend {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #606266;
  }
}

.risk-analysis {
  .risk-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px 0;
    border-bottom: 1px solid #eee;

    &:last-child {
      border-bottom: none;
    }

    .risk-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-top: 4px;

      &.high {
        background-color: #F56C6C;
      }

      &.medium {
        background-color: #E6A23C;
      }

      &.low {
        background-color: #67C23A;
      }
    }

    .risk-content {
      flex: 1;

      .risk-title {
        font-weight: 500;
        color: #303133;
        margin-bottom: 4px;
      }

      .risk-description {
        font-size: 13px;
        color: #606266;
        margin-bottom: 4px;
      }

      .risk-probability {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}

.recommendations {
  .recommendation-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px 0;
    border-bottom: 1px solid #eee;

    &:last-child {
      border-bottom: none;
    }

    .recommendation-content {
      flex: 1;

      .recommendation-title {
        font-weight: 500;
        color: #303133;
        margin-bottom: 6px;
      }

      .recommendation-text {
        font-size: 13px;
        color: #606266;
        line-height: 1.5;
      }
    }
  }
}

:deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}

:deep(.el-card__body) {
  padding: 16px;
}
</style>

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
                        Zamanında Kalkış Grafiği
                      </div>
                    </div>
                    <div class="metric-stats">
                      <div class="stat-item">
                        <span class="stat-label">Mevcut</span>
                        <span class="stat-value good">87.5%</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">Hedef</span>
                        <span class="stat-value">90%</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">Önceki Dönem</span>
                        <span class="stat-value">85.2%</span>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="8">
                <el-card>
                  <template #header>
                    <span>Uçak Doluluk Oranı</span>
                  </template>
                  <div class="metric-container">
                    <div class="metric-chart">
                      <div ref="loadFactorChart" class="chart-placeholder">
                        Doluluk Oranı Grafiği
                      </div>
                    </div>
                    <div class="metric-stats">
                      <div class="stat-item">
                        <span class="stat-label">Mevcut</span>
                        <span class="stat-value excellent">92.3%</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">Hedef</span>
                        <span class="stat-value">85%</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">Önceki Dönem</span>
                        <span class="stat-value">89.1%</span>
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
                      <div ref="cancellationChart" class="chart-placeholder">
                        İptal Oranı Grafiği
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
          </div>
        </el-tab-pane>

        <!-- Financial KPIs -->
        <el-tab-pane label="Mali" name="financial">
          <div class="category-content">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-card>
                  <template #header>
                    <span>Gelir Trendi</span>
                  </template>
                  <div ref="revenueChart" class="large-chart-placeholder">
                    Gelir Trend Grafiği
                  </div>
                </el-card>
              </el-col>

              <el-col :span="12">
                <el-card>
                  <template #header>
                    <span>Maliyet Analizi</span>
                  </template>
                  <div ref="costChart" class="large-chart-placeholder">
                    Maliyet Analiz Grafiği
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="16" style="margin-top: 16px;">
              <el-col :span="8">
                <el-card class="financial-metric">
                  <div class="financial-content">
                    <div class="financial-icon">
                      <el-icon size="32" color="#67C23A"><Money /></el-icon>
                    </div>
                    <div class="financial-info">
                      <div class="financial-value">₺45.2M</div>
                      <div class="financial-label">Toplam Gelir</div>
                      <div class="financial-change positive">+15.3%</div>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="8">
                <el-card class="financial-metric">
                  <div class="financial-content">
                    <div class="financial-icon">
                      <el-icon size="32" color="#E6A23C"><TrendCharts /></el-icon>
                    </div>
                    <div class="financial-info">
                      <div class="financial-value">₺287</div>
                      <div class="financial-label">Koltuk Başına Gelir</div>
                      <div class="financial-change positive">+8.7%</div>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="8">
                <el-card class="financial-metric">
                  <div class="financial-content">
                    <div class="financial-icon">
                      <el-icon size="32" color="#409EFF"><PieChart /></el-icon>
                    </div>
                    <div class="financial-info">
                      <div class="financial-value">23.5%</div>
                      <div class="financial-label">Kar Marjı</div>
                      <div class="financial-change positive">+2.1%</div>
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

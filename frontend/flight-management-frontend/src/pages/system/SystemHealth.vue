<template>
  <div class="system-health-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1>
            <el-icon><Monitor /></el-icon>
            Sistem Durumu
          </h1>
          <p>Altyapı izleme ve sistem sağlığı kontrolü</p>
        </div>

        <div class="header-actions">
          <el-button-group>
            <el-button :icon="Refresh" @click="refreshStatus" :loading="refreshing">
              Yenile
            </el-button>
            <el-button :icon="Download" @click="exportLogs">
              Logları İndir
            </el-button>
            <el-button :icon="Setting" @click="openSettings">
              Ayarlar
            </el-button>
          </el-button-group>
        </div>
      </div>

      <!-- System Overview -->
      <div class="system-overview">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-card class="overview-card" :class="systemOverall.status">
              <div class="overview-content">
                <div class="overview-icon">
                  <el-icon size="32">
                    <component :is="systemOverall.icon" />
                  </el-icon>
                </div>
                <div class="overview-info">
                  <div class="overview-status">{{ systemOverall.text }}</div>
                  <div class="overview-label">Genel Durum</div>
                  <div class="overview-time">
                    Son güncelleme: {{ formatTime(lastUpdate) }}
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>

          <el-col :span="6">
            <el-card class="overview-card">
              <div class="overview-content">
                <div class="overview-icon uptime">
                  <el-icon size="32"><Clock /></el-icon>
                </div>
                <div class="overview-info">
                  <div class="overview-status">{{ uptime }}</div>
                  <div class="overview-label">Çalışma Süresi</div>
                  <div class="overview-time">99.9% kullanılabilirlik</div>
                </div>
              </div>
            </el-card>
          </el-col>

          <el-col :span="6">
            <el-card class="overview-card">
              <div class="overview-content">
                <div class="overview-icon performance">
                  <el-icon size="32"><TrendCharts /></el-icon>
                </div>
                <div class="overview-info">
                  <div class="overview-status">{{ performanceScore }}%</div>
                  <div class="overview-label">Performans Skoru</div>
                  <div class="overview-time">Ortalama yanıt: {{ averageResponse }}ms</div>
                </div>
              </div>
            </el-card>
          </el-col>

          <el-col :span="6">
            <el-card class="overview-card">
              <div class="overview-content">
                <div class="overview-icon alerts">
                  <el-icon size="32"><Bell /></el-icon>
                </div>
                <div class="overview-info">
                  <div class="overview-status">{{ activeAlerts }}</div>
                  <div class="overview-label">Aktif Uyarı</div>
                  <div class="overview-time">{{ criticalAlerts }} kritik</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- Services Status -->
    <div class="services-section">
      <el-card>
        <template #header>
          <div class="section-header">
            <span>Mikro Servisler</span>
            <div class="header-actions">
              <el-switch
                v-model="autoRefresh"
                active-text="Otomatik Yenileme"
                @change="toggleAutoRefresh"
              />
            </div>
          </div>
        </template>

        <div class="services-grid">
          <div
            v-for="service in services"
            :key="service.name"
            class="service-card"
            :class="service.status.toLowerCase()"
          >
            <div class="service-header">
              <div class="service-info">
                <div class="service-name">{{ service.displayName }}</div>
                <div class="service-url">{{ service.url }}</div>
              </div>
              <div class="service-status">
                <el-tag :type="getServiceTagType(service.status)" size="large">
                  <el-icon class="tag-icon">
                    <component :is="getServiceIcon(service.status)" />
                  </el-icon>
                  {{ getServiceStatusText(service.status) }}
                </el-tag>
              </div>
            </div>

            <div class="service-metrics">
              <div class="metric-item">
                <span class="metric-label">Yanıt Süresi</span>
                <span class="metric-value" :class="getResponseTimeClass(service.responseTime)">
                  {{ service.responseTime }}ms
                </span>
              </div>
              <div class="metric-item">
                <span class="metric-label">CPU</span>
                <span class="metric-value">{{ service.cpu }}%</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Bellek</span>
                <span class="metric-value">{{ service.memory }}%</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Çalışma Süresi</span>
                <span class="metric-value">{{ service.uptime }}</span>
              </div>
            </div>

            <div class="service-actions">
              <el-button-group size="small">
                <el-button @click="viewLogs(service)" :icon="Document">
                  Loglar
                </el-button>
                <el-button @click="viewMetrics(service)" :icon="TrendCharts">
                  Metrikler
                </el-button>
                <el-button
                  @click="restartService(service)"
                  :icon="RefreshRight"
                  type="warning"
                  v-if="service.status === 'DOWN'"
                >
                  Yeniden Başlat
                </el-button>
              </el-button-group>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Infrastructure Status -->
    <div class="infrastructure-section">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>Veritabanları</span>
            </template>
            <div class="infrastructure-list">
              <div
                v-for="db in databases"
                :key="db.name"
                class="infrastructure-item"
                :class="db.status.toLowerCase()"
              >
                <div class="item-header">
                  <div class="item-info">
                    <el-icon size="20"><Database /></el-icon>
                    <span class="item-name">{{ db.name }}</span>
                  </div>
                  <el-tag :type="getServiceTagType(db.status)" size="small">
                    {{ getServiceStatusText(db.status) }}
                  </el-tag>
                </div>

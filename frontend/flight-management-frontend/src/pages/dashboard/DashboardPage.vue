<template>
  <div class="dashboard-page">
    <div class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Uçuş yönetim sistemine hoş geldiniz</p>
    </div>

    <!-- KPI Cards -->
    <div class="kpi-cards">
      <div class="kpi-row">
        <KpiCard
          title="Toplam Uçuş"
          :value="kpis.totalFlights"
          icon="Position"
          color="#409eff"
          :loading="loading"
        />
        <KpiCard
          title="Aktif Havayolları"
          :value="kpis.activeAirlines"
          icon="Ship"
          color="#67c23a"
          :loading="loading"
        />
        <KpiCard
          title="Toplam Havaalanı"
          :value="kpis.totalAirports"
          icon="MapLocation"
          color="#e6a23c"
          :loading="loading"
        />
        <KpiCard
          title="Aktif Uçaklar"
          :value="kpis.activeAircrafts"
          icon="Promotion"
          color="#f56c6c"
          :loading="loading"
        />
      </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-section">
      <el-row :gutter="24">
        <el-col :xs="24" :lg="12">
          <div class="chart-card">
            <div class="card-header">
              <h3>Günlük Uçuş Dağılımı</h3>
              <el-button-group size="small">
                <el-button :type="chartPeriod === '7d' ? 'primary' : ''" @click="chartPeriod = '7d'">
                  7 Gün
                </el-button>
                <el-button :type="chartPeriod === '30d' ? 'primary' : ''" @click="chartPeriod = '30d'">
                  30 Gün
                </el-button>
              </el-button-group>
            </div>
            <div class="chart-content">
              <FlightChart :period="chartPeriod" />
            </div>
          </div>
        </el-col>

        <el-col :xs="24" :lg="12">
          <div class="chart-card">
            <div class="card-header">
              <h3>Uçuş Türü Dağılımı</h3>
            </div>
            <div class="chart-content">
              <FlightTypeChart />
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- Recent Activity -->
    <div class="activity-section">
      <el-row :gutter="24">
        <el-col :xs="24" :lg="16">
          <div class="activity-card">
            <div class="card-header">
              <h3>Son Uçuşlar</h3>
              <el-link type="primary" @click="$router.push('/flights')">
                Tümünü Gör
              </el-link>
            </div>
            <div class="activity-content">
              <RecentFlightsTable :limit="5" />
            </div>
          </div>
        </el-col>

        <el-col :xs="24" :lg="8">
          <div class="activity-card">
            <div class="card-header">
              <h3>Sistem Durumu</h3>
            </div>
            <div class="activity-content">
              <SystemStatus />
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import KpiCard from '@/components/charts/KpiCard.vue'
import FlightChart from '@/components/charts/FlightChart.vue'
import FlightTypeChart from '@/components/charts/FlightTypeChart.vue'
import RecentFlightsTable from '@/components/tables/RecentFlightsTable.vue'
import SystemStatus from '@/components/common/SystemStatus.vue'

const loading = ref(true)
const chartPeriod = ref('7d')

const kpis = reactive({
  totalFlights: 0,
  activeAirlines: 0,
  totalAirports: 0,
  activeAircrafts: 0
})

const fetchKpis = async () => {
  loading.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mock data - replace with real API calls
    kpis.totalFlights = 1247
    kpis.activeAirlines = 23
    kpis.totalAirports = 156
    kpis.activeAircrafts = 89
  } catch (error) {
    console.error('Error fetching KPIs:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchKpis()
})
</script>

<style scoped>
.dashboard-page {
  padding: 0;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 16px;
  color: #606266;
  margin: 0;
}

.kpi-cards {
  margin-bottom: 24px;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.charts-section {
  margin-bottom: 24px;
}

.chart-card, .activity-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 24px;
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.card-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.chart-content {
  height: 300px;
}

.activity-content {
  min-height: 200px;
}

@media (max-width: 768px) {
  .kpi-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .page-title {
    font-size: 24px;
  }

  .chart-card, .activity-card {
    padding: 16px;
  }

  .chart-content {
    height: 250px;
  }
}

@media (max-width: 480px) {
  .kpi-row {
    grid-template-columns: 1fr;
  }
}
</style>

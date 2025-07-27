<template>
  <div class="kpi-reports">
    <div class="page-header">
      <h1>KPI Raporları</h1>
      <p>Anahtar Performans Göstergeleri</p>
    </div>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>KPI Raporları</span>
          <el-button type="primary" @click="generateKpiReport">
            KPI Raporu Oluştur
          </el-button>
        </div>
      </template>

      <div class="report-content">
        <el-alert
          title="KPI Raporları"
          description="Bu sayfa anahtar performans göstergeleri ve metrikler için tasarlanmıştır. Yakında detaylı KPI analizleri eklenecektir."
          type="success"
          show-icon
          :closable="false"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const generateKpiReport = () => {
  console.log('Generating KPI report...')
}
</script>

<style scoped>
.kpi-reports {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.page-header p {
  margin: 0;
  color: #666;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.report-content {
  padding: 20px 0;
}
</style>

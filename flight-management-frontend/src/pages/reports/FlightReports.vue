<template>
  <div class="flight-reports">
    <div class="page-header">
      <h1>Uçuş Raporları</h1>
      <p>Uçuş performansı ve istatistikleri</p>
    </div>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>Uçuş Raporları</span>
          <el-button type="primary" @click="generateReport">
            Rapor Oluştur
          </el-button>
        </div>
      </template>

      <div class="report-content">
        <el-alert
          title="Rapor Özelliği"
          description="Bu sayfa uçuş raporları ve analizleri için tasarlanmıştır. Yakında daha detaylı raporlar eklenecektir."
          type="info"
          show-icon
          :closable="false"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const generateReport = () => {
  console.log('Generating flight report...')
}
</script>

<style scoped>
.flight-reports {
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

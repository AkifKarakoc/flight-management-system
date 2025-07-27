<template>
  <div class="airline-statistics">
    <el-row :gutter="16">
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-number">{{ statistics?.totalFlights || 0 }}</div>
            <div class="stat-label">Toplam Uçuş</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-number">{{ statistics?.activeFlights || 0 }}</div>
            <div class="stat-label">Aktif Uçuş</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-number">{{ statistics?.totalAircraft || 0 }}</div>
            <div class="stat-label">Toplam Uçak</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-number">{{ statistics?.totalRoutes || 0 }}</div>
            <div class="stat-label">Toplam Rota</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
defineProps({
  statistics: {
    type: Object,
    default: () => ({})
  }
})
</script>

<style scoped>
.airline-statistics {
  padding: 16px;
}

.stat-card {
  text-align: center;
  padding: 16px;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 8px;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}
</style> 
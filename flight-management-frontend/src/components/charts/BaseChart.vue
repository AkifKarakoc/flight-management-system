<template>
  <div :class="chartClass" :style="chartStyle">
    <!-- Chart header -->
    <div v-if="showHeader" class="chart-header">
      <div class="header-content">
        <div class="header-info">
          <h3 v-if="title" class="chart-title">{{ title }}</h3>
          <p v-if="description" class="chart-description">{{ description }}</p>
        </div>

        <div class="header-actions">
          <slot name="header-actions" />

          <!-- Time period selector -->
          <BaseSelect
            v-if="showTimePeriod"
            v-model="selectedPeriod"
            :options="timePeriodOptions"
            size="small"
            style="width: 120px"
            @change="handlePeriodChange"
          />

          <!-- Export options -->
          <el-dropdown
            v-if="exportable"
            trigger="click"
            @command="handleExport"
          >
            <BaseButton size="small" icon="Download">
              Export
            </BaseButton>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="png" icon="Picture">
                  PNG olarak indir
                </el-dropdown-item>
                <el-dropdown-item command="jpg" icon="Picture">
                  JPG olarak indir
                </el-dropdown-item>
                <el-dropdown-item command="svg" icon="Document">
                  SVG olarak indir
                </el-dropdown-item>
                <el-dropdown-item command="pdf" icon="Document">
                  PDF olarak indir
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- Refresh button -->
          <BaseButton
            v-if="refreshable"
            size="small"
            icon="Refresh"
            :loading="loading"
            @click="handleRefresh"
          />
        </div>
      </div>
    </div>

    <!-- Chart content -->
    <div class="chart-content" :style="contentStyle">
      <!-- Loading state -->
      <div v-if="loading" class="chart-loading">
        <el-skeleton :rows="4" animated>
          <template #template>
            <div class="skeleton-chart">
              <div class="skeleton-bars">
                <div v-for="i in 8" :key="i" class="skeleton-bar" :style="{ height: `${Math.random() * 80 + 20}%` }" />
              </div>
            </div>
          </template>
        </el-skeleton>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="chart-error">
        <div class="error-icon">
          <el-icon size="48"><Warning /></el-icon>
        </div>
        <div class="error-message">{{ error }}</div>
        <BaseButton type="primary" size="small" @click="handleRetry">
          Tekrar Dene
        </BaseButton>
      </div>

      <!-- Empty state -->
      <div v-else-if="isEmpty" class="chart-empty">
        <div class="empty-icon">
          <el-icon size="48"><DataAnalysis /></el-icon>
        </div>
        <div class="empty-message">{{ emptyText }}</div>
        <div v-if="emptyDescription" class="empty-description">
          {{ emptyDescription }}
        </div>
      </div>

      <!-- Chart container -->
      <div
        v-else
        ref="chartContainer"
        class="chart-container"
        :style="containerStyle"
      />
    </div>

    <!-- Chart footer -->
    <div v-if="showFooter" class="chart-footer">
      <slot name="footer">
        <!-- Legend -->
        <div v-if="showLegend &&

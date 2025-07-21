<template>
  <div class="crew-management">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="page-title">
          <el-icon size="24"><Avatar /></el-icon>
          <h1>Mürettebat Yönetimi</h1>
          <el-tag :type="crewMembers.length > 0 ? 'success' : 'info'">
            {{ crewMembers.length }} Kişi
          </el-tag>
        </div>

        <div class="header-actions">
          <el-button
            type="primary"
            :icon="Plus"
            @click="handleCreate"
            :loading="loading"
          >
            Yeni Mürettebat
          </el-button>

          <el-dropdown @command="handleBulkAction" :disabled="selectedRows.length === 0">
            <el-button :disabled="selectedRows.length === 0">
              Toplu İşlemler
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="activate" :icon="Check">
                  Seçilenleri Aktifleştir
                </el-dropdown-item>
                <el-dropdown-item command="deactivate" :icon="Close">
                  Seçilenleri Pasifleştir
                </el-dropdown-item>
                <el-dropdown-item command="leave" :icon="Coffee">
                  İzne Çıkar
                </el-dropdown-item>
                <el-dropdown-item command="training" :icon="Reading">
                  Eğitime Gönder
                </el-dropdown-item>
                <el-dropdown-item command="export" :icon="Download">
                  Seçilenleri Dışa Aktar
                </el-dropdown-item>
                <el-dropdown-item command="delete" :icon="Delete" divided>
                  Seçilenleri Sil
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-button :icon="Refresh" @click="handleRefresh" :loading="loading">
            Yenile
          </el-button>

          <el-button :icon="Upload" @click="handleImport">
            İçe Aktar
          </el-button>

          <el-button :icon="Download" @click="handleExport">
            Dışa Aktar
          </el-button>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="search-filters">
        <div class="search-bar">
          <el-input
            v-model="searchQuery"
            placeholder="Mürettebat ara... (ad, soyad, lisans no, çalışan no)"
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
            @clear="handleSearchClear"
            class="search-input"
          />
        </div>

        <div class="filters">
          <el-select
            v-model="filterRole"
            placeholder="Görev"
            clearable
            @change="handleFilter"
            class="filter-select"
          >
            <el-option label="Kaptan Pilot" value="CAPTAIN" />
            <el-option label="Yardımcı Pilot" value="FIRST_OFFICER" />
            <el-option label="Uçuş Mühendisi" value="FLIGHT_ENGINEER" />
            <el-option label="Kabin Görevlisi" value="CABIN_CREW" />
          </el-select>

          <el-select
            v-model="filterAirline"
            placeholder="Havayolu"
            clearable
            filterable
            @change="handleFilter"
            class="filter-select"
          >
            <el-option
              v-for="airline in availableAirlines"
              :key="airline.id"
              :label="airline.name"
              :value="airline.id"
            >
              <span class="airline-option">
                <span class="airline-code">{{ airline.code }}</span>
                <span>{{ airline.name }}</span>
              </span>
            </el-option>
          </el-select>

          <el-select
            v-model="filterStatus"
            placeholder="İstihdam Durumu"
            clearable
            @change="handleFilter"
            class="filter-select"
          >
            <el-option label="Aktif" value="ACTIVE" />
            <el-option label="İzinli" value="ON_LEAVE" />
            <el-option label="Askıda" value="SUSPENDED" />
            <el-option label="Emekli" value="RETIRED" />
            <el-option label="İstifa" value="RESIGNED" />
          </el-select>

          <el-button :icon="Filter" @click="toggleAdvancedFilters">
            {{ showAdvancedFilters ? 'Basit' : 'Gelişmiş' }} Filtre
          </el-button>
        </div>
      </div>

      <!-- Advanced Filters -->
      <el-collapse-transition>
        <div v-show="showAdvancedFilters" class="advanced-filters">
          <el-card shadow="never">
            <div class="advanced-filters-grid">
              <el-form-item label="Uyruk">
                <el-select
                  v-model="filterNationality"
                  placeholder="Uyruk seçin"
                  clearable
                  @change="handleFilter"
                >
                  <el-option
                    v-for="country in availableNationalities"
                    :key="country.code"
                    :label="country.name"
                    :value="country.code"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="Min. Deneyim (Yıl)">
                <el-input-number
                  v-model="filterMinExperience"
                  :min="0"
                  :max="50"
                  placeholder="Yıl"
                  @change="handleFilter"
                />
              </el-form-item>

              <el-form-item label="Sertifika Durumu">
                <el-select
                  v-model="filterCertificateStatus"
                  placeholder="Sertifika durumu"
                  clearable
                  @change="handleFilter"
                >
                  <el-option label="Geçerli" value="valid" />
                  <el-option label="Süresi Yakında Dolacak" value="expiring" />
                  <el-option label="Süresi Dolmuş" value="expired" />
                </el-select>
              </el-form-item>

              <el-form-item label="Uçak Tipi">
                <el-select
                  v-model="filterAircraftType"
                  placeholder="Uçak tipi"
                  clearable
                  @change="handleFilter"
                >
                  <el-option
                    v-for="type in availableAircraftTypes"
                    :key="type"
                    :label="type"
                    :value="type"
                  />
                </el-select>
              </el-form-item>

              <el-form-item>
                <el-button @click="clearFilters">Filtreleri Temizle</el-button>
              </el-form-item>
            </div>
          </el-card>
        </div>
      </el-collapse-transition>
    </div>

    <!-- Statistics Cards -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon pilots">
            <el-icon><UserFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ pilotsCount }}</div>
            <div class="stat-label">Pilot</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon cabin">
            <el-icon><Avatar /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ cabinCrewCount }}</div>
            <div class="stat-label">Kabin Görevlisi</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon active">
            <el-icon><CircleCheckFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ activeCrewCount }}</div>
            <div class="stat-label">Aktif Personel</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon experience">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ averageExperience.toFixed(1) }}</div>
            <div class="stat-label">Ortalama Deneyim (Yıl)</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Data Table -->
    <div class="table-container">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="paginatedCrewMembers"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
        row-key="id"
        class="data-table"
        empty-text="Mürettebat üyesi bulunamadı"
        :default-sort="{ prop: 'lastName', order: 'ascending' }"
      >
        <!-- Selection Column -->
        <el-table-column type="selection" width="55" fixed="left" />

        <!-- Index Column -->
        <el-table-column type="index" label="#" width="60" />

        <!-- Employee Info Column -->
        <el-table-column label="Personel Bilgileri" min-width="200" sortable="custom" fixed="left">
          <template #default="{ row }">
            <div class="employee-info">
              <div class="avatar-section">
                <el-avatar :size="40" :icon="UserFilled" />
              </div>
              <div class="info-section">
                <div class="name">{{ row.firstName }} {{ row.lastName }}</div>
                <div class="employee-id">
                  <el-icon><Document /></el-icon>
                  <span>{{ row.employeeId }}</span>
                </div>
                <div v-if="row.licenseNumber" class="license">
                  <el-icon><Ticket /></el-icon>
                  <span>{{ row.licenseNumber }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Role & Airline Column -->
        <el-table-column label="Görev & Havayolu" width="180">
          <template #default="{ row }">
            <div class="role-airline">
              <div class="role">
                <el-tag :type="getRoleTagType(row.role)" size="small">
                  {{ getRoleText(row.role) }}
                </el-tag>
              </div>
              <div class="airline">
                <el-tag class="airline-tag">{{ getAirlineCode(row.airlineId) }}</el-tag>
                <div class="airline-name">{{ getAirlineName(row.airlineId) }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Experience & Hours Column -->
        <el-table-column label="Deneyim & Saat" width="140" align="center">
          <template #default="{ row }">
            <div class="experience-hours">
              <div v-if="row.experienceYears" class="experience">
                <el-icon><Calendar /></el-icon>
                <span>{{ row.experienceYears }} yıl</span>
              </div>
              <div v-if="row.totalFlightHours" class="hours">
                <el-icon><Clock /></el-icon>
                <span>{{ row.totalFlightHours.toLocaleString() }}h</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Qualifications Column -->
        <el-table-column label="Yeterlilikler" width="150">
          <template #default="{ row }">
            <div class="qualifications">
              <div v-if="row.qualifiedAircraftTypes?.length" class="aircraft-types">
                <el-tag
                  v-for="type in row.qualifiedAircraftTypes.slice(0, 2)"
                  :key="type"
                  size="small"
                  class="aircraft-tag"
                >
                  {{ type }}
                </el-tag>
                <el-tag
                  v-if="row.qualifiedAircraftTypes.length > 2"
                  size="small"
                  type="info"
                >
                  +{{ row.qualifiedAircraftTypes.length - 2 }}
                </el-tag>
              </div>
              <div v-if="row.languages?.length" class="languages">
                <el-icon><ChatDotRound /></el-icon>
                <span>{{ row.languages.slice(0, 3).join(', ') }}</span>
                <span v-if="row.languages.length > 3">...</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Certificates Column -->
        <el-table-column label="Sertifikalar" width="120" align="center">
          <template #default="{ row }">
            <div class="certificates">
              <div v-if="row.licenseExpiry" class="license-status">
                <el-tooltip :content="`Lisans: ${formatDate(row.licenseExpiry)}`" placement="top">
                  <el-tag
                    :type="getCertificateStatus(row.licenseExpiry)"
                    size="small"
                  >
                    Lisans
                  </el-tag>
                </el-tooltip>
              </div>
              <div v-if="row.medicalCertificateExpiry" class="medical-status">
                <el-tooltip :content="`Sağlık: ${formatDate(row.medicalCertificateExpiry)}`" placement="top">
                  <el-tag
                    :type="getCertificateStatus(row.medicalCertificateExpiry)"
                    size="small"
                  >
                    Sağlık
                  </el-tag>
                </el-tooltip>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Employment Status Column -->
        <el-table-column prop="employmentStatus" label="İstihdam Durumu" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getEmploymentStatusTagType(row.employmentStatus)" size="small">
              {{ getEmploymentStatusText(row.employmentStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Contact Column -->
        <el-table-column label="İletişim" width="100" align="center">
          <template #default="{ row }">
            <div class="contact-actions">
              <el-tooltip v-if="row.email" content="E-posta" placement="top">
                <el-button
                  :icon="Message"
                  size="small"
                  @click="sendEmail(row.email)"
                />
              </el-tooltip>
              <el-tooltip v-if="row.phone" content="Telefon" placement="top">
                <el-button
                  :icon="Phone"
                  size="small"
                  @click="callPhone(row.phone)"
                />
              </el-tooltip>
            </div>
          </template>
        </el-table-column>

        <!-- Active Status Column -->
        <el-table-column prop="active" label="Aktif" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.active"
              @change="handleStatusChange(row)"
              :loading="row.statusLoading"
            />
          </template>
        </el-table-column>

        <!-- Actions Column -->
        <el-table-column label="İşlemler" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-tooltip content="Görüntüle" placement="top">
                <el-button
                  :icon="View"
                  size="small"
                  @click="handleView(row)"
                />
              </el-tooltip>

              <el-tooltip content="Düzenle" placement="top">
                <el-button
                  :icon="Edit"
                  size="small"
                  type="primary"
                  @click="handleEdit(row)"
                />
              </el-tooltip>

              <el-tooltip content="Uçuş Geçmişi" placement="top">
                <el-button
                  :icon="Document"
                  size="small"
                  type="success"
                  @click="viewFlightHistory(row)"
                />
              </el-tooltip>

              <el-tooltip content="Sil" placement="top">
                <el-button
                  :icon="Delete"
                  size="small"
                  type="danger"
                  @click="handleDelete(row)"
                />
              </el-tooltip>

              <el-dropdown @command="(command) => handleRowAction(command, row)">
                <el-button :icon="MoreFilled" size="small" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="duplicate" :icon="CopyDocument">
                      Kopyala
                    </el-dropdown-item>
                    <el-dropdown-item command="schedule" :icon="Calendar">
                      Görev Programı
                    </el-dropdown-item>
                    <el-dropdown-item command="training" :icon="Reading">
                      Eğitim Kayıtları
                    </el-dropdown-item>
                    <el-dropdown-item command="leave" :icon="Coffee">
                      İzin Ver
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalCrewMembers"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? 'Yeni Mürettebat Ekle' : 'Mürettebat Düzenle'"
      width="900px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="handleDialogClose"
    >
      <CrewMemberForm
        v-model="currentCrewMember"
        :is-editing="dialogMode === 'edit'"
        :submitting="submitting"
        @submit="handleFormSubmit"
        @cancel="handleDialogClose"
      />
    </el-dialog>

    <!-- View Dialog -->
    <el-dialog
      v-model="viewDialogVisible"
      title="Mürettebat Detayları"
      width="800px"
    >
      <div v-if="viewingCrewMember" class="crew-details">
        <div class="detail-header">
          <div class="crew-title">
            <div class="avatar-section">
              <el-avatar :size="60" :icon="UserFilled" />
            </div>
            <div class="title-info">
              <h3>{{ viewingCrewMember.firstName }} {{ viewingCrewMember.lastName }}</h3>
              <div class="subtitle">
                <el-tag :type="getRoleTagType(viewingCrewMember.role)">
                  {{ getRoleText(viewingCrewMember.role) }}
                </el-tag>
                <span>{{ getAirlineName(viewingCrewMember.airlineId) }}</span>
              </div>
            </div>
          </div>
          <div class="status-badges">
            <el-tag :type="getEmploymentStatusTagType(viewingCrewMember.employmentStatus)">
              {{ getEmploymentStatusText(viewingCrewMember.employmentStatus) }}
            </el-tag>
            <el-tag :type="viewingCrewMember.active ? 'success' : 'danger'">
              {{ viewingCrewMember.active ? 'Aktif' : 'Pasif' }}
            </el-tag>
          </div>
        </div>

        <el-divider />

        <div class="detail-tabs">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="Kişisel Bilgiler" name="personal">
              <div class="detail-grid">
                <div class="detail-section">
                  <h4>Temel Bilgiler</h4>
                  <div class="detail-item">
                    <span class="label">Çalışan No:</span>
                    <span>{{ viewingCrewMember.employeeId }}</span>
                  </div>
                  <div class="detail-item" v-if="viewingCrewMember.licenseNumber">
                    <span class="label">Lisans No:</span>
                    <span>{{ viewingCrewMember.licenseNumber }}</span>
                  </div>
                  <div class="detail-item" v-if="viewingCrewMember.birthDate">
                    <span class="label">Doğum Tarihi:</span>
                    <span>{{ formatDate(viewingCrewMember.birthDate) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Uyruk:</span>
                    <span>{{ getCountryName(viewingCrewMember.nationality) }}</span>
                  </div>
                </div>

                <div class="detail-section">
                  <h4>İletişim</h4>
                  <div class="detail-item" v-if="viewingCrewMember.email">
                    <span class="label">E-posta:</span>
                    <a :href="`mailto:${viewingCrewMember.email}`" class="link">
                      {{ viewingCrewMember.email }}
                    </a>
                  </div>
                  <div class="detail-item" v-if="viewingCrewMember.phone">
                    <span class="label">Telefon:</span>
                    <a :href="`tel:${viewingCrewMember.phone}`" class="link">
                      {{ viewingCrewMember.phone }}
                    </a>
                  </div>
                  <div class="detail-item" v-if="viewingCrewMember.emergencyContact">
                    <span class="label">Acil Durum:</span>
                    <span>{{ viewingCrewMember.emergencyContact }}</span>
                  </div>
                  <div class="detail-item" v-if="viewingCrewMember.address">
                    <span class="label">Adres:</span>
                    <span>{{ viewingCrewMember.address }}</span>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="Mesleki Bilgiler" name="professional">
              <div class="detail-grid">
                <div class="detail-section">
                  <h4>Kariyer</h4>
                  <div class="detail-item">
                    <span class="label">Görev:</span>
                    <el-tag :type="getRoleTagType(viewingCrewMember.role)">
                      {{ getRoleText(viewingCrewMember.role) }}
                    </el-tag>
                  </div>
                  <div class="detail-item">
                    <span class="label">Havayolu:</span>
                    <span>{{ getAirlineName(viewingCrewMember.airlineId) }}</span>
                  </div>
                  <div class="detail-item" v-if="viewingCrewMember.hireDate">
                    <span class="label">İşe Giriş:</span>
                    <span>{{ formatDate(viewingCrewMember.hireDate) }}</span>
                  </div>
                  <div class="

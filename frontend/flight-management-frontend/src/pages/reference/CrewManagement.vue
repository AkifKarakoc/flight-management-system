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
                  <div class="detail-item" v-if="viewingCrewMember.experienceYears">
                    <span class="label">Deneyim:</span>
                    <span>{{ viewingCrewMember.experienceYears }} yıl</span>
                  </div>
                  <div class="detail-item" v-if="viewingCrewMember.totalFlightHours">
                    <span class="label">Toplam Uçuş Saati:</span>
                    <span>{{ viewingCrewMember.totalFlightHours.toLocaleString() }} saat</span>
                  </div>
                </div>

                <div class="detail-section">
                  <h4>Sertifikalar</h4>
                  <div class="detail-item" v-if="viewingCrewMember.licenseExpiry">
                    <span class="label">Lisans Geçerlilik:</span>
                    <el-tag :type="getCertificateStatus(viewingCrewMember.licenseExpiry)">
                      {{ formatDate(viewingCrewMember.licenseExpiry) }}
                    </el-tag>
                  </div>
                  <div class="detail-item" v-if="viewingCrewMember.medicalCertificateExpiry">
                    <span class="label">Sağlık Sertifikası:</span>
                    <el-tag :type="getCertificateStatus(viewingCrewMember.medicalCertificateExpiry)">
                      {{ formatDate(viewingCrewMember.medicalCertificateExpiry) }}
                    </el-tag>
                  </div>
                </div>
              </div>

              <div v-if="viewingCrewMember.qualifiedAircraftTypes?.length" class="detail-section full-width">
                <h4>Yetkin Olunan Uçak Tipleri</h4>
                <div class="aircraft-types-list">
                  <el-tag
                    v-for="type in viewingCrewMember.qualifiedAircraftTypes"
                    :key="type"
                    class="aircraft-tag"
                  >
                    {{ type }}
                  </el-tag>
                </div>
              </div>

              <div v-if="viewingCrewMember.languages?.length" class="detail-section full-width">
                <h4>Dil Yetkinlikleri</h4>
                <div class="languages-list">
                  <el-tag
                    v-for="language in viewingCrewMember.languages"
                    :key="language"
                    class="language-tag"
                  >
                    {{ language }}
                  </el-tag>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="Notlar" name="notes">
              <div class="detail-section full-width">
                <div v-if="viewingCrewMember.notes" class="notes-content">
                  <p>{{ viewingCrewMember.notes }}</p>
                </div>
                <div v-else class="no-notes">
                  <el-empty description="Henüz not eklenmemiş" />
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>

        <div class="detail-actions">
          <el-button
            type="primary"
            :icon="Document"
            @click="viewFlightHistory(viewingCrewMember)"
          >
            Uçuş Geçmişi
          </el-button>
          <el-button
            :icon="Calendar"
            @click="viewSchedule(viewingCrewMember)"
          >
            Görev Programı
          </el-button>
          <el-button
            :icon="Reading"
            @click="viewTrainingRecords(viewingCrewMember)"
          >
            Eğitim Kayıtları
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Avatar,
  Plus,
  ArrowDown,
  Check,
  Close,
  Coffee,
  Reading,
  Delete,
  Refresh,
  Download,
  Upload,
  Search,
  Filter,
  View,
  Edit,
  MoreFilled,
  CopyDocument,
  Calendar,
  UserFilled,
  CircleCheckFilled,
  TrendCharts,
  Document,
  Ticket,
  Clock,
  ChatDotRound,
  Message,
  Phone
} from '@element-plus/icons-vue'
import { useReferenceStore } from '@/stores/reference'
import { useAppStore } from '@/stores/app'
import CrewMemberForm from '@/components/forms/CrewMemberForm.vue'
import dayjs from 'dayjs'

// Stores
const referenceStore = useReferenceStore()
const appStore = useAppStore()
const router = useRouter()

// Reactive state
const loading = ref(false)
const submitting = ref(false)
const tableRef = ref(null)
const selectedRows = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const searchQuery = ref('')
const filterRole = ref('')
const filterAirline = ref('')
const filterStatus = ref('')
const filterNationality = ref('')
const filterMinExperience = ref('')
const filterCertificateStatus = ref('')
const filterAircraftType = ref('')
const showAdvancedFilters = ref(false)
const sortField = ref('lastName')
const sortOrder = ref('ascending')

// Dialog state
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const dialogMode = ref('create')
const currentCrewMember = ref({})
const viewingCrewMember = ref(null)
const activeTab = ref('personal')

// Countries mapping
const countries = {
  'TR': { name: 'Türkiye', flag: '🇹🇷' },
  'US': { name: 'ABD', flag: '🇺🇸' },
  'GB': { name: 'İngiltere', flag: '🇬🇧' },
  'DE': { name: 'Almanya', flag: '🇩🇪' },
  'FR': { name: 'Fransa', flag: '🇫🇷' },
  'IT': { name: 'İtalya', flag: '🇮🇹' },
  'ES': { name: 'İspanya', flag: '🇪🇸' },
  'NL': { name: 'Hollanda', flag: '🇳🇱' },
  'AE': { name: 'BAE', flag: '🇦🇪' },
  'QA': { name: 'Katar', flag: '🇶🇦' },
  'JP': { name: 'Japonya', flag: '🇯🇵' },
  'SG': { name: 'Singapur', flag: '🇸🇬' }
}

// Computed
const crewMembers = computed(() => referenceStore.crewMembers)
const airlines = computed(() => referenceStore.airlines)

const availableAirlines = computed(() => {
  const airlineSet = new Set(crewMembers.value.map(c => c.airlineId))
  return airlines.value.filter(airline => airlineSet.has(airline.id))
})

const availableNationalities = computed(() => {
  const nationalitySet = new Set(crewMembers.value.map(c => c.nationality))
  return Array.from(nationalitySet).map(code => ({
    code,
    name: countries[code]?.name || code
  }))
})

const availableAircraftTypes = computed(() => {
  const typesSet = new Set()
  crewMembers.value.forEach(crew => {
    if (crew.qualifiedAircraftTypes?.length) {
      crew.qualifiedAircraftTypes.forEach(type => typesSet.add(type))
    }
  })
  return Array.from(typesSet)
})

const filteredCrewMembers = computed(() => {
  let result = [...crewMembers.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(crew =>
      crew.firstName?.toLowerCase().includes(query) ||
      crew.lastName?.toLowerCase().includes(query) ||
      crew.employeeId?.toLowerCase().includes(query) ||
      crew.licenseNumber?.toLowerCase().includes(query) ||
      crew.email?.toLowerCase().includes(query)
    )
  }

  // Role filter
  if (filterRole.value) {
    result = result.filter(crew => crew.role === filterRole.value)
  }

  // Airline filter
  if (filterAirline.value) {
    result = result.filter(crew => crew.airlineId === filterAirline.value)
  }

  // Employment status filter
  if (filterStatus.value) {
    result = result.filter(crew => crew.employmentStatus === filterStatus.value)
  }

  // Nationality filter
  if (filterNationality.value) {
    result = result.filter(crew => crew.nationality === filterNationality.value)
  }

  // Experience filter
  if (filterMinExperience.value) {
    result = result.filter(crew =>
      crew.experienceYears && crew.experienceYears >= filterMinExperience.value
    )
  }

  // Certificate status filter
  if (filterCertificateStatus.value) {
    result = result.filter(crew => {
      const licenseStatus = getCertificateStatus(crew.licenseExpiry)
      const medicalStatus = getCertificateStatus(crew.medicalCertificateExpiry)
      
      switch (filterCertificateStatus.value) {
        case 'valid':
          return licenseStatus === 'success' && medicalStatus === 'success'
        case 'expiring':
          return licenseStatus === 'warning' || medicalStatus === 'warning'
        case 'expired':
          return licenseStatus === 'danger' || medicalStatus === 'danger'
        default:
          return true
      }
    })
  }

  // Aircraft type filter
  if (filterAircraftType.value) {
    result = result.filter(crew =>
      crew.qualifiedAircraftTypes?.includes(filterAircraftType.value)
    )
  }

  // Sort
  result.sort((a, b) => {
    let aVal = a[sortField.value] || ''
    let bVal = b[sortField.value] || ''

    if (sortField.value === 'firstName' || sortField.value === 'lastName') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }

    if (sortOrder.value === 'ascending') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })

  return result
})

const totalCrewMembers = computed(() => filteredCrewMembers.value.length)

const paginatedCrewMembers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredCrewMembers.value.slice(start, end)
})

// Statistics computed
const pilotsCount = computed(() => {
  return crewMembers.value.filter(c => 
    ['CAPTAIN', 'FIRST_OFFICER', 'FLIGHT_ENGINEER'].includes(c.role)
  ).length
})

const cabinCrewCount = computed(() => {
  return crewMembers.value.filter(c => c.role === 'CABIN_CREW').length
})

const activeCrewCount = computed(() => {
  return crewMembers.value.filter(c => c.active && c.employmentStatus === 'ACTIVE').length
})

const averageExperience = computed(() => {
  const crewWithExperience = crewMembers.value.filter(c => c.experienceYears)
  if (crewWithExperience.length === 0) return 0

  const totalExperience = crewWithExperience.reduce((sum, crew) => sum + crew.experienceYears, 0)
  return totalExperience / crewWithExperience.length
})

// Methods
function getAirlineCode(airlineId) {
  const airline = airlines.value.find(a => a.id === airlineId)
  return airline ? airline.code : 'N/A'
}

function getAirlineName(airlineId) {
  const airline = airlines.value.find(a => a.id === airlineId)
  return airline ? airline.name : 'Bilinmeyen Havayolu'
}

function getCountryName(code) {
  return countries[code]?.name || code
}

function getRoleText(role) {
  const roles = {
    'CAPTAIN': 'Kaptan Pilot',
    'FIRST_OFFICER': 'Yardımcı Pilot',
    'FLIGHT_ENGINEER': 'Uçuş Mühendisi',
    'CABIN_CREW': 'Kabin Görevlisi'
  }
  return roles[role] || role
}

function getRoleTagType(role) {
  const tagTypes = {
    'CAPTAIN': 'danger',
    'FIRST_OFFICER': 'primary',
    'FLIGHT_ENGINEER': 'warning',
    'CABIN_CREW': 'success'
  }
  return tagTypes[role] || 'default'
}

function getEmploymentStatusText(status) {
  const statuses = {
    'ACTIVE': 'Aktif',
    'ON_LEAVE': 'İzinli',
    'SUSPENDED': 'Askıda',
    'RETIRED': 'Emekli',
    'RESIGNED': 'İstifa'
  }
  return statuses[status] || status
}

function getEmploymentStatusTagType(status) {
  const tagTypes = {
    'ACTIVE': 'success',
    'ON_LEAVE': 'warning',
    'SUSPENDED': 'danger',
    'RETIRED': 'info',
    'RESIGNED': 'info'
  }
  return tagTypes[status] || 'default'
}

function formatDate(date) {
  if (!date) return '-'
  return dayjs(date).format('DD.MM.YYYY')
}

function getCertificateStatus(expiryDate) {
  if (!expiryDate) return 'info'
  
  const now = dayjs()
  const expiry = dayjs(expiryDate)
  const daysUntilExpiry = expiry.diff(now, 'day')
  
  if (daysUntilExpiry < 0) {
    return 'danger' // Expired
  } else if (daysUntilExpiry <= 30) {
    return 'warning' // Expiring soon
  } else {
    return 'success' // Valid
  }
}

async function loadCrewMembers() {
  loading.value = true
  try {
    await referenceStore.fetchCrewMembers(true)
  } catch (error) {
    ElMessage.error('Mürettebat üyeleri yüklenirken hata oluştu')
  } finally {
    loading.value = false
  }
}

function handleCreate() {
  dialogMode.value = 'create'
  currentCrewMember.value = {
    active: true,
    employmentStatus: 'ACTIVE',
    role: 'CABIN_CREW',
    nationality: 'TR',
    languages: ['Türkçe'],
    qualifiedAircraftTypes: []
  }
  dialogVisible.value = true
}

function handleEdit(crewMember) {
  dialogMode.value = 'edit'
  currentCrewMember.value = { ...crewMember }
  dialogVisible.value = true
}

function handleView(crewMember) {
  viewingCrewMember.value = crewMember
  activeTab.value = 'personal'
  viewDialogVisible.value = true
}

async function handleDelete(crewMember) {
  try {
    await ElMessageBox.confirm(
      `"${crewMember.firstName} ${crewMember.lastName}" isimli mürettebat üyesini silmek istediğinizden emin misiniz?`,
      'Mürettebat Sil',
      {
        confirmButtonText: 'Sil',
        cancelButtonText: 'İptal',
        type: 'warning'
      }
    )

    await referenceStore.deleteCrewMember(crewMember.id)
    ElMessage.success('Mürettebat üyesi başarıyla silindi')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Mürettebat üyesi silinirken hata oluştu')
    }
  }
}

async function handleStatusChange(crewMember) {
  crewMember.statusLoading = true
  try {
    await referenceStore.updateCrewMember(crewMember.id, { active: crewMember.active })
    ElMessage.success(`Mürettebat üyesi ${crewMember.active ? 'aktifleştirildi' : 'pasifleştirildi'}`)
  } catch (error) {
    crewMember.active = !crewMember.active
    ElMessage.error('Durum güncellenirken hata oluştu')
  } finally {
    crewMember.statusLoading = false
  }
}

async function handleFormSubmit(formData) {
  submitting.value = true
  try {
    if (dialogMode.value === 'create') {
      await referenceStore.createCrewMember(formData)
      ElMessage.success('Mürettebat üyesi başarıyla oluşturuldu')
    } else {
      await referenceStore.updateCrewMember(currentCrewMember.value.id, formData)
      ElMessage.success('Mürettebat üyesi başarıyla güncellendi')
    }

    dialogVisible.value = false
    currentCrewMember.value = {}
  } catch (error) {
    ElMessage.error(
      dialogMode.value === 'create'
        ? 'Mürettebat üyesi oluşturulurken hata oluştu'
        : 'Mürettebat üyesi güncellenirken hata oluştu'
    )
  } finally {
    submitting.value = false
  }
}

function handleDialogClose() {
  dialogVisible.value = false
  currentCrewMember.value = {}
}

function handleSelectionChange(selection) {
  selectedRows.value = selection
}

function handleSortChange({ prop, order }) {
  sortField.value = prop
  sortOrder.value = order
}

function handleSearch() {
  currentPage.value = 1
}

function handleSearchClear() {
  searchQuery.value = ''
  currentPage.value = 1
}

function handleFilter() {
  currentPage.value = 1
}

function toggleAdvancedFilters() {
  showAdvancedFilters.value = !showAdvancedFilters.value
}

function clearFilters() {
  filterRole.value = ''
  filterAirline.value = ''
  filterStatus.value = ''
  filterNationality.value = ''
  filterMinExperience.value = ''
  filterCertificateStatus.value = ''
  filterAircraftType.value = ''
  currentPage.value = 1
}

function handleRefresh() {
  loadCrewMembers()
}

function handleImport() {
  ElMessage.info('İçe aktarma özelliği yakında eklenecek')
}

function handleExport() {
  ElMessage.info('Dışa aktarma özelliği yakında eklenecek')
}

async function handleBulkAction(command) {
  if (selectedRows.value.length === 0) return

  try {
    const count = selectedRows.value.length
    await ElMessageBox.confirm(
      `${count} mürettebat üyesi için ${command} işlemini gerçekleştirmek istediğinizden emin misiniz?`,
      'Toplu İşlem',
      {
        confirmButtonText: 'Evet',
        cancelButtonText: 'İptal',
        type: 'warning'
      }
    )

    switch (command) {
      case 'activate':
        ElMessage.success(`${count} mürettebat üyesi aktifleştirildi`)
        break
      case 'deactivate':
        ElMessage.success(`${count} mürettebat üyesi pasifleştirildi`)
        break
      case 'leave':
        ElMessage.success(`${count} mürettebat üyesi izne çıkarıldı`)
        break
      case 'training':
        ElMessage.success(`${count} mürettebat üyesi eğitime gönderildi`)
        break
      case 'export':
        ElMessage.success(`${count} mürettebat üyesi dışa aktarıldı`)
        break
      case 'delete':
        ElMessage.success(`${count} mürettebat üyesi silindi`)
        break
    }

    selectedRows.value = []
    await loadCrewMembers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Toplu işlem sırasında hata oluştu')
    }
  }
}

function handleRowAction(command, crewMember) {
  switch (command) {
    case 'duplicate':
      dialogMode.value = 'create'
      currentCrewMember.value = {
        ...crewMember,
        id: undefined,
        employeeId: '',
        licenseNumber: '',
        email: '',
        phone: '',
        firstName: `${crewMember.firstName} (Kopya)`
      }
      dialogVisible.value = true
      break
    case 'schedule':
      viewSchedule(crewMember)
      break
    case 'training':
      viewTrainingRecords(crewMember)
      break
    case 'leave':
      grantLeave(crewMember)
      break
  }
}

function viewFlightHistory(crewMember) {
  router.push({
    name: 'FlightHistory',
    query: { crewMember: crewMember.id }
  })
}

function viewSchedule(crewMember) {
  router.push({
    name: 'CrewSchedule',
    query: { crewMember: crewMember.id }
  })
}

function viewTrainingRecords(crewMember) {
  router.push({
    name: 'TrainingRecords',
    query: { crewMember: crewMember.id }
  })
}

async function grantLeave(crewMember) {
  try {
    await ElMessageBox.confirm(
      `${crewMember.firstName} ${crewMember.lastName} isimli mürettebat üyesini izne çıkarmak istediğinizden emin misiniz?`,
      'İzin Ver',
      {
        confirmButtonText: 'İzin Ver',
        cancelButtonText: 'İptal',
        type: 'warning'
      }
    )

    await referenceStore.updateCrewMember(crewMember.id, { employmentStatus: 'ON_LEAVE' })
    ElMessage.success('Mürettebat üyesi izne çıkarıldı')
    await loadCrewMembers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('İzin verme işlemi sırasında hata oluştu')
    }
  }
}

function sendEmail(email) {
  window.location.href = `mailto:${email}`
}

function callPhone(phone) {
  window.location.href = `tel:${phone}`
}

function handleSizeChange(size) {
  pageSize.value = size
  currentPage.value = 1
}

function handlePageChange(page) {
  currentPage.value = page
}

// Lifecycle
onMounted(async () => {
  appStore.setPageTitle('Mürettebat Yönetimi')
  await Promise.all([
    loadCrewMembers(),
    referenceStore.fetchAirlines()
  ])
})

// Watch for route query changes
watch(() => router.currentRoute.value.query, (query) => {
  if (query.search) {
    searchQuery.value = query.search
  }
  if (query.airline) {
    filterAirline.value = parseInt(query.airline)
  }
  if (query.role) {
    filterRole.value = query.role
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
.crew-management {
  padding: 1.5rem;

  .page-header {
    margin-bottom: 2rem;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;

      .page-title {
        display: flex;
        align-items: center;
        gap: 1rem;

        h1 {
          margin: 0;
          font-size: 1.75rem;
          font-weight: 600;
          color: #303133;
        }
      }

      .header-actions {
        display: flex;
        gap: 0.75rem;
      }
    }

    .search-filters {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;

      .search-bar {
        flex: 1;
        max-width: 400px;

        .search-input {
          width: 100%;
        }
      }

      .filters {
        display: flex;
        gap: 0.75rem;
        align-items: center;

        .filter-select {
          width: 140px;
        }
      }
    }

    .advanced-filters {
      margin-top: 1rem;

      .advanced-filters-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        align-items: end;
      }
    }
  }

  .stats-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;

    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;
        gap: 1rem;

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;

          &.pilots {
            background: linear-gradient(135deg, #f56c6c, #ff7875);
            color: white;
          }

          &.cabin {
            background: linear-gradient(135deg, #409eff, #66b1ff);
            color: white;
          }

          &.active {
            background: linear-gradient(135deg, #67c23a, #85ce61);
            color: white;
          }

          &.experience {
            background: linear-gradient(135deg, #e6a23c, #ebb563);
            color: white;
          }
        }

        .stat-info {
          .stat-number {
            font-size: 1.5rem;
            font-weight: 700;
            color: #303133;
            line-height: 1;
          }

          .stat-label {
            font-size: 0.875rem;
            color: #606266;
            margin-top: 0.25rem;
          }
        }
      }
    }
  }

  .table-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .data-table {
      .employee-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .avatar-section {
          flex-shrink: 0;
        }

        .info-section {
          flex: 1;

          .name {
            font-weight: 600;
            color: #303133;
            margin-bottom: 0.25rem;
          }

          .employee-id, .license {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.875rem;
            color: #909399;
            margin-bottom: 0.125rem;

            .el-icon {
              font-size: 0.75rem;
            }
          }
        }
      }

      .role-airline {
        .role {
          margin-bottom: 0.5rem;
        }

        .airline {
          .airline-tag {
            background-color: #f0f9ff;
            border-color: #409eff;
            color: #409eff;
            margin-bottom: 0.25rem;
          }

          .airline-name {
            font-size: 0.75rem;
            color: #909399;
          }
        }
      }

      .experience-hours {
        .experience, .hours {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          margin-bottom: 0.25rem;
          font-size: 0.875rem;

          .el-icon {
            color: #909399;
            font-size: 0.75rem;
          }
        }
      }

      .qualifications {
        .aircraft-types {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          margin-bottom: 0.5rem;

          .aircraft-tag {
            font-size: 0.75rem;
            background-color: #f5f7fa;
            border-color: #909399;
            color: #606266;
          }
        }

        .languages {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: #909399;

          .el-icon {
            font-size: 0.875rem;
          }
        }
      }

      .certificates {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .contact-actions {
        display: flex;
        gap: 0.25rem;
        justify-content: center;
      }

      .action-buttons {
        display: flex;
        gap: 0.25rem;
        justify-content: center;
        flex-wrap: wrap;
      }
    }

    .pagination-container {
      padding: 1rem;
      display: flex;
      justify-content: center;
      border-top: 1px solid #ebeef5;
    }
  }

  .airline-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .airline-code {
      font-weight: 600;
      color: #409eff;
    }
  }

  .crew-details {
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;

      .crew-title {
        display: flex;
        align-items: center;
        gap: 1rem;

        .title-info {
          h3 {
            margin: 0 0 0.5rem 0;
            color: #303133;
            font-size: 1.25rem;
          }

          .subtitle {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #606266;
          }
        }
      }

      .status-badges {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-end;
      }
    }

    .detail-tabs {
      .detail-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-bottom: 1.5rem;
      }

      .detail-section {
        &.full-width {
          grid-column: 1 / -1;
        }

        h4 {
          margin: 0 0 1rem 0;
          color: #606266;
          font-size: 1rem;
          border-bottom: 1px solid #ebeef5;
          padding-bottom: 0.5rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;

          .label {
            font-weight: 500;
            color: #606266;
            min-width: 120px;
            margin-right: 1rem;
          }

          .link {
            color: #409eff;
            text-decoration: none;

            &:hover {
              text-decoration: underline;
            }
          }
        }

        .aircraft-types-list, .languages-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;

          .aircraft-tag, .language-tag {
            background-color: #f0f9ff;
            border-color: #409eff;
            color: #409eff;
          }
        }

        .notes-content {
          p {
            margin: 0;
            line-height: 1.6;
            color: #303133;
          }
        }

        .no-notes {
          text-align: center;
          padding: 2rem 0;
        }
      }
    }

    .detail-actions {
      display: flex;
      gap: 1rem;
      padding-top: 1.5rem;
      border-top: 1px solid #ebeef5;
      justify-content: center;
    }
  }
}

// Responsive
@media (max-width: 768px) {
  .crew-management {
    padding: 1rem;

    .page-header {
      .header-content {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;

        .page-title {
          justify-content: center;
        }

        .header-actions {
          justify-content: center;
          flex-wrap: wrap;
        }
      }

      .search-filters {
        flex-direction: column;
        align-items: stretch;

        .filters {
          justify-content: center;
          flex-wrap: wrap;

          .filter-select {
            width: 120px;
          }
        }
      }
    }

    .stats-cards {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .table-container {
      .data-table {
        :deep(.el-table__body-wrapper) {
          overflow-x: auto;
        }

        .employee-info {
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.5rem;
        }

        .action-buttons {
          flex-direction: column;
          gap: 0.25rem;

          .el-button {
            padding: 0.25rem;
            min-width: auto;
          }
        }
      }
    }

    .crew-details {
      .detail-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;

        .crew-title {
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .status-badges {
          flex-direction: row;
          align-items: center;
          justify-content: center;
        }
      }

      .detail-tabs {
        .detail-grid {
          grid-template-columns: 1fr;
          gap: 1rem;
        }
      }

      .detail-actions {
        flex-direction: column;

        .el-button {
          width: 100%;
        }
      }
    }
  }
}

// Table animations
:deep(.el-table__row) {
  transition: all 0.3s ease;

  &:hover {
    background-color: #f5f7fa;
  }
}

// Tag styling
:deep(.el-tag) {
  &.el-tag--primary {
    background-color: #409eff;
    border-color: #409eff;
  }

  &.el-tag--success {
    background-color: #67c23a;
    border-color: #67c23a;
  }

  &.el-tag--warning {
    background-color: #e6a23c;
    border-color: #e6a23c;
  }

  &.el-tag--info {
    background-color: #909399;
    border-color: #909399;
  }

  &.el-tag--danger {
    background-color: #f56c6c;
    border-color: #f56c6c;
  }
}

// Button hover effects
.action-buttons {
  :deep(.el-button) {
    &:hover {
      transform: translateY(-1px);
    }

    &.el-button--success:hover {
      background-color: #5daf34;
    }
  }
}

// Switch styling
:deep(.el-switch) {
  &.is-checked .el-switch__core {
    background-color: #67c23a;
  }
}

// Loading state
:deep(.el-loading-mask) {
  border-radius: 8px;
}

// Dialog animations
:deep(.el-dialog) {
  .el-dialog__header {
    border-bottom: 1px solid #ebeef5;
    padding-bottom: 1rem;
  }

  .el-dialog__body {
    padding-top: 1.5rem;
  }
}

// Empty state
:deep(.el-table__empty-block) {
  padding: 4rem 0;

  .el-table__empty-text {
    color: #909399;
    font-size: 1rem;
  }
}

// Contact buttons
.contact-actions {
  .el-button {
    border: none;
    background: transparent;

    &:hover {
      background-color: #f5f7fa;
    }
  }
}
</style>
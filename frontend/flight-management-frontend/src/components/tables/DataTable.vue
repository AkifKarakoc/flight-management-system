<template>
  <div class="data-table">
    <!-- Table Toolbar -->
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-input
          v-if="searchable"
          v-model="searchQuery"
          placeholder="Ara..."
          :prefix-icon="Search"
          clearable
          style="width: 300px"
          @input="handleSearch"
        />
      </div>

      <div class="toolbar-right">
        <el-button
          v-if="showRefresh"
          :icon="Refresh"
          @click="$emit('refresh')"
          :loading="loading"
        >
          Yenile
        </el-button>

        <el-button
          v-if="showCreate"
          type="primary"
          :icon="Plus"
          @click="$emit('create')"
        >
          {{ createText }}
        </el-button>
      </div>
    </div>

    <!-- Table -->
    <el-table
      :data="filteredData"
      v-loading="loading"
      stripe
      highlight-current-row
      style="width: 100%"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
    >
      <!-- Selection Column -->
      <el-table-column
        v-if="selectable"
        type="selection"
        width="55"
        align="center"
      />

      <!-- Index Column -->
      <el-table-column
        v-if="showIndex"
        type="index"
        label="#"
        width="60"
        align="center"
      />

      <!-- Dynamic Columns -->
      <el-table-column
        v-for="column in columns"
        :key="column.prop"
        :prop="column.prop"
        :label="column.label"
        :width="column.width"
        :min-width="column.minWidth"
        :sortable="column.sortable"
        :align="column.align || 'left'"
        :show-overflow-tooltip="column.showOverflowTooltip !== false"
      >
        <template #default="scope" v-if="column.slot">
          <slot :name="column.slot" :row="scope.row" :index="scope.$index" />
        </template>

        <template #default="scope" v-else-if="column.formatter">
          <span>{{ column.formatter(scope.row[column.prop], scope.row) }}</span>
        </template>

        <template #default="scope" v-else-if="column.type === 'tag'">
          <el-tag
            :type="getTagType(scope.row[column.prop], column.tagMap)"
            size="small"
          >
            {{ getTagText(scope.row[column.prop], column.tagMap) }}
          </el-tag>
        </template>

        <template #default="scope" v-else-if="column.type === 'switch'">
          <el-switch
            v-model="scope.row[column.prop]"
            @change="(val) => handleSwitchChange(scope.row, column.prop, val)"
            :disabled="column.disabled && column.disabled(scope.row)"
          />
        </template>

        <template #default="scope" v-else-if="column.type === 'image'">
          <el-avatar
            :src="scope.row[column.prop]"
            :size="column.size || 32"
            :icon="UserFilled"
          />
        </template>
      </el-table-column>

      <!-- Actions Column -->
      <el-table-column
        v-if="showActions"
        label="İşlemler"
        :width="actionsWidth"
        align="center"
        fixed="right"
      >
        <template #default="scope">
          <div class="action-buttons">
            <el-tooltip content="Görüntüle" v-if="actions.includes('view')">
              <el-button
                size="small"
                :icon="View"
                @click="$emit('view', scope.row)"
              />
            </el-tooltip>

            <el-tooltip content="Düzenle" v-if="actions.includes('edit')">
              <el-button
                size="small"
                type="primary"
                :icon="Edit"
                @click="$emit('edit', scope.row)"
              />
            </el-tooltip>

            <el-tooltip content="Sil" v-if="actions.includes('delete')">
              <el-button
                size="small"
                type="danger"
                :icon="Delete"
                @click="handleDelete(scope.row)"
              />
            </el-tooltip>

            <!-- Custom Actions -->
            <template v-if="customActions && customActions.length > 0">
              <el-tooltip
                v-for="action in customActions"
                :key="action.key"
                :content="action.tooltip"
              >
                <el-button
                  size="small"
                  :type="action.type || 'default'"
                  :icon="action.icon"
                  @click="$emit('custom-action', action.key, scope.row)"
                />
              </el-tooltip>
            </template>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <div class="table-pagination" v-if="showPagination && total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="pageSizes"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import {
  Search, Refresh, Plus, View, Edit, Delete, UserFilled
} from '@element-plus/icons-vue'
import { debounce } from '@/utils/helpers'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  columns: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  searchable: {
    type: Boolean,
    default: true
  },
  selectable: {
    type: Boolean,
    default: false
  },
  showIndex: {
    type: Boolean,
    default: false
  },
  showActions: {
    type: Boolean,
    default: true
  },
  actions: {
    type: Array,
    default: () => ['edit', 'delete']
  },
  customActions: {
    type: Array,
    default: () => []
  },
  actionsWidth: {
    type: [String, Number],
    default: 150
  },
  showCreate: {
    type: Boolean,
    default: true
  },
  createText: {
    type: String,
    default: 'Yeni Ekle'
  },
  showRefresh: {
    type: Boolean,
    default: true
  },
  showPagination: {
    type: Boolean,
    default: true
  },
  pageSize: {
    type: Number,
    default: 20
  },
  pageSizes: {
    type: Array,
    default: () => [10, 20, 50, 100]
  },
  total: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits([
  'create', 'edit', 'delete', 'view', 'refresh',
  'custom-action', 'selection-change', 'search',
  'size-change', 'current-change', 'sort-change',
  'switch-change'
])

const searchQuery = ref('')
const currentPage = ref(1)
const selectedRows = ref([])

// Computed
const filteredData = computed(() => {
  if (!searchQuery.value) return props.data

  const query = searchQuery.value.toLowerCase()
  return props.data.filter(row => {
    return props.columns.some(column => {
      const value = row[column.prop]
      if (value === null || value === undefined) return false
      return String(value).toLowerCase().includes(query)
    })
  })
})

// Methods
const handleSearch = debounce((query) => {
  emit('search', query)
}, 300)

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
  emit('selection-change', selection)
}

const handleSortChange = (sort) => {
  emit('sort-change', sort)
}

const handleSizeChange = (size) => {
  emit('size-change', size)
}

const handleCurrentChange = (page) => {
  emit('current-change', page)
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      'Bu kaydı silmek istediğinizden emin misiniz?',
      'Onay',
      {
        confirmButtonText: 'Evet',
        cancelButtonText: 'Hayır',
        type: 'warning'
      }
    )
    emit('delete', row)
  } catch (error) {
    // User cancelled
  }
}

const handleSwitchChange = (row, prop, value) => {
  emit('switch-change', { row, prop, value })
}

const getTagType = (value, tagMap) => {
  return tagMap && tagMap[value] ? tagMap[value].type : 'info'
}

const getTagText = (value, tagMap) => {
  return tagMap && tagMap[value] ? tagMap[value].text : value
}

// Watch for external page changes
watch(() => props.pageSize, (newSize) => {
  currentPage.value = 1
})
</script>

<style scoped>
.data-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.table-pagination {
  padding: 16px 24px;
  display: flex;
  justify-content: center;
  border-top: 1px solid #ebeef5;
  background: #fafafa;
}

:deep(.el-table) {
  border-radius: 0;
}

:deep(.el-table__header) {
  th {
    background-color: #f8f9fa;
    color: #606266;
    font-weight: 600;
  }
}

:deep(.el-table__row) {
  transition: background-color 0.2s;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}

@media (max-width: 768px) {
  .table-toolbar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .toolbar-left,
  .toolbar-right {
    justify-content: center;
  }

  .action-buttons {
    flex-wrap: wrap;
  }
}
</style>

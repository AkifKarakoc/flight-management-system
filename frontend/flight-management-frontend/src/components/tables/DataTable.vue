<template>
  <div class="data-table">
    <!-- Table Header -->
    <div v-if="showToolbar" class="table-toolbar">
      <div class="toolbar-left">
        <slot name="toolbar-left">
          <h3 v-if="title" class="table-title">{{ title }}</h3>
        </slot>
      </div>

      <div class="toolbar-right">
        <slot name="toolbar-right">
          <!-- Search -->
          <el-input
            v-if="searchable"
            v-model="searchQuery"
            placeholder="Ara..."
            :prefix-icon="Search"
            size="small"
            style="width: 200px; margin-right: 12px;"
            clearable
          />

          <!-- Refresh Button -->
          <el-button
            v-if="refreshable"
            :icon="Refresh"
            size="small"
            @click="handleRefresh"
            :loading="loading"
          >
            Yenile
          </el-button>

          <!-- Add Button -->
          <el-button
            v-if="showAddButton"
            type="primary"
            :icon="Plus"
            size="small"
            @click="handleAdd"
          >
            {{ addButtonText }}
          </el-button>
        </slot>
      </div>
    </div>

    <!-- Table -->
    <el-table
      ref="tableRef"
      :data="filteredData"
      v-loading="loading"
      :stripe="stripe"
      :border="border"
      :size="size"
      :height="height"
      :max-height="maxHeight"
      :show-header="showHeader"
      :highlight-current-row="highlightCurrentRow"
      :row-key="rowKey"
      :tree-props="treeProps"
      :default-sort="defaultSort"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
      @row-click="handleRowClick"
      @row-dblclick="handleRowDblclick"
      class="custom-table"
    >
      <!-- Selection Column -->
      <el-table-column
        v-if="selectable"
        type="selection"
        width="55"
        fixed="left"
      />

      <!-- Index Column -->
      <el-table-column
        v-if="showIndex"
        type="index"
        label="#"
        width="60"
        fixed="left"
      />

      <!-- Dynamic Columns -->
      <el-table-column
        v-for="column in columns"
        :key="column.prop"
        :prop="column.prop"
        :label="column.label"
        :width="column.width"
        :min-width="column.minWidth"
        :fixed="column.fixed"
        :sortable="column.sortable"
        :sort-method="column.sortMethod"
        :formatter="column.formatter"
        :show-overflow-tooltip="column.showOverflowTooltip !== false"
        :align="column.align || 'left'"
        :header-align="column.headerAlign || column.align || 'left'"
      >
        <template v-if="column.slot" #default="scope">
          <slot :name="column.slot" :row="scope.row" :column="column" :$index="scope.$index" />
        </template>

        <template v-else-if="column.type === 'tag'" #default="scope">
          <el-tag
            :type="getTagType(scope.row[column.prop], column)"
            :size="column.tagSize || 'small'"
            :effect="column.tagEffect || 'light'"
          >
            {{ getTagText(scope.row[column.prop], column) }}
          </el-tag>
        </template>

        <template v-else-if="column.type === 'switch'" #default="scope">
          <el-switch
            v-model="scope.row[column.prop]"
            :disabled="column.disabled"
            @change="(value) => handleSwitchChange(scope.row, column.prop, value)"
          />
        </template>

        <template v-else-if="column.type === 'image'" #default="scope">
          <el-image
            :src="scope.row[column.prop]"
            :style="{ width: column.imageWidth || '40px', height: column.imageHeight || '40px' }"
            fit="cover"
            :preview-src-list="[scope.row[column.prop]]"
          />
        </template>

        <template v-else-if="column.type === 'link'" #default="scope">
          <el-link
            :type="column.linkType || 'primary'"
            :href="column.linkHref ? column.linkHref(scope.row) : undefined"
            :target="column.linkTarget || '_blank'"
            @click="column.linkClick ? column.linkClick(scope.row) : undefined"
          >
            {{ scope.row[column.prop] }}
          </el-link>
        </template>

        <template v-else-if="column.type === 'progress'" #default="scope">
          <el-progress
            :percentage="scope.row[column.prop]"
            :status="getProgressStatus(scope.row[column.prop], column)"
            :stroke-width="column.progressStrokeWidth || 6"
            :show-text="column.showProgressText !== false"
          />
        </template>
      </el-table-column>

      <!-- Actions Column -->
      <el-table-column
        v-if="actions && actions.length > 0"
        label="İşlemler"
        :width="actionsWidth"
        fixed="right"
        align="center"
      >
        <template #default="scope">
          <div class="table-actions">
            <template v-for="action in getVisibleActions(scope.row)" :key="action.key">
              <el-button
                v-if="action.type === 'button'"
                :type="action.buttonType || 'primary'"
                :size="action.size || 'small'"
                :icon="action.icon"
                :disabled="action.disabled && action.disabled(scope.row)"
                :loading="action.loading && action.loading(scope.row)"
                :text="action.text"
                :link="action.link"
                @click="handleAction(action, scope.row, scope.$index)"
              >
                {{ action.label }}
              </el-button>

              <el-dropdown
                v-else-if="action.type === 'dropdown'"
                @command="(command) => handleAction(action, scope.row, scope.$index, command)"
              >
                <el-button
                  :type="action.buttonType || 'primary'"
                  :size="action.size || 'small'"
                  :icon="action.icon"
                  text
                >
                  {{ action.label }}
                  <el-icon class="el-icon--right"><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="item in action.items"
                      :key="item.key"
                      :command="item.key"
                      :disabled="item.disabled && item.disabled(scope.row)"
                    >
                      <el-icon v-if="item.icon">
                        <component :is="item.icon" />
                      </el-icon>
                      {{ item.label }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </div>
        </template>
      </el-table-column>

      <!-- Empty State -->
      <template #empty>
        <div class="table-empty">
          <slot name="empty">
            <el-empty :description="emptyText" :image-size="80" />
          </slot>
        </div>
      </template>
    </el-table>

    <!-- Pagination -->
    <div v-if="showPagination" class="table-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="pageSizes"
        :total="total"
        :layout="paginationLayout"
        :background="true"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Search, Refresh, Plus, ArrowDown } from '@element-plus/icons-vue'

const props = defineProps({
  // Data
  data: {
    type: Array,
    default: () => []
  },
  columns: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },

  // Table appearance
  title: {
    type: String,
    default: ''
  },
  stripe: {
    type: Boolean,
    default: true
  },
  border: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'default',
    validator: value => ['large', 'default', 'small'].includes(value)
  },
  height: {
    type: [String, Number],
    default: ''
  },
  maxHeight: {
    type: [String, Number],
    default: ''
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  highlightCurrentRow: {
    type: Boolean,
    default: false
  },

  // Selection
  selectable: {
    type: Boolean,
    default: false
  },
  showIndex: {
    type: Boolean,
    default: false
  },
  rowKey: {
    type: [String, Function],
    default: ''
  },

  // Tree table
  treeProps: {
    type: Object,
    default: () => ({})
  },

  // Sorting
  defaultSort: {
    type: Object,
    default: () => ({})
  },

  // Toolbar
  showToolbar: {
    type: Boolean,
    default: true
  },
  searchable: {
    type: Boolean,
    default: true
  },
  refreshable: {
    type: Boolean,
    default: true
  },
  showAddButton: {
    type: Boolean,
    default: false
  },
  addButtonText: {
    type: String,
    default: 'Ekle'
  },

  // Actions
  actions: {
    type: Array,
    default: () => []
  },
  actionsWidth: {
    type: [String, Number],
    default: 150
  },

  // Pagination
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
  paginationLayout: {
    type: String,
    default: 'total, sizes, prev, pager, next, jumper'
  },

  // Empty state
  emptyText: {
    type: String,
    default: 'Veri bulunamadı'
  }
})

const emit = defineEmits([
  'refresh',
  'add',
  'selection-change',
  'sort-change',
  'row-click',
  'row-dblclick',
  'action',
  'switch-change',
  'size-change',
  'current-change'
])

const tableRef = ref(null)
const searchQuery = ref('')
const currentPage = ref(1)
const total = computed(() => props.data.length)

// Filtered data based on search
const filteredData = computed(() => {
  if (!searchQuery.value) {
    return props.data
  }

  const query = searchQuery.value.toLowerCase()
  return props.data.filter(row => {
    return Object.values(row).some(value => {
      if (value === null || value === undefined) return false
      return String(value).toLowerCase().includes(query)
    })
  })
})

// Action handlers
const handleRefresh = () => {
  emit('refresh')
}

const handleAdd = () => {
  emit('add')
}

const handleSelectionChange = (selection) => {
  emit('selection-change', selection)
}

const handleSortChange = (sort) => {
  emit('sort-change', sort)
}

const handleRowClick = (row, column, event) => {
  emit('row-click', row, column, event)
}

const handleRowDblclick = (row, column, event) => {
  emit('row-dblclick', row, column, event)
}

const handleAction = (action, row, index, command = null) => {
  emit('action', { action: action.key, row, index, command })
}

const handleSwitchChange = (row, prop, value) => {
  emit('switch-change', { row, prop, value })
}

const handleSizeChange = (size) => {
  emit('size-change', size)
}

const handleCurrentChange = (page) => {
  emit('current-change', page)
}

// Helper functions
const getVisibleActions = (row) => {
  return props.actions.filter(action => {
    if (action.visible && typeof action.visible === 'function') {
      return action.visible(row)
    }
    return action.visible !== false
  })
}

const getTagType = (value, column) => {
  if (column.tagTypeMap && column.tagTypeMap[value]) {
    return column.tagTypeMap[value]
  }
  return 'primary'
}

const getTagText = (value, column) => {
  if (column.tagTextMap && column.tagTextMap[value]) {
    return column.tagTextMap[value]
  }
  return value
}

const getProgressStatus = (value, column) => {
  if (column.progressStatusMap) {
    for (const [threshold, status] of Object.entries(column.progressStatusMap)) {
      if (value <= parseInt(threshold)) {
        return status
      }
    }
  }
  return undefined
}

// Watch for search query changes to reset pagination
watch(searchQuery, () => {
  currentPage.value = 1
})

// Expose table methods
defineExpose({
  clearSelection: () => tableRef.value?.clearSelection(),
  toggleRowSelection: (row, selected) => tableRef.value?.toggleRowSelection(row, selected),
  toggleAllSelection: () => tableRef.value?.toggleAllSelection(),
  setCurrentRow: (row) => tableRef.value?.setCurrentRow(row),
  sort: (prop, order) => tableRef.value?.sort(prop, order)
})
</script>

<style scoped>
.data-table {
  background: white;
  border-radius: 8px;
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
  flex: 1;
}

.table-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-table {
  --el-table-border-color: #ebeef5;
  --el-table-header-bg-color: #f8f9fa;
}

.table-actions {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.table-empty {
  padding: 40px 20px;
}

.table-pagination {
  padding: 16px 24px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #ebeef5;
  background: #fafafa;
}

@media (max-width: 768px) {
  .table-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .toolbar-right {
    justify-content: flex-end;
  }

  .table-pagination {
    justify-content: center;
  }
}
</style>

<template>
  <div :class="tableClass">
    <!-- Table header -->
    <div v-if="showHeader" class="table-header">
      <div class="header-content">
        <div class="header-info">
          <h3 v-if="title" class="table-title">{{ title }}</h3>
          <p v-if="description" class="table-description">{{ description }}</p>
        </div>

        <div class="header-actions">
          <slot name="header-actions" />

          <!-- Search -->
          <BaseInput
            v-if="searchable"
            v-model="searchQuery"
            placeholder="Ara..."
            prefix-icon="Search"
            clearable
            size="small"
            class="table-search"
            @input="handleSearch"
          />

          <!-- Filters -->
          <el-dropdown
            v-if="filterable && filters.length > 0"
            trigger="click"
            @command="handleFilterCommand"
          >
            <BaseButton size="small" icon="Filter">
              Filtreler
              <el-badge
                v-if="activeFiltersCount > 0"
                :value="activeFiltersCount"
                class="filter-badge"
              />
            </BaseButton>
            <template #dropdown>
              <el-dropdown-menu class="filter-menu">
                <div class="filter-content">
                  <div
                    v-for="filter in filters"
                    :key="filter.key"
                    class="filter-item"
                  >
                    <label class="filter-label">{{ filter.label }}</label>
                    <component
                      :is="getFilterComponent(filter.type)"
                      v-model="filterValues[filter.key]"
                      v-bind="filter.props"
                      size="small"
                      @change="applyFilters"
                    />
                  </div>

                  <div class="filter-actions">
                    <BaseButton
                      size="small"
                      @click="clearFilters"
                    >
                      Temizle
                    </BaseButton>
                  </div>
                </div>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- Column visibility -->
          <el-dropdown
            v-if="showColumnToggle"
            trigger="click"
            @command="handleColumnToggle"
          >
            <BaseButton size="small" icon="Setting">
              Sütunlar
            </BaseButton>
            <template #dropdown>
              <el-dropdown-menu class="column-menu">
                <div class="column-content">
                  <div
                    v-for="column in toggleableColumns"
                    :key="column.prop"
                    class="column-item"
                  >
                    <el-checkbox
                      v-model="column.visible"
                      @change="updateColumnVisibility"
                    >
                      {{ column.label }}
                    </el-checkbox>
                  </div>
                </div>
              </el-dropdown-menu>
            </template>
          </el-dropdown>



          <!-- Refresh -->
          <BaseButton
            v-if="refreshable"
            size="small"
            icon="Refresh"
            :loading="loading"
            @click="handleRefresh"
          >
            Yenile
          </BaseButton>
        </div>
      </div>

      <!-- Bulk actions -->
      <div v-if="showBulkActions && selectedRows.length > 0" class="bulk-actions">
        <div class="bulk-info">
          {{ selectedRows.length }} öğe seçili
        </div>
        <div class="bulk-buttons">
          <slot name="bulk-actions" :selected-rows="selectedRows" />
        </div>
      </div>
    </div>

    <!-- Table content -->
    <div class="table-content">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="paginatedData"
        :stripe="stripe"
        :border="border"
        :size="size"
        :fit="fit"
        :show-header="showTableHeader"
        :highlight-current-row="highlightCurrentRow"
        :row-class-name="getRowClassName"
        :row-style="getRowStyle"
        :cell-class-name="getCellClassName"
        :cell-style="getCellStyle"
        :span-method="spanMethod"
        :default-sort="defaultSort"
        :tooltip-effect="tooltipEffect"
        :show-summary="showSummary"
        :sum-text="sumText"
        :summary-method="summaryMethod"
        :max-height="maxHeight"
        :scrollbar-always-on="scrollbarAlwaysOn"
        @select="handleSelect"
        @select-all="handleSelectAll"
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
        @row-dblclick="handleRowDblClick"
        @row-contextmenu="handleRowContextMenu"
        @cell-click="handleCellClick"
        @cell-dblclick="handleCellDblClick"
        @sort-change="handleSortChange"
        @filter-change="handleFilterChange"
        @current-change="handleCurrentChange"
        @header-click="handleHeaderClick"
        @header-contextmenu="handleHeaderContextMenu"
        @expand-change="handleExpandChange"
      >
        <!-- Selection column -->
        <el-table-column
          v-if="selectable"
          type="selection"
          :width="selectionWidth"
          :selectable="selectableFunction"
          fixed="left"
        />

        <!-- Index column -->
        <el-table-column
          v-if="showIndex"
          type="index"
          :label="indexLabel"
          :width="indexWidth"
          :index="getIndexValue"
          fixed="left"
        />

        <!-- Expand column -->
        <el-table-column
          v-if="expandable"
          type="expand"
          :width="expandWidth"
          fixed="left"
        >
          <template #default="{ row, $index }">
            <slot name="expand" :row="row" :index="$index" />
          </template>
        </el-table-column>

        <!-- Dynamic columns -->
        <el-table-column
          v-for="column in visibleColumns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          :fixed="column.fixed"
          :render-header="column.renderHeader"
          :sortable="column.sortable"
          :sort-method="column.sortMethod"
          :sort-by="column.sortBy"
          :sort-orders="column.sortOrders"
          :resizable="column.resizable"
          :formatter="column.formatter"
          :show-overflow-tooltip="column.showOverflowTooltip"
          :align="column.align"
          :header-align="column.headerAlign"
          :class-name="column.className"
          :label-class-name="column.labelClassName"
          :filters="column.filters"
          :filter-placement="column.filterPlacement"
          :filter-multiple="column.filterMultiple"
          :filter-method="column.filterMethod"
          :filtered-value="column.filteredValue"
        >
          <template #default="{ row, column: col, $index }">
            <slot
              :name="`column-${column.prop}`"
              :row="row"
              :column="col"
              :index="$index"
              :value="row[column.prop]"
            >
              <TableCell
                :value="row[column.prop]"
                :type="column.type"
                :format="column.format"
                :options="column.options"
                :row="row"
                :column="column"
              />
            </slot>
          </template>

          <template v-if="column.headerSlot" #header="{ column: col, $index }">
            <slot
              :name="`header-${column.prop}`"
              :column="col"
              :index="$index"
            />
          </template>
        </el-table-column>

        <!-- Actions column -->
        <el-table-column
          v-if="actions && actions.length > 0"
          :label="actionsLabel"
          :width="actionsWidth"
          :min-width="actionsMinWidth"
          :fixed="actionsFixed"
          :align="actionsAlign"
          class-name="table-actions-column"
        >
          <template #default="{ row, $index }">
            <slot name="actions" :row="row" :index="$index">
              <div class="table-actions">
                <template v-for="action in getVisibleActions(row)" :key="action.key">
                  <BaseButton
                    v-if="action.type === 'button'"
                    :type="action.buttonType"
                    :size="actionButtonSize"
                    :icon="action.icon"
                    :disabled="isActionDisabled(action, row)"
                    :loading="isActionLoading(action, row)"
                    :title="action.title || action.label"
                    @click="handleActionClick(action, row, $index)"
                  >
                    {{ action.showLabel ? action.label : '' }}
                  </BaseButton>

                  <el-dropdown
                    v-else-if="action.type === 'dropdown'"
                    trigger="click"
                    :disabled="isActionDisabled(action, row)"
                    @command="(command) => handleDropdownAction(command, row, $index)"
                  >
                    <BaseButton
                      :size="actionButtonSize"
                      :icon="action.icon"
                      :title="action.title || action.label"
                    />
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item
                          v-for="item in action.items"
                          :key="item.key"
                          :command="{ action: item, row, index: $index }"
                          :disabled="isActionDisabled(item, row)"
                          :divided="item.divided"
                          :icon="item.icon"
                        >
                          {{ item.label }}
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </template>
              </div>
            </slot>
          </template>
        </el-table-column>

        <!-- Custom columns slot -->
        <slot />

        <!-- Empty state -->
        <template #empty>
          <slot name="empty">
            <div class="table-empty">
              <div class="empty-icon">
                <el-icon size="48"><Box /></el-icon>
              </div>
              <div class="empty-text">{{ emptyText }}</div>
              <div v-if="emptyDescription" class="empty-description">
                {{ emptyDescription }}
              </div>
              <div v-if="showEmptyAction" class="empty-action">
                <slot name="empty-action">
                  <BaseButton type="primary" @click="handleEmptyAction">
                    {{ emptyActionText }}
                  </BaseButton>
                </slot>
              </div>
            </div>
          </slot>
        </template>
      </el-table>
    </div>

    <!-- Table footer -->
    <div v-if="showFooter" class="table-footer">
      <!-- Pagination -->
      <el-pagination
        v-if="paginated && pagination"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="pageSizes"
        :pager-count="pagerCount"
        :layout="paginationLayout"
        :small="paginationSmall"
        :background="paginationBackground"
        :disabled="loading"
        @size-change="handlePageSizeChange"
        @current-change="handleCurrentPageChange"
      />

      <!-- Table info -->
      <div v-if="showTableInfo" class="table-info">
       <span class="info-text">
         Toplam {{ total }} kayıt
         <span v-if="selectedRows.length > 0">
           ({{ selectedRows.length }} seçili)
         </span>
       </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Box } from '@element-plus/icons-vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
//import TableCell from './TableCell.vue'
import { debounce } from '@/utils/helpers'

const props = defineProps({
  // Data
  data: {
    type: Array,
    default: () => []
  },

  // Table configuration
  title: {
    type: String,
    default: ''
  },

  description: {
    type: String,
    default: ''
  },

  columns: {
    type: Array,
    default: () => []
  },

  // Element Plus table props
  stripe: {
    type: Boolean,
    default: true
  },

  border: {
    type: Boolean,
    default: true
  },

  size: {
    type: String,
    default: 'default',
    validator: (value) => ['large', 'default', 'small'].includes(value)
  },

  fit: {
    type: Boolean,
    default: true
  },

  showHeader: {
    type: Boolean,
    default: true
  },

  showTableHeader: {
    type: Boolean,
    default: true
  },

  highlightCurrentRow: {
    type: Boolean,
    default: false
  },

  tooltipEffect: {
    type: String,
    default: 'dark',
    validator: (value) => ['dark', 'light'].includes(value)
  },

  showSummary: {
    type: Boolean,
    default: false
  },

  sumText: {
    type: String,
    default: 'Toplam'
  },

  summaryMethod: {
    type: Function,
    default: null
  },

  maxHeight: {
    type: [String, Number],
    default: null
  },

  scrollbarAlwaysOn: {
    type: Boolean,
    default: false
  },

  // Selection
  selectable: {
    type: Boolean,
    default: false
  },

  selectionWidth: {
    type: Number,
    default: 55
  },

  selectableFunction: {
    type: Function,
    default: null
  },

  // Index
  showIndex: {
    type: Boolean,
    default: false
  },

  indexLabel: {
    type: String,
    default: '#'
  },

  indexWidth: {
    type: Number,
    default: 50
  },

  // Expand
  expandable: {
    type: Boolean,
    default: false
  },

  expandWidth: {
    type: Number,
    default: 48
  },

  // Actions
  actions: {
    type: Array,
    default: () => []
  },

  actionsLabel: {
    type: String,
    default: 'İşlemler'
  },

  actionsWidth: {
    type: Number,
    default: null
  },

  actionsMinWidth: {
    type: Number,
    default: 120
  },

  actionsFixed: {
    type: [String, Boolean],
    default: 'right'
  },

  actionsAlign: {
    type: String,
    default: 'center'
  },

  actionButtonSize: {
    type: String,
    default: 'small'
  },

  // Search and filters
  searchable: {
    type: Boolean,
    default: false
  },

  searchFields: {
    type: Array,
    default: () => []
  },

  filterable: {
    type: Boolean,
    default: false
  },

  filters: {
    type: Array,
    default: () => []
  },

  // Column toggle
  showColumnToggle: {
    type: Boolean,
    default: false
  },



  // Refresh
  refreshable: {
    type: Boolean,
    default: false
  },

  // Pagination
  paginated: {
    type: Boolean,
    default: false
  },

  pagination: {
    type: Object,
    default: () => ({
      page: 1,
      size: 20,
      total: 0
    })
  },

  pageSizes: {
    type: Array,
    default: () => [10, 20, 50, 100]
  },

  pagerCount: {
    type: Number,
    default: 7
  },

  paginationLayout: {
    type: String,
    default: 'total, sizes, prev, pager, next, jumper'
  },

  paginationSmall: {
    type: Boolean,
    default: false
  },

  paginationBackground: {
    type: Boolean,
    default: true
  },

  // Footer
  showFooter: {
    type: Boolean,
    default: true
  },

  showTableInfo: {
    type: Boolean,
    default: true
  },

  showBulkActions: {
    type: Boolean,
    default: true
  },

  // Empty state
  emptyText: {
    type: String,
    default: 'Veri bulunamadı'
  },

  emptyDescription: {
    type: String,
    default: ''
  },

  showEmptyAction: {
    type: Boolean,
    default: false
  },

  emptyActionText: {
    type: String,
    default: 'Yenile'
  },

  // Loading
  loading: {
    type: Boolean,
    default: false
  },

  // Styling
  rowClassName: {
    type: [String, Function],
    default: ''
  },

  rowStyle: {
    type: [Object, Function],
    default: () => ({})
  },

  cellClassName: {
    type: [String, Function],
    default: ''
  },

  cellStyle: {
    type: [Object, Function],
    default: () => ({})
  },

  spanMethod: {
    type: Function,
    default: null
  },

  defaultSort: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits([
  'select',
  'select-all',
  'selection-change',
  'row-click',
  'row-dblclick',
  'row-contextmenu',
  'cell-click',
  'cell-dblclick',
  'sort-change',
  'filter-change',
  'current-change',
  'header-click',
  'header-contextmenu',
  'expand-change',
  'action-click',
  'search',
  'filter',

  'refresh',
  'page-change',
  'page-size-change',
  'empty-action'
])

// Table reference
const tableRef = ref(null)

// Local state
const searchQuery = ref('')
const filterValues = ref({})
const selectedRows = ref([])
const currentPage = ref(props.pagination?.page || 1)
const pageSize = ref(props.pagination?.size || 20)
const total = ref(props.pagination?.total || 0)

// Column visibility
const columnVisibility = ref({})

// Computed properties
const tableClass = computed(() => {
  const classes = ['base-table']

  if (props.loading) {
    classes.push('table-loading')
  }

  return classes.join(' ')
})

const toggleableColumns = computed(() => {
  return props.columns.filter(column => column.toggleable !== false).map(column => ({
    ...column,
    visible: columnVisibility.value[column.prop] !== false
  }))
})

const visibleColumns = computed(() => {
  return props.columns.filter(column => {
    if (column.toggleable === false) return true
    return columnVisibility.value[column.prop] !== false
  })
})

const filteredData = computed(() => {
  let result = [...props.data]

  // Apply search
  if (searchQuery.value && props.searchFields.length > 0) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(row => {
      return props.searchFields.some(field => {
        const value = row[field]
        return String(value).toLowerCase().includes(query)
      })
    })
  }

  // Apply filters
  Object.keys(filterValues.value).forEach(key => {
    const value = filterValues.value[key]
    if (value !== null && value !== undefined && value !== '') {
      const filter = props.filters.find(f => f.key === key)
      if (filter && filter.filterMethod) {
        result = result.filter(row => filter.filterMethod(value, row))
      }
    }
  })

  return result
})

const paginatedData = computed(() => {
  if (!props.paginated) {
    return filteredData.value
  }

  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value

  // Update total
  total.value = filteredData.value.length

  return filteredData.value.slice(start, end)
})

const activeFiltersCount = computed(() => {
  return Object.values(filterValues.value).filter(value =>
    value !== null && value !== undefined && value !== ''
  ).length
})

// Debounced search
const debouncedSearch = debounce((query) => {
  emit('search', query)
}, 300)

// Methods
const handleSearch = () => {
  debouncedSearch(searchQuery.value)
}

const getFilterComponent = (type) => {
  const componentMap = {
    'select': 'BaseSelect',
    'input': 'BaseInput',
    'date': 'el-date-picker',
    'number': 'el-input-number'
  }
  return componentMap[type] || 'BaseInput'
}

const applyFilters = () => {
  emit('filter', { ...filterValues.value })
}

const clearFilters = () => {
  filterValues.value = {}
  applyFilters()
}

const handleFilterCommand = () => {
  // Handle filter dropdown commands
}

const updateColumnVisibility = () => {
  // Update column visibility
}

const handleColumnToggle = () => {
  // Handle column toggle
}



const handleRefresh = () => {
  emit('refresh')
}

const getIndexValue = (index) => {
  if (props.paginated) {
    return (currentPage.value - 1) * pageSize.value + index + 1
  }
  return index + 1
}

const getRowClassName = ({ row, rowIndex }) => {
  if (typeof props.rowClassName === 'function') {
    return props.rowClassName({ row, rowIndex })
  }
  return props.rowClassName
}

const getRowStyle = ({ row, rowIndex }) => {
  if (typeof props.rowStyle === 'function') {
    return props.rowStyle({ row, rowIndex })
  }
  return props.rowStyle
}

const getCellClassName = ({ row, column, rowIndex, columnIndex }) => {
  if (typeof props.cellClassName === 'function') {
    return props.cellClassName({ row, column, rowIndex, columnIndex })
  }
  return props.cellClassName
}

const getCellStyle = ({ row, column, rowIndex, columnIndex }) => {
  if (typeof props.cellStyle === 'function') {
    return props.cellStyle({ row, column, rowIndex, columnIndex })
  }
  return props.cellStyle
}

const getVisibleActions = (row) => {
  return props.actions.filter(action => {
    if (typeof action.visible === 'function') {
      return action.visible(row)
    }
    return action.visible !== false
  })
}

const isActionDisabled = (action, row) => {
  if (typeof action.disabled === 'function') {
    return action.disabled(row)
  }
  return action.disabled || false
}

const isActionLoading = (action, row) => {
  if (typeof action.loading === 'function') {
    return action.loading(row)
  }
  return action.loading || false
}

const handleActionClick = (action, row, index) => {
  emit('action-click', { action, row, index })

  if (action.handler) {
    action.handler(row, index)
  }
}

const handleDropdownAction = ({ action, row, index }) => {
  handleActionClick(action, row, index)
}

// Table event handlers
const handleSelect = (selection, row) => {
  emit('select', selection, row)
}

const handleSelectAll = (selection) => {
  emit('select-all', selection)
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
  emit('selection-change', selection)
}

const handleRowClick = (row, column, event) => {
  emit('row-click', row, column, event)
}

const handleRowDblClick = (row, column, event) => {
  emit('row-dblclick', row, column, event)
}

const handleRowContextMenu = (row, column, event) => {
  emit('row-contextmenu', row, column, event)
}

const handleCellClick = (row, column, cell, event) => {
  emit('cell-click', row, column, cell, event)
}

const handleCellDblClick = (row, column, cell, event) => {
  emit('cell-dblclick', row, column, cell, event)
}

const handleSortChange = ({ column, prop, order }) => {
  emit('sort-change', { column, prop, order })
}

const handleFilterChange = (filters) => {
  emit('filter-change', filters)
}

const handleCurrentChange = (currentRow, oldCurrentRow) => {
  emit('current-change', currentRow, oldCurrentRow)
}

const handleHeaderClick = (column, event) => {
  emit('header-click', column, event)
}

const handleHeaderContextMenu = (column, event) => {
  emit('header-contextmenu', column, event)
}

const handleExpandChange = (row, expandedRows) => {
  emit('expand-change', row, expandedRows)
}

const handlePageSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  emit('page-size-change', size)
}

const handleCurrentPageChange = (page) => {
  currentPage.value = page
  emit('page-change', page)
}

const handleEmptyAction = () => {
  emit('empty-action')
}

// Public methods
const clearSelection = () => {
  tableRef.value?.clearSelection()
}

const toggleRowSelection = (row, selected) => {
  tableRef.value?.toggleRowSelection(row, selected)
}

const toggleAllSelection = () => {
  tableRef.value?.toggleAllSelection()
}

const toggleRowExpansion = (row, expanded) => {
  tableRef.value?.toggleRowExpansion(row, expanded)
}

const setCurrentRow = (row) => {
  tableRef.value?.setCurrentRow(row)
}

const clearSort = () => {
  tableRef.value?.clearSort()
}

const clearFilter = (columnKeys) => {
  tableRef.value?.clearFilter(columnKeys)
}

const doLayout = () => {
  tableRef.value?.doLayout()
}

const sort = (prop, order) => {
  tableRef.value?.sort(prop, order)
}

// Initialize column visibility
onMounted(() => {
  props.columns.forEach(column => {
    if (column.toggleable !== false) {
      columnVisibility.value[column.prop] = column.visible !== false
    }
  })
})

// Watch pagination props
watch(() => props.pagination, (newPagination) => {
  if (newPagination) {
    currentPage.value = newPagination.page || 1
    pageSize.value = newPagination.size || 20
    total.value = newPagination.total || 0
  }
}, { deep: true, immediate: true })

// Expose public methods
defineExpose({
  clearSelection,
  toggleRowSelection,
  toggleAllSelection,
  toggleRowExpansion,
  setCurrentRow,
  clearSort,
  clearFilter,
  doLayout,
  sort,
  tableRef
})
</script>

<style scoped>
.base-table {
  background: var(--el-bg-color);
  border-radius: 8px;
  overflow: hidden;
}

/* Table header */
.table-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.header-info {
  flex: 1;
  min-width: 0;
}

.table-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 4px 0;
  line-height: 1.4;
}

.table-description {
  font-size: 14px;
  color: var(--el-text-color-regular);
  margin: 0;
  line-height: 1.4;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.table-search {
  min-width: 200px;
}

.filter-badge {
  margin-left: 4px;
}

/* Bulk actions */
.bulk-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-color-primary-light-9);
  border-radius: 6px;
  margin-top: 16px;
}

.bulk-info {
  font-size: 14px;
  color: var(--el-color-primary);
  font-weight: 500;
}

.bulk-buttons {
  display: flex;
  gap: 8px;
}

/* Table content */
.table-content {
  position: relative;
}

/* Table actions */
.table-actions {
  display: flex;
  gap: 4px;
  justify-content: center;
  align-items: center;
}

/* Table footer */
.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.table-info {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

/* Empty state */
.table-empty {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  margin-bottom: 16px;
  color: var(--el-text-color-placeholder);
}

.empty-text {
  font-size: 16px;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
}

.empty-description {
  font-size: 14px;
  color: var(--el-text-color-placeholder);
  margin-bottom: 16px;
}

.empty-action {
  margin-top: 16px;
}

/* Filter and column menus */
.filter-menu,
.column-menu {
  width: 250px;
}

.filter-content,
.column-content {
  padding: 12px;
}

.filter-item {
  margin-bottom: 12px;
}

.filter-label {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-bottom: 4px;
}

.filter-actions {
  text-align: right;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.column-item {
  margin-bottom: 8px;
}

/* Responsive design */
@media (max-width: 1024px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
  }

  .table-search {
    min-width: auto;
    flex: 1;
  }

  .bulk-actions {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .table-footer {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .table-header {
    padding: 12px 16px;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions > * {
    width: 100%;
  }

  .table-actions {
    flex-direction: column;
    gap: 2px;
  }

  .table-footer {
    padding: 12px 16px;
  }
}

/* Table loading state */
.table-loading {
  position: relative;
}

/* Custom table styling */
:deep(.el-table) {
  border-radius: 0;
}

:deep(.el-table__header-wrapper) {
  background: var(--el-fill-color-extra-light);
}

:deep(.el-table th) {
  background: var(--el-fill-color-extra-light);
  font-weight: 600;
  color: var(--el-text-color-primary);
}

:deep(.el-table .table-actions-column .cell) {
  padding: 8px;
}

:deep(.el-pagination) {
  justify-content: center;
}

/* High contrast mode */
@media (prefers-contrast: more) {
  .table-header,
  .table-footer {
    border-width: 2px;
  }

  :deep(.el-table) {
    border-width: 2px;
  }
}

/* Print styles */
@media print {
  .table-header,
  .table-footer {
    display: none;
  }

  .table-actions {
    display: none;
  }

  :deep(.el-table) {
    break-inside: avoid;
  }
}
</style>


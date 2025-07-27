<template>
  <div>
    <PageHeader title="Route Management" />
    <BaseCard>
      <template #header>
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center space-x-4">
            <el-input
              v-model="searchQuery"
              placeholder="Search by route name or code..."
              clearable
              @clear="fetchData"
              @keydown.enter.prevent="fetchData"
            >
              <template #prepend>
                <font-awesome-icon :icon="['fas', 'search']" />
              </template>
            </el-input>
          </div>
          <BaseButton
            variant="primary"
            @click="$router.push({ name: 'RouteCreate' })"
          >
            <font-awesome-icon :icon="['fas', 'plus']" class="mr-2" />
            Create Route
          </BaseButton>
        </div>
      </template>

      <RouteTable
        :routes="routes"
        :loading="loading.routes"
        @edit="handleEdit"
        @delete="handleDelete"
      />

      <div class="mt-4 flex justify-end">
        <el-pagination
          v-if="pagination.routes.totalElements > 0"
          :current-page="pagination.routes.number + 1"
          :page-size="pagination.routes.size"
          :total="pagination.routes.totalElements"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </BaseCard>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useReferenceStore } from '@/stores/reference';
import { useApi } from '@/composables/useApi';
import { useNotification } from '@/composables/useNotification';
import { ElMessageBox } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import RouteTable from '@/components/tables/RouteTable.vue';
import BaseCard from '@/components/ui/BaseCard.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
// Element Plus components are globally registered

const router = useRouter();
const referenceStore = useReferenceStore();
const { routes, pagination, loading } = storeToRefs(referenceStore);
const { showSuccess, showError } = useNotification();

const {
  fetchData,
  searchQuery,
  handleSizeChange,
  handleCurrentChange
} = useApi(referenceStore.loadRoutes);

onMounted(() => {
  fetchData();
});

const handleEdit = (route) => {
  router.push({ name: 'RouteEdit', params: { id: route.id } });
};

const handleDelete = async (route) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete route <strong>${route.routeName}</strong>? This action cannot be undone.`,
      'Confirm Deletion',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
        dangerouslyUseHTMLString: true,
      }
    );
    await referenceStore.deleteRoute(route.id);
    showSuccess('Route deleted successfully!');
    fetchData(); // Listeyi yenile
  } catch (error) {
    if (error !== 'cancel') {
      showError(error.message || 'Failed to delete route.');
    }
  }
};
</script>

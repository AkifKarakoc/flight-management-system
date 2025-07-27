<template>
  <div>
    <PageHeader title="Aircraft Management" />
    <BaseCard>
      <template #header>
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center space-x-4">
            <el-input
              v-model="searchQuery"
              placeholder="Search by registration or type..."
              clearable
              @clear="fetchData"
              @keyup.enter="fetchData"
            >
              <template #prepend>
                <font-awesome-icon :icon="['fas', 'search']" />
              </template>
            </el-input>
          </div>
          <BaseButton
            variant="primary"
            @click="$router.push({ name: 'AircraftCreate' })"
          >
            <font-awesome-icon :icon="['fas', 'plus']" class="mr-2" />
            Create Aircraft
          </BaseButton>
        </div>
      </template>

      <AircraftTable
        :aircrafts="aircrafts"
        :loading="loading.aircrafts"
        @edit="handleEdit"
        @delete="handleDelete"
      />

      <div class="mt-4 flex justify-end">
        <el-pagination
          v-if="pagination.aircrafts.totalElements > 0"
          :current-page="pagination.aircrafts.number + 1"
          :page-size="pagination.aircrafts.size"
          :total="pagination.aircrafts.totalElements"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </BaseCard>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useReferenceStore } from '@/stores/reference';
import { useApi } from '@/composables/useApi';
import { useNotification } from '@/composables/useNotification';
import { ElMessageBox } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import AircraftTable from '@/components/tables/AircraftTable.vue';
import BaseCard from '@/components/ui/BaseCard.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import ElInput from 'element-plus/es/components/input/src/input.mjs';
import ElPagination from 'element-plus/es/components/pagination/src/pagination.mjs';


const router = useRouter();
const referenceStore = useReferenceStore();
const { aircrafts, pagination, loading } = storeToRefs(referenceStore);
const { showSuccess, showError } = useNotification();

const {
  fetchData,
  searchQuery,
  handleSizeChange,
  handleCurrentChange
} = useApi(referenceStore.fetchAircrafts);

onMounted(() => {
  fetchData();
});

const handleEdit = (aircraft) => {
  router.push({ name: 'AircraftEdit', params: { id: aircraft.id } });
};

const handleDelete = async (aircraft) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete aircraft <strong>${aircraft.registrationNumber}</strong>? This action cannot be undone.`,
      'Confirm Deletion',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
        dangerouslyUseHTMLString: true,
      }
    );
    await referenceStore.deleteAircraft(aircraft.id);
    showSuccess('Aircraft deleted successfully!');
    fetchData(); // Listeyi yenile
  } catch (error) {
    if (error !== 'cancel') {
      showError(error.message || 'Failed to delete aircraft.');
    }
  }
};
</script>

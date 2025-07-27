<template>
  <div>
    <PageHeader title="Crew Management" />
    <BaseCard>
      <template #header>
        <div class="flex justify-between items-center">
          <el-input v-model="searchQuery" placeholder="Search by name or employee number..." class="w-1/3" clearable @clear="fetchData" @keyup.enter="fetchData" />
          <BaseButton @click="$router.push({ name: 'CrewCreate' })">Create Crew Member</BaseButton>
        </div>
      </template>
      <CrewMemberTable :crew-members="crewMembers" :loading="loading.crewMembers" @edit="handleEdit" @delete="handleDelete" />
      <div class="mt-4 flex justify-end">
        <el-pagination
          v-if="pagination.crewMembers.totalElements > 0"
          :current-page="pagination.crewMembers.number + 1"
          :page-size="pagination.crewMembers.size"
          :total="pagination.crewMembers.totalElements"
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
import CrewMemberTable from '@/components/tables/CrewMemberTable.vue';
import BaseCard from '@/components/ui/BaseCard.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
// Element Plus components are globally registered

const router = useRouter();
const referenceStore = useReferenceStore();
const { crewMembers, pagination, loading } = storeToRefs(referenceStore);
const { showSuccess, showError } = useNotification();

const {
  fetchData,
  searchQuery,
  handleSizeChange,
  handleCurrentChange
} = useApi(referenceStore.loadCrewMembers);

onMounted(() => {
  fetchData();
});

const handleEdit = (crewMember) => {
  router.push({ name: 'CrewEdit', params: { id: crewMember.id } });
};

const handleDelete = async (crewMember) => {
  try {
    await ElMessageBox.confirm(`Are you sure you want to delete ${crewMember.firstName} ${crewMember.lastName}?`, 'Confirm Deletion', { type: 'warning' });
    await referenceStore.deleteCrewMember(crewMember.id);
    showSuccess('Crew member deleted successfully!');
    fetchData();
  } catch (error) {
    if (error !== 'cancel') {
      showError(error.message || 'Failed to delete crew member.');
    }
  }
};
</script>

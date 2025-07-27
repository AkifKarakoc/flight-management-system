<template>
  <div>
    <PageHeader title="Toplu Uçuş Yükleme (CSV)" />
    <el-row :gutter="20">
      <el-col :span="8">
        <BaseCard>
          <template #header>
            <div class="flex items-center">
              <font-awesome-icon :icon="['fas', 'info-circle']" class="mr-2 text-blue-500" />
              <h3 class="font-semibold text-lg">Nasıl Çalışır?</h3>
            </div>
          </template>
          <div class="text-sm text-gray-700 space-y-3">
            <p>1. Sisteme toplu olarak uçuş eklemek için lütfen sağlanan CSV şablonunu kullanın.</p>
            <p>2. Şablonu indirin, uçuş bilgilerinizi Excel veya benzeri bir programla doldurun ve dosyayı kaydedin.</p>
            <p>3. Doldurduğunuz dosyayı aşağıdaki yükleme alanına sürükleyip bırakın veya seçerek yükleyin.</p>
            <p>4. Sistem, dosyayı doğruladıktan sonra uçuşları veritabanına ekleyecektir.</p>
          </div>
          <template #footer>
            <BaseButton variant="success" class="w-full" @click="downloadTemplate">
              <font-awesome-icon :icon="['fas', 'download']" class="mr-2" />
              CSV Şablonunu İndir
            </BaseButton>
          </template>
        </BaseCard>
      </el-col>

      <el-col :span="16">
        <BaseCard>
          <template #header>
            <div class="flex items-center">
              <font-awesome-icon :icon="['fas', 'upload']" class="mr-2 text-gray-600" />
              <h3 class="font-semibold text-lg">CSV Dosyasını Yükle</h3>
            </div>
          </template>
          <CsvUpload @upload="handleUpload" />
        </BaseCard>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { useFlightStore } from '@/stores/flights';
import { useNotification } from '@/composables/useNotification';
import { useRouter } from 'vue-router';
import PageHeader from '@/components/common/PageHeader.vue';
import CsvUpload from '@/components/upload/CsvUpload.vue';
import BaseCard from '@/components/ui/BaseCard.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import { ElRow, ElCol } from 'element-plus';

const flightStore = useFlightStore();
const { showSuccess, showError } = useNotification();
const router = useRouter();

const handleUpload = async (file, onProgress) => {
  try {
    const response = await flightStore.uploadFlightsCsv(file, onProgress);
    showSuccess(`${response.data.importedCount} uçuş başarıyla yüklendi!`);
    router.push({ name: 'FlightManagement' });
  } catch (error) {
    showError(error.message || 'CSV yüklenirken bir hata oluştu.');
  }
};

const downloadTemplate = () => {
  // API'den şablonu indirme mantığı flightStore'a eklenecek
  flightStore.downloadCsvTemplate();
};
</script>

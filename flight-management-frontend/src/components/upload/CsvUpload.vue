<template>
  <div class="csv-upload-container">
    <el-upload
      drag
      action="#"
      :http-request="handleHttpRequest"
      :before-upload="beforeUpload"
      :show-file-list="false"
      class="w-full"
    >
      <font-awesome-icon :icon="['fas', 'file-csv']" size="3x" class="text-gray-400 mb-4" />
      <div class="el-upload__text">
        Dosyayı buraya sürükleyin veya <em>seçmek için tıklayın</em>
      </div>
      <template #tip>
        <div class="el-upload__tip mt-2">
          Lütfen sadece .csv uzantılı dosyaları yükleyin (maks 5MB).
        </div>
      </template>
    </el-upload>

    <div v-if="file" class="mt-4 p-4 border rounded-md">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <font-awesome-icon :icon="['fas', 'file-alt']" class="mr-2 text-gray-500" />
          <span class="font-medium">{{ file.name }}</span>
          <span class="text-sm text-gray-500 ml-2">({{ (file.size / 1024).toFixed(2) }} KB)</span>
        </div>
        <div>
          <BaseButton v-if="!isUploading" variant="danger" size="small" @click="removeFile">Kaldır</BaseButton>
        </div>
      </div>
      <div v-if="isUploading" class="mt-2">
        <el-progress :percentage="uploadPercentage" :stroke-width="10" striped />
      </div>
      <div v-if="!isUploading" class="mt-4">
        <BaseButton class="w-full" @click="startUpload">Yüklemeyi Başlat</BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElUpload, ElProgress } from 'element-plus';
import { useNotification } from '@/composables/useNotification';
import BaseButton from '@/components/ui/BaseButton.vue';

const emit = defineEmits(['upload']);
const { showError } = useNotification();

const file = ref(null);
const isUploading = ref(false);
const uploadPercentage = ref(0);

const beforeUpload = (rawFile) => {
  if (rawFile.type !== 'text/csv') {
    showError('Lütfen sadece CSV formatında bir dosya seçin.');
    return false;
  }
  if (rawFile.size / 1024 / 1024 > 5) {
    showError('Dosya boyutu 5MB\'ı geçemez.');
    return false;
  }
  file.value = rawFile;
  return false; // Otomatik yüklemeyi engelle
};

const handleHttpRequest = () => {
  // El-upload'un kendi isteğini engelliyoruz, kontrol bizde.
};

const startUpload = () => {
  if (!file.value) return;

  isUploading.value = true;
  uploadPercentage.value = 0;

  const onProgress = (progressEvent) => {
    uploadPercentage.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
  };

  emit('upload', file.value, onProgress);
};

const removeFile = () => {
  file.value = null;
  isUploading.value = false;
  uploadPercentage.value = 0;
};
</script>

<style scoped>
.csv-upload-container :deep(.el-upload-dragger) {
  padding: 40px;
}
</style>

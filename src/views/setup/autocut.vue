<script setup lang="ts">
import { downloadAutoCut, selectAutocutSaveDirectory } from "@/interface/autocut";
import { debounce } from "lodash-es"

const { t } = useI18n()

const installPath = ref(configStore.installPath)
const autocutStatus = computed(() => statusStore.autocutStatus)
const { checkAutocut } = useAutoCut()

watch(() => installPath.value, (newVal) => {
  configStore.setInstallPath(newVal)
})

const selectDirectory = () => {
  selectAutocutSaveDirectory().then((path) => {
    if (path?.filePaths?.[0]) {
      installPath.value = path.filePaths[0]
    }
  })
}
const debounceSelectDirectory = debounce(selectDirectory, 500)

const downloadStatus = ref("")
const downloadProcess = ref(-1)

const download = () => {
  if(downloadProcess.value > 0 || autocutStatus.value){
    return
  }

  downloadAutoCut(
    installPath.value,
    (task, process) => {
      downloadStatus.value = task
      downloadProcess.value = process
    },
  ).then(() => {
    checkAutocut()
  }).catch(err => {
    alert(err)
    downloadProcess.value = -1
  })
}
const debounceDownload = debounce(download, 500)
</script>

<template>
  <div class="p-4">
    <div class="flex items-center">
      <div class="mr-4 flex items-center cursor-pointer" @click="$router.push('/status')">
        <i class="i-material-symbols:chevron-left"></i>
        <h3>{{ t("back") }}</h3>
      </div>
      <h3>{{ t("autocutInstalled.tip") }}</h3>
    </div>
    <h2> {{ t("autocutInstalled.step1") }}</h2>
    <div class="flex justify-between items-center" @click="debounceSelectDirectory">
      <input 
        v-model="installPath"
        :placeholder="t('autocutInstalled.installPathPlaceholder')"
        class="h-[39px] border border-[#F0F0F0] bg-white rounded-[4px] w-full px-2"
        disabled
      />
      <button 
        class="h-[40px] bg-[#F0F0F0] ml-4 rounded-[4px] border-none cursor-pointer whitespace-nowrap px-2"
      >
        {{ t("autocutInstalled.selectBtn") }}
      </button>
    </div>
    <h2> {{ t("autocutInstalled.step2") }} </h2>
    <template v-if="autocutStatus">
      {{ t("autocutInstalled.success") }}
    </template>
    <template v-else>
      <button
        v-if="downloadProcess < 0"
        class="h-[40px] bg-[#F0F0F0] rounded-[4px] border-none  whitespace-nowrap px-2"
        :class="installPath ? 'cursor-pointer' : 'cursor-not-allowed'"
        :disabled="!installPath"
        @click="debounceDownload"
      >
        {{ t("autocutInstalled.downloadBtn") }}
      </button>
      <div v-if="downloadProcess >= 0">
        <div class="h-[8px] w-full rounded-[4px] bg-[#CCCCCC] my-2 overflow-hidden">
          <div class="bg-[#0063b1] h-full" :style="`width: ${downloadProcess}%;`"></div>
          <div class="h-full" :style="`width: ${100 - downloadProcess}%;`"></div>
        </div>
        <p class="text-gray-400">
          {{ downloadStatus === 'downloading' ? t('autocutInstalled.downloading') : '' }}
          {{ downloadStatus === 'extracting' ? t('autocutInstalled.extracting') : '' }}
        </p>
      </div>
    </template>
  </div>
</template>

<style scoped>

</style>

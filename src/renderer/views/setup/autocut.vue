<script setup lang="ts">
import * as fs from "fs"
import * as os from "os"
import path from "path"
import { downloadAutoCut, selectAutocutSaveDirectory } from "@/interface/autocut";
import { debounce } from "lodash-es"

const { t } = useI18n()

const installPath = ref(configStore.installPath)
const autocutStatus = computed(() => statusStore.autocutStatus)
const { checkAutocut } = useAutoCut()

watch(() => installPath.value, (newVal) => {
  configStore.setInstallPath(newVal)
  checkAutocut()
})

const allowDownload = computed(() => {
  console.log(installPath.value.match(/[^a-zA-z0-9\:\\\/\-\_\ ]+/))
  return installPath.value && !installPath.value.match(/[^a-zA-z0-9\:\\\/\-\_\ ]+/)
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
    downloadProcess.value = -1
  }).catch(err => {
    alert(err)
    downloadProcess.value = -1
  })
}

function _removeDir(dir: string) {
  let files = fs.readdirSync(dir)
  for(var i=0;i<files.length;i++){
    let newPath = path.join(dir,files[i]);
    let stat = fs.statSync(newPath)
    if(stat.isDirectory()){
      //如果是文件夹就递归下去
      _removeDir(newPath);
    }else {
      //删除文件
      fs.unlinkSync(newPath);
    }
  }
  fs.rmdirSync(dir)//如果文件夹是空的，就将自己删除掉
}

const showRedownloading = ref(false)

const reDownload = () => {
  try{
    showRedownloading.value = true
    const file1 = path.join(installPath.value, "autocut", `autocut${os.platform().indexOf("win") >= 0? ".exe" : ""}`)
    if(fs.existsSync(file1)){
      fs.unlinkSync(file1)
    }
    statusStore.setAutocut(false)
    const file2 = path.join(installPath.value, "autocut")
    if(fs.existsSync(file2)){
      _removeDir(file2)
    }
    const file3 = path.join(installPath.value, "autocut.zip")
    if(fs.existsSync(file3)){
      fs.unlinkSync(file3)
    }
    checkAutocut()
    showRedownloading.value = false
    download()
  }catch(e){
    alert(e)
    checkAutocut()
  }
}
const debounceReDownload = debounce(reDownload, 500)
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
    <p v-if="!allowDownload">
      {{ t('autocutInstalled.downloadTip') }}
    </p>
    <h2> {{ t("autocutInstalled.step2") }} </h2>
    <template v-if="autocutStatus && allowDownload">
      <p> {{ t("autocutInstalled.success") }} </p>
      <div>
        <button
          v-if="downloadProcess < 0"
          class="h-[40px] bg-[#F0F0F0] rounded-[4px] border-none  whitespace-nowrap px-2"
          :class="installPath ? 'cursor-pointer' : 'cursor-not-allowed'"
          :disabled="!allowDownload"
          @click="debounceReDownload"
        >
          {{ t("autocutInstalled.reDownloadBtn") }}
        </button>
      </div>
      <p v-if="showRedownloading">
        {{ t("autocutInstalled.reDownloadTip") }}
      </p>
    </template>
    <template v-else>
      <button
        v-if="downloadProcess < 0"
        class="h-[40px] bg-[#F0F0F0] rounded-[4px] border-none  whitespace-nowrap px-2"
        :class="installPath ? 'cursor-pointer' : 'cursor-not-allowed'"
        :disabled="!allowDownload"
        @click="debounceReDownload"
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

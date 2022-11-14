<script setup lang="ts">
import { ipcRenderer } from "electron"
import { debounce } from "lodash-es"

const installPath = ref(configStore.installPath)
const autocutStatus = computed(() => statusStore.autocutStatus)
const { checkAutocut } = useAutoCut()

watch(() => installPath.value, (newVal) => {
  configStore.setInstallPath(newVal)
})

const selectDirectory = () => {
  ipcRenderer.invoke("select-autocut-save-directory").then((path) => {
    installPath.value = path.filePaths[0]
  })
}
const debounceSelectDirectory = debounce(selectDirectory, 500)

const downloadStatus = ref("")
const downloadProcess = ref(-1)

const download = () => {
  if(downloadProcess.value > 0 || autocutStatus.value){
    return
  }
  ipcRenderer.send("download-autocut", configStore.installPath)
}
const debounceDownload = debounce(download, 500)

interface DownloadReport {
  status: "downloading"| "extracting" | "error" | "success"
  msg: string
  process?: number
}

ipcRenderer.on("report-download",(e,...args) => {
  const res = args[0] as DownloadReport
  console.log(res)
  if(res.status === "downloading") {
    downloadStatus.value = "下载中"
    downloadProcess.value = res.process!
  }
  
  if(res.status === "extracting") {
    downloadStatus.value = "解压中"
  }

  if(res.status === "error") {
    downloadProcess.value = -1
    alert(res.msg)
  }
  if(res.status === "success") {
    checkAutocut()
    downloadProcess.value = -1
  }
})

</script>

<template>
  <div class="p-4">
    <div class="flex items-center">
      <div class="mr-4 flex items-center cursor-pointer" @click="$router.push('/status')">
        <i class="i-material-symbols:chevron-left"></i>
        <h3>返回</h3>
      </div>
      <h3>配置 AutoCut</h3>
    </div>
    <h2> 1.选择安装路径 </h2>
    <div class="flex justify-between items-center" @click="debounceSelectDirectory">
      <input 
        v-model="installPath"
        placeholder="请选择文件夹"
        class="h-[39px] border border-[#F0F0F0] bg-white rounded-[4px] w-full px-2"
        disabled
      />
      <button 
        class="h-[40px] bg-[#F0F0F0] ml-4 rounded-[4px] border-none cursor-pointer whitespace-nowrap px-2"
      >
        选择文件夹
      </button>
    </div>
    <p class="text-gray-400">* 暂不支持中文路径</p>
    <h2> 2.安装 AutoCut </h2>
    <template v-if="autocutStatus">
      已正确安装 AutoCut
    </template>
    <template v-else>
      <button
        v-if="downloadProcess < 0"
        class="h-[40px] bg-[#F0F0F0] rounded-[4px] border-none  whitespace-nowrap px-2"
        :class="installPath ? 'cursor-pointer' : 'cursor-not-allowed'"
        :disabled="!installPath"
        @click="debounceDownload"
      >
        点击下载
      </button>
      <div v-if="downloadProcess >= 0">
        <div class="h-[8px] w-full rounded-[4px] bg-[#CCCCCC] my-2 overflow-hidden">
          <div class="bg-[#0063b1] h-full" :style="`width: ${downloadProcess}%;`"></div>
          <div class="h-full" :style="`width: ${100 - downloadProcess}%;`"></div>
        </div>
        <p class="text-gray-400">正在{{ downloadStatus }}，请勿进行其它操作</p>
      </div>
    </template>
  </div>
</template>

<style scoped>

</style>
<script setup lang="ts">
import { ipcRenderer } from "electron"
import Subtitle from "./Subtitle.vue"

const filePath = ref("")
const srtFilePath = ref("")
const status = ref("")
const transcribeProcess = ref(-1)
const dragRef = ref<HTMLElement | null>(null)

const start = () => {
  ipcRenderer.send("start-transcribe", filePath.value)
}

interface TranscribeReport {
  status: "processing" | "error" | "success"
  msg: string
  process?: number
}

ipcRenderer.on("report-transcribe",(e,...args) => {
  const res = args[0] as TranscribeReport
  console.log(res)
  if(res.status === "processing") {
    transcribeProcess.value = res.process!
  }


  if(res.status === "error") {
    transcribeProcess.value = -1
    alert(res.msg)
  }
  if(res.status === "success") {
    console.log("完成")
    transcribeProcess.value = -1
    // 替换后缀名为 .srt
    srtFilePath.value = filePath.value.slice(0,filePath.value.lastIndexOf(".")) + ".srt"
    console.log(srtFilePath.value)
  }
})

const onDrop = (e: DragEvent)=>{
  //阻止默认行为
  e.preventDefault();
  // 在处理中
  if(status.value) {
    return
  }
  //获取文件列表
  const files = e.dataTransfer?.files;

  if(files && files.length > 0) {
    //获取文件路径
    const path = files[0].path;
    console.log("path:", path);
    filePath.value = path
    // TODO: 检查中文路径
    start()
  }
}
const onDropOver = (e: DragEvent)=>{
  e.preventDefault();
}

onMounted(()=>{
  dragRef.value && dragRef.value.addEventListener("drop", onDrop)
  dragRef.value && dragRef.value.addEventListener("dragover", onDropOver)
})

onUnmounted(()=>{
  dragRef.value && dragRef.value.removeEventListener("drop", onDrop)
  dragRef.value && dragRef.value.removeEventListener("dragover", onDropOver)
})

</script>

<template>
  <div v-if="!srtFilePath" class="flex justify-center items-center h-full">
    <div 
      ref="dragRef"
      class="w-[90%] min-h-[400px] h-[80%] max-h-[80vh] my-auto
        flex flex-col justify-center items-center
        border border-solid border-[#F0F0F0] rounded-[4px]
        bg-white
        leading-6"
    >
      <template v-if="!filePath">
        拖入文件开始剪辑
      </template>
      <template v-else>
        <div>已选文件： {{ filePath }}</div>
      </template>
    </div>
    
  </div>
  <div v-else class="h-full">
    <subtitle :file-path="filePath" :srt-file-path="srtFilePath"></subtitle>
  </div>
</template>

<style scoped>

</style>
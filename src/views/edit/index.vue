<script setup lang="ts">
import { ipcRenderer } from "electron"
import Subtitle from "./Subtitle.vue"

/**
 * 原始视频文件地址
 */
const filePath = ref("")
/**
 * 生成的字幕文件地址
 */
const srtFilePath = ref("")
/**
 * 转码后的视频文件地址
 */
const videoPath = ref("")
/**
 * 转码后的音频文件地址
 */
const audioPath = ref("")

/**
 * 生成字幕进度
 */
const transcribeProcess = ref(-1)


const tasksStatus = reactive({
  transcribe: "",
  convertVideo: "",
  convertAudio: "",
})

const status = computed(() => {
  return tasksStatus.transcribe === "success" 
    && tasksStatus.convertVideo === "success" 
    && tasksStatus.convertAudio === "success" 
})

const start = () => {
  ipcRenderer.send("start-transcribe", Buffer.from(filePath.value).toString("base64"))
  // 后缀名不是 mp4
  if(filePath.value.slice(-4) !== ".mp4") {
    ipcRenderer.send("convert-video", Buffer.from(filePath.value).toString("base64"))
  } else {
    videoPath.value = filePath.value
    tasksStatus.convertVideo = "success"
  }
  ipcRenderer.send("convert-audio", Buffer.from(filePath.value).toString("base64"))
}

interface TranscribeReport {
  status: "processing" | "error" | "success"
  msg: string
  process?: number
}

ipcRenderer.on("report-transcribe",(e,...args) => {
  const res = args[0] as TranscribeReport

  if(res.status === "processing") {
    transcribeProcess.value = res.process!
  }

  if(res.status === "error") {
    transcribeProcess.value = -1
    alert(res.msg)
  }
  if(res.status === "success") {
    console.log("字幕生成完成")
    transcribeProcess.value = -1
    // 替换后缀名为 .srt
    srtFilePath.value = filePath.value.slice(0,filePath.value.lastIndexOf(".")) + ".srt"
  }

  tasksStatus.transcribe = res.status
})

ipcRenderer.on("report-convert-video",(e,...args)=>{
  const res = args[0] 
  
  if(res.status === "success") {
    console.log("视频转码完成")
    transcribeProcess.value = -1
    // 替换后缀名为 .mp4
    videoPath.value = filePath.value.slice(0,filePath.value.lastIndexOf(".")) + ".mp4"
  }

  tasksStatus.convertVideo = res.status
})

ipcRenderer.on("report-convert-audio",(e,...args)=>{
  const res = args[0] 
  
  if(res.status === "success") {
    console.log("音频转码完成")
    transcribeProcess.value = -1
    // 替换后缀名为 .wav
    audioPath.value = filePath.value.slice(0,filePath.value.lastIndexOf(".")) + ".wav"
  }

  tasksStatus.convertAudio = res.status
})

const dragRef = ref<HTMLElement | null>(null)

const onDrop = (e: DragEvent)=>{
  //阻止默认行为
  e.preventDefault();
  // 在处理中
  if(tasksStatus.transcribe) {
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
  <div v-if="!status" class="flex justify-center items-center h-full">
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
        <div v-if="tasksStatus.transcribe">
          <span>字幕生成: </span>
          <span v-if="tasksStatus.transcribe === 'processing' && transcribeProcess >= 0">
            {{ transcribeProcess }}%
          </span>
          <span v-if="tasksStatus.transcribe === 'success'"> 成功 </span>
          <span v-if="tasksStatus.transcribe === 'error'"> 失败 </span>
        </div>
        <div v-if="tasksStatus.convertVideo">
          <span>视频转码: </span>
          <span v-if="tasksStatus.convertVideo === 'success'"> 成功 </span>
          <span v-if="tasksStatus.convertVideo === 'error'"> 失败 </span>
        </div>
        <div v-if="tasksStatus.convertAudio">
          <span>音频转码: </span>
          <span v-if="tasksStatus.convertAudio === 'success'"> 成功 </span>
          <span v-if="tasksStatus.convertAudio === 'error'"> 失败 </span>
        </div>
      </template>
    </div>
    
  </div>
  <div v-else-if="srtFilePath" class="h-full">
    <subtitle 
      :file-path="filePath" 
      :video-path="videoPath" 
      :srt-file-path="srtFilePath" 
      :audio-file-path="audioPath"
    ></subtitle>
  </div>
</template>

<style scoped>

</style>
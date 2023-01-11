<script setup lang="ts">
import { startTranscribe } from "@/interface/autocut";
import { convertAudio, convertVideo } from "@/interface/ffmpeg";
import Subtitle from "./Subtitle.vue"

const { t } = useI18n()

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
  // 后缀名不是 mp4
  if(filePath.value.slice(-4) !== ".mp4") {
    convertVideo(filePath.value).then(res => {
      videoPath.value = res
      tasksStatus.convertVideo = "success"
    }).catch(()=>{
      tasksStatus.convertVideo = "error"
    })
  } else {
    videoPath.value = filePath.value
    tasksStatus.convertVideo = "success"
  }
  convertAudio(filePath.value).then(res => {
    audioPath.value = res
    tasksStatus.convertAudio = "success"

    startTranscribe(
      audioPath.value,
      (task, process) => {
        transcribeProcess.value = process
        tasksStatus.transcribe = "processing"
      },
    ).then(res => {
      srtFilePath.value = res
      transcribeProcess.value = -1
      tasksStatus.transcribe = "success"
    }).catch(err => {
      alert(err)
      transcribeProcess.value = -1
      tasksStatus.transcribe = "error"
    })

  }).catch(() => {
    tasksStatus.convertAudio = "error"
  })
}

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
        {{ t("dropIn") }}
      </template>
      <template v-else>
        <div>{{ t("selectedFile") }} {{ filePath }}</div>
        <div v-if="tasksStatus.transcribe">
          <span>{{ t("transcribeTask") }} </span>
          <span v-if="tasksStatus.transcribe === 'processing' && transcribeProcess >= 0">
            {{ transcribeProcess }}%
          </span>
          <span v-if="tasksStatus.transcribe === 'success'"> {{ t('success') }} </span>
          <span v-if="tasksStatus.transcribe === 'error'"> {{ t('fail') }} </span>
        </div>
        <div v-if="tasksStatus.convertVideo">
          <span>{{ t("convertVideoTask") }} </span>
          <span v-if="tasksStatus.convertVideo === 'success'"> {{ t('success') }} </span>
          <span v-if="tasksStatus.convertVideo === 'error'"> {{ t('fail') }} </span>
        </div>
        <div v-if="tasksStatus.convertAudio">
          <span>{{ t("convertAudioTask") }} </span>
          <span v-if="tasksStatus.convertAudio === 'success'"> {{ t('success') }} </span>
          <span v-if="tasksStatus.convertAudio === 'error'"> {{ t('fail') }} </span>
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

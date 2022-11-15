<script setup lang="ts">
import * as fs from "fs"
import { parseSync, Cue } from "subtitle"
import { type SrtItem } from "./components/SubtitleItem.vue"
import SubtitleItem from "./components/SubtitleItem.vue";
import { throttle } from "lodash-es"
// @ts-ignore
import { useAVWaveform } from "vue-audio-visual"

const props = defineProps({
  filePath: {
    type: String,
    required: true,
  },
  audioFilePath: {
    type: String,
    // required: true,
  },
  srtFilePath: {
    type: String,
    required: true,
  },
})



/**
 * 解析后的字幕列表
 */
const srtItemList = ref([] as Array<SrtItem>)

const readSrt = (path: string) => {
  const content = fs.readFileSync(path, "utf-8")
  srtItemList.value = parseSync(content).filter(i => i.type === "cue").map(item => {
    return {
      ...item,
      checked: (item.data as Cue)?.text.indexOf("No Speech") >= 0 ? false : true,
    } as SrtItem
  })
}

readSrt(props.srtFilePath)

watch(  
  ()=> props.srtFilePath,
  (newVal) => {
    if(newVal) {
      console.log(newVal)
      readSrt(newVal)
    }
  },
)

const toggleChecked = (index: number) => {
  const item = srtItemList.value[index]
  item.checked = !item.checked
}

const videoRef = ref<HTMLVideoElement | null>(null)
const audioPlayer = ref<HTMLAudioElement | null>(null)
const audioCanvas = ref<HTMLCanvasElement | null>(null)


watch(
  ()=>videoRef.value,
  (newVal)=>{
    if(newVal) {
      useAVWaveform(
        audioPlayer, 
        audioCanvas, 
        {
          src: props.audioFilePath, 
          canvHeight: 80,
          canvWidth: videoRef.value?.clientWidth,
        },
      )
    }
  },
)
const selectItem = (index:number) => {
  const item = srtItemList.value[index]
  // 控制播放进度
  if(videoRef.value && audioPlayer.value) {
    videoRef.value.pause()
    videoRef.value.currentTime = item.data.start / 1000
    videoRef.value.play()

    // audioPlayer.value.pause()
    // audioPlayer.value.currentTime = item.data.start / 1000
    // audioPlayer.value.play()
  }
}

onMounted(()=>{
  if(videoRef.value) {
    videoRef.value.addEventListener("timeupdate", throttle(()=>{
      if(audioPlayer.value) {
        audioPlayer.value.currentTime = videoRef.value?.currentTime || 0
      }
    }, 50))
    videoRef.value.addEventListener("pause", ()=>{
      if(audioPlayer.value) {
        audioPlayer.value.pause()
      }
    })
    videoRef.value.addEventListener("play", ()=>{
      if(audioPlayer.value) {
        audioPlayer.value.play()
      }
    })
  }
})


</script>

<template>
  <div class="flex justify-between w-[94%] mx-auto h-full">
    <div class="w-[460px] mr-4  overflow-y-scroll" id="list">
      <subtitle-item 
        v-for="(node, index) in srtItemList" 
        :key="index" 
        :node="node" 
        :index="index"
        @click="selectItem(index)"
        @change="toggleChecked(index)"
      ></subtitle-item>
    </div>
    <div class="w-[calc(100%-460px)]">
      <video ref="videoRef" class="w-full" controls :src="filePath"></video>
      <div class="mt-2">
        <audio ref="audioPlayer" :src="audioFilePath" controls class="hidden" muted/>
        <canvas ref="audioCanvas" />
      </div>
    </div>
  </div>
</template>

<style scoped>
#list::-webkit-scrollbar {
  display: none;
}
</style>
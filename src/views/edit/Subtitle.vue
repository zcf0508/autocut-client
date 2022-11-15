<script setup lang="ts">
import * as fs from "fs"
import { parseSync, Cue, stringifySync } from "subtitle"
import { type SrtItem } from "./components/SubtitleItem.vue"
import SubtitleItem from "./components/SubtitleItem.vue";
import { throttle, cloneDeep } from "lodash-es"
// @ts-ignore
import { useAVWaveform } from "vue-audio-visual"
import { ipcRenderer } from "electron";

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
const presentIndex = ref(0)

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
    // +100 加0.1毫秒缓解延迟问题
    videoRef.value.currentTime = (item.data.start + 100) / 1000
    videoRef.value.play()
    
    presentIndex.value = index
  }
}

onMounted(()=>{
  if(videoRef.value) {
    videoRef.value.addEventListener("timeupdate", throttle(()=>{
      if(audioPlayer.value) {
        audioPlayer.value.currentTime = videoRef.value?.currentTime || 0

        presentIndex.value = srtItemList.value.findIndex(item => {
          return item.data.start / 1000 <= (videoRef.value?.currentTime || 0)
            && item.data.end / 1000 >= (videoRef.value?.currentTime|| 0)
        })
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

const save = ()=>{
  const list = cloneDeep(srtItemList.value.filter(i => i.checked))
  const content = list.map(i => {
    delete i.checked
    return i
  })

  const cutSrtPath = props.filePath.slice(0, props.filePath.lastIndexOf("."))+ "_cut.srt"
  fs.writeFileSync(
    cutSrtPath, 
    stringifySync(content, { format: "SRT" }), 
    "utf-8",
  )

  ipcRenderer.send("start-cut", props.filePath, cutSrtPath)
}

ipcRenderer.on("report-cut",(e,...args) => {
  const res = args[0]

  if(res.status === "error") {
    alert(res.msg)
  }
  if(res.status === "success") {
    console.log("字幕生成完成")
    alert(res.msg)
  }

})
</script>

<template>
  <div class="flex justify-between w-[94%] mx-auto h-full">
    <div class="w-[460px] mr-4  overflow-y-scroll relative" id="list">
      <subtitle-item 
        v-for="(node, index) in srtItemList" 
        :key="index" 
        :node="node" 
        :index="index"
        :selected="index === presentIndex"
        @click="selectItem(index)"
        @change="toggleChecked(index)"
      ></subtitle-item>
      <div class="sticky bottom-0 h-[48px] flex justify-between px-2">
        <button
          class="h-[40px] w-[45%] px-2
            bg-[#0063b1] text-white 
            rounded-[4px] border-none  whitespace-nowrap 
            cursor-pointer"
          @click="save"
        >
          导出视频
        </button>
        <button
          class="h-[40px] w-[45%] px-2
            bg-[#3e89c3] text-white 
            rounded-[4px] border-none  whitespace-nowrap 
            cursor-not-allowed"
          title="暂不支持"
          disabled
        >
          导出到 Pr (暂不支持)
        </button>
      </div>
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
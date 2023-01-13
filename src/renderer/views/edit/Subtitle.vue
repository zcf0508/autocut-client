<script setup lang="ts">
import * as fs from "fs"
import { parseSync, Cue, stringifySync } from "subtitle"
import { type SrtItem } from "./components/SubtitleItem.vue"
import SubtitleItem from "./components/SubtitleItem.vue";
import ExportToPr from "./components/exportToPr.vue";
import { throttle, cloneDeep } from "lodash-es"
// @ts-ignore
import { useAVWaveform } from "vue-audio-visual"
import { startCut } from "@/interface/autocut";

const { t } = useI18n()

const props = defineProps({
  filePath: {
    type: String,
    required: true,
  },
  videoPath: {
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

const preview = ref(false)

const getCurrentTimeSubtitleIdx = (currentTime: number) => {
  return srtItemList.value.findIndex(item => {
    return item.data.start / 1000 <= currentTime
      && item.data.end / 1000 >= currentTime
  })
}

onMounted(()=>{
  if(videoRef.value) {
    videoRef.value.addEventListener("timeupdate", throttle(()=>{
      if (preview.value) {
        const currentSubtitleIdx = getCurrentTimeSubtitleIdx(videoRef.value?.currentTime || 0)
        // 没被选中，则跳过这个时间段
        if(currentSubtitleIdx >= 0 && !srtItemList.value[currentSubtitleIdx].checked && videoRef.value) {
          videoRef.value.pause()
          videoRef.value.currentTime = (srtItemList.value[currentSubtitleIdx].data.end + 100) / 1000
          videoRef.value.play()
          return
        }
      }
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

const exporting = ref(false)

const editedlist = computed(()=>{
  return cloneDeep(srtItemList.value.filter(i => i.checked)).map(i => {
    delete i.checked
    i.data.text = i.data.text.replaceAll("< No Speech >", "")
    return i
  })
})

const save = ()=>{

  const cutSrtPath = props.videoPath.slice(0, props.videoPath.lastIndexOf("."))+ "_cut.srt"
  fs.writeFileSync(
    cutSrtPath, 
    stringifySync(editedlist.value, { format: "SRT" }), 
    "utf-8",
  )

  startCut(props.videoPath, cutSrtPath).then(msg => {
    alert(`${t("exportSuccess")} ${msg}`)
    exporting.value = false
  }).catch(err => {
    alert(`${t("exportFail")} ${err}`)
    exporting.value = false
  })
  exporting.value = true
}

const showVideo = ref(true)

const edit = (index:number, val:string) => {
  srtItemList.value[index].data.text = val
}

provide("STOP",{
  stop: ()=>{
    if(videoRef.value) {
      videoRef.value.pause()
    }
  },
})
</script>

<template>
  <div class="relative h-full">
    <div class="w-[94%] mx-auto my-2">
      <div class="p-2 flex items-center cursor-pointer" @click="$router.push('/status')">
        <div class="i-material-symbols:chevron-left"></div>
        {{ t("back") }}
      </div>
    </div>
    <div class="flex justify-between w-[94%] mx-auto h-[calc(100%-37px-16px)]">
      <div class="w-[460px] mr-4  overflow-y-scroll relative" id="list">
        <subtitle-item
          v-for="(node, index) in srtItemList" 
          :key="index"
          :node="node" 
          :index="index"
          :selected="index === presentIndex"
          @click="selectItem(index)"
          @change="toggleChecked(index)"
          @edit="edit"
        ></subtitle-item>
        <div class="sticky bottom-0 h-[48px] flex justify-between px-2">
          <button
            class="h-[40px] w-[45%] px-2
              bg-[#0063b1] text-white 
              rounded-[4px] border-none  whitespace-nowrap 
              cursor-pointer"
            @click="save"
          >
            {{ t("export") }}
          </button>
          <export-to-pr
            :file-path="props.filePath"
            :edited-srt="editedlist"
            @open="showVideo = false" 
            @close="showVideo = true"
          ></export-to-pr>
        </div>
      </div>
      <div class="w-[calc(100%-460px)]">
        <div>
          <label for="preview" class="cursor-pointer">
            <input v-model="preview" type="checkbox" id="preview">
            <span>{{ t("preview") }}</span>
          </label>
        </div>
        <video 
          ref="videoRef" 
          v-show="showVideo" 
          controls
          class="w-full max-h-[640px]" 
          :src="props.videoPath"
        ></video>
        <div class="mt-2">
          <audio ref="audioPlayer" :src="audioFilePath" controls class="hidden" muted/>
          <canvas ref="audioCanvas" />
        </div>
      </div>
    </div>
    <div 
      v-if="exporting"
      class="absolute top-0 right-0 bottom-0 left-0 
      bg-[rgba(0,99,177,0.3)] font-bold text-white
      flex justify-center items-center "
      @click.stop
    >
      {{ t("exporting") }}
    </div>
  </div>
</template>

<style scoped>
/* 滚动槽 */
#list::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
#list::-webkit-scrollbar-track {
    border-radius: 3px;
    background: rgba(0,0,0,0.06);
    -webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.08);
}
/* 滚动条滑块 */
#list::-webkit-scrollbar-thumb {
    border-radius: 3px;
    background: rgba(0,0,0,0.12);
    -webkit-box-shadow: inset 0 0 10px rgba(0,0,0,0.2);
}
</style>

<script setup lang="ts">
import * as fs from "fs"
import { parseSync, formatTimestamp, Cue } from "subtitle"
import { type SrtItem } from "./components/SubtitleItem.vue"

import SubtitleItem from "./components/SubtitleItem.vue";

const props = defineProps({
  filePath: {
    type: String,
    required: true,
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

const selectItem = (index:number) => {
  const item = srtItemList.value[index]
  // 控制播放进度
  if(videoRef.value) {
    videoRef.value.pause()
    videoRef.value.currentTime = item.data.start / 1000
    videoRef.value.play()
  }
}
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
    </div>
  </div>
</template>

<style scoped>
#list::-webkit-scrollbar {
  display: none;
}
</style>
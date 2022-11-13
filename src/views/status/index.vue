<script setup lang="ts">
import {shell} from "electron"

const { ffmpegStatus } = useFFmpeg()
const { autocutStatus } = useAutoCut()

const ffmpegUrl = "https://ffmpeg.org/download.html"

const openFFmpeg = ()=>{
  shell.openExternal(ffmpegUrl);
}
</script>

<template>
  <div class="flex flex-col justify-center items-center">
    <div class="w-[90%] h-[240px] my-2
      flex flex-col justify-center items-center
      border border-solid border-[#F0F0F0]
      bg-white
      leading-6"
    >
      <img class="block w-[80px] h-[80px]" src="@/assets/FFmpeg.png">
      <div>{{ ffmpegStatus ? '已正确安装 FFmpeg' : '请检查 ffmpeg 是否已正确安装'}}</div>
      <div v-if="!ffmpegStatus">
        请 <a :href="ffmpegUrl" @click.prevent="openFFmpeg">点击下载 ffmpeg</a> 并安装
      </div>
    </div>
    <div class="w-[90%] h-[240px] my-2
      flex flex-col justify-center items-center
      border border-solid border-[#F0F0F0]
      bg-white
      leading-6"
    >
      <div>{{ autocutStatus ? '已正确安装 AutoCut' : '请检查 AutoCut 是否已正确安装'}}</div>
      <div v-if="!autocutStatus">
        <a href="/setup/autocut">点击开始配置</a>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
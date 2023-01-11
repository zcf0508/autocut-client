<script setup lang="ts">
import {shell} from "electron"

const { t } = useI18n()

const ffmpegStatus = computed(() => statusStore.ffmpegStatus)
const autocutStatus = computed(() => statusStore.autocutStatus)

const ffmpegUrl = "https://ffmpeg.org/download.html"

const openFFmpeg = ()=>{
  shell.openExternal(ffmpegUrl);
}
</script>

<template>
  <div class="flex flex-col justify-center items-center">
    <div class="w-[90%] h-[240px] my-2
      flex flex-col justify-center items-center
      border border-solid border-[#F0F0F0] rounded-[4px]
      bg-white
      leading-6"
    >
      <img class="block w-[80px] h-[80px]" src="@/assets/FFmpeg.png">
      <div>{{ ffmpegStatus ? t("ffmepegInstalled.success") : t("ffmepegInstalled.error")}}</div>
      <div v-if="!ffmpegStatus">
        <a :href="ffmpegUrl" @click.prevent="openFFmpeg">{{ t("ffmepegInstalled.tip") }}</a> 
      </div>
    </div>
    <div class="w-[90%] h-[240px] my-2
      flex flex-col justify-center items-center
      border border-solid border-[#F0F0F0] rounded-[4px]
      bg-white
      leading-6"
    >
      <div>{{ autocutStatus ? t("autocutInstalled.success") : t("autocutInstalled.error")}}</div>
      <div>
        <a href="/#/setup/autocut" @click.prevent.stop="$router.push('/setup/autocut')">
          {{ t("autocutInstalled.tip") }}
        </a>
      </div>
    </div>
    <div>
      <button 
        class="h-[40px] rounded-[4px] border-none  whitespace-nowrap px-2"
        :class=" ffmpegStatus && autocutStatus 
          ? 'cursor-pointer bg-[#0063b1] text-white' 
          : 'cursor-not-allowed bg-[#F0F0F0]'"
        :disabled="!ffmpegStatus || !autocutStatus"
        @click="$router.push('/edit')"
      >
        {{ t("start") }}
      </button>
    </div>
  </div>
</template>

<style scoped>

</style>

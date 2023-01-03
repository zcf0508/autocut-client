<script setup lang="ts">
import { LOCALES } from "@/i18n"

const { t, locale } = useI18n()

const changLocale = (e: Event) => {
  configStore.setLocale((e.target as HTMLSelectElement).value)
}

const { ffmpegStatus, checkFFmpeg } = useFFmpeg()
const { autocutStatus, checkAutocut } = useAutoCut()

checkFFmpeg()
checkAutocut()
</script>

<template>
  <div class="bg-[#fafafa] w-full h-full">
    <div class="h-[calc(100%-48px)] overflow-y-hidden">
      <router-view></router-view>
    </div>
    <div class="fixed bottom-0 w-full h-[47px] px-4 box-border
      flex items-center bg-white justify-between
      border-0 border-t border-solid border-[#F0F0F0]"
    >
      <div class="flex">
        <div class="mr-2"> {{ t("statusBar") }}: </div>
        <div class="flex items-center cursor-pointer mr-4" @click="checkFFmpeg">
          <div 
            class="w-[8px] h-[8px] rounded-full mr-2" 
            :class="ffmpegStatus ? 'bg-[#388E3C]' : 'bg-[#C9C9C9]'"
          ></div>
          <span>FFmpeg</span>
        </div>
        <div class="flex items-center cursor-pointer" @click="checkAutocut">
          <div 
            class="w-[8px] h-[8px] rounded-full mr-2" 
            :class="autocutStatus ? 'bg-[#388E3C]' : 'bg-[#C9C9C9]'"
          ></div>
          <span>AutoCut</span>
        </div>
      </div>
      <div>
        <select 
        v-model="locale" 
        class="h-[39px] border border-[#F0F0F0] bg-white rounded-[4px] px-2" 
        @change="changLocale"
      >
          <option v-for="l in LOCALES" :key="l.locale" :value="l.locale">{{ l.name }}</option>
        </select>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>

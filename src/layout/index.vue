<script setup lang="ts">
const { ffmpegStatus, checkFFmpeg } = useFFmpeg()
const { autocutStatus, checkAutocut } = useAutoCut()

checkFFmpeg()
checkAutocut()
</script>

<template>
  <div class="bg-[#fafafa] w-full h-full">
    <router-view></router-view>
    <div class="fixed bottom-0 w-full h-[48px] flex items-center bg-white px-4">
      <span>状态：</span>
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
  </div>
</template>

<style scoped>

</style>
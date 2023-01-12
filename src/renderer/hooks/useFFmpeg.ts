import { checkStatus } from "@/interface/ffmpeg"

export function useFFmpeg(){
  const ffmpegStatus = computed(() => statusStore.ffmpegStatus)
  
  const checkFFmpeg = async ()=>{
    statusStore.setFFmpeg(await checkStatus())
  }
  
  return {
    ffmpegStatus,
    checkFFmpeg,
  }
}
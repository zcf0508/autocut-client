import { checkStatus } from "@/interface/ffmpeg"

export function useFFmpeg(){
  const ffmpegStatus = ref(false)
  
  const checkFFmpeg = async ()=>{
    ffmpegStatus.value = await checkStatus()
    statusStore.setFFmpeg(ffmpegStatus.value)
  }
  
  return {
    ffmpegStatus,
    checkFFmpeg,
  }
}
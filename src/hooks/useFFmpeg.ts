import { ipcRenderer } from "electron"

export function useFFmpeg(){
  const ffmpegStatus = ref(false)
  
  const checkFFmpeg = ()=>{
    ipcRenderer.send("check-ffmpeg")
  }

  ipcRenderer.on("report-ffmpeg-status",(e,...args)=>{
    ffmpegStatus.value = args[0]
  })

  // 主动检查一遍
  checkFFmpeg()
  
  return {
    ffmpegStatus,
    checkFFmpeg,
  }
}
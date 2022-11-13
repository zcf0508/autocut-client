import { ipcRenderer } from "electron"

export function useAutoCut(){
  const excutePath = ""
  const autocutStatus = ref(false)
  
  const checkAutocut = ()=>{
    ipcRenderer.send("check-autocut", excutePath)
  }

  ipcRenderer.on("report-autocut-status",(e,...args)=>{
    autocutStatus.value = args[0]
  })

  // 主动检查一遍
  checkAutocut()
  
  return {
    autocutStatus,
    checkAutocut,
  }
}
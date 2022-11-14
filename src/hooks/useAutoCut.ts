import { ipcRenderer } from "electron"
import path from "path"

export function useAutoCut(){
  const excutePath = computed(() => path.join(configStore.installPath, "autocut", "autocut.exe"))
  const autocutStatus = ref(false)
  
  const checkAutocut = ()=>{
    console.log(excutePath.value)
    ipcRenderer.send("check-autocut", excutePath.value)
  }

  ipcRenderer.on("report-autocut-status",(e,...args)=>{
    autocutStatus.value = args[0]
    statusStore.setAutocut(args[0])
  })
  
  watch(
    () => excutePath.value,
    () => {
      checkAutocut()
    },
  )


  return {
    autocutStatus,
    checkAutocut,
  }
}
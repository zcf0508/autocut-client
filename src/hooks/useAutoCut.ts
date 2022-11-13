import { ipcRenderer } from "electron"

export function useAutoCut(){
  const excutePath = computed(() => `${configStore.installPath}/autocut/autocut.exe`)
  const autocutStatus = ref(false)
  
  const checkAutocut = ()=>{
    console.log(excutePath.value)
    ipcRenderer.send("check-autocut", excutePath.value)
  }

  ipcRenderer.on("report-autocut-status",(e,...args)=>{
    autocutStatus.value = args[0]
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
import * as os from "os"
import { checkStatus } from "@/interface/autocut"
import path from "path"

export function useAutoCut(){
  const excutePath = computed(() => path.join(
    configStore.installPath, 
    "autocut", 
    `autocut${os.platform().indexOf("win") >= 0? ".exe" : ""}`,
  ))
  const autocutStatus = computed(() => statusStore.autocutStatus)
  
  const checkAutocut = async ()=>{
    if (configStore.installPath && !configStore.installPath.match(/[^a-zA-z0-9\:\\\/\-\_\ ]+/)) {  
      statusStore.setAutocut(await checkStatus(excutePath.value))
    } else {
      statusStore.setAutocut(false)
    }
  }

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

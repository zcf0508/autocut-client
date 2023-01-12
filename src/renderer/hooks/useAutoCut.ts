import * as os from "os"
import { checkStatus } from "@/interface/autocut"
import path from "path"

export function useAutoCut(){
  const excutePath = computed(() => path.join(
    configStore.installPath, 
    "autocut", 
    `autocut${os.platform().indexOf("win") >= 0? ".exe" : ""}`,
  ))
  const autocutStatus = ref(false)
  
  const checkAutocut = async ()=>{
    autocutStatus.value = await checkStatus(excutePath.value)
    statusStore.setAutocut(autocutStatus.value)
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

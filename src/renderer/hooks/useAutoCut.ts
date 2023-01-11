import { checkStatus } from "@/interface/autocut"
import path from "path"

export function useAutoCut(){
  const excutePath = computed(() => path.join(configStore.installPath, "autocut", "autocut.exe"))
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
import { ipcRenderer } from "electron"

export interface PrVersion  {
  specifier: string
  name: string
}

export function usePrVersions(){
  const prVersions = ref([] as Array<PrVersion>)

  const checkPrVersions = ()=>{
    ipcRenderer.send("check-pr-versions")
  }

  ipcRenderer.on("report-pr-versions",(e,...args)=>{
    prVersions.value = args[0]
  })

  return {
    prVersions,
    checkPrVersions,
  }
}
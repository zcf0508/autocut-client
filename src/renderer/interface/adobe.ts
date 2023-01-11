import { ipcRenderer } from "electron"


export interface PrVersion  {
  specifier: string
  name: string
}

/**
 * 获取 pr 版本列表
 */
export function getPrVersions() {
  return new Promise<Array<PrVersion>>((resolve,reject) => {
    ipcRenderer.once("report-pr-versions", (e, versions: Array<PrVersion>) => {
      resolve(versions)
    })

    ipcRenderer.send("check-pr-versions")
  })
}

export function selectPrprojSaveDirectory() {
  return new Promise<Electron.OpenDialogReturnValue>(async (resolve, reject) => {
    resolve(
      await ipcRenderer.invoke("select-prproj-save-directory"),
    )
  })
}

export function exportToPr(
  targetPath: string, 
  videoPath: string, 
  srtPath: string, 
  clipPoints: Array<string>, 
  version: string,
) {
  return new Promise<void>((resolve, reject) => {

    ipcRenderer.once("export-to-pr", (e, {status, msg}) => {
      if (status === "success") {
        resolve()
      } else if(status === "error") {
        reject(msg)
      }
    })

    ipcRenderer.send(
      "export-to-pr", 
      Buffer.from(targetPath).toString("base64"), 
      Buffer.from(videoPath).toString("base64"), 
      Buffer.from(srtPath).toString("base64"), 
      clipPoints, 
      version,
    )
  })
}
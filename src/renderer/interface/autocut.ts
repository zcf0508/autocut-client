import { v4 as uuidv4 } from "uuid";
import { ipcRenderer } from "electron"
import { AutocutConfig } from "src/types"

/**
 * 检查 AuctoCut 可执行状态
 * @param excutePath 执行路径
 */
export function checkStatus(excutePath: string) {
  return new Promise<boolean>((resolve,reject) => {
    ipcRenderer.once("report-autocut-status", (e, status: boolean) => {
      resolve(status)
    })

    ipcRenderer.send("check-autocut", Buffer.from(excutePath).toString("base64"))
  })
}

/**
 * 选择 AutoCut 安装目录
 */
export function selectAutocutSaveDirectory() {
  return new Promise<Electron.OpenDialogReturnValue>(async (resolve,reject) => {
    resolve(
      await ipcRenderer.invoke("select-autocut-save-directory"),
    )
  })
}

interface DownloadReport {
  status: "downloading"| "extracting" | "error" | "success"
  msg: string
  process?: number
}

/**
 * 正在进行的下载任务
 */
const downloadTasks = new Set<string>()

/**
 * 下载 AutoCut
 * @param installPath 安装路径
 * @param processCallback 进度回调
 * @returns 
 */
export function downloadAutoCut(installPath: string, processCallback: (task: string, process: number) => any) {
  return new Promise<void>((resolve, reject) => {
    const uuid = uuidv4()

    const taskCount = 2 // 下载和解压
    ipcRenderer.on("report-download",(e, _uuid: string, res: DownloadReport) => {
      if (_uuid !== uuid) {
        return
      }
      if (res.status === "error") {
        downloadTasks.delete(uuid)
        reject(new Error(res.msg))
      }
      else if (res.status === "success" ) {
        downloadTasks.delete(uuid)
        resolve()
      }
      else {
        if(res.status === "downloading") {
          processCallback("downloading", res.process!/taskCount)
        }
        else if(res.status === "extracting") {
          processCallback("extracting", 100/taskCount + res.process!/taskCount)
        }
      }
    })

    ipcRenderer.send("download-autocut", uuid, Buffer.from(installPath).toString("base64"))
    downloadTasks.add(uuid)
  }).finally(() => {
    if (downloadTasks.size === 0) {
      ipcRenderer.removeAllListeners("report-download")
    }
  })
}

interface TranscribeReport {
  status: "processing" | "error" | "success"
  msg: string
  process?: number
}

/**
 * 正在进行的转录任务
 */
const transcribeTasks = new Set<string>()

/**
 * 转录视频
 * @param filePath 文件路径
 * @param processCallback 进度回调
 * @returns 返回转录成功后的字幕地址
 */
export function startTranscribe(
  filePath: string, 
  config: AutocutConfig,
  processCallback: (task: string, process: number) => any,
) {
  return new Promise<string>((resolve, reject) => {
    const uuid = uuidv4()

    let taskCount = 1 // 默认为转录

    ipcRenderer.on("report-transcribe", (e, _uuid: string, res: TranscribeReport) => {
      if (_uuid !== uuid) {
        return
      }
      if (res.status === "error") {
        transcribeTasks.delete(uuid)
        reject(new Error(res.msg))
      } else if (res.status === "success") {
        transcribeTasks.delete(uuid)
        resolve(filePath.slice(0, filePath.lastIndexOf(".")) + ".srt")
      } else if (res.status === "processing") {
        if (res.msg === "transcribing") {
          processCallback(
            "processing", 
            taskCount === 1 
              ? res.process! // 仅转录
              : 100/taskCount + res.process!/taskCount, // 下载和转录
          )
        } else if (res.msg === "downloading") {
          if (taskCount === 1) {
            taskCount++ // 增加一个下载任务
          }
          processCallback("processing", res.process!/taskCount)
        }
      }

    })

    ipcRenderer.send("start-transcribe", uuid, Buffer.from(filePath).toString("base64"), config)
    transcribeTasks.add(uuid)
  }).finally(() => {
    if (transcribeTasks.size === 0) {
      ipcRenderer.removeAllListeners("report-transcribe")
    }
  })
}

/**
 * 正在进行的剪辑任务
 */
const cutTasks = new Set<string>()

/**
 * 按字幕剪辑视频
 * @param videoPath 原视频地址
 * @param cutSrtPath 剪辑后的字幕文件地址
 * @returns 
 */
export function startCut(videoPath: string, cutSrtPath: string) {
  return new Promise<string>((resolve, reject) => {
    const uuid = uuidv4()

    ipcRenderer.on("report-cut",(e, _uuid: string,  res) => {
      if(_uuid !==  uuid) {
        return
      }

      if(res.status === "error"){
        cutTasks.delete(uuid)
        reject(res.msg)
      } else if(res.status === "success") {
        cutTasks.delete(uuid)
        resolve(res.msg)
      }
    })

    ipcRenderer.send(
      "start-cut", 
      uuid,
      Buffer.from(videoPath).toString("base64"), 
      Buffer.from(cutSrtPath).toString("base64"),
    )
    cutTasks.add(uuid)
  }).finally(() => {
    if (cutTasks.size === 0) {
      ipcRenderer.removeAllListeners("report-cut")
    }
  })
}

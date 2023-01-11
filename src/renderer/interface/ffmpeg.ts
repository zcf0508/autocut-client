import { v4 as uuidv4 } from "uuid";
import { ipcRenderer } from "electron"

/**
 * 检查 ffmpeg 可执行状态
 */
export function checkStatus() {
  return new Promise<boolean>((resolve,reject) => {
    ipcRenderer.once("report-ffmpeg-status", (e, status: boolean) => {
      resolve(status)
    })

    ipcRenderer.send("check-ffmpeg")
  })
}

/**
 * 正在进行的视频转换任务
 */
const convertVideoTasks = new Set<string>()

/**
 * 将输入的视频文件转为 mp4
 * @param filePath 视频文件路径
 * @returns 转换后的视频地址
 */
export function convertVideo(filePath: string) {
  return new Promise<string>((resolve, reject) => {
    const uuid = uuidv4()

    ipcRenderer.on("report-convert-video",(e, _uuid: string, res)=>{
      if (_uuid !== uuid) {
        return
      }
      if (res.status === "error") {
        convertVideoTasks.delete(uuid)
        reject()
      } else if (res.status === "success") {
        convertVideoTasks.delete(uuid)
        resolve(filePath.slice(0,filePath.lastIndexOf(".")) + ".mp4")
      }
    })

    ipcRenderer.send("convert-video", uuid, Buffer.from(filePath).toString("base64"))
    convertVideoTasks.add(uuid)
  }).finally(() => {
    if (convertVideoTasks.size === 0) {
      ipcRenderer.removeAllListeners("report-convert-video")
    }
  })
}

/**
 * 正在进行的视频转换任务
 */
const convertAudioTasks = new Set<string>()

/**
 * 将输入的视频文件转为 wav
 * @param filePath 视频文件路径
 * @returns 转换后的音频地址
 */
export function convertAudio(filePath: string) {
  return new Promise<string>((resolve, reject) => {
    const uuid = uuidv4()

    ipcRenderer.on("report-convert-audio",(e, _uuid: string, res)=>{
      if (_uuid !== uuid) {
        return
      }
      if (res.status === "error") {
        convertAudioTasks.delete(uuid)
        reject()
      } else if (res.status === "success") {
        convertAudioTasks.delete(uuid)
        resolve(filePath.slice(0,filePath.lastIndexOf(".")) + ".wav")
      }
    })

    ipcRenderer.send("convert-audio", uuid, Buffer.from(filePath).toString("base64"))
    convertAudioTasks.add(uuid)
  }).finally(() => {
    if (convertAudioTasks.size === 0) {
      ipcRenderer.removeAllListeners("report-convert-audio")
    }
  })
}
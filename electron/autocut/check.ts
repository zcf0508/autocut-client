import { exec } from "child_process"

export function ffmpegCheck() {
  return new Promise<boolean>((resolve, reject) => {
    const ffmpeg = exec("ffmpeg -version")

    ffmpeg.stdout.on("data", (res) => {
      if(res.indexOf("ffmpeg version") >= 0){
        resolve(true)
        return
      }
    })

    ffmpeg.stderr.on("data", (err) => {
      resolve(false)
      return
    })

    ffmpeg.on("close", (code, signal) => {
      console.log(`ffmpeg exit. ${code}: ${signal}`)
    })
  })
}

/**
 * 
 * @param excutePath AutoCut 可执行文件路径
 */
export function autocutCheck(excutePath:string){
  return new Promise<boolean>((resolve, reject) => {
    const autocut = exec(`${excutePath} -h`)

    autocut.stdout.on("data", (res) => {
      if(res.indexOf("usage: autocut") >= 0){
        resolve(true)
        return
      }
    })

    autocut.stderr.on("data", (err) => {
      resolve(false)
      return
    })

    autocut.on("close", (code, signal) => {
      console.log(`AutoCut exit. ${code}: ${signal}`)
    })
  })
}
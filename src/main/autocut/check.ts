import { exec } from "child_process"
import { safePath } from "~~/utils"

export function ffmpegCheck() {
  return new Promise<boolean>((resolve, reject) => {
    const ffmpeg = exec("ffmpeg -version")
    let success = false

    ffmpeg.stdout.on("data", (res) => {
      // console.log(`stdout: ${res}`)
      if(res.indexOf("ffmpeg version") >= 0){
        success = true
        resolve(true)
        return
      }
    })

    ffmpeg.stderr.on("data", (err) => {
      // console.log(`stderr: ${err}`)
      if(err.indexOf("ffmpeg version") >= 0){
        success = true
        resolve(true)
        return
      }
    })

    ffmpeg.on("close", (code, signal) => {
      console.log(`ffmpeg exit. ${code}: ${signal}`)
      if (!success) {
        resolve(false)
      }
      return
    })
  })
}

/**
 * 
 * @param excutePath AutoCut 可执行文件路径
 */
export function autocutCheck(excutePath:string){
  return new Promise<boolean>((resolve, reject) => {
    const commad = `"${safePath(excutePath)}" -h`
    const autocut = exec(commad)
    let success = false
    autocut.stdout.on("data", (res) => {
      // console.log(`stdout: ${res}`)
      if(res.indexOf("usage: autocut") >= 0){
        resolve(true)
        success = true
        return
      }
    })

    autocut.stderr.on("data", (err) => {
      // console.log(`stderr: ${err}`)
      if(err.indexOf("usage: autocut") >= 0){
        resolve(true)
        success = true
        return
      }
    })

    autocut.on("close", (code, signal) => {
      console.log(`AutoCut exit. ${code}: ${signal}`)
      if (!success) {
        resolve(false)
      }
      return
    })
  })
}

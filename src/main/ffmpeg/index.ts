import * as fs from "fs"
import { spawn } from "child_process"
import readline from "readline"
import { safePath } from "~~/utils"

type ProcessStatus = "error" | "processing" | "success"

/**
 * 生成视频的音频文件，用于页面显示
 * @param video 视频地址
 * @param cb 
 */
export function getAudio(
  video: string,
  cb: (status: ProcessStatus, msg: string, process?: number) => any,
){
  let success = false
  const exportPath = `${video.slice(0, video.lastIndexOf("."))}.wav`
  if(fs.existsSync(exportPath)){
    cb(
      "success",
      "exists, skipping",
    )
    return 
  }
  const p = spawn(
    "ffmpeg",
    [
      "-i", safePath(video), "-y", 
      "-vn",  "-acodec", "pcm_s16le", "-ac", "1", "-ar", "8000", 
      exportPath,
    ],
  )
  const stdoutLineReader = readline.createInterface({
    input: p.stdout,
    output: p.stdin,
    terminal: false,
  });
  stdoutLineReader.on("line", (line) => {
    console.log(`stdout: ${line}`)
  })

  const stderrLineReader = readline.createInterface({
    input: p.stderr,
    output: p.stdin,
    terminal: false,
  });
  stderrLineReader.on("line", (line) => {
    console.log(`stderr: ${line}`)
    if(line.match(/audio:[0-9]*kB/)?.length>0) {
      success = true
      cb("success", "success")
    }
  })

  p.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
    if(!success){
      cb("error", "close")
    }
  });
}

/**
 * 转换视频格式，用于页面显示
 * @param video 视频地址
 * @param cb 
 */
export function convertVideo(
  video: string,
  cb: (status: ProcessStatus, msg: string, process?: number) => any,
){
  let success = false
  const exportPath = `${video.slice(0, video.lastIndexOf("."))}.mp4`
  if(fs.existsSync(exportPath)){
    cb(
      "success",
      "exists, skipping",
    )
    return 
  }
  const p = spawn(
    "ffmpeg",
    [
      "-i", safePath(video), "-y", 
      "-c:v", "libx264", "-c:a", "acc", "-pix_fmt", "yuv420p", "-ac", "2", "-movflags", "faststart",
      "-threads", "8", "-preset", "ultrafast", 
      safePath(exportPath),
    ],
  )
  const stdoutLineReader = readline.createInterface({
    input: p.stdout,
    output: p.stdin,
    terminal: false,
  });
  stdoutLineReader.on("line", (line) => {
    console.log(`stdout: ${line}`)
  })

  const stderrLineReader = readline.createInterface({
    input: p.stderr,
    output: p.stdin,
    terminal: false,
  });
  stderrLineReader.on("line", (line) => {
    console.log(`stderr: ${line}`)
    if(line.match(/video:[0-9]*kB/)?.length>0) {
      success = true
      cb("success", "success")
    }
  })

  p.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
    if(!success){
      cb("error", "close")
    }
  });
}

import { spawn } from "child_process"
import readline from "readline"

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
  const p = spawn(
    "ffmpeg",
    [
      "-i", `${video}`, "-y", 
      "-vn",  "-acodec", "pcm_s16le", "-ac", "1", "-ar", "8000", 
      `${video.slice(0, video.lastIndexOf("."))}.wav`,
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
  const p = spawn(
    "ffmpeg",
    [
      "-i", `${video}`, "-y", 
      "-vcodec", "libx264", 
      "-threads", "8", "-preset", "ultrafast", 
      `${video.slice(0, video.lastIndexOf("."))}.mp4`,
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
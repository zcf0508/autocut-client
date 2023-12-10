import * as fs from "fs"
import os from "os";
import path from "path";
import { spawn } from "child_process"
import readline from "readline"
import { secondToTimestamp } from "~~/utils"
import { safePath } from "~~/utils/path"
import { type Vad } from "~~/vad/index"
import { i } from "vitest/dist/index-5aad25c1";

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
      "-vn",  "-acodec", "pcm_s16le", "-ac", "1", "-ar", "16000", 
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

function _ffmpegSlice(file: string, start: string, end: string) {
  const tempDir = path.join(os.tmpdir(), "./autocut-client")
  if(!fs.existsSync(tempDir)){
    fs.mkdirSync(tempDir)
  }
  return new Promise<ReturnType<Vad>[0] & {file: string}>((resolve, reject) => {
    
    const id = Math.random().toString(36).slice(2)
    const exportPath = `${tempDir}/${id}.wav`
    const p = spawn(
      "ffmpeg",
      [
        "-i", safePath(file), "-y", 
        "-ss", secondToTimestamp(start), 
        "-t", secondToTimestamp((Number(end) - Number(start)).toFixed(6)), 
        "-c:a", "pcm_s16le", 
        exportPath,
      ],
    )

    p.on("close", (code) => {
      if(code === 0) {
        resolve({
          start,
          end,
          file: exportPath,
        })
      } else {
        console.log(`child process exited with code ${code}`);
        reject()
      }
    })
    
  })
}

export async function slice(file: string, times: ReturnType<Vad>) {
  // ffmpeg -i input_audio.mp3 -ss 00:00:02 -t 00:00:03 -c:a pcm_s16le output_audio.wav

  const sliceRes = [] as Array<{
    start: string;
    end: string;
    file: string;
  }>

  const cpuNum = os.cpus().length
  const threads = Math.floor(cpuNum / 2) || 1

  // 打印进度条
  let lastProgress = 0
  for (let i = 0; i < Math.ceil(times.length / threads); i++) {
    const _res = await Promise.all(times.slice(i * threads, i * threads + threads).map(time => {
      return _ffmpegSlice(file, time.start, time.end)
    }))
    sliceRes.push(..._res)
    const progress = Math.floor((i * threads + threads) / times.length * 100)
    if(progress > lastProgress) {
      lastProgress = progress
      console.log(`slice progress: ${progress > 100 ? 100 : progress}%`)
    }
  }
  
  return {
    sliceRes,
    removeTemps() {
      sliceRes.forEach((item) => {
        try{
          fs.unlinkSync(item.file)
        } catch(err) {
          console.error(err)
        }
      })
    },
  }
}

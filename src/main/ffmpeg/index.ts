import * as fs from "fs"
import os from "os";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { spawn } from "child_process"
import readline from "readline"
import { safePath } from "~~/utils"
import { type Vad } from "~~/vad"

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

/** like 2.304000 -> 00:00:02.304 */
function _transformTimeformat(time: string | number): string {
  const [second, millisecond] = `${time}`.split(".")
  const date = new Date(0)
  date.setSeconds(+second)
  return date.toISOString().substr(11, 8).replace("T", "").replace("Z", "") + "." + millisecond.slice(0, 3)
}

function _ffmpegSlice(file: string, start: string, end: string) {
  const tempDir = path.join(os.tmpdir(), "./autocut-client")
  if(!fs.existsSync(tempDir)){
    fs.mkdirSync(tempDir)
  }
  return new Promise<ReturnType<Vad>[0] & {file: string}>((resolve, reject) => {
    const id = uuidv4()
    const exportPath = `${tempDir}/${id}.wav`
    console.log("ffmpeg",
      [
        "-i", safePath(file), "-y", 
        "-ss", _transformTimeformat(start), 
        "-t", _transformTimeformat(Number(end) - Number(start)), 
        "-c:a", "pcm_s16le", 
        exportPath,
      ])
    const p = spawn(
      "ffmpeg",
      [
        "-i", safePath(file), "-y", 
        "-ss", _transformTimeformat(start), 
        "-t", _transformTimeformat(Number(end) - Number(start)), 
        "-c:a", "pcm_s16le", 
        exportPath,
      ],
    )

    p.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
      if(code === 0) {
        resolve({
          start,
          end,
          file: exportPath,
        })
      } else {
        reject()
      }
    })
    
  })
}

export async function slice(file: string, times: ReturnType<Vad>) {
  // ffmpeg -i input_audio.mp3 -ss 00:00:02 -t 00:00:03 -c:a pcm_s16le output_audio.wav

  console.log(os.tmpdir())

  const sliceRes = await Promise.all(times.map(time => {
    return _ffmpegSlice(file, time.start, time.end)
  }))
  
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
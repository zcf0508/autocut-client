import { spawn } from "child_process"
import readline from "readline"
import fs from "fs"
import { savePath } from "~~/utils"
import { AutocutConfig } from "~~/../types"
type GenerateStatus = "processing" | "error" | "success"

/**
 * 生成字幕文件
 */
export function generateSubtitle(
  excutePath: string, 
  filePath: string,
  config: AutocutConfig,
  cb: (status: GenerateStatus, msg: string, process?: number) => any,
) {
  const srtFile = filePath.slice(0, filePath.lastIndexOf(".")) + ".srt"

  if (fs.existsSync(srtFile)) {
    cb("success", "srt file already exist")
    return
  }

  let fail = false
  // let commad = `${excutePath} -t ${filePath}`
  const p = spawn(
    savePath(excutePath), 
    [
      "-t", savePath(filePath), 
      "--device", config.device || "cpu", 
      "--whisper-model", config.whisperModel || "tiny",
      "--lang", config.lang || "zh",
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

    if (line.indexOf("exists, skipping")>= 0){
      fail = true
      cb("success", "md file already exist")
      return
    }
    if (line.indexOf("Transcribing") >= 0){
      cb(
        "processing",
        "transcribing",
        0,
      )
    }
    if (line.match(/[0-9]*%/)?.length > 0 && line.match(/B\/s/)?.length > 0) {
      const process = parseInt(line.match(/[0-9]*%/)[0])
      cb(
        "processing",
        "downloading",
        process,
      )
    }
    else if (line.match(/[0-9]*%/)?.length > 0) {
      const process = parseInt(line.match(/[0-9]*%/)[0])
      cb(
        "processing",
        "transcribing",
        process,
      )
    }
    if (line.indexOf("Saved texts to") >= 0){
      cb(
        "success",
        "saved",
        100,
      )
    }
  })

  p.on("error", (err) => {
    console.log(`err: ${err}`)
    fail = true
    cb(
      "error",
      `unknown error: ${err}`,
    )
    return
  });

  p.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
    if(!fail){
      cb("success", "close")
    }
  });

}

type CutStatus = "error" | "success" | "processing"

export function cutVideo(
  excutePath: string, 
  videoFilePath: string,
  srtFilePath:string,
  cb: (status: CutStatus, msg: string, process?: number) => any,
){
  let fail = false
  const p = spawn(
    savePath(excutePath),
    ["-c", savePath(videoFilePath), savePath(srtFilePath)],
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

    if (line.indexOf("exists, skipping")>= 0){
      fail = true
      cb("success", "cuted file already exist")
      return
    }

    if (line.indexOf("based on") >= 0){
      cb(
        "processing",
        "transcribing",
        0,
      )
    }
    if (line.match(/[0-9]*%/)?.length > 0) {
      const process = parseInt(line.match(/[0-9]*%/)[0])
      cb(
        "processing",
        "transcribing",
        process,
      )
    }
    if (line.indexOf("Saved video to") >= 0){
      cb(
        "success",
        "saved",
        100,
      )
      return
    }
  })

  p.on("error", (err) => {
    console.log(`err: ${err}`)
    fail = true
    cb(
      "error",
      `unknown error: ${err}`,
    )
    return
  });

  p.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
    if(!fail){
      cb("success", "close")
    }
  });

}

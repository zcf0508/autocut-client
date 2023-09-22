import { spawn } from "child_process"
import readline from "readline"
import fs from "fs"
import { timestampToSecond } from "~~/utils"
import { safePath } from "~~/utils/path"
import { AutocutConfig } from "~~/../types"
import { slice } from "~~/ffmpeg"
import { detectVoiceActivity } from "~~/vad"
import { transcribe, WhisperResItem } from "~~/whisper"
import { type NodeCue, type NodeList, stringifySync } from "subtitle"

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
    safePath(excutePath), 
    [
      "-t", safePath(filePath), 
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
    safePath(excutePath),
    ["-c", safePath(videoFilePath), safePath(srtFilePath)],
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
    if (line.indexOf("Saved media to") >= 0){

      const time = new Date().getTime()
      // 修改保存后的文件名
      const cutedVideoPath = safePath(videoFilePath).slice(0, safePath(videoFilePath).lastIndexOf(".")) + "_cut.mp4"
      const renamedCutedVideoPath = safePath(videoFilePath)
        .slice(0, safePath(videoFilePath).lastIndexOf(".")) + `_cut_${time}.mp4`

      fs.renameSync(cutedVideoPath, renamedCutedVideoPath)

      const renamedCutedSrtPath = safePath(srtFilePath)
        .slice(0, safePath(srtFilePath).lastIndexOf(".")) + `_${time}.srt`

      fs.renameSync(safePath(srtFilePath), renamedCutedSrtPath)
      

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


export async function generateSubtitle1(
  file: string, 
  config: {language: string, modelPath: string, vad?: boolean}, 
  cb?: (status: GenerateStatus, msg: string, process?: number) => any,
) {
  const srtFile = file.slice(0, file.lastIndexOf(".")) + ".srt"

  const srt: NodeList = []
  const times = await detectVoiceActivity(file)

  let res: Array<WhisperResItem[]> = []

  let sliceRes: Array<{start: string, end: string, file: string}> = []
  
  if(config.vad) {
    const { sliceRes: _sliceRes, removeTemps } = await slice(file, times)
    sliceRes = _sliceRes

    const done: number[] = []
    
    cb?.("processing", "transcribing", 0)
    res = await Promise.all(sliceRes.map((item, _idx) => {
      return transcribe(config.modelPath, item.file, {language: config.language}, _idx, (idx: number) => {
        done.push(idx)
        cb?.("processing", "transcribing", Math.floor(done.length / sliceRes.length * 100))
      })
    }))

    removeTemps()
  } else {
    cb?.("processing", "transcribing", 0)
    res.push(await transcribe(config.modelPath, file, {language: config.language}))
    cb?.("processing", "transcribing", 100)
  }
  
  // 生成 srt 并保存
  res.forEach((p, pIdx) => {
    p.forEach(l => {
      let offset = 0
      if(sliceRes[pIdx]) {
        offset = Number(Number(sliceRes[pIdx].start).toFixed(3))
      }
      const cue: NodeCue = {
        type: "cue",
        data: {
          start: (timestampToSecond(l[0]) + offset) * 1000,
          end: (timestampToSecond(l[1]) + offset) * 1000,
          text: l[2],
        },
      }
      srt.push(cue)
    })
  })
  fs.writeFileSync(srtFile, stringifySync(srt, { format: "SRT" }))
}
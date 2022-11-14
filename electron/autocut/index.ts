import { spawn } from "child_process"
import readline from "readline"

type GenerateStatus = "processing" | "error" | "success"

/**
 * 生成字幕文件
 * TODO: 中文路径有问题 暂时不支持中文
 */
export function generateSubtitle(
  excutePath: string, 
  filePath: string, 
  cb: (status: GenerateStatus, msg: string, process?: number) => any,
) {
  let fail = false
  // let commad = `${excutePath} -t ${filePath}`
  // console.log(commad)
  const p = spawn(excutePath, ["-t", `${filePath}`])

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
    if (line.match(/[0-9]*%/)?.length > 0) {
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
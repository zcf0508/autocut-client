const shelljs = require("shelljs")
const fs = require("node:fs")
const path = require("node:path")
const { isCI } = require("std-env")

function cpDirSync(source, target) {
  const stat = fs.statSync(source)
  if(stat.isDirectory()) {
    if(!fs.existsSync(target)) {
      fs.mkdirSync(target)
    }
    const files = fs.readdirSync(source)
    files.forEach((file) => {
      const curSource = path.join(source, file)
      const curTarget = path.join(target, file)
      if(fs.statSync(curSource).isDirectory()) {
        cpDirSync(curSource, curTarget)
      } else {
        fs.copyFileSync(curSource, curTarget)
      }
    })
  } else {
    fs.copyFileSync(source, target)
  }
}

function info(msg) {
  shelljs.echo("\x1b[32m" + msg + "\x1b[0m")
}

if(!fs.existsSync(path.resolve(__dirname, "../lib/whisper.cpp/Makefile"))) {
  info("Clone whisper.cpp")
  shelljs.exec("git clone https://github.com/ggerganov/whisper.cpp.git lib/whisper.cpp -b v1.5.1 --depth=1")

  info("Patch whisper addon.cpp")
  fs.cpSync(
    path.resolve(__dirname, "./whisper.cpp/whisper-addon.cpp"), 
    path.resolve(__dirname, "../lib/whisper.cpp/examples/addon.node/addon.cpp"),
  )
  fs.cpSync(
    path.resolve(__dirname, "./whisper.cpp/CMakeLists.txt"), 
    path.resolve(__dirname, "../lib/whisper.cpp/examples/addon.node/CMakeLists.txt"),
  )
}

if(
  !fs.existsSync(path.resolve(__dirname, "../lib/whisper.cpp/build/Release/whisper-addon.node"))
  && !fs.existsSync(path.resolve(__dirname, "../lib/whisper.cpp/build/bin/Release/whisper-addon.node"))
) {
  info("Build whisper.cpp addon")

  // cpu
  shelljs.exec("cd ./lib/whisper.cpp && npx cmake-js compile -T whisper-addon -B Release")
  if(
    fs.existsSync(path.resolve(__dirname, "../lib/whisper.cpp/build/Release/whisper-addon.node")) 
    || fs.existsSync(path.resolve(__dirname, "../lib/whisper.cpp/build/bin/Release/whisper-addon.node")) 
  ) {
    info("Copy whisper.cpp addon")
    if(process.platform === "win32") {
      cpDirSync(
        path.resolve(__dirname, "../lib/whisper.cpp/build/bin/Release"), 
        path.resolve(__dirname, "../public/resources/whisper"),
      )
    } else {
      cpDirSync(
        path.resolve(__dirname, "../lib/whisper.cpp/build/Release"), 
        path.resolve(__dirname, "../public/resources/whisper"),
      )
    }
  }

  if(!isCI) {
    // 使用 fs 删除 build 文件夹
    shelljs.rm("-rf", path.resolve(__dirname, "../lib/whisper.cpp/build"))
    // gpu
    shelljs.exec("cd ./lib/whisper.cpp && npx cmake-js compile --CDWHISPER_CUBLAS=1 -T whisper-addon -B Release")
    if(
      fs.existsSync(path.resolve(__dirname, "../lib/whisper.cpp/build/Release/whisper-addon.node")) 
      || fs.existsSync(path.resolve(__dirname, "../lib/whisper.cpp/build/bin/Release/whisper-addon.node")) 
    ) {
      info("Copy whisper.cpp addon")
      if(process.platform === "win32") {
        cpDirSync(
          path.resolve(__dirname, "../lib/whisper.cpp/build/bin/Release"), 
          path.resolve(__dirname, "../public/resources/cublas-whisper"),
        )
      } else {
        cpDirSync(
          path.resolve(__dirname, "../lib/whisper.cpp/build/Release"), 
          path.resolve(__dirname, "../public/resources/cublas-whisper"),
        )
      }
    } 
  }
}

if(!fs.existsSync(path.resolve(__dirname, "../lib/vad/CMakeLists.txt"))) {
  info("Clone VAD-addon")
  shelljs.exec("git clone https://github.com/chenqianhe/VAD-addon lib/vad --depth=1")

  info("Patch whisper addon.cpp")
  fs.cpSync(
    path.resolve(__dirname, "./vad/CMakeLists.txt"),
    path.resolve(__dirname, "../lib/vad/CMakeLists.txt"),
  )
}

if(!fs.existsSync(path.resolve(__dirname, "../lib/vad/build/Release/vad_addon.node"))) {
  info("Build VAD-addon")
  shelljs.exec("cd lib/vad && npx gulp")
  info("Copy VAD-addon model")
  fs.cpSync(
    path.resolve(__dirname, "../lib/vad/silero_vad.onnx"), 
    path.resolve(__dirname, "../public/resources/silero_vad.onnx"),
  )
}

if(
  fs.existsSync(path.resolve(__dirname, "../lib/vad/build/Release/vad_addon.node"))
) {
  info("Copy VAD-addon")
  cpDirSync(
    path.resolve(__dirname, "../lib/vad/build/Release"), 
    path.resolve(__dirname, "../public/resources/vad"),
  )
}

const shelljs = require("shelljs")
const fs = require("node:fs")
const path = require("node:path")

function info(msg) {
  shelljs.echo("\x1b[32m" + msg + "\x1b[0m")
}

if(!fs.existsSync(path.resolve(__dirname, "../lib/whisper.cpp/Makefile"))) {
  info("Clone whisper.cpp")
  shelljs.exec("git clone https://github.com/ggerganov/whisper.cpp.git lib/whisper.cpp -b v1.4.0 --depth=1")

  info("Patch whisper addon.cpp")
  fs.cpSync(
    path.resolve(__dirname, "./whisper-addon.cpp"), 
    path.resolve(__dirname, "../lib/whisper.cpp/examples/addon.node/addon.cpp"),
  )
}

if(!fs.existsSync(path.resolve(__dirname, "../lib/whisper.cpp/build/Release/whisper-addon.node"))) {
  info("Build whisper.cpp addon")
  shelljs.exec("cd ./lib/whisper.cpp && npx cmake-js compile -T whisper-addon -B Release") 
}

if(
  (
    fs.existsSync(path.resolve(__dirname, "../lib/whisper.cpp/build/Release/whisper-addon.node")) 
    || fs.existsSync(path.resolve(__dirname, "../lib/whisper.cpp/build/bin/Release/whisper-addon.node")) 
  )
  && !fs.existsSync(path.resolve(__dirname, "../public/resources/whisper-addon.node"))
) {
  info("Copy whisper.cpp addon")
  if(process.platform === "win32") {
    fs.cpSync(
      path.resolve(__dirname, "../lib/whisper.cpp/build/bin/Release/whisper-addon.node"), 
      path.resolve(__dirname, "../public/resources/whisper-addon.node"),
    )
  } else {
    fs.cpSync(
      path.resolve(__dirname, "../lib/whisper.cpp/build/Release/whisper-addon.node"), 
      path.resolve(__dirname, "../public/resources/whisper-addon.node"),
    )
  }
}

if(!fs.existsSync(path.resolve(__dirname, "../lib/vad/CMakeLists.txt"))) {
  info("Clone VAD-addon")
  shelljs.exec("git clone https://github.com/chenqianhe/VAD-addon lib/vad --depth=1")
}

if(!fs.existsSync(path.resolve(__dirname, "../lib/vad/build/Release/vad_addon.node"))) {
  info("Build VAD-addon")
  shelljs.exec("cd lib/vad && npm install && npx gulp")
  info("Copy VAD-addon model")
  fs.cpSync(
    path.resolve(__dirname, "../lib/vad/silero_vad.onnx"), 
    path.resolve(__dirname, "../public/resources/silero_vad.onnx"),
  )
}

if(
  fs.existsSync(path.resolve(__dirname, "../lib/vad/build/Release/vad_addon.node"))
  && !fs.existsSync(path.resolve(__dirname, "../public/resources/vad_addon.node"))
) {
  info("Copy VAD-addon")
  fs.cpSync(
    path.resolve(__dirname, "../lib/vad/build/Release/vad_addon.node"), 
    path.resolve(__dirname, "../public/resources/vad_addon.node"),
  )
}

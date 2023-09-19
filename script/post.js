const shelljs = require("shelljs")
const fs = require("node:fs")


if(!fs.existsSync("./lib/whisper.cpp/Makefile")) {
  shelljs.exec("git clone https://github.com/ggerganov/whisper.cpp.git lib/whisper.cpp --depth=1")
}

if(!fs.existsSync("./lib/whisper.cpp/build/Release/whisper-addon.node")) {
  shelljs.exec("cd ./lib/whisper.cpp && npx cmake-js compile -T whisper-addon -B Release") 
}

if(
  fs.existsSync("./lib/whisper.cpp/build/Release/whisper-addon.node") 
  && !fs.existsSync("./public/resources/whisper-addon.node")
) {
  fs.cpSync("./lib/whisper.cpp/build/Release/whisper-addon.node", "./public/resources/whisper-addon.node")
}

if(!fs.existsSync("./lib/vad/CMakeLists.txt")) {
  shelljs.exec("git clone https://github.com/chenqianhe/VAD-addon lib/vad --depth=1")
}

if(!fs.existsSync("./lib/vad/build/Release/vad_addon.node")) {
  shelljs.exec("cd lib/vad && npm install && npx gulp")
  fs.cpSync("./lib/vad/silero_vad.onnx", "./public/resources/silero_vad.onnx")
}

if(
  fs.existsSync("./lib/vad/build/Release/vad_addon.node")
  && !fs.existsSync("./public/resources/vad_addon.node")
) {
  fs.cpSync("./lib/vad/build/Release/vad_addon.node", "./public/resources/vad_addon.node")
}
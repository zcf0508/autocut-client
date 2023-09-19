import path from "path";

const prod = import.meta.env.PROD
const resourcesPath = prod ? process.resourcesPath : path.join(__dirname, "../../public/resources")

type Vad = (model: string, filePath: string) => Array<{start: string, end: string}>

const { vad }: {vad: Vad} = require(path.join(
  resourcesPath,
  "vad_addon.node",
));

const model = path.resolve(resourcesPath, "silero_vad.onnx")

export function detectVoiceActivity(filePath: string) {
  return vad(model, filePath)
}
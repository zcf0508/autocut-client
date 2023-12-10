import fs from "fs";
import os from "os";
import path from "path";
import { promisify } from "node:util";

const prod = import.meta.env.PROD
const resourcesPath = prod ? process.resourcesPath : path.resolve(__dirname, "../../public/resources")

const addonPath = path.resolve(resourcesPath, "whisper", "./whisper-addon.node")

if(!fs.existsSync(addonPath)) {
  console.log({addonPath})
  throw new Error("Whisper addon not found")
}

const { whisper } = require(addonPath);

export type WhisperResItem = [
  /** start time , format 00:00:00,000 */
  string,
  /** end time , format 00:00:00,000 */
  string,
  /** subtitle */
  string
]

type WhisperAsync = (options: {
  language: string, 
  model: string,
  fname_inp: string
  /** default: Math.min(4, os.cpus().length) */
  n_threads: number
  prompt: string
  /** default: false */
  translate: boolean
  /** not work   default: true */
  use_gpu?: boolean
}) => Promise<Array<WhisperResItem>>

const whisperAsync: WhisperAsync = promisify(whisper);

export async function transcribe(
  modelPath: string, 
  filePath: string, 
  _options: Partial<Omit<Parameters<WhisperAsync>[0], "model" | "fname_inp" | "use_gpu">> = {},
) {
  const defaultOptions: Omit<Parameters<WhisperAsync>[0], "model" | "fname_inp"> = {
    language: "en",
    n_threads: Math.min(4, os.cpus().length),
    translate: false,
    prompt: "",
    use_gpu: true,
  }

  let time = Date.now()

  const res = await whisperAsync({
    model: modelPath,
    fname_inp: filePath,
    ...{
      ...defaultOptions,
      ..._options,
    },
  })

  const cost = Date.now() - time
  
  return {
    res,
    cost: cost / 1000,
  }
}

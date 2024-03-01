import fs from "fs";
import os from "os";
import path from "path";
import { promisify } from "node:util";
import { isNumber } from "lodash-es";

const prod = import.meta.env.PROD
const resourcesPath = prod ? process.resourcesPath : path.resolve(__dirname, "../../public/resources")

const addonPath = path.join(resourcesPath, "./whisper/whisper-addon.node")
// const addonPath = path.join(resourcesPath, "./cublas-whisper/whisper-addon.node")

if(!fs.existsSync(addonPath)) {
  console.log({addonPath})
  throw new Error("Whisper addon not found")
}

const getWhisper = () => {
  const { whisper} = require(addonPath);

  return whisper
}

export type WhisperResItem = [
  /** start time , format 00:00:00,000 */
  string,
  /** end time , format 00:00:00,000 */
  string,
  /** subtitle */
  string
]

type WhisperAsync = (
  options: {
    language: string,
    model: string
    fname_inp: string[]
    /** default: Math.min(4, os.cpus().length) */
    n_threads: number
    prompt: string
    /** default: false */
    translate: boolean
    /** not work   default: true */
    use_gpu?: boolean
  }, 
  callback?: (...args:[null, Array<WhisperResItem> | number]) => any,
) => Promise<Array<WhisperResItem>>

const getWhisperAsync: () => WhisperAsync = () => {
  const whisper = getWhisper()
  return promisify(whisper);
}



export async function transcribe(
  modelPath: string, 
  filePaths: string[], 
  _options: Partial<Omit<Parameters<WhisperAsync>[0], "model" | "fname_inp" | "use_gpu">> = {},
  callback?: (progress: number) => any,
) {
  const defaultOptions: Omit<Parameters<WhisperAsync>[0], "model" | "fname_inp"> = {
    language: "en",
    n_threads: Math.min(4, os.cpus().length),
    translate: false,
    prompt: "",
    use_gpu: true,
  }

  let time = Date.now()

  console.log(filePaths.length)

  const res = await (getWhisperAsync()({
    model: modelPath,
    fname_inp: filePaths,
    ...defaultOptions,
    ..._options,
  },(_, index) => {
    if(isNumber(index)) {
      callback((index+1)/filePaths.length * 100)
    }
  }))

  console.log(res)

  const cost = Date.now() - time
  
  return {
    res,
    cost: cost / 1000,
  }
}

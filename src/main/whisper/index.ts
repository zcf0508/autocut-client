import fs from "fs";
import path from "path";
import { promisify } from "node:util";

const prod = import.meta.env.PROD
const resourcesPath = prod ? process.resourcesPath : path.resolve(__dirname, "../../public/resources")

const addonPath = path.resolve(resourcesPath, "./whisper-addon.node")

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
  /** default: 0 */
  max_len?: number
  /** default: false */
  translate?: boolean
}) => Promise<Array<WhisperResItem>>

const whisperAsync: WhisperAsync = promisify(whisper);

export async function transcribe(
  modelPath: string, 
  filePath: string, 
  _options: Omit<Parameters<WhisperAsync>[0], "model" | "fname_inp"> = {language: "en"},
  idx?: number,
  cb?: (idx: number) => any,
) {
  const defaultOptions = {
    language: "en",
    max_len: 0,
    translate: false,
  }
  const res = await whisperAsync({
    model: modelPath,
    fname_inp: filePath,
    ...{
      ...defaultOptions,
      ..._options,
    },
  })
  cb?.(idx)
  return res
}
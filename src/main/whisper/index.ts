import path from "path";

const prod = import.meta.env.PROD
const test = import.meta.env.TEST
const resourcesPath = prod ? process.resourcesPath : path.join(__dirname, "../../../public/resources")

const { whisper } = require(path.join(
  resourcesPath,
  "whisper-addon.node",
));
import { promisify } from "node:util";

type WhisperAsync = (options: {
  language: string, 
  model: string,
  fname_inp: string
  /** default: 0 */
  max_len?: number
  /** default: false */
  translate?: boolean
}) => Promise<Array<[
  /** start time , format 00:00:00,000 */
  string,
  /** end time , format 00:00:00,000 */
  string,
  /** subtitle */
  string
]>>

const whisperAsync: WhisperAsync = promisify(whisper);

export async function transcribe(
  modelPath: string, 
  filePath: string, 
  options: Omit<Parameters<WhisperAsync>[0], "model" | "fname_inp"> = {language: "en"},
) {
  return await whisperAsync({
    model: modelPath,
    fname_inp: filePath,
    ...options,
  })
}
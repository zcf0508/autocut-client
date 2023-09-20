import path from "path";
import { promisify } from "node:util";

const prod = import.meta.env.PROD
const resourcesPath = prod ? process.resourcesPath : path.resolve(__dirname, "../../../public/resources")

const { whisper } = require(path.join(
  resourcesPath,
  "whisper-addon.node",
));

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

export function transcribe(
  modelPath: string, 
  filePath: string, 
  _options: Omit<Parameters<WhisperAsync>[0], "model" | "fname_inp"> = {language: "en"},
) {
  const defaultOptions = {
    language: "en",
    max_len: 0,
    translate: false,
  }
  return whisperAsync({
    model: modelPath,
    fname_inp: filePath,
    ...{
      ...defaultOptions,
      ..._options,
    },
  })
}
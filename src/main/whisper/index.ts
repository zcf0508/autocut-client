import path from "path";

const prod = import.meta.env.PROD
const resourcesPath = prod ? process.resourcesPath : path.join(__dirname, "../../public/resources")

const { whisper } = require(path.join(
  resourcesPath,
  "whisper-addon.node",
));
import { promisify } from "node:util";

type WhisperAsync = (options: {
  language: string, 
  model: string,
  fname_inp: string
}) => Promise<Array<[string,string,string]>>

const whisperAsync: WhisperAsync = promisify(whisper);

export async function transcribe(language="en", modelPath: string, filePath: string) {
  return await whisperAsync({
    language,
    model: modelPath,
    fname_inp: filePath,
  })
}
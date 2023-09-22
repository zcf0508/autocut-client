import path from "path";
import { exec } from "child_process";

const prod = import.meta.env.PROD
const resourcesPath = prod ? process.resourcesPath : path.join(__dirname, "../../public/resources")


export type Vad = (model: string, filePath: string) => Array<{
  /** like `0.000000` s */
  start: string, 
  /** like `2.304000` s */
  end: string
}>

const { vad }: {vad: Vad} = require(path.join(
  resourcesPath,
  "vad_addon.node",
));

const model = path.resolve(resourcesPath, "silero_vad.onnx")

function getDuration(file: string) {
  return new Promise<number>((resolve, reject) => {
    exec(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${file}`, 
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        const duration = parseFloat(stdout);
        resolve(duration);
      });
  });
}

export async function detectVoiceActivity(filePath: string) {
  const mediaDuration = await getDuration(filePath)

  const res = vad(model, filePath)

  res[0].start = "0.000000"
  res[res.length - 1].end = `${mediaDuration}`

  for(let i = 0; i < res.length - 1; i++) {
    const current = res[i]
    const next = res[i + 1]
    if(Number(next.start) - Number(current.end) > 0.3) {
      const middle = ((Number(next.start) + Number(current.end)) / 2).toFixed(6)
      current.end = `${middle}`
      next.start = `${middle}`
    }
  }
  console.log(res)
  return res
}
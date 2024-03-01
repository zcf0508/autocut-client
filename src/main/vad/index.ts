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

const getVad = () => {
  const { vad }: {vad: Vad} = require(path.join(
    resourcesPath,
    "vad",
    "vad_addon.node",
  ));

  return vad
}

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
  console.log({
    model,
    filePath,
  })
  const res = getVad()(model, filePath)  
  
  const mediaDuration = await getDuration(filePath)
  if(res[0].start !== "0.000000") {
    res.unshift({
      start: "0.000000",
      end: res[0].start,
    })
  }
  if(res[res.length - 1].end !== `${mediaDuration}`) {
    res.push({
      start: res[res.length - 1].end,
      end: `${mediaDuration}`,
    })
  }

  for(let i = 0; i < res.length - 1; i++) {
    const current = res[i]
    const next = res[i + 1]
    if(Number(next.start) - Number(current.end) > 0.3) {
      const middle = ((Number(next.start) + Number(current.end)) / 2).toFixed(6)
      current.end = `${middle}`
      next.start = `${middle}`
    }
  }

  let merged = [];
  let current = res[0];

  for(let i = 1; i < res.length; i++) {
    if(Number(res[i].end) - Number(current.start) < 15) {
      current.end = res[i].end;
    } else {
      merged.push(current);
      current = res[i];
    }
  }

  // Push the last segment
  merged.push(current);

  return merged
}

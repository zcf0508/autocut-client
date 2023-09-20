import got from "got"
import fs from "node:fs"
import path from "node:path"
import { transcribe } from "~~/whisper"

const modelPath = path.resolve(__dirname, "ggml-base.bin");

function downloadModel(){
  return new Promise<void>((resolve, reject) => {
    const modelFile = fs.createWriteStream(modelPath);
    got.stream("https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin")
      .pipe(modelFile).on("finish", ()=>{
        console.log("downloaded")
        modelFile.close();
        resolve()
      })
      .on("error", (err)=>{
        console.error(err)
        modelFile.close();
        fs.unlinkSync(modelPath)
        reject()
      })
  })
}

beforeEach(async () => {
  if(!fs.existsSync(modelPath)) {
    try {
      await downloadModel()
    }catch(e) {
      if(fs.existsSync(modelPath)) {
        fs.unlinkSync(modelPath)
      }
    }
  }	
}, 100000)

describe("whisper", () => {
  it("transcribe ", async () => {
    const wavFilePath = path.resolve(__dirname, "./jfk.wav");
    const result = await transcribe(modelPath, wavFilePath)
    expect(result.length > 0).toBe(true)
  })
})
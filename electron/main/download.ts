import * as os from "os"
import * as fs from "fs"
import * as https from "https"
import * as path from "path"
import StreamZip  from "node-stream-zip"

/**
 * 下载 autocut 程序
 * @param savePath autocut 存放地址
 * @return 返回可执行文件地址
 */
export function downloadAutoCut(savePath: string) {
  return new Promise<string>((resolve, reject) => {
    const platform = os.platform()
    const arch = os.arch()
    console.log(`platform: ${platform}`)
    console.log(`arch: ${arch}`)
    if(platform.indexOf("win")>=0 && arch === "x64") {
      const zipFilePath = path.join(savePath, "autocut.zip")
      const file = fs.createWriteStream(zipFilePath);
      const excutePath = path.join(savePath,"autocut","autocut.ext")

      if(fs.existsSync(excutePath)){
        // TODO: 验证是否可用
        resolve(excutePath)
        return
      }

      https.get("", (res)=>{
        if(res.statusCode !== 200) {
          reject(new Error(`下载失败${res.statusCode}`))
          return 
        }
        res.on("end", ()=>{
          console.log("finish download");
        });

        // 进度
        const len = parseInt(res.headers["content-length"]) // 文件总长度
        let cur = 0
        const total = (len / 1048576).toFixed(2) // 转为M 1048576 - bytes in  1Megabyte
        res.on("data", function (chunk) {
          cur += chunk.length
          const progress = (100.0 * cur / len).toFixed(2) // 当前进度
          const currProgress = (cur / 1048576).toFixed(2) // 当前了多少
          console.log("data", progress, currProgress, total)
          // TODO：展示进度
        })

        file.on("finish", ()=>{
          file.close();

          const zip = new StreamZip({
            file: zipFilePath,
            storeEntries: true,
          });
          const extractedPath = path.join(savePath,"./autocut")
          
          if(!fs.existsSync(extractedPath)){
            fs.mkdirSync(extractedPath);
          }

          zip.on("ready", () => {
            zip.extract(null, extractedPath, (err, count) => {
              console.log(err ? "Extract error" : `Extracted ${count} entries`);
              zip.close();
              resolve(excutePath)
            });
          })

          zip.on("error",(err)=>{
            console.error(err)
            zip.close();
            reject(new Error("解压失败"))
          })

        }).on("error", (err)=>{
          console.error(err)
          file.close();
          reject(new Error("保存文件失败"))
        });

        res.pipe(file);
      }).on("error", (e) => {
        console.error(e);
        reject(new Error(`下载失败，请检查网络: ${e}`))
      });
      // 下载
    } else {
      console.log("暂不支持")
      resolve("")
    }
  })
}
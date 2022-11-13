import * as os from "os"
import * as fs from "fs"
import * as https from "https"
import * as path from "path"
import StreamZip  from "node-stream-zip"
import { autocutCheck } from "./check"

const DOWNLOAD_URL = "https://dubai.huali.cafe/autocut/autocut-x86_64.zip"

type DownloadStatus = "downloading" | "extracting" | "error" | "success"

/**
 * 下载 autocut 程序
 * @param savePath autocut 存放地址
 * @return 返回可执行文件地址
 */
export async function downloadAutoCut(
  savePath: string, 
  cb: (status: DownloadStatus, msg: string, process?: number) => any,
) {

  const platform = os.platform()
  const arch = os.arch()
  console.log(`platform: ${platform}`)
  console.log(`arch: ${arch}`)
  if(platform.indexOf("win")>=0 && arch === "x64") {
    const zipFilePath = path.join(savePath, "autocut.zip")
    const file = fs.createWriteStream(zipFilePath);
    const excutePath = path.join(savePath,"autocut","autocut.exe")

    if(fs.existsSync(excutePath)){
      if(await autocutCheck(excutePath)){
        cb("success", excutePath, 100)
        return
      }
    }

    https.get(DOWNLOAD_URL, (res)=>{
      if(res.statusCode !== 200) {
        cb("error", `下载失败${res.statusCode}`)
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

        cb("downloading", "下载中...", parseFloat(progress))
      })

      file.on("finish", ()=>{
        file.close();

        const zip = new StreamZip({
          file: zipFilePath,
          storeEntries: true,
        });
        const extractedPath = savePath


        zip.on("ready", () => {
          cb("extracting", "解压中" )
          zip.extract(null, extractedPath, (err, count) => {
            console.log(err ? "Extract error" : `Extracted ${count} entries`);
            zip.close();

            cb("success", excutePath )
            return
          });
        })

        zip.on("error",(err)=>{
          console.error(err)
          zip.close();
          cb("error", `解压失败：${err}`)
          return
        })

      }).on("error", (err)=>{
        console.error(err)
        file.close();
        cb("error", "文件保存失败")
        return
      });

      res.pipe(file);
    }).on("error", (e) => {
      console.error(e);
      cb("error", `下载失败，请检查网络: ${e}`)
      return
    });
    // 下载
  } else {
    console.log("暂不支持")
    cb("error", "暂不支持")
    return
  }

}
import * as os from "os"
import * as fs from "fs"
import * as https from "https"
import * as path from "path"
import StreamZip  from "node-stream-zip"
import got from "got";
import { autocutCheck } from "./check"

const AUTOCUT_VERSION = "v0.0.3-build.2023.02.14"

const DOWNLOAD_URL = {
  github: {
    win32: `https://github.com/zcf0508/autocut/releases/download/${AUTOCUT_VERSION}/autocut_windows.zip`,
    darwin: `https://github.com/zcf0508/autocut/releases/download/${AUTOCUT_VERSION}/autocut_macos.zip`,
  },
  cdn: {
    win32: `https://dubai.huali.cafe/autocut/${AUTOCUT_VERSION}/autocut_windows.zip`,
    darwin: `https://dubai.huali.cafe/autocut/${AUTOCUT_VERSION}/autocut_macos.zip`,
  },
}

/**
 * 测试可否正常访问 github
 */
function testNetwork(){
  return new Promise<boolean>((resolve, reject)=>{
    const req = https.request("https://www.github.com", (res)=>{
      if (res.statusCode === 200) {
        resolve(true)
      } else {
        resolve(false)
      }
    })
    req.on("error", (e)=>{
      resolve(false)
    })
    req.end()
  })
}

/**
 * 下载 autocut 程序
 * @param savePath autocut 存放地址
 */
export async function downloadAutoCut(
  savePath: string, 
  cb: (status: "downloading" | "extracting" | "error" | "success", msg: string, process?: number) => any,
) {

  const platform = os.platform()
  const arch = os.arch()
  console.log(`platform: ${platform}`)
  console.log(`arch: ${arch}`)
  if((platform.indexOf("win") >= 0 || platform.indexOf("darwin") >= 0)  && arch === "x64") {
    const zipFilePath = path.join(savePath, "autocut.zip").replaceAll("\\","\\\\").replaceAll(" ","\ ")
    const excutePath = path.join(
      savePath, 
      "autocut", 
      `autocut${platform.indexOf("win") >= 0? ".exe" : ""}`,
    ).replaceAll("\\","\\\\").replaceAll(" ","\ ")

    if(fs.existsSync(excutePath)){
      if(await autocutCheck(excutePath)){
        cb("success", excutePath, 100)
        return
      }
    }
    if(fs.existsSync(zipFilePath)){
      unzip(zipFilePath, savePath, excutePath, cb)
      return
    }

    cb("downloading", "下载中...", 0)

    const file = fs.createWriteStream(zipFilePath);

    const download_url = DOWNLOAD_URL[
      await testNetwork() ? "github": "cdn"
    ][platform]

    if (!download_url || typeof download_url !== "string") {
      alert("sorry, not support your platform")
      cb("error", "sorry, not support your platform")
      return
    }

    got.stream(download_url).on("downloadProgress", ({ transferred, total }) => {
      const progress = (100.0 * transferred / total).toFixed(2) // 当前进度
      const currProgress = (transferred / 1048576).toFixed(2) // 当前下了多少
      console.log("data", progress, currProgress, total / 1048576)
      cb("downloading", "下载中...", parseFloat(progress))
    }).pipe(file).on("finish", ()=>{
      file.close();
      unzip(zipFilePath, savePath, excutePath, cb)
    }).on("error", (err)=>{
      console.error(err)
      file.close();
      cb("error", "文件保存失败")
      fs.unlinkSync(zipFilePath)
      return
    })

  } else {
    console.log("暂不支持")
    cb("error", "sorry, not support your platform")
    return
  }

}


function unzip(
  zipFilePath: string, 
  savePath: string, 
  excutePath: string, 
  cb: (status: "extracting" | "success" | "error", msg: string, process?: number) => any,
){
  const zip = new StreamZip({
    file: zipFilePath,
    storeEntries: true,
  });
  const extractedPath = savePath


  zip.on("ready", () => {
    cb("extracting", "解压中", 99 )
    zip.extract(null, extractedPath, (err, count) => {
      
      console.log(err ? "Extract error" : `Extracted ${count} entries`);
      zip.close();

      if (err) {
        cb("error", `解压失败：${err}，请重试`)
      } else {
        cb("success", excutePath )
      }
      return
    });
  })

  zip.on("error",(err)=>{
    console.error(err)
    zip.close();
    if(fs.existsSync(zipFilePath)){
      fs.unlinkSync(zipFilePath)
    }
    cb("error", `解压失败：${err}，请重试`)
    return
  })
}

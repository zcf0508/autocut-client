import path from "path"
import * as fs from "fs"

const prod = import.meta.env.PROD

type EXTENSION_SPEC_NAME =  "vscesd";
type CoreLib = {
  /**
   * 初始化, 返回值为 0 时表示成功
   */
  esdInitialize: (name: EXTENSION_SPEC_NAME, processId: number) => {status: number};
  /**
   * 获取已安装应用的 spec
   */
  esdGetInstalledApplicationSpecifiers: () => {status: number, specifiers: Array<string>};
  /**
   * 通过 spec 获取应用名称
   */
  esdGetDisplayNameForApplication: (spec: string) => {status:number, name: string};
  /**
   * 检查指定程序是否正在运行
   */
  esdGetApplicationRunning:(spen: string) => {status:number, isRunning: string};
  /**
   * 转换文件地址格式
   */
  esdPathToUri:(path: string)=> {status:number, uri: string};
  /**
   * 发送调试信息，运行 jsx
   */
  esdSendDebugMessage: (
    appSpecifier: string, 
    body: string, 
    bringToFront: boolean, 
    timeout: number
  ) => {status: number, serialNumber: number};
  /**
   * 清理
   */
  esdCleanup: () => {status: number};
}

let coreLib = undefined as CoreLib

function GetCoreLib() {
  if (coreLib === undefined) {
    const platform = process.platform;
    let core = undefined;
    if (platform === "darwin") {
      core = require("../../adobe-lib/esdebugger-core/mac/esdcorelibinterface.node");
    }
    else if (platform === "win32") {
      const arch = process.arch;
      if (arch === "x64" || arch === "arm64") {
        core = require("../../adobe-lib/esdebugger-core/win/x64/esdcorelibinterface.node");
      }
      else {
        core = require("../../adobe-lib/esdebugger-core/win/win32/esdcorelibinterface.node");
      }
    }
    if (core === undefined) {
      throw new Error("Could not initialize Core Library! Is this running on a supported platform?");
    }

    coreLib = core
  }
  return coreLib;
}

// 初始化 core
function initCore(){
  return new Promise<CoreLib>((resolve, reject) => {
    const core = GetCoreLib();
    console.log(core.esdCleanup().status)
    const result = core.esdInitialize("vscesd", process.pid);
    console.log("init result " + result.status)
    if (result.status === 0 || result.status === 11) {
      resolve(core)
    } else {
      reject()
    }
  })
}


function createPrProject(targetDir: string, videoPath: string){
  const videoName = path.basename(videoPath).slice(
    0, 
    path.basename(videoPath).indexOf(".") || path.basename(videoPath).length,
  )
  const tempFile = path.join(
    prod ? process.resourcesPath : path.join(__dirname, "../../public/resources"), 
    "temp.prproj",
  )
  try{
    !fs.existsSync(targetDir) && fs.mkdirSync(targetDir)
    // 复制到目标文件夹中
    fs.copyFileSync(tempFile, path.join(targetDir, videoName + ".prproj"))
    fs.copyFileSync(videoPath, path.join(targetDir, path.basename(videoPath)))
    return {
      proj: path.join(targetDir, videoName + ".prproj"),
      video: path.join(targetDir, path.basename(videoPath)),
    }
  }catch(e){
    console.error(e)
    return ""
  }
}


// 生成 jsx 文件
function createJsxFile(
  targetDir: string, proj: string, videoFile: string, srtFile: string, clipPoints: Array<string>,
) {
  let jsxTemplate = fs.readFileSync(
    path.join(prod ? process.resourcesPath : path.join(__dirname, "../../public/resources"), "./autocut.jsx.template"), 
    "utf-8",
  )

  jsxTemplate = jsxTemplate.replace("{{projPath}}", proj.replaceAll("\\","\\\\"))
  jsxTemplate = jsxTemplate.replace("{{videoPath}}", videoFile.replaceAll("\\","\\\\"))
  jsxTemplate = jsxTemplate.replace("{{srtPath}}", srtFile.replaceAll("\\","\\\\"))
  jsxTemplate = jsxTemplate.replace("{{clipPoints}}", clipPoints.join(","))

  fs.writeFileSync(path.join(targetDir, "autocut.jsx"), jsxTemplate)
  
  return path.join(targetDir, "autocut.jsx")
}


export async function exportToPr(
  targetDir: string, 
  videoFile: string, 
  srtFile: string, 
  clipPoints: Array<string>, 
  spec:string, 
  cb:(status: string, msg: string) => any,
) {
  const { proj, video } = createPrProject(targetDir, videoFile)
  if(!proj){
    cb("error", "项目创建失败")
    return 
  }
  const jsx = createJsxFile(targetDir, proj, video, srtFile, clipPoints)
  if(!jsx){
    cb("error", "脚本创建失败")
    return 
  }

  const core = await initCore()
  // eslint-disable-next-line max-len
  const body = `<eval engine="main" file="${core.esdPathToUri(jsx).uri}" debug="0"><source><![CDATA[${fs.readFileSync(jsx)}]]></source></eval>`
  const result = core.esdSendDebugMessage(spec, body, true, 0)
  core.esdCleanup()
  if(result.status!==0) {
    cb("error", "脚本运行失败")
    return
  }
  cb("success", "")
}

const prVersions = [
  {
    specifier: "premierepro-23.0",
    name: "Adobe Premiere Pro CC 2023",
  },
  {
    specifier: "premierepro-22.0",
    name: "Adobe Premiere Pro CC 2022",
  },
  {
    specifier: "premierepro-15.0",
    name: "Adobe Premiere Pro CC 2021",
  },
  {
    specifier: "premierepro-14.3",
    name: "Adobe Premiere Pro CC 2020",
  },
  {
    specifier: "premierepro-14.0",
    name: "Adobe Premiere Pro CC 2020",
  },
  {
    specifier: "premierepro-13.1.5",
    name: "Adobe Premiere Pro CC 2019",
  },
  {
    specifier: "premierepro-13.1.4",
    name: "Adobe Premiere Pro CC 2019",
  },
  {
    specifier: "premierepro-13.1.3",
    name: "Adobe Premiere Pro CC 2019",
  },
  {
    specifier: "premierepro-13.1.2",
    name: "Adobe Premiere Pro CC 2019",
  },
  {
    specifier: "premierepro-13.1.1",
    name: "Adobe Premiere Pro CC 2019",
  },
  {
    specifier: "premierepro-13.1",
    name: "Adobe Premiere Pro CC 2019",
  },
  {
    specifier: "premierepro-13.0",
    name: "Adobe Premiere Pro CC 2019",
  },
  {
    specifier: "premierepro-12.0",
    name: "Adobe Premiere Pro CC 2019",
  },
  {
    specifier: "premierepro-11.0",
    name: "Adobe Premiere Pro CC 2017",
  },
]

export async function getSpec() {
  let appDefs = [] as Array<{
    specifier: string,
    name:string
  }>
  const core = await initCore()
  const res = core.esdGetInstalledApplicationSpecifiers()

  if(res.status === 0) {
    let specifiers = res.specifiers
    if(specifiers.length === 0){
      const installedProDir = path.join(process.env.APPDATA, "/Adobe/Premiere Pro")
      fs.readdirSync(installedProDir).forEach((dir) => {
        if(!isNaN(Number(dir.replaceAll(".", "")))){
          specifiers.push(`premierepro-${dir}`)
        }
      })
    }
    specifiers.map((spec) => {
      const result = core.esdGetDisplayNameForApplication(spec);
      if (result.status === 0) {
        if(result.name.indexOf("Adobe Premiere Pro") >= 0){
          appDefs.push({
            specifier: spec,
            name: result.name,
          })
        } else {
          prVersions.map(item=>{
            if(item.specifier === spec){
              appDefs.push(item)
            }
          })
        }
      }
    })
  }
  core.esdCleanup()
  return appDefs
}
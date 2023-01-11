import path from "path"
import * as fs from "fs"
import * as fastXMLParser from "fast-xml-parser"
import { GetCoreLib, initCore } from "./core";

const prod = import.meta.env.PROD

const ATTR_PREFIX = "@";
const TEXT_NODE_NAME = "#value";
const XML_OPTIONS = {
  attributeNamePrefix: ATTR_PREFIX,
  ignoreAttributes: false,
  parseAttributeValue: true,
  textNodeName: TEXT_NODE_NAME,
};

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
    return {
      proj: "",
      video: "",
    }
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

  jsxTemplate = jsxTemplate.replace("{{projPath}}", proj.replaceAll("\\","\\\\").replaceAll(" ","\ "))
  jsxTemplate = jsxTemplate.replace("{{videoPath}}", videoFile.replaceAll("\\","\\\\").replaceAll(" ","\ "))
  jsxTemplate = jsxTemplate.replace("{{srtPath}}", srtFile.replaceAll("\\","\\\\").replaceAll(" ","\ "))
  jsxTemplate = jsxTemplate.replace("{{clipPoints}}", clipPoints.join(","))

  fs.writeFileSync(path.join(targetDir, "autocut.jsx"), jsxTemplate)
  
  return path.join(targetDir, "autocut.jsx")
}


const genderOnUnfilteredMessageReceived = (serialNumber:number, cb:({ reason, message })=>any) => {
  return (reason, message) => {
    console.log("OnUnfilteredMessageReceived reason", reason)
    console.log("OnUnfilteredMessageReceived message", message)
    if(message.serialNumber === serialNumber && reason === 3) {
      cb({ reason, message })
    }
  }
}

function connectPromise(cb:()=>number, next:(message:any)=>any){
  return new Promise<void>(async (resolve, reject) => {
    const core = await initCore()

    const serialNumber = cb()
    if(!serialNumber) {
      reject()
    }

    const timer = setInterval(
      (handler)=>{
        GetCoreLib().esdPumpSession(handler);
      },
      5,
      genderOnUnfilteredMessageReceived(serialNumber, async ({ reason, message })=>{
        const _message = JSON.parse(JSON.stringify(message))
        clearInterval(timer)
        await next(_message)
        core.esdCleanup()
        resolve()
      }),
    )
    timer.unref();
    
  })
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
  if(!proj || !video){
    cb("error", "项目创建失败")
    return 
  }
  const jsx = createJsxFile(targetDir, proj, video, srtFile, clipPoints)
  if(!jsx){
    cb("error", "脚本创建失败")
    return 
  }

  
  let requestEngine = ""
  try{
    await connectPromise(()=>{

      const connectRes = GetCoreLib().esdSendDebugMessage(spec, "<connect/>", true, 0)
      console.log("connectRes", connectRes)
      if(connectRes.status !== 0) {
        GetCoreLib().esdCleanup()
        cb("error", "Connect 脚本运行失败")
      }
      return connectRes.serialNumber

    }, async (message)=>{
      console.log(message.body)
      if(!message){
        cb("error", "无法识别引擎")
        return
      }
      const res = fastXMLParser.parse(message.body, XML_OPTIONS);
      const engineDefs = res.engines.engine;
      const engineNames = Array.isArray(engineDefs) 
        ? engineDefs.map(engine => { return engine["@name"]; }) : [engineDefs["@name"]];
      console.log(engineNames)
      // TODO: 可能存在多个引擎
      if (engineNames.length === 1) {
        requestEngine = engineNames[0];
      }
      return 
    })
  }catch(e) {
    console.error(e)
    cb("error", "发生异常")
    GetCoreLib().esdCleanup()
    return
  }

  console.log(requestEngine)

  
  const core = await initCore()
  const runingRes = core.esdGetApplicationRunning(spec)
  console.log("runingRes ", JSON.stringify(runingRes))
  
  if(runingRes.status!==0 || runingRes.isRunning === false) {
    core.esdCleanup()
    cb("error", "请先打开 Premiere Pro " + spec)
    return
  }
  // eslint-disable-next-line max-len
  const body = `<eval engine="${requestEngine}" file="${core.esdPathToUri(jsx).uri}" debug="0"><source><![CDATA[${fs.readFileSync(jsx)}]]></source></eval>`
  console.log("body: " + body)
  const result = core.esdSendDebugMessage(spec, body, true, 0)
  console.log("exportToPr result: " + JSON.stringify(result))
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
  console.log("InstalledApplicationSpecifiers", JSON.stringify(res))
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
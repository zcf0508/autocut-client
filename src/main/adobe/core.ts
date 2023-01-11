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
  esdGetApplicationRunning:(spen: string) => {status:number, isRunning: boolean};
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
  esdPumpSession: (handler: Function) => any
}

let coreLib = undefined as CoreLib

export function GetCoreLib() {
  if (coreLib === undefined) {
    const platform = process.platform;
    let core = undefined;
    if (platform === "darwin") {
      core = require("../../../adobe-lib/esdebugger-core/mac/esdcorelibinterface.node");
    }
    else if (platform === "win32") {
      const arch = process.arch;
      if (arch === "x64" || arch === "arm64") {
        core = require("../../../adobe-lib/esdebugger-core/win/x64/esdcorelibinterface.node");
      }
      else {
        core = require("../../../adobe-lib/esdebugger-core/win/win32/esdcorelibinterface.node");
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
export function initCore(){
  return new Promise<CoreLib>((resolve, reject) => {
    try {
      const core = GetCoreLib();
      const result = core.esdInitialize("vscesd", process.pid);
      console.log("init result " + JSON.stringify(result))
      if (result.status === 0 || result.status === 11) {
        resolve(core)
      } else {
        reject()
      }
    } catch(e) {
      console.log("init error" + e)
      reject()
    }
  })
}

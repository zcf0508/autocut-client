import {  ipcMain } from "electron"
import { autocutCheck, ffmpegCheck } from "../autocut/check"

export function registerAutoCut(){
  ipcMain.on("check-ffmpeg",async (e) => {
    const res = await ffmpegCheck()
    e.reply("report-ffmpeg-status", res)
  })

  ipcMain.on("check-autocut",async (e, ...args) => {
    const path = args[0] as  string
    let res = false
    if(path){
      res = await autocutCheck(path)
    }
    e.reply("report-autocut-status", res)
  })

}
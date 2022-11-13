import {  BrowserWindow, ipcMain, dialog } from "electron"
import { autocutCheck, ffmpegCheck } from "../autocut/check"

export function registerAutoCut(win: BrowserWindow){
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

  ipcMain.handle("select-autocut-save-directory", async (e, ...args) => {
    const res = await dialog.showOpenDialog(win, {
      title: "请选择 AutoCut 安装路径",
      properties: ["openDirectory", "createDirectory"],

    })
    return res
  })
}
import {  BrowserWindow, ipcMain, dialog } from "electron"
import { cutVideo, generateSubtitle } from "../autocut"
import { autocutCheck, ffmpegCheck } from "../autocut/check"
import { downloadAutoCut } from "../autocut/download"
import { convertVideo, getAudio } from "../ffmpeg"
let excutePath = ""

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
      if(res) {
        excutePath = path
      }
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

  ipcMain.on("download-autocut", async (e,...args) => {
    const downloadPath = args[0] as string
    downloadAutoCut(downloadPath, (status, msg, process) => {
      e.reply("report-download", {
        status,
        msg,
        process,
      })
    })
  })

  ipcMain.on("start-transcribe", async (e,...args) => {
    const filePath = args[0] as string
    generateSubtitle(excutePath, filePath, (status, msg, process) => {
      e.reply("report-transcribe", {
        status,
        msg,
        process,
      })
    })
  })

  ipcMain.on("convert-video", async (e,...args) => {
    const filePath = args[0] as string
    convertVideo(filePath, (status, msg, process) => {
      e.reply("report-convert-video", {
        status,
        msg,
        process,
      })
    })
  })

  ipcMain.on("convert-audio", async (e,...args) => {
    const filePath = args[0] as string
    getAudio(filePath, (status, msg, process) => {
      e.reply("report-convert-audio", {
        status,
        msg,
        process,
      })
    })
  })

  ipcMain.on("start-cut", async (e,...args) => {
    const videoFilePath = args[0] as string
    const srtFilePath = args[1] as string
    cutVideo(excutePath, videoFilePath, srtFilePath, (status, msg, process) => {
      e.reply("report-cut", {
        status,
        msg,
        process,
      })
    })
  })
}
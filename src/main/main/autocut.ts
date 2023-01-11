import {  BrowserWindow, ipcMain, dialog } from "electron"
import { exportToPr, getSpec } from "~~/adobe"
import { cutVideo, generateSubtitle } from "~~/autocut"
import { autocutCheck, ffmpegCheck } from "~~/autocut/check"
import { downloadAutoCut } from "~~/autocut/download"
import { convertVideo, getAudio } from "~~/ffmpeg"
let excutePath = ""

export function registerAutoCut(win: BrowserWindow){
  ipcMain.on("check-ffmpeg",async (e) => {
    const res = await ffmpegCheck()
    e.reply("report-ffmpeg-status", res)
  })

  ipcMain.on("check-autocut",async (e, ...args) => {
    const path = Buffer.from(args[0] as string, "base64").toString()
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

  ipcMain.on("download-autocut", async (e, uuid: string, path: string) => {
    const downloadPath = Buffer.from(path, "base64").toString()
    downloadAutoCut(downloadPath, (status, msg, process) => {
      e.reply(
        "report-download",
        uuid,
        {
          status,
          msg,
          process,
        },
      )
    })
  })

  ipcMain.on("start-transcribe", async (e, uuid: string, path: string) => {
    const filePath = Buffer.from(path, "base64").toString()
    generateSubtitle(excutePath, filePath, (status, msg, process) => {
      e.reply(
        "report-transcribe", 
        uuid,
        {
          status,
          msg,
          process,
        },
      )
    })
  })

  ipcMain.on("convert-video", async (e, uuid: string, path: string) => {
    const filePath = Buffer.from(path, "base64").toString()
    convertVideo(filePath, (status, msg, process) => {
      e.reply(
        "report-convert-video",
        uuid,
        {
          status,
          msg,
          process,
        },
      )
    })
  })

  ipcMain.on("convert-audio", async (e, uuid: string, path: string) => {
    const filePath = Buffer.from(path, "base64").toString()
    getAudio(filePath, (status, msg, process) => {
      e.reply(
        "report-convert-audio",
        uuid,
        {
          status,
          msg,
          process,
        },
      )
    })
  })

  ipcMain.on("start-cut", async (e, uuid:string, video:string, srt:string) => {
    const videoFilePath = Buffer.from(video, "base64").toString()
    const srtFilePath = Buffer.from(srt, "base64").toString()
    cutVideo(excutePath, videoFilePath, srtFilePath, (status, msg, process) => {
      e.reply(
        "report-cut",
        uuid, 
        {
          status,
          msg,
          process,
        },
      )
    })
  })

  ipcMain.on("check-pr-versions", async (e,...args) => {
    const version = await getSpec()
    e.reply("report-pr-versions", version)
  })

  ipcMain.handle("select-prproj-save-directory", async (e, ...args) => {
    const res = await dialog.showOpenDialog(win, {
      title: "请选择 Pr 工程路径",
      properties: ["openDirectory", "createDirectory"],

    })
    return res
  })

  ipcMain.on("export-to-pr", (e,...args) => {
    const targetDir = Buffer.from(args[0] as string, "base64").toString()
    const videoFile = Buffer.from(args[1] as string, "base64").toString()
    const srtFile = Buffer.from(args[2] as string, "base64").toString()
    const clipPoints = args[3] as Array<string>
    const spec = args[4] as string

    exportToPr(targetDir, videoFile, srtFile, clipPoints, spec, (status, msg)=>{
      e.sender.send("export-to-pr", {status, msg})
    })
  })
}

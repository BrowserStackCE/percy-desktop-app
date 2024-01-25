import {BrowserWindow, ipcMain, contextBridge, ipcRenderer, app} from 'electron'
import * as path from 'path'
import fetch from "node-fetch";
import {load} from "cheerio";
import {platform} from "os";
import {createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync} from "fs";
import {loadAsync} from "jszip";
import {execSync} from "child_process";

export const CONSTANTS = {
    binaryDownloadPath: `${app.getPath('home')}/percy/binary.zip`,
    binaryDir: `${app.getPath('home')}/percy`,
    binaryExecutablePath: `${app.getPath('home')}/percy/${platform() == 'win32' ? 'percy.exe' : 'percy'}`
}
export default class CliDownloader{
    static window:BrowserWindow
    static async startDownload(){
        await this.prepareWindow()
    }

    private static prepareWindow(){
        return new Promise((resolve,reject)=>{
            this.window = new BrowserWindow({
                width:300,
                height:150,
                resizable:false,
                title:"Downloading Percy",
                webPreferences:{
                    preload:path.resolve('src/windows/cli-downloader/cli-downloader.preload.js')
                }
            }).on('show',()=>{
                this.window.loadFile(path.resolve("src/windows/cli-downloader/cli-downloader.html"))
                resolve(null)
            })
        })
    }

    static async getCurrentVersion(){
        return fetch('https://github.com/percy/cli/releases').then(async (res) => {
            const html = await res.text()
            const $ = load(html)
            return  $('.f1').first().text()
        })
    }

    static async DownloadExecutable(cb?: (progress: number) => void) {
        const version = await this.getCurrentVersion()
        const platformName = platform()
        const downloadEndpoint = {
            "win32": "percy-win.zip",
            "win64": "percy-win.zip",
            "darwin": "percy-osx.zip",
            "linux": "percy-linux.zip"
        }[platformName]

        if (!downloadEndpoint) {
            throw new Error("Invalid Plafrom")
        }
        const downloadPath = `https://github.com/percy/cli/releases/download/${version}/${downloadEndpoint}`

        return fetch(downloadPath).then(async (res) => {
            return new Promise(async (resolve, reject) => {
                const contentLength = +res.headers.get('Content-Length');
                if (!existsSync(CONSTANTS.binaryDir)) {
                    mkdirSync(CONSTANTS.binaryDir, { recursive: true })
                }
                const writeStream = createWriteStream(CONSTANTS.binaryDownloadPath)
                for await (const chunk of res.body) {
                    writeStream.write(chunk)
                    cb?.(writeStream.bytesWritten / contentLength)
                }
                writeStream.close((err) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(null)
                    }
                })
            })
        })
    }

    static async UnZipExecutable() {
        const file = readFileSync(CONSTANTS.binaryDownloadPath)
        const zip = await loadAsync(file)
        if (!existsSync(CONSTANTS.binaryDir)) {
            mkdirSync(CONSTANTS.binaryDir, { recursive: true })
        }
        for (let file in zip.files) {
            await zip.file(file).async('nodebuffer').then((buffer) => {
                writeFileSync(`${CONSTANTS.binaryDir}/${file}`, buffer)
            })
        }
        if (platform() != 'win32') {
            execSync(`chmod +x ${CONSTANTS.binaryExecutablePath}`)
        }
    }

    static IsBinaryDownloaded() {
        return existsSync(CONSTANTS.binaryExecutablePath)
    }
}
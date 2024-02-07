import { BrowserWindow, ipcMain, contextBridge, ipcRenderer, app } from 'electron'
import * as path from 'path'
import fetch from "node-fetch";
import { load } from "cheerio";
import { platform } from "os";
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { loadAsync } from "jszip";
import { execSync,execFile, ExecFileException } from "child_process";

export const CONSTANTS = {
    binaryDownloadPath: `${app.getPath('home')}/percy/binary.zip`,
    binaryDir: `${app.getPath('home')}/percy`,
    binaryExecutablePath: `${app.getPath('home')}/percy/${platform() == 'win32' ? 'percy.exe' : 'percy'}`
}
export default class CliDownloader {
    static window: BrowserWindow
    static async startDownload() {

        if (this.IsBinaryDownloaded()) {
            console.log("downloaded")
            const installedVersion = await this.getInstalledVersion();
            console.log("installed version",installedVersion)
            const latestVersion = await this.getCurrentVersion();
            console.log("current version", latestVersion)
            if (this.isVersionOutdated(installedVersion, latestVersion)) {
                await this.prepareWindow();
                await this.DownloadExecutable();
            } else {
                console.log('CLI is already installed, and it is up-to-date.');
            }
        }
        else {
            console.log("not downloaded")

            await this.prepareWindow();
            await this.DownloadExecutable();
        }
    }

    private static getInstalledVersion(){
        return new Promise((resolve, reject) => {
            execFile(CONSTANTS.binaryExecutablePath, ['--version'], (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                const outputString = stdout.toString().trim();
                const lines = outputString.split(' ');
                resolve(lines[1]);
            });
        });
    }

    private static isVersionOutdated(installedVersion, latestVersion) {
        return installedVersion !== latestVersion;
    }

    private static prepareWindow() {
        return new Promise((resolve, reject) => {
            this.window = new BrowserWindow({
                width: 300,
                height: 150,
                resizable: false,
                title: "Downloading Percy",
                webPreferences: {
                    preload: path.resolve('src/windows/cli-downloader/cli-downloader.preload.js')
                }
            }).on('show', () => {
                this.window.loadFile(path.resolve("src/windows/cli-downloader/cli-downloader.html"))
                resolve(null)
            })
        })
    }

    //is update available
    //if so install
    static async getCurrentVersion() {
        return fetch('https://github.com/percy/cli/releases').then(async (res) => {
            const html = await res.text()
            const $ = load(html)
            return $('.f1').first().text()
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
                let downloadedBytes = 0;

                if (!existsSync(CONSTANTS.binaryDir)) {
                    mkdirSync(CONSTANTS.binaryDir, { recursive: true })
                }
                const writeStream = createWriteStream(CONSTANTS.binaryDownloadPath)
                for await (const chunk of res.body) {
                    downloadedBytes += chunk.length;
                    writeStream.write(chunk)
                    cb?.(downloadedBytes / contentLength * 100)
                    this.window.webContents.send('download-progress', downloadedBytes / contentLength * 100);

                }
                writeStream.close((err) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(null)
                        this.window.close()
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




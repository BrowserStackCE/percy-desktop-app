import { app } from 'electron'
import { load } from "cheerio"
import fetch from 'node-fetch'
import { platform } from 'os'
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync, constants } from 'fs'
import { loadAsync } from 'jszip'
import { execFile, execSync } from 'child_process'
import { z } from 'zod'
import { PercyConfig } from './schemas'

//#region  Types

interface StartPercyOptions {
    port?: number
    parallel?: boolean
    partial?: boolean
    dryRun?: boolean
    disableCache?: boolean
    debug?: boolean
    verbose?: boolean
}

//#endregion

export const CONSTANTS = {
    binaryDownloadPath: `${app.getPath('home')}/percy/binary.zip`,
    binaryDir: `${app.getPath('home')}/percy`,
    binaryExecuablePath: `${app.getPath('home')}/percy/${platform() == 'win32' ? 'percy.exe' : 'percy'}`
}

export function getLatestCLIVersion() {
    return fetch('https://github.com/percy/cli/releases').then(async (res) => {
        const html = await res.text()
        const $ = load(html)
        const latestVersion = $('.f1').first().text()
        return latestVersion
    })
}

export async function DownloadExecutable(cb?: (progress: number) => void) {
    const version = await getLatestCLIVersion()
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

export async function UnZipExecutable() {
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
        execSync(`chmod +x ${CONSTANTS.binaryExecuablePath}`)
    }
}

export function IsBinaryDownloaded() {
    return existsSync(CONSTANTS.binaryExecuablePath)
}

export function StartPercy(config: z.infer<typeof PercyConfig>, options: StartPercyOptions = {}) {
    return new Promise<string>((resolve, reject) => {
        const { port, ...boolArgs } = options
        let stdoutlines: string[] = []
        writeFileSync(`${CONSTANTS.binaryDir}/.percy.json`, JSON.stringify(config))
        const args = ['exec:start']
        if (port) {
            args.push(`--port ${port}`)
        }
        for (let key in boolArgs) {
            if (boolArgs[key]) {
                args.push(`--${key}`)
            }
        }
        execFile(CONSTANTS.binaryExecuablePath, args, {
            cwd:CONSTANTS.binaryDir,
            env: {
                "PERCY_TOKEN": config.percy.token
            }
        }, (errr, stdout, stderr) => {
            if (errr) {
                return reject(errr)
            }
            if (stderr) {
                return reject(errr)
            }
        }).stdout.on('data', (chunk) => {
            const lines = chunk.split('\n')
            stdoutlines = stdoutlines.concat(lines)
            if (lines.some((l) => String(l).includes("Percy has started"))) {
                resolve(null)
            }
        })
    })

}

export function StopPercy() {
    return new Promise<string>((resolve, reject) => {
        execFile(CONSTANTS.binaryExecuablePath, ['exec:stop'], {
            env: {
                "PERCY_TOKEN": " ewqfdqwd"
            }
        }, (errr, stdout, stdin) => {
            if (errr) {
                reject(errr)
            }
            resolve(stdout)
        })
    })
}

export async function RunPercy(config: z.infer<typeof PercyConfig>, options: StartPercyOptions = {}) {
    try {
        if (!IsBinaryDownloaded()) {
            await DownloadExecutable()
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    UnZipExecutable().then(resolve).catch(reject)
                }, 500)
            })
        }
        await StartPercy(config, options)
    } catch (err) {
        console.log(err)
        throw err
    }
}
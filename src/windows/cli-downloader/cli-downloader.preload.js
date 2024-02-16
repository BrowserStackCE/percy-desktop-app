// cli-downloader.preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  'onProgressChange': (callback) => ipcRenderer.on('download-progress', (_, value) => callback(value)),
  'onUnzip': (callback)=> ipcRenderer.on('unzip',(_,value) => callback(value))
});
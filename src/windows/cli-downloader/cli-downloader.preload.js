const {contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('api',{
    'onProgressChange':(callback)=>ipcRenderer.on('progress',(_event,value)=>callback(value))
})
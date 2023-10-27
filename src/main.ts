
import { app, Menu, Tray } from 'electron'
if (require('electron-squirrel-startup')) app.quit();
import { join } from 'path'
import './server'
import { StartExpressServer } from './server';
import { version } from '../package.json'
import { platform } from 'os'
// require('update-electron-app')({
//     repo: 'browserstackce/percy-desktop-app',
//     updateInterval: '1 hour'
// })
const trayIconPath = join(__dirname, 'assets', 'tray.png');
const iconPath = join(__dirname, 'assets', 'icon.png')
if (platform() == 'darwin') {
    app.dock.setIcon(iconPath)
    app.dock.hide()
}
app.on('ready', () => {
    StartExpressServer()
    const tray = new Tray(trayIconPath);
    Menu.setApplicationMenu(null)
    const contextMenu = Menu.buildFromTemplate([
        { label: `Version ${version}`, type: 'normal', enabled: false },
        { label: "Quit", type: 'normal', click: () => app.quit() }
    ]);
    tray.setContextMenu(contextMenu);
})

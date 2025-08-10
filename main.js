const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');
const { runRootkitCheck } = require('./rootkit-checker');
const { createBaseline, checkIntegrity, baselineFile } = require('./file-integrity');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false
        }
    });

    win.loadFile('index.html');

// Optionally open DevTools
    win.webContents.openDevTools();
}

app.whenReady().then(() => {
    if (!fs.existsSync(baselineFile)) {
        createBaseline(process.cwd());
    }
    createWindow();
});

ipcMain.handle('run-security-checks', async () => {
    const rootkit = await runRootkitCheck();
    const integrity = checkIntegrity(process.cwd());
    return { rootkit, integrity };
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
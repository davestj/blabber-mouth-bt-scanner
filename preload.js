const { contextBridge, ipcRenderer } = require('electron');

const noble = require('@abandonware/noble');  // Ensure this line correctly imports the noble package

contextBridge.exposeInMainWorld('electron', {
    noble,
    ipcRenderer
});
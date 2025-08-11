/*
 * File: preload.js
 * Author: David St John
 * Date: 2025-08-11
 * Purpose: Secure IPC bridge between main and renderer processes
 * Project: Beyond The Horizon Labs - Blabber Mouth BT Scanner
 * 
 * When we design Electron applications, we need to understand that the main process
 * handles system resources (like Bluetooth), while the renderer process handles the UI.
 * This file acts as a secure bridge between them, exposing only the methods we need.
 */

const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');

// We detect the operating system and architecture to provide system-specific functionality
const systemInfo = {
    platform: os.platform(), // 'darwin', 'linux', 'win32'
    arch: os.arch(), // 'arm64', 'x64'
    hostname: os.hostname(),
    release: os.release(),
    type: os.type(),
    isMac: os.platform() === 'darwin',
    isLinux: os.platform() === 'linux',
    isWindows: os.platform() === 'win32',
    isARM: os.arch() === 'arm64'
};

// We create a comprehensive API that the renderer can use to communicate with the main process
// This approach ensures security while providing all the functionality we need
contextBridge.exposeInMainWorld('bthlAPI', {
    // System information - useful for platform-specific features
    system: systemInfo,
    
    // Bluetooth Scanner Methods - these all communicate with the main process
    bluetooth: {
        // We use invoke() for requests that need a response
        startScan: () => ipcRenderer.invoke('bt-start-scan'),
        stopScan: () => ipcRenderer.invoke('bt-stop-scan'),
        getDevices: () => ipcRenderer.invoke('bt-get-devices'),
        flagDevice: (address, flag, reason) => ipcRenderer.invoke('bt-flag-device', address, flag, reason),
        clearDevices: () => ipcRenderer.invoke('bt-clear-devices'),
        exportData: () => ipcRenderer.invoke('bt-export-data'),
        getStatistics: () => ipcRenderer.invoke('bt-get-statistics'),
        
        // We use on() for listening to events from the main process
        onDeviceDiscovered: (callback) => ipcRenderer.on('device-discovered', callback),
        removeDeviceListener: (callback) => ipcRenderer.removeListener('device-discovered', callback)
    },
    
    // GPS Methods for location tracking
    gps: {
        getCurrentLocation: () => ipcRenderer.invoke('gps-get-location'),
        calculateGPSFromSignal: (device) => ipcRenderer.invoke('gps-calculate', device),
        enableTracking: () => ipcRenderer.invoke('gps-enable'),
        disableTracking: () => ipcRenderer.invoke('gps-disable')
    },
    
    // Database Methods for device history and analytics
    database: {
        getDeviceHistory: (address) => ipcRenderer.invoke('db-get-device-history', address),
        getFlaggedDevices: () => ipcRenderer.invoke('db-get-flagged'),
        addVulnerability: (address, type, severity, desc) => 
            ipcRenderer.invoke('db-add-vulnerability', address, type, severity, desc)
    },
    
    // Security Methods for threat detection
    security: {
        runChecks: () => ipcRenderer.invoke('run-security-checks'),
        checkVulnerabilities: (address) => ipcRenderer.invoke('check-vulnerabilities', address),
        scanRootkit: () => ipcRenderer.invoke('scan-rootkit'),
        checkIntegrity: () => ipcRenderer.invoke('check-integrity'),
        runFullScan: () => ipcRenderer.invoke('run-full-security-scan')
    },
    
    // Authentication Methods
    auth: {
        authenticate: (username, password) => ipcRenderer.invoke('authenticate', username, password),
        logout: () => ipcRenderer.invoke('logout')
    },

    // App Info
    app: {
        getVersion: () => ipcRenderer.invoke('get-version'),
        getOperator: () => ipcRenderer.invoke('get-operator')
    }
});

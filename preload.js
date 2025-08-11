/*
 * File: preload.js
 * Author: David St John
 * Date: 2025-08-11
 * Purpose: Complete preload script with OS detection and GPS
 * Project: Beyond The Horizon Labs - Blabber Mouth BT Scanner
 */

const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');

// Detect OS and architecture
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

// We expose comprehensive API to renderer
contextBridge.exposeInMainWorld('bthlAPI', {
    // System information
    system: systemInfo,
    
    // Bluetooth Scanner Methods
    bluetooth: {
        startScan: () => ipcRenderer.invoke('bt-start-scan'),
        stopScan: () => ipcRenderer.invoke('bt-stop-scan'),
        getDevices: () => ipcRenderer.invoke('bt-get-devices'),
        flagDevice: (address, flag, reason) => ipcRenderer.invoke('bt-flag-device', address, flag, reason),
        clearDevices: () => ipcRenderer.invoke('bt-clear-devices'),
        exportData: () => ipcRenderer.invoke('bt-export-data'),
        getStatistics: () => ipcRenderer.invoke('bt-get-statistics')
    },
    
    // GPS Methods
    gps: {
        getCurrentLocation: () => ipcRenderer.invoke('gps-get-location'),
        calculateGPSFromSignal: (device) => ipcRenderer.invoke('gps-calculate', device),
        enableTracking: () => ipcRenderer.invoke('gps-enable'),
        disableTracking: () => ipcRenderer.invoke('gps-disable')
    },
    
    // Database Methods
    database: {
        getDeviceHistory: (address) => ipcRenderer.invoke('db-get-device-history', address),
        getFlaggedDevices: () => ipcRenderer.invoke('db-get-flagged'),
        addVulnerability: (address, type, severity, desc) => 
            ipcRenderer.invoke('db-add-vulnerability', address, type, severity, desc)
    },
    
    // Security Methods
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
        navigateToDashboard: () => ipcRenderer.invoke('navigate-to-dashboard'),
        logout: () => ipcRenderer.invoke('logout')
    },
    
    // Navigation Methods
    navigation: {
        loadPage: (page) => ipcRenderer.invoke('load-page', page)
    },
    
    // App Info
    app: {
        getVersion: () => ipcRenderer.invoke('get-version'),
        getOperator: () => ipcRenderer.invoke('get-operator')
    }
});

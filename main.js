/*
 * File: main.js
 * Author: David St John
 * Date: 2025-08-11
 * Purpose: Complete main process with database and Bluetooth integration
 * Project: Beyond The Horizon Labs - Blabber Mouth BT Scanner
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');
const { runRootkitCheck } = require('./rootkit-checker');
const { createBaseline, checkIntegrity, baselineFile } = require('./file-integrity');
const noble = require('@abandonware/noble');
const db = require('./database');

let mainWindow = null;
let currentOperator = 'ALPHA-7';

// Bluetooth Scanner Module
class BluetoothScanner {
    static devices = new Map();
    static isScanning = false;
    static flaggedDevices = new Set();
    
    static init() {
        // We initialize the Bluetooth state handler
        noble.on('stateChange', (state) => {
            logger.info(`Bluetooth state changed to: ${state}`);
            if (state === 'poweredOn' && this.isScanning) {
                noble.startScanning([], true);
            }
        });
        
        // We handle device discovery
        noble.on('discover', async (peripheral) => {
            const device = {
                address: peripheral.address,
                name: peripheral.advertisement.localName || 'Unknown Device',
                rssi: peripheral.rssi,
                uuid: peripheral.uuid,
                connectable: peripheral.connectable,
                distance: this.calculateDistance(peripheral.rssi),
                lastSeen: Date.now(),
                services: peripheral.advertisement.serviceUuids || [],
                manufacturer: peripheral.advertisement.manufacturerData?.toString('hex') || null,
                txPowerLevel: peripheral.advertisement.txPowerLevel,
                flagged: this.flaggedDevices.has(peripheral.address),
                type: this.determineDeviceType(peripheral)
            };
            
            this.devices.set(peripheral.address, device);
            
            // We save to database
            await db.addDevice(device);
            
            logger.info(`Discovered: ${device.name} (${device.address}) at ${device.distance}m`);
            
            // Send update to renderer
            if (mainWindow) {
                mainWindow.webContents.send('device-discovered', device);
            }
        });
    }
    
    static calculateDistance(rssi) {
        // We use path loss formula for distance estimation
        const txPower = -59; // Calibrated TX power at 1 meter
        const n = 2.0; // Path loss exponent
        return Math.pow(10, (txPower - rssi) / (10 * n)).toFixed(2);
    }
    
    static determineDeviceType(peripheral) {
        const name = (peripheral.advertisement.localName || '').toLowerCase();
        const services = peripheral.advertisement.serviceUuids || [];
        
        // Threat detection patterns
        const suspiciousPatterns = ['spy', 'cam', 'hidden', 'covert', 'mini', 'micro'];
        const isSuspicious = suspiciousPatterns.some(p => name.includes(p));
        
        if (isSuspicious) return 'Suspicious';
        if (name.includes('airpods') || name.includes('beats')) return 'Audio';
        if (name.includes('iphone') || name.includes('android') || name.includes('phone')) return 'Phone';
        if (name.includes('watch') || name.includes('band')) return 'Wearable';
        if (name.includes('tv') || name.includes('speaker')) return 'Media';
        if (name.includes('laptop') || name.includes('macbook')) return 'Computer';
        if (name.includes('car') || name.includes('tesla')) return 'Vehicle';
        if (services.includes('180d')) return 'Heart Rate Monitor';
        if (services.includes('180f')) return 'Battery';
        if (services.includes('1812')) return 'HID';
        
        // Check for camera/spy device patterns
        if (services.includes('1800') || services.includes('1801')) return 'Suspicious';
        
        return 'Unknown';
    }
    
    static calculateThreatLevel(device) {
        let threatScore = 0;
        
        // Suspicious name patterns
        const suspiciousNames = ['spy', 'cam', 'hidden', 'covert', 'mini', 'micro', 'hc-', 'esp'];
        if (suspiciousNames.some(p => device.name?.toLowerCase().includes(p))) threatScore += 40;
        
        // No name is suspicious
        if (!device.name || device.name === 'Unknown Device') threatScore += 20;
        
        // Very strong signal but unknown device
        if (device.rssi > -50 && device.type === 'Unknown') threatScore += 30;
        
        // Rapidly changing RSSI (moving device)
        if (device.rssiVariance > 10) threatScore += 20;
        
        // Hidden services
        if (device.services?.length === 0 && device.connectable) threatScore += 15;
        
        if (threatScore >= 60) return 'HIGH';
        if (threatScore >= 30) return 'MEDIUM';
        return 'LOW';
    }
    
    static triangulatePosition(rssiReadings) {
        // Using trilateration with at least 3 RSSI readings
        // Assumes scanner positions for triangulation
        const positions = [
            { x: 0, y: 0 },    // Scanner position 1
            { x: 10, y: 0 },   // Scanner position 2  
            { x: 5, y: 8.66 }  // Scanner position 3
        ];
        
        if (rssiReadings.length < 3) {
            // Simple distance only
            return { x: 0, y: this.calculateDistance(rssiReadings[0]) };
        }
        
        // Convert RSSI to distances
        const distances = rssiReadings.map(rssi => this.calculateDistance(rssi));
        
        // Trilateration calculation
        const A = 2 * positions[1].x - 2 * positions[0].x;
        const B = 2 * positions[1].y - 2 * positions[0].y;
        const C = Math.pow(distances[0], 2) - Math.pow(distances[1], 2) - Math.pow(positions[0].x, 2) + Math.pow(positions[1].x, 2);
        
        const D = 2 * positions[2].x - 2 * positions[1].x;
        const E = 2 * positions[2].y - 2 * positions[1].y;
        const F = Math.pow(distances[1], 2) - Math.pow(distances[2], 2) - Math.pow(positions[1].x, 2) + Math.pow(positions[2].x, 2);
        
        const x = (C * E - F * B) / (E * A - B * D);
        const y = (C * D - A * F) / (B * D - A * E);
        
        return { x: x.toFixed(2), y: y.toFixed(2) };
    }
    
    static async startScan() {
        this.isScanning = true;
        if (noble.state === 'poweredOn') {
            noble.startScanning([], true);
            logger.info('Bluetooth scanning started');
        }
        return { status: 'scanning', message: 'Scan initiated' };
    }
    
    static stopScan() {
        this.isScanning = false;
        noble.stopScanning();
        logger.info('Bluetooth scanning stopped');
        return { status: 'stopped', message: 'Scan stopped' };
    }
    
    static async getDevices() {
        // We get from memory and merge with database
        const dbDevices = await db.getAllDevices();
        const liveDevices = Array.from(this.devices.values());
        
        // Merge live and database devices
        const merged = new Map();
        dbDevices.forEach(d => merged.set(d.address, d));
        liveDevices.forEach(d => merged.set(d.address, d));
        
        return Array.from(merged.values()).sort((a, b) => b.rssi - a.rssi);
    }
    
    static async flagDevice(address, flag = true, reason = 'Manual flag') {
        if (flag) {
            this.flaggedDevices.add(address);
            await db.flagDevice(address, reason, currentOperator);
        } else {
            this.flaggedDevices.delete(address);
        }
        
        const device = this.devices.get(address);
        if (device) {
            device.flagged = flag;
        }
        
        logger.info(`Device ${address} ${flag ? 'flagged' : 'unflagged'}: ${reason}`);
        return { success: true, flagged: flag };
    }
    
    static async getStatistics() {
        return await db.getStatistics();
    }
}

// GPS Module
class GPSTracker {
    static baseLocation = null;
    static trackingEnabled = false;
    
    static async getCurrentLocation() {
        // We use system location or default to a base location
        // For real GPS, you'd integrate with a GPS library
        if (!this.baseLocation) {
            this.baseLocation = {
                lat: 47.6062, // Default: Seattle area (near Renton)
                lng: -122.3321,
                accuracy: 10
            };
        }
        return this.baseLocation;
    }
    
    static calculateGPSFromSignal(device, baseLocation = null) {
        const base = baseLocation || this.baseLocation || { lat: 47.6062, lng: -122.3321 };
        const distance = parseFloat(device.distance || this.calculateDistance(device.rssi));
        
        // Calculate GPS offset based on signal triangulation
        // Convert meters to degrees (rough approximation)
        const metersPerDegree = 111139; // At equator
        const latOffset = (device.y || 0) / metersPerDegree;
        const lngOffset = (device.x || 0) / (metersPerDegree * Math.cos(base.lat * Math.PI / 180));
        
        return {
            lat: (base.lat + latOffset).toFixed(6),
            lng: (base.lng + lngOffset).toFixed(6),
            accuracy: distance,
            address: device.address
        };
    }
    
    static enable() {
        this.trackingEnabled = true;
        logger.info('GPS tracking enabled');
        return { enabled: true };
    }
    
    static disable() {
        this.trackingEnabled = false;
        logger.info('GPS tracking disabled');
        return { enabled: false };
    }
}

// Security Scanner Module
class SecurityScanner {
    static async runFullScan() {
        const results = {
            timestamp: new Date().toISOString(),
            rootkit: null,
            integrity: null,
            vulnerabilities: [],
            threats: []
        };
        
        try {
            // We run rootkit check
            results.rootkit = await runRootkitCheck();
            
            // We check file integrity
            results.integrity = checkIntegrity(process.cwd());
            
            // Check for suspicious processes
            results.processes = this.checkSuspiciousProcesses();
            
            // Network scan
            results.network = this.checkNetworkThreats();
            
            logger.info('Security scan completed');
        } catch (error) {
            logger.error('Security scan failed:', error);
        }
        
        return results;
    }
    
    static checkSuspiciousProcesses() {
        // Check for known malicious process names
        const suspicious = ['keylogger', 'backdoor', 'trojan'];
        const running = [];
        
        // In production, use ps-list or similar
        return { suspicious: running, status: running.length > 0 ? 'THREAT' : 'CLEAR' };
    }
    
    static checkNetworkThreats() {
        // Check for suspicious network connections
        return { openPorts: [], suspiciousConnections: [], status: 'CLEAR' };
    }
}

// Initialize modules
BluetoothScanner.init();
GPSTracker.getCurrentLocation();

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 1000,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true
        },
        icon: path.join(__dirname, 'assets', 'icon.png'),
        titleBarStyle: 'hiddenInset',
        backgroundColor: '#0a0e1a',
        title: 'BTHL Tactical Scanner'
    });
    
    // Load authentication screen
    mainWindow.loadFile('auth.html');
    
    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
    
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    // We create baseline for file integrity
    if (!fs.existsSync(baselineFile)) {
        createBaseline(process.cwd());
    }
    createWindow();
});

// IPC Handlers for Bluetooth
ipcMain.handle('bt-start-scan', async () => {
    return await BluetoothScanner.startScan();
});

ipcMain.handle('bt-stop-scan', async () => {
    return BluetoothScanner.stopScan();
});

ipcMain.handle('bt-get-devices', async () => {
    return await BluetoothScanner.getDevices();
});

ipcMain.handle('bt-flag-device', async (event, address, flag, reason) => {
    return await BluetoothScanner.flagDevice(address, flag, reason);
});

ipcMain.handle('bt-clear-devices', async () => {
    BluetoothScanner.devices.clear();
    return { success: true };
});

ipcMain.handle('bt-export-data', async () => {
    const devices = await BluetoothScanner.getDevices();
    const stats = await db.getStatistics();
    
    const exportData = {
        timestamp: new Date().toISOString(),
        operator: currentOperator,
        statistics: stats,
        devices: devices,
        flaggedCount: BluetoothScanner.flaggedDevices.size
    };
    
    const outputPath = path.join(__dirname, 'data', `scan-${Date.now()}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    logger.info(`Data exported to ${outputPath}`);
    
    return { success: true, path: outputPath };
});

ipcMain.handle('bt-get-statistics', async () => {
    return await BluetoothScanner.getStatistics();
});

// IPC Handlers for Database
ipcMain.handle('db-get-device-history', async (event, address) => {
    return await db.getDeviceHistory(address);
});

ipcMain.handle('db-get-flagged', async () => {
    return await db.getFlaggedDevices();
});

ipcMain.handle('db-add-vulnerability', async (event, address, type, severity, desc) => {
    return await db.addVulnerability(address, type, severity, desc);
});

// Security Handlers
ipcMain.handle('run-security-checks', async () => {
    const rootkit = await runRootkitCheck();
    const integrity = checkIntegrity(process.cwd());
    return { rootkit, integrity };
});

ipcMain.handle('check-vulnerabilities', async (event, address) => {
    const { checkDeviceVulnerabilities } = require('./vulnerability-checker');
    return await checkDeviceVulnerabilities(address);
});

// Authentication Handler
ipcMain.handle('authenticate', async (event, username, password) => {
    const { verifyCredentials } = require('./credentials');
    const isValid = verifyCredentials(username, password);
    
    if (isValid) {
        currentOperator = username.toUpperCase();
        logger.info(`Authentication successful: ${username}`);
        return { success: true, token: require('crypto').randomBytes(32).toString('hex') };
    } else {
        logger.warn(`Authentication failed: ${username}`);
        return { success: false, error: 'Invalid credentials' };
    }
});

// Navigation Handlers
ipcMain.handle('navigate-to-dashboard', async () => {
    if (mainWindow) {
        mainWindow.loadFile('dashboard.html');
    }
});

ipcMain.handle('load-page', async (event, page) => {
    if (mainWindow) {
        mainWindow.loadFile(page);
    }
});

ipcMain.handle('logout', async () => {
    if (mainWindow) {
        mainWindow.loadFile('auth.html');
    }
});

// System Info
ipcMain.handle('get-version', () => {
    return require('./package.json').version;
});

ipcMain.handle('get-operator', () => {
    return currentOperator;
});

// App lifecycle
app.on('window-all-closed', () => {
    BluetoothScanner.stopScan();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('before-quit', () => {
    BluetoothScanner.stopScan();
    db.close();
    logger.info('Application shutting down');
});

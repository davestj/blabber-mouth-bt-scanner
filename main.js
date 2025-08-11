/*
 * File: main.js
 * Author: David St John
 * Date: 2025-08-11
 * Purpose: Main Electron process with proper Bluetooth scanning and database integration
 * Project: Beyond The Horizon Labs - Blabber Mouth BT Scanner
 * 
 * When we build the main process, we need to understand that this is where all the heavy lifting
 * happens. The main process manages system resources, handles Bluetooth communication,
 * maintains the database, and coordinates with the renderer process through IPC.
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');
const { runRootkitCheck } = require('./rootkit-checker');
const { createBaseline, checkIntegrity, baselineFile } = require('./file-integrity');

// We need to handle the case where noble might not be available on all systems
let noble = null;
try {
    noble = require('@abandonware/noble');
    console.log('Noble Bluetooth library loaded successfully');
} catch (error) {
    console.warn('Noble Bluetooth library not available:', error.message);
}

// We'll try to load the database, but handle gracefully if SQLite isn't available
let db = null;
try {
    db = require('./database');
    console.log('Database module loaded successfully');
} catch (error) {
    console.warn('Database module not available:', error.message);
    // We create a simple fallback database for basic functionality
    db = {
        addDevice: async (device) => console.log('Device would be saved:', device.address),
        getAllDevices: async () => [],
        flagDevice: async (address, reason, operator) => console.log('Device flagged:', address),
        getStatistics: async () => ({ totalDevices: 0, flaggedDevices: 0, criticalThreats: 0, recentDevices: 0 }),
        getDeviceHistory: async (address) => [],
        getFlaggedDevices: async () => [],
        addVulnerability: async () => ({ success: true }),
        close: () => {}
    };
}

let mainWindow = null;
let currentOperator = 'ALPHA-7';

// This is our main Bluetooth scanning engine - the heart of the application
class BluetoothScanner {
    static devices = new Map();
    static isScanning = false;
    static flaggedDevices = new Set();
    static scanStartTime = null;
    
    static init() {
        if (!noble) {
            console.warn('Noble not available - Bluetooth scanning disabled');
            return;
        }
        
        // We set up the Bluetooth state management to handle when Bluetooth is turned on/off
        noble.on('stateChange', (state) => {
            logger.info(`Bluetooth state changed to: ${state}`);
            console.log(`Bluetooth state: ${state}`);
            
            if (state === 'poweredOn' && this.isScanning) {
                // When Bluetooth becomes available and we should be scanning, start scanning
                noble.startScanning([], true); // Empty array means scan for all devices, true allows duplicates
                console.log('Bluetooth scanning started automatically');
            } else if (state !== 'poweredOn') {
                // If Bluetooth is turned off, stop scanning
                noble.stopScanning();
                console.log('Bluetooth scanning stopped - Bluetooth not available');
            }
            
            // We notify the renderer about the state change
            if (mainWindow) {
                mainWindow.webContents.send('bluetooth-state-changed', state);
            }
        });
        
        // This is where we handle each discovered device
        noble.on('discover', async (peripheral) => {
            try {
                // We calculate the estimated distance using the RSSI (signal strength)
                const distance = this.calculateDistance(peripheral.rssi);
                
                // We create a comprehensive device object with all available information
                const device = {
                    address: peripheral.address,
                    name: peripheral.advertisement.localName || 'Unknown Device',
                    rssi: peripheral.rssi,
                    uuid: peripheral.uuid,
                    connectable: peripheral.connectable,
                    distance: distance,
                    lastSeen: Date.now(),
                    firstSeen: this.devices.has(peripheral.address) ? this.devices.get(peripheral.address).firstSeen : Date.now(),
                    services: peripheral.advertisement.serviceUuids || [],
                    manufacturer: peripheral.advertisement.manufacturerData?.toString('hex') || null,
                    txPowerLevel: peripheral.advertisement.txPowerLevel,
                    flagged: this.flaggedDevices.has(peripheral.address),
                    type: this.determineDeviceType(peripheral),
                    threatLevel: 'LOW'
                };
                
                // We calculate a threat level based on device characteristics
                device.threatLevel = this.calculateThreatLevel(device);
                
                // We store the device in our memory map for quick access
                this.devices.set(peripheral.address, device);
                
                // We save the device to the database for persistent storage
                if (db && db.addDevice) {
                    await db.addDevice(device);
                }
                
                logger.info(`Discovered: ${device.name} (${device.address}) at ${device.distance}m - Threat: ${device.threatLevel}`);
                
                // We immediately notify the renderer so the UI can update
                if (mainWindow) {
                    mainWindow.webContents.send('device-discovered', device);
                }
                
            } catch (error) {
                console.error('Error processing discovered device:', error);
            }
        });
        
        // We handle scanning start events
        noble.on('scanStart', () => {
            console.log('Bluetooth scan started');
            this.scanStartTime = Date.now();
            if (mainWindow) {
                mainWindow.webContents.send('scan-started');
            }
        });
        
        // We handle scanning stop events
        noble.on('scanStop', () => {
            console.log('Bluetooth scan stopped');
            if (mainWindow) {
                mainWindow.webContents.send('scan-stopped');
            }
        });
    }
    
    // We use the path loss formula to estimate distance from signal strength
    static calculateDistance(rssi) {
        const txPower = -59; // Calibrated TX power at 1 meter (this is a standard reference)
        const n = 2.0; // Path loss exponent (2.0 for free space, higher for indoor environments)
        
        if (rssi === 0) return -1.0; // Cannot determine distance
        
        const ratio = rssi * 1.0 / txPower;
        if (ratio < 1.0) {
            return Math.pow(ratio, 10);
        } else {
            const accuracy = (0.89976) * Math.pow(ratio, 7.7095) + 0.111;
            return parseFloat(accuracy.toFixed(2));
        }
    }
    
    // We analyze device characteristics to classify the type of device
    static determineDeviceType(peripheral) {
        const name = (peripheral.advertisement.localName || '').toLowerCase();
        const services = peripheral.advertisement.serviceUuids || [];
        
        // We check for suspicious patterns that might indicate surveillance equipment
        const suspiciousPatterns = ['spy', 'cam', 'hidden', 'covert', 'mini', 'micro', 'hc-', 'esp'];
        const isSuspicious = suspiciousPatterns.some(pattern => name.includes(pattern));
        
        if (isSuspicious) return 'Suspicious';
        
        // We classify known device types based on name patterns
        if (name.includes('airpods') || name.includes('beats') || name.includes('headphones')) return 'Audio';
        if (name.includes('iphone') || name.includes('android') || name.includes('phone') || name.includes('samsung')) return 'Phone';
        if (name.includes('watch') || name.includes('band') || name.includes('fitbit')) return 'Wearable';
        if (name.includes('tv') || name.includes('speaker') || name.includes('echo') || name.includes('alexa')) return 'Media';
        if (name.includes('laptop') || name.includes('macbook') || name.includes('computer')) return 'Computer';
        if (name.includes('car') || name.includes('tesla') || name.includes('vehicle')) return 'Vehicle';
        
        // We check for specific Bluetooth service UUIDs
        if (services.includes('180d')) return 'Heart Rate Monitor';
        if (services.includes('180f')) return 'Battery Service';
        if (services.includes('1812')) return 'HID Device';
        if (services.includes('110a')) return 'Audio Source';
        if (services.includes('110b')) return 'Audio Sink';
        
        // We flag devices with suspicious service combinations
        if (services.includes('1800') || services.includes('1801')) return 'Suspicious';
        
        return 'Unknown';
    }
    
    // We calculate a threat level based on various device characteristics
    static calculateThreatLevel(device) {
        let threatScore = 0;
        
        // We add points for suspicious name patterns
        const suspiciousNames = ['spy', 'cam', 'hidden', 'covert', 'mini', 'micro', 'hc-', 'esp'];
        if (suspiciousNames.some(pattern => device.name?.toLowerCase().includes(pattern))) {
            threatScore += 40;
        }
        
        // We consider unnamed devices suspicious
        if (!device.name || device.name === 'Unknown Device') {
            threatScore += 20;
        }
        
        // We flag very strong signals from unknown devices as potentially suspicious
        if (device.rssi > -50 && device.type === 'Unknown') {
            threatScore += 30;
        }
        
        // We check for devices that don't advertise services but are connectable (potential backdoors)
        if (device.services?.length === 0 && device.connectable) {
            threatScore += 15;
        }
        
        // We assign threat levels based on the accumulated score
        if (threatScore >= 60) return 'HIGH';
        if (threatScore >= 30) return 'MEDIUM';
        return 'LOW';
    }
    
    // We start the Bluetooth scanning process
    static async startScan() {
        if (!noble) {
            return { status: 'error', message: 'Bluetooth not available' };
        }
        
        this.isScanning = true;
        
        if (noble.state === 'poweredOn') {
            noble.startScanning([], true);
            logger.info('Bluetooth scanning started');
            return { status: 'scanning', message: 'Scan initiated successfully' };
        } else {
            return { status: 'waiting', message: 'Waiting for Bluetooth to power on' };
        }
    }
    
    // We stop the Bluetooth scanning process
    static stopScan() {
        if (!noble) {
            return { status: 'error', message: 'Bluetooth not available' };
        }
        
        this.isScanning = false;
        noble.stopScanning();
        logger.info('Bluetooth scanning stopped');
        return { status: 'stopped', message: 'Scan stopped successfully' };
    }
    
    // We retrieve all discovered devices, merging live data with database history
    static async getDevices() {
        try {
            // We get devices from the database for persistence
            const dbDevices = db && db.getAllDevices ? await db.getAllDevices() : [];
            
            // We get current live devices from memory
            const liveDevices = Array.from(this.devices.values());
            
            // We merge the data, prioritizing live data for devices currently visible
            const merged = new Map();
            
            // We add database devices first
            dbDevices.forEach(device => merged.set(device.address, device));
            
            // We overlay live devices (more recent data)
            liveDevices.forEach(device => merged.set(device.address, device));
            
            // We sort by signal strength (closest devices first)
            return Array.from(merged.values()).sort((a, b) => b.rssi - a.rssi);
            
        } catch (error) {
            console.error('Error getting devices:', error);
            return Array.from(this.devices.values()).sort((a, b) => b.rssi - a.rssi);
        }
    }
    
    // We flag or unflag a device for monitoring
    static async flagDevice(address, flag = true, reason = 'Manual flag') {
        try {
            if (flag) {
                this.flaggedDevices.add(address);
                if (db && db.flagDevice) {
                    await db.flagDevice(address, reason, currentOperator);
                }
            } else {
                this.flaggedDevices.delete(address);
            }
            
            // We update the device in our memory map
            const device = this.devices.get(address);
            if (device) {
                device.flagged = flag;
                device.threatLevel = flag ? 'HIGH' : this.calculateThreatLevel(device);
            }
            
            logger.info(`Device ${address} ${flag ? 'flagged' : 'unflagged'}: ${reason}`);
            return { success: true, flagged: flag };
            
        } catch (error) {
            console.error('Error flagging device:', error);
            return { success: false, error: error.message };
        }
    }
    
    // We clear all devices from memory (but not from database)
    static clearDevices() {
        this.devices.clear();
        logger.info('Device list cleared');
        return { success: true, cleared: true };
    }
    
    // We get scanning statistics
    static async getStatistics() {
        try {
            if (db && db.getStatistics) {
                return await db.getStatistics();
            } else {
                // We provide basic statistics from memory if database isn't available
                return {
                    totalDevices: this.devices.size,
                    flaggedDevices: this.flaggedDevices.size,
                    criticalThreats: Array.from(this.devices.values()).filter(d => d.threatLevel === 'HIGH').length,
                    recentDevices: Array.from(this.devices.values()).filter(d => Date.now() - d.lastSeen < 3600000).length
                };
            }
        } catch (error) {
            console.error('Error getting statistics:', error);
            return { totalDevices: 0, flaggedDevices: 0, criticalThreats: 0, recentDevices: 0 };
        }
    }
}

// We initialize our Bluetooth scanner
BluetoothScanner.init();

// We create the main application window
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
    
    // We start with the authentication screen
    mainWindow.loadFile('auth.html');
    
    // We enable developer tools in development mode
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
    
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// We set up the application lifecycle
app.whenReady().then(() => {
    // We create a file integrity baseline if it doesn't exist
    if (!fs.existsSync(baselineFile)) {
        createBaseline(process.cwd());
    }
    createWindow();
});

// We register all our IPC handlers for communication with the renderer process

// Bluetooth IPC Handlers
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
    return BluetoothScanner.clearDevices();
});

ipcMain.handle('bt-export-data', async () => {
    try {
        const devices = await BluetoothScanner.getDevices();
        const stats = await BluetoothScanner.getStatistics();
        
        const exportData = {
            timestamp: new Date().toISOString(),
            operator: currentOperator,
            statistics: stats,
            devices: devices,
            flaggedCount: BluetoothScanner.flaggedDevices.size
        };
        
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        const outputPath = path.join(dataDir, `scan-${Date.now()}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
        logger.info(`Data exported to ${outputPath}`);
        
        return { success: true, path: outputPath, deviceCount: devices.length };
        
    } catch (error) {
        console.error('Export error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('bt-get-statistics', async () => {
    return await BluetoothScanner.getStatistics();
});

// Database IPC Handlers
ipcMain.handle('db-get-device-history', async (event, address) => {
    return db && db.getDeviceHistory ? await db.getDeviceHistory(address) : [];
});

ipcMain.handle('db-get-flagged', async () => {
    return db && db.getFlaggedDevices ? await db.getFlaggedDevices() : [];
});

ipcMain.handle('db-add-vulnerability', async (event, address, type, severity, desc) => {
    return db && db.addVulnerability ? await db.addVulnerability(address, type, severity, desc) : { success: true };
});

// Security IPC Handlers
ipcMain.handle('run-security-checks', async () => {
    try {
        const rootkit = await runRootkitCheck();
        const integrity = checkIntegrity(process.cwd());
        return { rootkit, integrity };
    } catch (error) {
        console.error('Security check error:', error);
        return { rootkit: { status: 'error', output: error.message }, integrity: { status: 'error', changed: [] } };
    }
});

ipcMain.handle('check-vulnerabilities', async (event, address) => {
    try {
        const { checkDeviceVulnerabilities } = require('./vulnerability-checker');
        return await checkDeviceVulnerabilities(address);
    } catch (error) {
        console.error('Vulnerability check error:', error);
        return [];
    }
});

// Authentication IPC Handlers
ipcMain.handle('authenticate', async (event, username, password) => {
    try {
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
    } catch (error) {
        console.error('Authentication error:', error);
        return { success: false, error: 'Authentication system error' };
    }
});

// Navigation IPC Handlers
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

// System Info IPC Handlers
ipcMain.handle('get-version', () => {
    try {
        return require('./package.json').version;
    } catch (error) {
        return '1.0.0';
    }
});

ipcMain.handle('get-operator', () => {
    return currentOperator;
});

// We handle application lifecycle events
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
    if (db && db.close) {
        db.close();
    }
    logger.info('Application shutting down');
});

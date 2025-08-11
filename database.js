/*
 * File: database.js
 * Author: David St John
 * Date: 2025-08-11
 * Purpose: SQLite database backend for device storage
 * Project: Beyond The Horizon Labs - Blabber Mouth BT Scanner
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

class BTHLDatabase {
    constructor() {
        const dbDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        
        this.dbPath = path.join(dbDir, 'bthl-scanner.db');
        this.db = new sqlite3.Database(this.dbPath);
        this.initTables();
    }
    
    initTables() {
        // We create our device tracking tables
        this.db.serialize(() => {
            // Main device registry
            this.db.run(`
                CREATE TABLE IF NOT EXISTS devices (
                    address TEXT PRIMARY KEY,
                    name TEXT,
                    rssi INTEGER,
                    distance REAL,
                    uuid TEXT,
                    manufacturer TEXT,
                    device_type TEXT,
                    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                    times_seen INTEGER DEFAULT 1,
                    flagged BOOLEAN DEFAULT 0,
                    threat_level TEXT DEFAULT 'LOW',
                    notes TEXT
                )
            `);
            
            // Device scan history
            this.db.run(`
                CREATE TABLE IF NOT EXISTS scan_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    device_address TEXT,
                    rssi INTEGER,
                    distance REAL,
                    scan_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (device_address) REFERENCES devices(address)
                )
            `);
            
            // Known vulnerabilities
            this.db.run(`
                CREATE TABLE IF NOT EXISTS vulnerabilities (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    device_address TEXT,
                    vulnerability_type TEXT,
                    severity TEXT,
                    description TEXT,
                    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (device_address) REFERENCES devices(address)
                )
            `);
            
            // Flagged device profiles
            this.db.run(`
                CREATE TABLE IF NOT EXISTS flagged_profiles (
                    address TEXT PRIMARY KEY,
                    reason TEXT,
                    operator TEXT,
                    flagged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    monitoring_active BOOLEAN DEFAULT 1,
                    alert_threshold INTEGER DEFAULT -70
                )
            `);
            
            logger.info('Database tables initialized');
        });
    }
    
    // We add or update a device
    addDevice(device) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO devices 
                (address, name, rssi, distance, uuid, manufacturer, device_type, last_seen, times_seen, flagged)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 
                    COALESCE((SELECT times_seen FROM devices WHERE address = ?) + 1, 1),
                    COALESCE((SELECT flagged FROM devices WHERE address = ?), 0)
                )
            `);
            
            stmt.run(
                device.address,
                device.name || 'Unknown',
                device.rssi,
                device.distance,
                device.uuid,
                device.manufacturer,
                device.type,
                device.address,
                device.address,
                (err) => {
                    if (err) reject(err);
                    else {
                        // Log to scan history
                        this.addScanHistory(device);
                        resolve(device);
                    }
                }
            );
        });
    }
    
    // We add scan history entry
    addScanHistory(device) {
        this.db.run(
            `INSERT INTO scan_history (device_address, rssi, distance) VALUES (?, ?, ?)`,
            [device.address, device.rssi, device.distance]
        );
    }
    
    // We flag a device for monitoring
    flagDevice(address, reason, operator) {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run(
                    `UPDATE devices SET flagged = 1, threat_level = 'HIGH' WHERE address = ?`,
                    [address]
                );
                
                this.db.run(
                    `INSERT OR REPLACE INTO flagged_profiles (address, reason, operator) VALUES (?, ?, ?)`,
                    [address, reason, operator],
                    (err) => {
                        if (err) reject(err);
                        else resolve({ success: true });
                    }
                );
            });
        });
    }
    
    // We get all devices
    getAllDevices() {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT * FROM devices ORDER BY last_seen DESC`,
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }
    
    // We get flagged devices
    getFlaggedDevices() {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT d.*, f.reason, f.operator, f.flagged_at 
                 FROM devices d 
                 JOIN flagged_profiles f ON d.address = f.address 
                 WHERE d.flagged = 1`,
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }
    
    // We get device history
    getDeviceHistory(address, limit = 100) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT * FROM scan_history 
                 WHERE device_address = ? 
                 ORDER BY scan_time DESC 
                 LIMIT ?`,
                [address, limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }
    
    // We add vulnerability
    addVulnerability(address, type, severity, description) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO vulnerabilities (device_address, vulnerability_type, severity, description) 
                 VALUES (?, ?, ?, ?)`,
                [address, type, severity, description],
                (err) => {
                    if (err) reject(err);
                    else {
                        // Update threat level
                        this.db.run(
                            `UPDATE devices SET threat_level = ? WHERE address = ?`,
                            [severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH', address]
                        );
                        resolve({ success: true });
                    }
                }
            );
        });
    }
    
    // We get statistics
    getStatistics() {
        return new Promise((resolve, reject) => {
            const stats = {};
            
            this.db.serialize(() => {
                this.db.get(`SELECT COUNT(*) as total FROM devices`, (err, row) => {
                    stats.totalDevices = row.total;
                    
                    this.db.get(`SELECT COUNT(*) as flagged FROM devices WHERE flagged = 1`, (err, row) => {
                        stats.flaggedDevices = row.flagged;
                        
                        this.db.get(`SELECT COUNT(*) as critical FROM devices WHERE threat_level = 'CRITICAL'`, (err, row) => {
                            stats.criticalThreats = row.critical;
                            
                            this.db.get(`SELECT COUNT(*) as recent FROM devices WHERE datetime(last_seen) > datetime('now', '-1 hour')`, (err, row) => {
                                stats.recentDevices = row.recent;
                                resolve(stats);
                            });
                        });
                    });
                });
            });
        });
    }
    
    close() {
        this.db.close();
    }
}

module.exports = new BTHLDatabase();

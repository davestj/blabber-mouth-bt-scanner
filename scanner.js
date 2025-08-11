const fs = require('fs');
const path = require('path');
const noble = require('@abandonware/noble');
const { get } = require('./config');
const { safeDb, knownRogueDb, flagAsPotential, flagAsRogue } = require('./src/db');
const { checkDeviceVulnerabilities } = require('./vulnerability-checker');

console.log('Initializing Bluetooth scanner...');

const scannerConfig = get().scanner || {};

async function logDiscovery(entry) {
    const dir = path.join(__dirname, 'data');
    try {
        await fs.promises.mkdir(dir, { recursive: true });
        const file = path.join(
            dir,
            `${new Date().toISOString().replace(/[:.]/g, '-')}.json`
        );
        await fs.promises.writeFile(file, JSON.stringify(entry, null, 2));
    } catch (err) {
        console.error(`Failed to write discovery log: ${err.message}`);
    }
}

noble.on('stateChange', state => {
    console.log(`Bluetooth state changed to: ${state}`);
    if (state === 'poweredOn') {
        console.log('Starting Bluetooth scanning...');
        const services = scannerConfig.services || [];
        const allowDuplicates =
            scannerConfig.allowDuplicates !== undefined
                ? scannerConfig.allowDuplicates
                : true;
        noble.startScanning(services, allowDuplicates);
    } else {
        console.log('Stopping Bluetooth scanning...');
        noble.stopScanning();
    }
});

noble.on('discover', async peripheral => {
    const deviceName = peripheral.advertisement.localName || 'Unknown';
    const deviceAddress = peripheral.address;
    const deviceRSSI = peripheral.rssi;
    const deviceUUIDs = peripheral.advertisement.serviceUuids.join(', ');

    console.log(
        `Discovered device - Name: ${deviceName}, Address: ${deviceAddress}, RSSI: ${deviceRSSI}, UUIDs: ${deviceUUIDs}`
    );

    const dbRecord = {
        address: deviceAddress,
        name: deviceName,
        fingerprint: deviceUUIDs
    };

    let classification = 'unknown';

    if (await safeDb.findByAddress(deviceAddress)) {
        classification = 'safe';
    } else if (await knownRogueDb.findByAddress(deviceAddress)) {
        classification = 'known_rogue';
    } else {
        try {
            const vulns = await checkDeviceVulnerabilities(deviceAddress);
            if (vulns && vulns.length > 0) {
                classification = 'rogue';
                await flagAsRogue(dbRecord);
            } else {
                classification = 'potential';
                await flagAsPotential(dbRecord);
            }
        } catch (err) {
            console.error(
                `Vulnerability check failed for ${deviceAddress}: ${err.message}`
            );
            classification = 'potential';
            await flagAsPotential(dbRecord);
        }
    }

    const logEntry = {
        timestamp: new Date().toISOString(),
        address: deviceAddress,
        name: deviceName,
        rssi: deviceRSSI,
        uuids: peripheral.advertisement.serviceUuids,
        classification
    };

    await logDiscovery(logEntry);

    if (classification === 'safe') {
        console.log(`Safe device detected: ${deviceName} (${deviceAddress})`);
    } else if (classification === 'known_rogue') {
        console.warn(
            `Known rogue device detected: ${deviceName} (${deviceAddress})`
        );
    } else if (classification === 'rogue') {
        console.warn(
            `Confirmed rogue device added: ${deviceName} (${deviceAddress})`
        );
    } else if (classification === 'potential') {
        console.log(
            `Unknown device flagged as potential rogue: ${deviceName} (${deviceAddress})`
        );
    }
});

process.on('SIGINT', () => {
    console.log('Stopping Bluetooth scanning...');
    noble.stopScanning(() => {
        console.log('Bluetooth scanning stopped.');
        process.exit(0);
    });
});

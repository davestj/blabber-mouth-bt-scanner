const noble = require('@abandonware/noble');
const { get } = require('./config');
const { safeDb, knownRogueDb, flagAsPotential, flagAsRogue } = require('./src/db');
const { checkDeviceVulnerabilities } = require('./vulnerability-checker');

console.log('Initializing Bluetooth scanner...');

const scannerConfig = get().scanner || {};

noble.on('stateChange', state => {
    console.log(`Bluetooth state changed to: ${state}`);
    if (state === 'poweredOn') {
        console.log('Starting Bluetooth scanning...');
        const services = scannerConfig.services || [];
        const allowDuplicates = scannerConfig.allowDuplicates !== undefined ? scannerConfig.allowDuplicates : true;
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

    console.log(`Discovered device - Name: ${deviceName}, Address: ${deviceAddress}, RSSI: ${deviceRSSI}, UUIDs: ${deviceUUIDs}`);

    const record = { address: deviceAddress, name: deviceName, fingerprint: deviceUUIDs };

    if (await safeDb.findByAddress(deviceAddress)) {
        console.log(`Safe device detected: ${deviceName} (${deviceAddress})`);
        return;
    }

    if (await knownRogueDb.findByAddress(deviceAddress)) {
        console.warn(`Known rogue device detected: ${deviceName} (${deviceAddress})`);
        return;
    }

    try {
        const vulns = await checkDeviceVulnerabilities(deviceAddress);
        if (vulns && vulns.length > 0) {
            await flagAsRogue(record);
            console.warn(`Confirmed rogue device added: ${deviceName} (${deviceAddress})`);
            return;
        }
    } catch (err) {
        console.error(`Vulnerability check failed for ${deviceAddress}: ${err.message}`);
    }

    await flagAsPotential(record);
    console.log(`Unknown device flagged as potential rogue: ${deviceName} (${deviceAddress})`);
});

process.on('SIGINT', () => {
    console.log('Stopping Bluetooth scanning...');
    noble.stopScanning(() => {
        console.log('Bluetooth scanning stopped.');
        process.exit(0);
    });
});
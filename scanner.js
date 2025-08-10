const noble = require('@abandonware/noble');
const { get } = require('./config');

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

noble.on('discover', peripheral => {
    const deviceName = peripheral.advertisement.localName || 'Unknown';
    const deviceAddress = peripheral.address;
    const deviceRSSI = peripheral.rssi;
    const deviceUUIDs = peripheral.advertisement.serviceUuids.join(', ');

    console.log(`Discovered device - Name: ${deviceName}, Address: ${deviceAddress}, RSSI: ${deviceRSSI}, UUIDs: ${deviceUUIDs}`);
});

process.on('SIGINT', () => {
    console.log('Stopping Bluetooth scanning...');
    noble.stopScanning(() => {
        console.log('Bluetooth scanning stopped.');
        process.exit(0);
    });
});
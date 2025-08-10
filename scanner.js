const noble = require('@abandonware/noble');

console.log('Initializing Bluetooth scanner...');

noble.on('stateChange', state => {
    console.log(`Bluetooth state changed to: ${state}`);
    if (state === 'poweredOn') {
        console.log('Starting Bluetooth scanning...');
        noble.startScanning([], true); // Enable duplicates
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
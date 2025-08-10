const noble = require('@abandonware/noble');

noble.on('stateChange', state => {
    console.log(`State changed: ${state}`);
    if (state === 'poweredOn') {
        noble.startScanning([], true);
    }
});

noble.on('discover', peripheral => {
    console.log(`Discovered device: ${peripheral.advertisement.localName} (${peripheral.address})`);
});
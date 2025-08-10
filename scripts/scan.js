const fs = require('fs');
const path = require('path');
const noble = require('@abandonware/noble');
const { get } = require('../config');

async function quickScan() {
  const cfg = get();
  const paths = cfg.paths || {};
  const scannerCfg = cfg.scanner || {};
  const outputPath = path.resolve(__dirname, '..', paths.scanOutput || path.join('data', 'scan-results.json'));
  const services = scannerCfg.services || [];
  const allowDuplicates = scannerCfg.allowDuplicates !== undefined ? scannerCfg.allowDuplicates : true;

  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
  const devices = [];

  return new Promise((resolve, reject) => {
    noble.on('discover', peripheral => {
      devices.push({
        address: peripheral.address,
        name: peripheral.advertisement.localName || 'Unknown',
        rssi: peripheral.rssi,
        uuids: peripheral.advertisement.serviceUuids
      });
    });

    noble.on('stateChange', state => {
      if (state === 'poweredOn') {
        noble.startScanning(services, allowDuplicates);
        setTimeout(() => {
          noble.stopScanning();
          fs.promises
            .writeFile(outputPath, JSON.stringify(devices, null, 2))
            .then(resolve)
            .catch(reject);
        }, 5000);
      } else {
        noble.stopScanning();
        reject(new Error(`Bluetooth state: ${state}`));
      }
    });
  });
}

quickScan()
  .then(() => console.log('Scan complete'))
  .catch(err => {
    console.error('Scan failed:', err.message);
    process.exit(1);
  });


const { electron } = window;
const noble = electron.noble;
const { checkDeviceVulnerabilities } = require('./vulnerability-checker');
const logger = require('./logger');

const deviceListElement = document.getElementById('device-list');
const modal = document.getElementById('device-info-modal');
const modalContent = document.getElementById('device-info');
const closeModal = document.getElementById('close-modal');
const scanVulnerabilitiesButton = document.getElementById('scan-vulnerabilities');

let selectedDevice = null;

logger.debug('Initializing Bluetooth scanner...');
console.log('Initializing Bluetooth scanner...');

if (!noble) {
    console.error('Noble is not available');
}

noble.on('stateChange', state => {
    logger.debug(Bluetooth state changed to: ${state});
    console.log(Bluetooth state changed to: ${state});
    if (state === 'poweredOn') {
        logger.debug('Starting Bluetooth scanning...');
        console.log('Starting Bluetooth scanning...');
        noble.startScanning([], true);  // Enable duplicates
    } else {
        logger.debug('Stopping Bluetooth scanning...');
        console.log('Stopping Bluetooth scanning...');
        noble.stopScanning();
    }
});

noble.on('scanStart', () => {
    logger.debug('Scan started');
    console.log('Scan started');
    const scanningStatus = document.createElement('p');
    scanningStatus.id = 'scanning-status';
    scanningStatus.innerText = 'Scanning for devices...';
    document.body.appendChild(scanningStatus);
});

noble.on('scanStop', () => {
    logger.debug('Scan stopped');
    console.log('Scan stopped');
    const scanningStatus = document.getElementById('scanning-status');
    if (scanningStatus) {
        scanningStatus.innerText = 'Scan stopped.';
    }
});

noble.on('discover', peripheral => {
    logger.debug(Discovered device with address: ${peripheral.address});
    console.log(Discovered device with address: ${peripheral.address});
    const deviceItem = document.createElement('li');
    const deviceName = peripheral.advertisement.localName || 'Unknown';
    deviceItem.innerText = Device: ${deviceName}
    Address: ${peripheral.address};

    deviceItem.ondblclick = () => {
        logger.debug(`Device double-clicked: ${deviceName} (${peripheral.address})`);
        console.log(`Device double-clicked: ${deviceName} (${peripheral.address})`);
        selectedDevice = peripheral;
        modalContent.innerHTML = `
        <p>Name: ${deviceName}</p>
        <p>Address: ${peripheral.address}</p>
        <p>RSSI: ${peripheral.rssi}</p>
        <p>UUIDs: ${peripheral.advertisement.serviceUuids.join(', ')}</p>
    `;
        modal.style.display = 'block';
    };

    deviceListElement.appendChild(deviceItem);
});

closeModal.onclick = () => {
    logger.debug('Closing modal...');
    console.log('Closing modal...');
    modal.style.display = 'none';
};

window.onclick = event => {
    if (event.target === modal) {
        logger.debug('Window click detected, closing modal...');
        console.log('Window click detected, closing modal...');
        modal.style.display = 'none';
    }
};

scanVulnerabilitiesButton.onclick = async () => {
    if (!selectedDevice) {
        logger.debug('No device selected');
        console.log('No device selected');
        alert('No device selected');
        return;
    }

    logger.debug(`Scanning vulnerabilities for device: ${selectedDevice.advertisement.localName} (${selectedDevice.address})`);
    console.log(`Scanning vulnerabilities for device: ${selectedDevice.advertisement.localName} (${selectedDevice.address})`);

    try {
        const vulnerabilities = await checkDeviceVulnerabilities(selectedDevice.address);
        let vulnerabilityInfo = '';

        if (vulnerabilities.length > 0) {
            logger.debug(`Found ${vulnerabilities.length} vulnerabilities for device: ${selectedDevice.address}`);
            console.log(`Found ${vulnerabilities.length} vulnerabilities for device: ${selectedDevice.address}`);
            vulnerabilities.forEach(vul => {
                vulnerabilityInfo += `<p><strong>${vul.cve.CVE_data_meta.ID}</strong>: ${vul.cve.description.description_data[0].value}</p>`;
            });
        } else {
            logger.debug(`No vulnerabilities found for device: ${selectedDevice.address}`);
            console.log(`No vulnerabilities found for device: ${selectedDevice.address}`);
            vulnerabilityInfo = '<p>No known vulnerabilities found.</p>';
        }

        alert(`Vulnerability Scan Result:
${vulnerabilityInfo});
    } catch (error) {
        logger.error(Error scanning vulnerabilities: ${error.message});
        console.error(Error scanning vulnerabilities: ${error.message});
        alert(Error scanning vulnerabilities: ${error.message}`);
    }
};
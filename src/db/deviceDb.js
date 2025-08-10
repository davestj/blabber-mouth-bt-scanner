const fs = require('fs');
const path = require('path');

// Utility class for newline-delimited JSON device databases
class DeviceDb {
  constructor(filePath) {
    this.filePath = filePath;
    // Ensure the DB file exists
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, '');
    }
  }

  // Load all entries from the DB file
  async loadAll() {
    const data = await fs.promises.readFile(this.filePath, 'utf8');
    return data
      .split('\n')
      .filter(Boolean)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (err) {
          return null;
        }
      })
      .filter(Boolean);
  }

  // Find an entry by Bluetooth address
  async findByAddress(address) {
    const entries = await this.loadAll();
    return entries.find(entry => entry.address === address) || null;
  }

  // Find an entry by fingerprint
  async findByFingerprint(fingerprint) {
    const entries = await this.loadAll();
    return entries.find(entry => entry.fingerprint === fingerprint) || null;
  }

  // Append a new entry to the DB file
  async append(entry) {
    const line = `${JSON.stringify(entry)}\n`;
    await fs.promises.appendFile(this.filePath, line, 'utf8');
  }
}

module.exports = { DeviceDb };

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const zlib = require('zlib');
const cron = require('node-cron');

const DATA_DIR = path.join(__dirname, '..', 'data');
// Wireshark's "manuf" file mirrors the IEEE OUI list and is publicly available
const OUI_URL = 'https://www.wireshark.org/download/automated/data/manuf';
const CVE_URL = 'https://nvd.nist.gov/feeds/json/cve/1.1/nvdcve-1.1-recent.json.gz';
const OUI_DB = path.join(DATA_DIR, 'oui.db');
const CVE_DB = path.join(DATA_DIR, 'cve.db');
const CVE_GZ = path.join(DATA_DIR, 'nvdcve-recent.json.gz');

function fetch(url, binary = false) {
    return new Promise((resolve, reject) => {
        const args = ['-L', url];
        const options = { maxBuffer: 1024 * 1024 * 50, encoding: binary ? 'binary' : 'utf8' };
        execFile('curl', args, options, (err, stdout) => {
            if (err) return reject(err);
            resolve(binary ? Buffer.from(stdout, 'binary') : stdout);
        });
    });
}

async function mergeDb(file, items, key) {
    await fs.promises.mkdir(path.dirname(file), { recursive: true });
    const existing = new Set();
    if (fs.existsSync(file)) {
        const lines = await fs.promises.readFile(file, 'utf8');
        lines.split('\n').filter(Boolean).forEach(line => {
            try {
                const obj = JSON.parse(line);
                existing.add(obj[key]);
            } catch (err) {
                // ignore malformed lines
            }
        });
    }
    const toAppend = items
        .filter(item => !existing.has(item[key]))
        .map(item => JSON.stringify(item) + '\n');
    if (toAppend.length) {
        await fs.promises.appendFile(file, toAppend.join(''), 'utf8');
    }
    return toAppend.length;
}

async function updateOUI() {
    const data = await fetch(OUI_URL);
    const items = [];
    data.split('\n').forEach(line => {
        if (!line || line.startsWith('#')) return;
        const match = line.match(/^([0-9A-Fa-f:-]+)\s+\S+\s+(.+)$/);
        if (match) {
            items.push({ oui: match[1], organization: match[2].trim() });
        }
    });
    const added = await mergeDb(OUI_DB, items, 'oui');
    console.log(`OUI database updated, ${added} new entries`);
}

async function updateCVE() {
    const buffer = await fetch(CVE_URL, true);
    await fs.promises.mkdir(DATA_DIR, { recursive: true });
    await fs.promises.writeFile(CVE_GZ, buffer);
    const json = JSON.parse(zlib.gunzipSync(buffer).toString());
    const items = json.CVE_Items.map(item => ({
        id: item.cve.CVE_data_meta.ID,
        description: item.cve.description.description_data.map(d => d.value).join(' ')
    }));
    const added = await mergeDb(CVE_DB, items, 'id');
    console.log(`CVE database updated, ${added} new entries`);
}

async function updateAll() {
    await updateOUI();
    await updateCVE();
}

async function main() {
    await updateAll();
    if (process.argv.includes('--once')) return;
    cron.schedule('0 2 * * *', updateAll);
}

if (require.main === module) {
    main().catch(err => {
        console.error(`Update failed: ${err.message}`);
        process.exit(1);
    });
}

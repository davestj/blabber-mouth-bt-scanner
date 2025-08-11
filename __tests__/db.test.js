const fs = require('fs');
const os = require('os');
const path = require('path');
const { DeviceDb } = require('../src/db/deviceDb');

let mockConfig = {};
jest.mock('../config', () => ({ get: () => mockConfig }));

describe('DeviceDb', () => {
  test('appends and retrieves entries', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devdb-'));
    const dbPath = path.join(tempDir, 'db.json');
    const db = new DeviceDb(dbPath);

    expect(await db.loadAll()).toEqual([]);

    const entry = { address: 'AA', fingerprint: 'FP' };
    await db.append(entry);

    expect(await db.loadAll()).toEqual([entry]);
    expect(await db.findByAddress('AA')).toEqual(entry);
    expect(await db.findByFingerprint('FP')).toEqual(entry);

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});

describe('db index', () => {
  afterEach(() => {
    delete require.cache[require.resolve('../src/db')];
  });

  test('flags potential and rogue devices', async () => {
    const tempDir = fs.mkdtempSync(path.join(process.cwd(), 'dbindex-'));
    const safePath = path.join(tempDir, 'safe.db');
    const potPath = path.join(tempDir, 'potential.db');
    const roguePath = path.join(tempDir, 'rogue.db');

    mockConfig = {
      paths: {
        safeDb: path.relative(process.cwd(), safePath),
        potentialDb: path.relative(process.cwd(), potPath),
        rogueDb: path.relative(process.cwd(), roguePath)
      }
    };
    const db = require('../src/db');
    const device = { address: '00', fingerprint: 'fp' };
    await db.flagAsPotential(device);
    await db.flagAsRogue(device);

    const potContent = fs.readFileSync(potPath, 'utf8').trim();
    const rogueContent = fs.readFileSync(roguePath, 'utf8').trim();
    expect(potContent).toBe(JSON.stringify(device));
    expect(rogueContent).toBe(JSON.stringify(device));

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});

const path = require('path');
const { DeviceDb } = require('./deviceDb');

const ROOT = path.resolve(__dirname, '..', '..');

const safeDb = new DeviceDb(path.join(ROOT, 'known.safe.devices.db'));
const potentialRogueDb = new DeviceDb(path.join(ROOT, 'potential.rogue_devices.db'));
const knownRogueDb = new DeviceDb(path.join(ROOT, 'known.rogue.devices.db'));

async function flagAsPotential(device) {
  await potentialRogueDb.append(device);
}

async function flagAsRogue(device) {
  await knownRogueDb.append(device);
}

module.exports = {
  safeDb,
  potentialRogueDb,
  knownRogueDb,
  flagAsPotential,
  flagAsRogue
};

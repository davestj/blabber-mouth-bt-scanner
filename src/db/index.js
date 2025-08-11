const path = require('path');
const { DeviceDb } = require('./deviceDb');
const { get } = require('../../config');

const ROOT = path.resolve(__dirname, '..', '..');
const paths = (get().paths) || {};

const safeDb = new DeviceDb(path.join(ROOT, paths.safeDb || 'known.safe.devices.db'));
const potentialRogueDb = new DeviceDb(path.join(ROOT, paths.potentialDb || 'potential.rogue_devices.db'));
const knownRogueDb = new DeviceDb(path.join(ROOT, paths.rogueDb || 'known.rogue.devices.db'));

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


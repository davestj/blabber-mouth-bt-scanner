const fs = require('fs');
const path = require('path');
const { get } = require('../config');

function remove(target) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

(function run() {
  const cfg = get().paths || {};
  const root = path.resolve(__dirname, '..');

  const logDir = path.resolve(root, cfg.logDir || 'log');
  const buildDir = path.resolve(root, cfg.buildDir || 'dist');
  const tempDbs = [cfg.safeDb, cfg.potentialDb, cfg.rogueDb]
    .filter(Boolean)
    .map(p => path.resolve(root, p));

  remove(logDir);
  remove(buildDir);
  tempDbs.forEach(remove);
})();


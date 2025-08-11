const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

let config = {};

function loadConfig(configPath) {
  const filePath = configPath || path.join(__dirname, 'config.yaml');
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    config = yaml.load(fileContents) || {};
  } catch (err) {
    console.error(`Failed to load config from ${filePath}: ${err.message}`);
    config = {};
  }
  return config;
}

loadConfig();

module.exports = {
  get: () => config,
  reload: loadConfig
};

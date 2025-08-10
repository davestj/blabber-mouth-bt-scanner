const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { get } = require('./config');

const SALT_ROUNDS = 10;

function getStorePath() {
  const config = get() || {};
  const relativePath = config.userAuth && config.userAuth.credentialsPath ? config.userAuth.credentialsPath : './data/credentials.json';
  return path.isAbsolute(relativePath) ? relativePath : path.join(__dirname, relativePath);
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadStore() {
  const filePath = getStorePath();
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

function saveStore(store) {
  const filePath = getStorePath();
  ensureDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2));
}

function saveCredentials(username, password) {
  const store = loadStore();
  const hash = bcrypt.hashSync(password, SALT_ROUNDS);
  store[username] = hash;
  saveStore(store);
}

function verifyCredentials(username, password) {
  const store = loadStore();
  const hash = store[username];
  if (!hash) return false;
  return bcrypt.compareSync(password, hash);
}

module.exports = {
  saveCredentials,
  verifyCredentials
};

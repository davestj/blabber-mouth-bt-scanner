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
  let store;
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    store = JSON.parse(data);
  } catch (err) {
    store = {};
  }
  return seedStoreIfNeeded(store);
}

function saveStore(store) {
  const filePath = getStorePath();
  ensureDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2));
}

function seedStoreIfNeeded(store) {
  if (Object.keys(store).length > 0) return store;
  const config = get() || {};
  const auth = config.userAuth || {};
  let username;
  let password;

  if (auth.defaultUser && auth.defaultPassword) {
    username = auth.defaultUser;
    password = auth.defaultPassword;
  } else if (auth.credentialSeedFile) {
    const seedPath = path.isAbsolute(auth.credentialSeedFile)
      ? auth.credentialSeedFile
      : path.join(__dirname, auth.credentialSeedFile);
    try {
      const seed = fs.readFileSync(seedPath, 'utf8').trim();
      [username, password] = seed.split(':');
    } catch (err) {
      // ignore missing seed file
    }
  }

  if (username && password) {
    const hash = bcrypt.hashSync(password, SALT_ROUNDS);
    store[username] = hash;
    saveStore(store);
  }

  return store;
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

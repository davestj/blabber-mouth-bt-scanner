const crypto = require('crypto');
const { verifyCredentials } = require('./credentials');

const sessions = {};
const SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes

function login(username, password) {
  if (!verifyCredentials(username, password)) return null;
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  sessions[token] = { username, expiresAt };
  return token;
}

function logout(token) {
  delete sessions[token];
}

function validate(token) {
  const session = sessions[token];
  if (!session) return false;
  if (session.expiresAt < Date.now()) {
    delete sessions[token];
    return false;
  }
  return true;
}

module.exports = { login, logout, validate, SESSION_TTL_MS };

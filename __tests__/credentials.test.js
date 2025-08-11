const fs = require('fs');
const os = require('os');
const path = require('path');
const config = require('../config');

jest.mock('bcrypt', () => ({
  hashSync: pw => `hashed-${pw}`,
  compareSync: (pw, hash) => hash === `hashed-${pw}`
}));

const { saveCredentials, verifyCredentials } = require('../credentials');

describe('credentials module', () => {
  const defaultPath = path.join(__dirname, '..', 'config.yaml');

  afterEach(() => {
    config.reload(defaultPath);
  });

  test('saves and verifies credentials', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cred-'));
    const credPath = path.join(tempDir, 'creds.json');
    const yamlPath = path.join(tempDir, 'config.yaml');
    fs.writeFileSync(yamlPath, `userAuth:\n  credentialsPath: ${credPath}\n`);
    config.reload(yamlPath);

    saveCredentials('alice', 'secret');
    expect(verifyCredentials('alice', 'secret')).toBe(true);
    expect(verifyCredentials('alice', 'wrong')).toBe(false);

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('seeds default credentials when empty', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seed-'));
    const credPath = path.join(tempDir, 'creds.json');
    const yamlPath = path.join(tempDir, 'config.yaml');
    fs.writeFileSync(
      yamlPath,
      `userAuth:\n  credentialsPath: ${credPath}\n  defaultUser: admin\n  defaultPassword: pass\n`
    );
    config.reload(yamlPath);

    expect(verifyCredentials('admin', 'pass')).toBe(true);
    expect(fs.existsSync(credPath)).toBe(true);

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});

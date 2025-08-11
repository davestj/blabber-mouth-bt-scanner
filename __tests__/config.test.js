const fs = require('fs');
const os = require('os');
const path = require('path');
const config = require('../config');

describe('config module', () => {
  const defaultPath = path.join(__dirname, '..', 'config.yaml');

  afterEach(() => {
    config.reload(defaultPath);
  });

  test('loads default configuration', () => {
    const cfg = config.get();
    expect(cfg).toHaveProperty('scanner');
  });

  test('reloads from a given path', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cfg-'));
    const tempPath = path.join(tempDir, 'config.yaml');
    fs.writeFileSync(tempPath, 'foo: bar\n');

    config.reload(tempPath);
    expect(config.get()).toEqual({ foo: 'bar' });

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('returns empty object when file missing', () => {
    config.reload('/non/existent/path.yaml');
    expect(config.get()).toEqual({});
  });
});

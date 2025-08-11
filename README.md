![Build](https://img.shields.io/github/actions/workflow/status/davestj/blabber-mouth-bt-scanner/dev.yml?branch=main&label=build)
![Release](https://img.shields.io/github/v/release/davestj/blabber-mouth-bt-scanner)
![License](https://img.shields.io/github/license/davestj/blabber-mouth-bt-scanner)
![Language](https://img.shields.io/github/languages/top/davestj/blabber-mouth-bt-scanner)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-blue)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

**Author:** David Andrew St John<br>
**Version:** 1.0.0<br>
**Last Updated:** August 11, 2025<br>
**Repository:** [blabber-mouth-bt-scanner](https://github.com/davestj/blabber-mouth-bt-scanner)

# Blabber Mouth BT Scanner

Blabber Mouth BT Scanner is an Electron-based desktop application that scans for nearby Bluetooth devices and highlights potential security issues.  It combines the [`@abandonware/noble`](https://github.com/abandonware/noble) Bluetooth library with a simple vulnerability feed to help developers and researchers inspect their environment.

## Features
- Discover nearby Bluetooth devices and display name, address, RSSI and advertised UUIDs.
- Parse a local [NVD](https://nvd.nist.gov/) feed to flag known vulnerable device identifiers.
- Enrich device data with vendor information from the public IEEE OUI list (via [Wireshark's manuf](https://www.wireshark.org/download/automated/data/manuf)).
- Structured logging to both the console and an `output.log` file.
- Cross‑platform Electron UI with a React-based renderer.

## Getting Started
See [INSTALL.md](INSTALL.md) for platform prerequisites, dependency installation and launch instructions.  The project uses semantic versioning; release history and guidelines live in [CHANGELOG.md](CHANGELOG.md).

Before launching the application, ensure the credential store contains at least one user. You can seed it in one of several ways:

1. Run `node scripts/add-user.js` to interactively create a user.
2. Set `userAuth.defaultUser` and `userAuth.defaultPassword` in `config.yaml`.
3. Point `userAuth.credentialSeedFile` at a file containing `username:password`.

On first launch, the app hashes and stores the credentials if the store is empty. `data/credentials.json` and any seed files (e.g., `data/credential.seed`) are ignored by Git; keep them out of version control.

## Usage
Once dependencies are installed you can start the app with:

```bash
npm start
```

The application will open a window and begin scanning for Bluetooth devices.  Press `Ctrl+C` in the terminal to stop scanning when running scripts directly.


## Configuration

All application settings live in `config.yaml`. The table below lists each field,
its default value and an example override.

| Field | Default | Example |
| --- | --- | --- |
| `scanner.services` | `[]` | `["180d", "180f"]` |
| `scanner.allowDuplicates` | `true` | `false` |
| `aiProvider.name` | `openai` | `ollama` |
| `aiProvider.apiKey` | `YOUR_API_KEY` | `sk-123abc` |
| `aiProvider.endpoint` | `http://localhost:11434/api/generate` | `https://api.openai.com/v1/completions` |
| `aiProvider.model` | `gpt-4o-mini` | `llama3` |
| `userAuth.credentialsPath` | `./data/credentials.json` | `./data/creds.json` |
| `userAuth.defaultUser` | `""` | `admin` |
| `userAuth.defaultPassword` | `""` | `secret` |
| `userAuth.credentialSeedFile` | `""` | `./data/credential.seed` |
| `paths.logDir` | `./log` | `./logs` |
| `paths.safeDb` | `./known.safe.devices.db` | `./data/safe.db` |
| `paths.potentialDb` | `./potential.rogue_devices.db` | `./data/potential.db` |
| `paths.rogueDb` | `./known.rogue.devices.db` | `./data/rogue.db` |
| `paths.buildDir` | `./dist` | `./build` |
| `paths.scanOutput` | `./data/scan-results.json` | `./out/scan.json` |

## Helper Scripts

The project ships several utility scripts under `scripts/` (plus one in the
root). Run them with `node`:

- `node scripts/add-user.js` – interactively store a username and password in
  the credential store.
- `node scripts/scan.js` – perform a headless Bluetooth scan and write results
  to the file from `paths.scanOutput`.
- `node scripts/update-datasets.js --once` – fetch the latest IEEE OUI and NVD
  CVE data, merging new entries into the local `data/` databases.
- `node scripts/clean.js` – remove logs, temporary databases and the build
  directory using paths from `config.yaml`.
- `node export-logs.js aggregated.json` – gather JSON logs from `data/` and
  write them to `aggregated.json` (omit the filename to print to stdout).

## Optional Features

### AI Summaries

Scan results can be sent to an AI model for summarization or anomaly analysis.
The feature remains inactive until a supported provider is configured in
`config.yaml`.

```yaml
aiProvider:
  name: ollama        # or 'openai'
  model: llama3       # model name for the provider
  endpoint: http://localhost:11434/api/generate  # Ollama example
  apiKey: YOUR_API_KEY # required for OpenAI
```

With a provider configured you can send data using the helper module:

```javascript
const { sendScanSummary, sendAnomaly } = require('./ai-helper');
await sendScanSummary('5 devices detected with no vulnerabilities.');
```

To opt out, remove the `aiProvider` block or leave `name` empty.

### Rootkit Detection

The `rootkit-checker.js` module wraps the `chkrootkit` utility to scan the host
for known rootkits:

```bash
node -e "require('./rootkit-checker').runRootkitCheck().then(console.log)"
```

### File Integrity Checks

Generate a hash baseline and check for unexpected changes using
`file-integrity.js`:

```bash
# create baseline
node -e "require('./file-integrity').createBaseline(__dirname)"
# later verify files
node -e "require('./file-integrity').checkIntegrity(__dirname)"
```

### Log Export

Combine individual JSON logs under `data/` into a single file or print them to
stdout:

```bash
node export-logs.js all-logs.json
```

## Release Workflow

This project uses manual versioning that follows [Semantic Versioning](https://semver.org/).

1. For every change merged into the `master` or `future` branches, add an entry to [CHANGELOG.md](CHANGELOG.md) under **Unreleased**.
2. When cutting a release:
   - Update the version number in `package.json` (and any other manifests such as `Info.plist`) using `npm version <major|minor|patch>`.
   - Move the accumulated notes from **Unreleased** to a new versioned section in the changelog and include the release date.
   - Commit the changes with a message like `chore(release): vX.Y.Z` and create a matching Git tag.
3. Push the commit and tag to publish the release.

## Contributing
Contributions are welcome!  Please follow the guidelines in `CHANGELOG.md` and use pull requests for all changes.

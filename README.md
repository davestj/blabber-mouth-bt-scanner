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

## Scripts

- `npm run scan` – perform a headless Bluetooth scan and write the results to the JSON file defined in `config.yaml`.
- `npm run clean` – remove logs, temporary databases and build artifacts using paths from `config.yaml`.
- `npm test` – placeholder for future test coverage.
- `npm run update-data` – fetch the [Wireshark manuf](https://www.wireshark.org/download/automated/data/manuf) (IEEE OUI) list and the NVD [CVE](https://nvd.nist.gov/) feed, merging fresh entries into flat files under `data/`.

Paths for logs, databases and scan output can be adjusted in `config.yaml` under the `paths` section.

## AI Summaries (Optional)

Scan results can optionally be sent to an AI model for summarization or
anomaly analysis. The feature is opt-in and remains inactive until a
supported provider is configured in `config.yaml`.

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

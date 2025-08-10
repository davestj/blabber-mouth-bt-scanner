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

## Contributing
Contributions are welcome!  Please follow the guidelines in `CHANGELOG.md` and use pull requests for all changes.

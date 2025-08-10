# Blabber Mouth BT Scanner

Blabber Mouth BT Scanner is an Electron-based desktop application that scans for nearby Bluetooth devices and highlights potential security issues.  It combines the [`@abandonware/noble`](https://github.com/abandonware/noble) Bluetooth library with a simple vulnerability feed to help developers and researchers inspect their environment.

## Features
- Discover nearby Bluetooth devices and display name, address, RSSI and advertised UUIDs.
- Parse a local [NVD](https://nvd.nist.gov/) feed to flag known vulnerable device identifiers.
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

## Contributing
Contributions are welcome!  Please follow the guidelines in `CHANGELOG.md` and use pull requests for all changes.

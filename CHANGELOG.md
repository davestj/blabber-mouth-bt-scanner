# Changelog

All notable changes to this project will be documented in this file. The format follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [2.0.0] - 2025-08-11

### Added
- **Military-Grade UI Overhaul**
  - Tactical authentication screen with BTHL branding
  - Radar-based scanner visualization with sweep animation
  - Real-time signal waveform display
  - Device threat level indicators with color coding
  - Modal device intelligence reports with full details
  - Monitoring tab for suspicious device tracking
  - Security scan tab with rootkit detection

- **GPS & Location Services**
  - GPS coordinate calculation from Bluetooth signals
  - Signal triangulation for X,Y positioning
  - Base location configuration (Renton, WA default)
  - Real-time position tracking in device modals

- **Threat Detection System**
  - AI-powered threat assessment (HIGH/MEDIUM/LOW)
  - Suspicious pattern recognition (spy cams, hidden devices)
  - RSSI variance tracking for movement detection
  - Automated device flagging with operator tracking
  - Device type identification with threat icons

- **Database Integration**
  - SQLite backend for persistent device storage
  - Device history tracking with timestamps
  - Vulnerability database integration
  - Flagged device profiles with monitoring alerts
  - Statistics dashboard for threat overview

- **Security Features**
  - Integrated rootkit scanning capability
  - File integrity monitoring system
  - Process threat detection
  - Network vulnerability scanning
  - Full security scan with detailed reports

- **Enhanced Measurements**
  - Dual measurement system (Metric & Imperial)
  - Distance display in meters/feet/yards
  - Signal strength variance calculation
  - Triangulation accuracy indicators

- **Platform Improvements**
  - OS detection in preload (macOS/Linux/Windows)
  - Cross-platform compatibility verification
  - Raspberry Pi deployment support
  - ARM64 optimization for Apple Silicon

### Changed
- Replaced Material-UI with custom military-themed components
- Updated authentication flow with IPC integration
- Refactored Bluetooth scanner to accumulate devices
- Enhanced device list with live polling (500ms intervals)
- Improved threat detection algorithms
- Upgraded to Electron 31.7.7

### Fixed
- Device list now properly accumulates all discovered devices
- Authentication system properly uses bthlAPI namespace
- Modal updates with live data during scanning
- Distance calculations now use proper path loss formula
- RSSI history tracking for movement detection

### Security
- Implemented bcrypt credential hashing
- Added session token expiration (15 minutes)
- Encrypted database storage for sensitive data
- Rootkit detection integration
- File integrity baseline monitoring

## [1.0.0] - 2025-08-10

### Added
- Initial release with Bluetooth scanning
- Vulnerability checking
- Structured logging
- Basic Electron UI
- React-based renderer
- Noble Bluetooth library integration

### Changelog Guidelines
- Group entries under **Added**, **Changed**, **Deprecated**, **Removed**, **Fixed** or **Security** headers
- Include release date in ISO format: `YYYY-MM-DD`
- Increment versions according to [Semantic Versioning](https://semver.org/)

# 🛡️ BTHL Blabber Mouth BT Scanner

![Build](https://img.shields.io/github/actions/workflow/status/davestj/blabber-mouth-bt-scanner/dev.yml?branch=main&label=build)
![Release](https://img.shields.io/github/v/release/davestj/blabber-mouth-bt-scanner)
![License](https://img.shields.io/github/license/davestj/blabber-mouth-bt-scanner)
![Language](https://img.shields.io/github/languages/top/davestj/blabber-mouth-bt-scanner)
![Platform](https://img.shields.io/badge/platform-macOS%20ARM64%20%7C%20Linux%20%7C%20Windows%20%7C%20Raspberry%20Pi-blue)
![Version](https://img.shields.io/badge/version-2.0.0-blue)

![GitHub stars](https://img.shields.io/github/stars/davestj/blabber-mouth-bt-scanner?style=social)
![GitHub forks](https://img.shields.io/github/forks/davestj/blabber-mouth-bt-scanner?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/davestj/blabber-mouth-bt-scanner?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/davestj/blabber-mouth-bt-scanner)
![GitHub issues](https://img.shields.io/github/issues/davestj/blabber-mouth-bt-scanner)
![GitHub pull requests](https://img.shields.io/github/issues-pr/davestj/blabber-mouth-bt-scanner)

## 🎯 Military-Grade Bluetooth Threat Detection System

**Beyond The Horizon Labs (BTHL)** presents a tactical-grade Bluetooth security scanner designed for threat detection, device monitoring, and anomaly analysis. Built for deployment in high-security environments including Skinwalker Ranch-type investigations.

**Author:** David Andrew St John  
**Version:** 2.0.0  
**Last Updated:** August 11, 2025  
**Repository:** [blabber-mouth-bt-scanner](https://github.com/davestj/blabber-mouth-bt-scanner)

## 🚀 Key Features

### 🔍 Advanced Bluetooth Scanning
- **Real-time device discovery** with live RSSI monitoring
- **Distance triangulation** using RF signal strength algorithms
- **GPS coordinate calculation** from Bluetooth signal positioning
- **Dual measurement system** (Metric & Imperial: meters/feet/yards)
- **Device type identification** with threat-level icons
- **RSSI variance tracking** for movement detection

### 🎯 Threat Detection & Analysis
- **AI-powered threat assessment** (HIGH/MEDIUM/LOW)
- **Suspicious device pattern recognition** (spy cams, hidden devices)
- **Signal anomaly detection** for rogue devices
- **Automated flagging system** with operator tracking
- **Device profiling & monitoring** for continuous surveillance

### 🛡️ Security Features
- **Rootkit scanning** integration
- **File integrity monitoring**
- **Process threat detection**
- **Network vulnerability scanning**
- **SQLite database** for persistent threat tracking
- **Encrypted credential storage** with bcrypt

### 🎨 Military-Grade UI
- **Tactical radar visualization** with real-time sweep animation
- **Device signal waveform display**
- **Threat-level color coding** (RED/ORANGE/GREEN)
- **Live device tracking dashboard**
- **Modal device intelligence reports**
- **Monitoring & Security scan tabs**

### 📍 Location Services
- **GPS integration** for device geolocation
- **Signal triangulation** for position mapping
- **X,Y coordinate tracking** from RSSI history
- **Base location configuration** (defaults to Renton, WA)

## 💻 System Requirements

- **Node.js** 18.0.0+ 
- **npm** 8.0.0+
- **Electron** 31.7.7
- **Bluetooth adapter** compatible with Noble

### Supported Platforms
- ✅ macOS (ARM64/Intel)
- ✅ Linux/Debian 12+
- ✅ Ubuntu 22.04/24.04
- ✅ Windows 10/11
- ✅ Raspberry Pi 4+ (ARM)

## 🔧 Installation

```bash
# Clone repository
git clone https://github.com/davestj/blabber-mouth-bt-scanner
cd blabber-mouth-bt-scanner

# Install dependencies
npm install

# Initialize database
npm run db:init

# Create user credentials
npm run add-user

# Start application
npm run dev
```

## 🎮 Usage

### Authentication
Default credentials configured in `config.yaml`:
```yaml
userAuth:
  defaultUser: "dstjohn"
  defaultPassword: "#!5243wrvNN"
```

### Scanner Operations
1. **START SCAN** - Initiates Bluetooth discovery
2. **Device List** - Click any device for detailed intelligence report
3. **Flag Device** - Mark suspicious devices for monitoring
4. **Export Data** - Generate JSON reports with timestamp

### Security Scanning
- Click **SECURITY** tab (left side)
- Run full scan or targeted rootkit detection
- View file integrity and process analysis

### Monitoring
- Click **MONITORING** tab (right side)  
- Track flagged devices continuously
- Real-time RSSI and location updates

## 📊 Configuration

Key settings in `config.yaml`:

```yaml
scanner:
  services: []              # BT service UUIDs to filter
  allowDuplicates: true     # Track all advertisements

paths:
  logDir: ./log
  safeDb: ./known.safe.devices.db
  rogueDb: ./known.rogue.devices.db

aiProvider:
  name: openai              # or 'ollama'
  model: gpt-4o-mini
  apiKey: YOUR_API_KEY
```

## 🛠️ Development Scripts

```bash
npm run dev              # Start in development mode
npm run build           # Production build
npm run clean:all       # Full cleanup
npm run db:stats        # Database statistics
npm run scan:headless   # CLI scanning mode
npm run rootkit:check   # Security scan
npm run integrity:check # File integrity verification
npm run export-logs     # Aggregate JSON logs
```

## 📚 Architecture

```
├── main.js              # Main Electron process + Bluetooth
├── preload.js          # IPC bridge with OS detection
├── database.js         # SQLite device persistence
├── auth.html           # Military-grade login screen
├── dashboard.html      # Tactical operations interface
├── renderer.js         # React-based UI components
└── bluetooth-scanner.js # Noble BT integration
```

## 🔒 Security Considerations

- Credential store (`data/credentials.json`) excluded from Git
- All passwords hashed with bcrypt (10 rounds)
- Session tokens expire after 15 minutes
- File integrity baseline on first launch
- Rootkit detection via chkrootkit wrapper

## 🚁 Field Deployment

Optimized for high-security locations:
- Government facilities
- Research installations  
- Paranormal investigation sites (Skinwalker Ranch)
- Corporate security audits
- Counter-surveillance operations

## 📈 Project Stats

- **2000+ lines** of military-grade code
- **15+ security features** implemented
- **Real-time threat detection** algorithms
- **Cross-platform** compatibility
- **SQLite persistence** for device tracking

## 🤝 Contributing

See [CHANGELOG.md](CHANGELOG.md) for development history. PRs welcome following semantic versioning.

## 📜 License

ISC License - See [LICENSE](LICENSE) file

---

**BEYOND THE HORIZON LABS** - *Tactical Security Solutions*

![BTHL Logo](https://img.shields.io/badge/BTHL-CLASSIFIED-red)

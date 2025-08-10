# Installation

These instructions describe how to set up Blabber Mouth BT Scanner on common platforms.  The application requires [Node.js](https://nodejs.org/) and a Bluetooth adapter supported by [`@abandonware/noble`](https://github.com/abandonware/noble).

## macOS
1. Install Xcode Command Line Tools:
   ```bash
   xcode-select --install
   ```
2. Install Node.js (via [Homebrew](https://brew.sh/) or the official installer).
3. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
4. Launch the application:
   ```bash
   npm start
   ```

## Linux (Ubuntu/Debian)
1. Install system packages:
   ```bash
   sudo apt-get update
   sudo apt-get install -y bluetooth bluez libbluetooth-dev libudev-dev
   ```
2. Install Node.js from your package manager or from NodeSource.
3. Install dependencies and run:
   ```bash
   npm install
   npm start
   ```

## Windows
1. Install [Node.js](https://nodejs.org/) and ensure `node` and `npm` are in your `PATH`.
2. Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) for native module compilation.
3. From the project directory run:
   ```bash
   npm install
   npm start
   ```

## Build Script
The `build` script defined in `package.json` simply runs `npm install` and is provided for compatibility with some deployment setups:
```bash
npm run build
```

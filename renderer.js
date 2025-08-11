const React = require('react');
const ReactDOM = require('react-dom/client');
const { useState, useEffect } = React;
const {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Container,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  SvgIcon,
  TextField
} = require('@mui/material');
const { FontAwesomeIcon } = require('@fortawesome/react-fontawesome');
const { faSun, faMoon } = require('@fortawesome/free-solid-svg-icons');

const noble = (window.electron && window.electron.noble) || require('@abandonware/noble');
const { ipcRenderer } = (window.electron) || require('electron');
const { checkDeviceVulnerabilities } = require('./vulnerability-checker');
const session = require('./session');
const fs = require('fs');
const path = require('path');
const { get: getConfig } = require('./config');

function credentialStoreExists() {
  const config = getConfig() || {};
  const rel = config.userAuth && config.userAuth.credentialsPath ? config.userAuth.credentialsPath : './data/credentials.json';
  const filePath = path.isAbsolute(rel) ? rel : path.join(__dirname, rel);
  return fs.existsSync(filePath);
}

function BluetoothIcon(props) {
  return (
    React.createElement(SvgIcon, props,
      React.createElement('path', { d: 'M12 2v7.09L8.53 5.62 7.1 7.05 12 12l-4.9 4.95 1.43 1.43L12 14.91V22l6-6-4.27-4.27L18 6l-6-4z' })
    )
  );
}

function Login({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    const token = session.login(username, password);
    if (token) {
      onSuccess(token);
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    React.createElement(Container, { maxWidth: 'sm', sx: { mt: 8 } },
      React.createElement(Box, { component: 'form', onSubmit: handleSubmit },
        React.createElement(Typography, { variant: 'h5', sx: { mb: 2 } }, 'Login'),
        React.createElement(TextField, {
          label: 'Username',
          fullWidth: true,
          margin: 'normal',
          value: username,
          onChange: e => setUsername(e.target.value)
        }),
        React.createElement(TextField, {
          label: 'Password',
          type: 'password',
          fullWidth: true,
          margin: 'normal',
          value: password,
          onChange: e => setPassword(e.target.value)
        }),
        error && React.createElement(Typography, { color: 'error' }, error),
        React.createElement(Button, { type: 'submit', variant: 'contained', fullWidth: true, sx: { mt: 2 } }, 'Login')
      )
    )
  );
}

function ScannerApp({ onLogout }) {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [scanningStatus, setScanningStatus] = useState('');
  const [themeMode, setThemeMode] = useState('light');
  const [rootkitResult, setRootkitResult] = useState('');
  const [integrityResult, setIntegrityResult] = useState('');

  useEffect(() => {
    if (!noble) {
      console.error('Noble is not available');
      return;
    }
    noble.on('stateChange', state => {
      if (state === 'poweredOn') {
        noble.startScanning([], true);
      } else {
        noble.stopScanning();
      }
    });
    noble.on('scanStart', () => {
      setScanningStatus('Scanning for devices...');
    });
    noble.on('scanStop', () => {
      setScanningStatus('Scan stopped.');
    });
    noble.on('discover', peripheral => {
      setDevices(prev => {
        if (prev.find(d => d.address === peripheral.address)) return prev;
        return [...prev, peripheral];
      });
    });
  }, []);

  const handleDeviceClick = device => {
    setSelectedDevice(device);
    setModalOpen(true);
  };

  const handleScanVulnerabilities = async () => {
    if (!selectedDevice) return;
    try {
      const vulnerabilities = await checkDeviceVulnerabilities(selectedDevice.address);
      if (vulnerabilities.length > 0) {
        alert(`Found ${vulnerabilities.length} vulnerabilities`);
      } else {
        alert('No known vulnerabilities found.');
      }
    } catch (err) {
      alert(`Error scanning vulnerabilities: ${err.message}`);
    }
  };

  const handleRunSecurityChecks = async () => {
    const result = await ipcRenderer.invoke('run-security-checks');
    setRootkitResult(result.rootkit.status === 'ok'
      ? 'Rootkit check passed'
      : result.rootkit.output);
    setIntegrityResult((result.integrity.changed && result.integrity.changed.length === 0)
      ? 'No file changes detected'
      : `Changed files: ${result.integrity.changed.join(', ')}`);
  };

  const theme = createTheme({ palette: { mode: themeMode } });

  return (
    React.createElement(ThemeProvider, { theme },
      React.createElement(CssBaseline, null),
      React.createElement(AppBar, { position: 'static' },
        React.createElement(Toolbar, null,
          React.createElement(BluetoothIcon, { sx: { mr: 2 } }),
          React.createElement(Typography, { variant: 'h6', sx: { flexGrow: 1 } }, 'Blabber-Mouth BT Scanner'),
          React.createElement(Button, { color: 'inherit', onClick: onLogout }, 'Logout'),
          React.createElement(IconButton, {
            color: 'inherit',
            'aria-label': 'toggle dark mode',
            onClick: () => setThemeMode(prev => prev === 'light' ? 'dark' : 'light')
          },
            React.createElement(FontAwesomeIcon, { icon: themeMode === 'light' ? faMoon : faSun })
          )
        )
      ),
      React.createElement(Container, { sx: { py: 2 } },
        React.createElement(Typography, { variant: 'body1', 'aria-live': 'polite' }, scanningStatus),
        React.createElement(List, null,
          devices.map(device =>
            React.createElement(ListItem, {
              key: device.address,
              button: true,
              onClick: () => handleDeviceClick(device)
            },
              React.createElement(ListItemText, {
                primary: device.advertisement.localName || 'Unknown',
                secondary: device.address
              })
            )
          )
        ),
        React.createElement(Box, { sx: { mt: 2 } },
          React.createElement(Button, {
            variant: 'contained',
            onClick: handleRunSecurityChecks,
            'aria-label': 'Run security checks'
          }, 'Run Security Checks'),
          React.createElement(Typography, { variant: 'body2' }, rootkitResult),
          React.createElement(Typography, { variant: 'body2' }, integrityResult)
        )
      ),
      React.createElement(Dialog, {
        open: modalOpen,
        onClose: () => setModalOpen(false),
        'aria-labelledby': 'device-info-title'
      },
        React.createElement(DialogTitle, { id: 'device-info-title' }, 'Device Information'),
        React.createElement(DialogContent, { dividers: true },
          selectedDevice && React.createElement(React.Fragment, null,
            React.createElement(Typography, null, `Name: ${selectedDevice.advertisement.localName || 'Unknown'}`),
            React.createElement(Typography, null, `Address: ${selectedDevice.address}`),
            React.createElement(Typography, null, `RSSI: ${selectedDevice.rssi}`),
            React.createElement(Typography, null, `UUIDs: ${selectedDevice.advertisement.serviceUuids.join(', ')}`)
          )
        ),
        React.createElement(DialogActions, null,
          React.createElement(Button, { onClick: handleScanVulnerabilities }, 'Scan for Vulnerabilities'),
          React.createElement(Button, { onClick: () => setModalOpen(false) }, 'Close')
        )
      )
    )
  );
}

function Root() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      if (!session.validate(token)) {
        setToken(null);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [token]);

  if (!credentialStoreExists()) {
    return React.createElement(Container, { maxWidth: 'sm', sx: { mt: 8 } },
      React.createElement(Typography, { variant: 'h6', sx: { mb: 2 } }, 'Credential store not found'),
      React.createElement(Typography, null, 'Run "node scripts/add-user.js" to create one.')
    );
  }

  if (!token) {
    return React.createElement(Login, { onSuccess: setToken });
  }
  return React.createElement(ScannerApp, { onLogout: () => { session.logout(token); setToken(null); } });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(Root));


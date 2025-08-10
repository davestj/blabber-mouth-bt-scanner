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
  SvgIcon
} = require('@mui/material');
const { FontAwesomeIcon } = require('@fortawesome/react-fontawesome');
const { faSun, faMoon } = require('@fortawesome/free-solid-svg-icons');

const noble = (window.electron && window.electron.noble) || require('@abandonware/noble');
const { ipcRenderer } = (window.electron) || require('electron');
const { checkDeviceVulnerabilities } = require('./vulnerability-checker');

function BluetoothIcon(props) {
  return (
    React.createElement(SvgIcon, props,
      React.createElement('path', { d: 'M12 2v7.09L8.53 5.62 7.1 7.05 12 12l-4.9 4.95 1.43 1.43L12 14.91V22l6-6-4.27-4.27L18 6l-6-4z' })
    )
  );
}

function App() {
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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));


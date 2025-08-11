/*
 * File: components/BTHLComponents.jsx
 * Author: David St John
 * Date: 2025-08-10
 * Purpose: Military-grade UI component library for BTHL Scanner
 * Project: Beyond The Horizon Labs - Tactical UI System
 */

import React, { useState, useEffect, useRef } from 'react';

// We'll use inline styles to ensure everything works in the Electron environment
const styles = {
  // Base theme colors
  colors: {
    primaryDark: '#0a0e1a',
    secondaryDark: '#141922',
    panelDark: '#1a1f2e',
    electricBlue: '#00d4ff',
    tacticalBlue: '#0099cc',
    warningRed: '#ff3333',
    alertOrange: '#ff9933',
    successGreen: '#00ff41',
    metalSilver: '#c0c0c0',
    brassGold: '#d4af37'
  }
};

// Tactical Button Component
export const TacticalButton = ({ children, onClick, variant = 'primary', disabled = false, loading = false, icon, size = 'medium' }) => {
  const [hover, setHover] = useState(false);
  
  const sizeStyles = {
    small: { padding: '8px 16px', fontSize: '11px' },
    medium: { padding: '12px 24px', fontSize: '13px' },
    large: { padding: '16px 32px', fontSize: '15px' }
  };
  
  const variantStyles = {
    primary: {
      background: `linear-gradient(135deg, ${styles.colors.tacticalBlue}, ${styles.colors.electricBlue})`,
      color: styles.colors.primaryDark
    },
    danger: {
      background: `linear-gradient(135deg, ${styles.colors.warningRed}, #ff6666)`,
      color: '#fff'
    },
    success: {
      background: `linear-gradient(135deg, ${styles.colors.successGreen}, #00ff88)`,
      color: styles.colors.primaryDark
    },
    ghost: {
      background: 'transparent',
      border: `1px solid ${styles.colors.tacticalBlue}`,
      color: styles.colors.electricBlue
    }
  };
  
  const buttonStyle = {
    ...sizeStyles[size],
    ...variantStyles[variant],
    fontFamily: '"Orbitron", monospace',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'all 0.3s',
    position: 'relative',
    overflow: 'hidden',
    opacity: disabled ? 0.5 : 1,
    transform: hover && !disabled ? 'translateY(-2px)' : 'translateY(0)',
    boxShadow: hover && !disabled ? `0 0 30px ${styles.colors.electricBlue}` : 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  };
  
  return (
    <button 
      style={buttonStyle}
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {loading && <span className="fa fa-spinner fa-spin" />}
      {icon && !loading && <span className={`fa fa-${icon}`} />}
      {children}
    </button>
  );
};

// Alert Component
export const TacticalAlert = ({ children, severity = 'info', onClose }) => {
  const severityStyles = {
    info: {
      background: `rgba(0, 153, 204, 0.1)`,
      borderColor: styles.colors.tacticalBlue,
      color: styles.colors.electricBlue
    },
    warning: {
      background: `rgba(255, 153, 51, 0.1)`,
      borderColor: styles.colors.alertOrange,
      color: styles.colors.alertOrange
    },
    error: {
      background: `rgba(255, 51, 51, 0.1)`,
      borderColor: styles.colors.warningRed,
      color: styles.colors.warningRed
    },
    success: {
      background: `rgba(0, 255, 65, 0.1)`,
      borderColor: styles.colors.successGreen,
      color: styles.colors.successGreen
    }
  };
  
  const alertStyle = {
    ...severityStyles[severity],
    border: `1px solid`,
    padding: '15px 20px',
    marginBottom: '15px',
    fontFamily: '"Share Tech Mono", monospace',
    fontSize: '12px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  };
  
  const icons = {
    info: 'info-circle',
    warning: 'exclamation-triangle',
    error: 'times-circle',
    success: 'check-circle'
  };
  
  return (
    <div style={alertStyle}>
      <span className={`fa fa-${icons[severity]}`} />
      <div style={{ flex: 1 }}>{children}</div>
      {onClose && (
        <button 
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '0 5px'
          }}
        >
          <span className="fa fa-times" />
        </button>
      )}
    </div>
  );
};

// Panel Component
export const TacticalPanel = ({ title, children, icon, actions }) => {
  const panelStyle = {
    background: styles.colors.secondaryDark,
    border: `1px solid ${styles.colors.tacticalBlue}`,
    marginBottom: '20px'
  };
  
  const headerStyle = {
    background: `linear-gradient(90deg, ${styles.colors.panelDark}, ${styles.colors.secondaryDark})`,
    padding: '10px 15px',
    borderBottom: `1px solid ${styles.colors.tacticalBlue}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };
  
  const titleStyle = {
    fontSize: '12px',
    textTransform: 'uppercase',
    color: styles.colors.electricBlue,
    letterSpacing: '1px',
    fontFamily: '"Orbitron", monospace',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  };
  
  const contentStyle = {
    padding: '15px'
  };
  
  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>
          {icon && <span className={`fa fa-${icon}`} />}
          {title}
        </div>
        {actions && <div>{actions}</div>}
      </div>
      <div style={contentStyle}>
        {children}
      </div>
    </div>
  );
};

// Progress Bar Component
export const TacticalProgress = ({ value, max = 100, label, variant = 'primary' }) => {
  const percentage = (value / max) * 100;
  
  const variantColors = {
    primary: styles.colors.electricBlue,
    danger: styles.colors.warningRed,
    warning: styles.colors.alertOrange,
    success: styles.colors.successGreen
  };
  
  const containerStyle = {
    width: '100%',
    marginBottom: '10px'
  };
  
  const labelStyle = {
    fontSize: '11px',
    color: styles.colors.tacticalBlue,
    textTransform: 'uppercase',
    marginBottom: '5px',
    fontFamily: '"Share Tech Mono", monospace',
    display: 'flex',
    justifyContent: 'space-between'
  };
  
  const barStyle = {
    width: '100%',
    height: '20px',
    background: styles.colors.primaryDark,
    border: `1px solid ${styles.colors.tacticalBlue}`,
    position: 'relative',
    overflow: 'hidden'
  };
  
  const fillStyle = {
    height: '100%',
    width: `${percentage}%`,
    background: `linear-gradient(90deg, ${variantColors[variant]}, ${variantColors[variant]}cc)`,
    transition: 'width 0.5s',
    boxShadow: `0 0 10px ${variantColors[variant]}66`
  };
  
  return (
    <div style={containerStyle}>
      {label && (
        <div style={labelStyle}>
          <span>{label}</span>
          <span style={{ color: variantColors[variant] }}>{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div style={barStyle}>
        <div style={fillStyle} />
      </div>
    </div>
  );
};

// Badge Component
export const TacticalBadge = ({ children, variant = 'primary', size = 'medium' }) => {
  const sizeStyles = {
    small: { padding: '2px 6px', fontSize: '9px' },
    medium: { padding: '4px 8px', fontSize: '10px' },
    large: { padding: '6px 12px', fontSize: '12px' }
  };
  
  const variantStyles = {
    primary: {
      background: styles.colors.tacticalBlue,
      color: '#fff'
    },
    danger: {
      background: styles.colors.warningRed,
      color: '#fff'
    },
    warning: {
      background: styles.colors.alertOrange,
      color: '#fff'
    },
    success: {
      background: styles.colors.successGreen,
      color: styles.colors.primaryDark
    },
    ghost: {
      background: 'transparent',
      border: `1px solid ${styles.colors.tacticalBlue}`,
      color: styles.colors.electricBlue
    }
  };
  
  const badgeStyle = {
    ...sizeStyles[size],
    ...variantStyles[variant],
    display: 'inline-block',
    fontFamily: '"Share Tech Mono", monospace',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: 'bold',
    borderRadius: '2px'
  };
  
  return <span style={badgeStyle}>{children}</span>;
};

// Status Indicator Component
export const StatusIndicator = ({ status = 'inactive', label, pulse = false }) => {
  const statusColors = {
    active: styles.colors.successGreen,
    inactive: styles.colors.metalSilver,
    warning: styles.colors.alertOrange,
    error: styles.colors.warningRed,
    scanning: styles.colors.electricBlue
  };
  
  const containerStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '5px 12px',
    background: 'rgba(0, 153, 204, 0.1)',
    border: `1px solid ${statusColors[status]}`,
    fontSize: '11px',
    textTransform: 'uppercase',
    fontFamily: '"Share Tech Mono", monospace',
    color: statusColors[status]
  };
  
  const dotStyle = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: statusColors[status],
    animation: pulse ? 'pulse 2s infinite' : 'none'
  };
  
  return (
    <div style={containerStyle}>
      <div style={dotStyle} />
      {label && <span>{label}</span>}
    </div>
  );
};

// Data Table Component
export const TacticalTable = ({ columns, data, onRowClick }) => {
  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: '"Share Tech Mono", monospace',
    fontSize: '12px'
  };
  
  const thStyle = {
    padding: '10px',
    background: styles.colors.panelDark,
    borderBottom: `2px solid ${styles.colors.tacticalBlue}`,
    color: styles.colors.electricBlue,
    textAlign: 'left',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontSize: '11px'
  };
  
  const tdStyle = {
    padding: '10px',
    borderBottom: `1px solid ${styles.colors.tacticalBlue}33`,
    color: styles.colors.metalSilver
  };
  
  const [hoveredRow, setHoveredRow] = useState(null);
  
  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          {columns.map((col, i) => (
            <th key={i} style={thStyle}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr 
            key={rowIndex}
            style={{
              background: hoveredRow === rowIndex ? styles.colors.panelDark : 'transparent',
              cursor: onRowClick ? 'pointer' : 'default',
              transition: 'background 0.2s'
            }}
            onMouseEnter={() => setHoveredRow(rowIndex)}
            onMouseLeave={() => setHoveredRow(null)}
            onClick={() => onRowClick && onRowClick(row)}
          >
            {columns.map((col, colIndex) => (
              <td key={colIndex} style={tdStyle}>
                {col.render ? col.render(row[col.field], row) : row[col.field]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Example Usage Component
export default function ComponentShowcase() {
  const [alertVisible, setAlertVisible] = useState(true);
  
  const sampleData = [
    { id: 1, device: 'iPhone 13', mac: 'AA:BB:CC:DD:EE:FF', rssi: -45, status: 'active' },
    { id: 2, device: 'Unknown BT', mac: '11:22:33:44:55:66', rssi: -72, status: 'warning' },
    { id: 3, device: 'AirPods', mac: '77:88:99:AA:BB:CC', rssi: -38, status: 'active' }
  ];
  
  const columns = [
    { field: 'device', label: 'Device Name' },
    { field: 'mac', label: 'MAC Address' },
    { field: 'rssi', label: 'Signal', render: (val) => `${val} dBm` },
    { 
      field: 'status', 
      label: 'Status',
      render: (val) => (
        <TacticalBadge variant={val === 'active' ? 'success' : 'warning'}>
          {val}
        </TacticalBadge>
      )
    }
  ];
  
  return (
    <div style={{ background: styles.colors.primaryDark, padding: '20px', minHeight: '100vh', color: styles.colors.metalSilver }}>
      <h1 style={{ color: styles.colors.electricBlue, fontFamily: '"Orbitron", monospace', marginBottom: '30px' }}>
        BTHL Component Library
      </h1>
      
      {alertVisible && (
        <TacticalAlert severity="warning" onClose={() => setAlertVisible(false)}>
          System Alert: Anomalous Bluetooth activity detected in sector 7
        </TacticalAlert>
      )}
      
      <TacticalPanel title="Control Systems" icon="cog">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <TacticalButton icon="satellite-dish">Start Scan</TacticalButton>
          <TacticalButton variant="danger" icon="stop">Emergency Stop</TacticalButton>
          <TacticalButton variant="success" icon="check">Verify</TacticalButton>
          <TacticalButton variant="ghost" icon="download">Export</TacticalButton>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <TacticalProgress value={67} label="Scan Progress" variant="primary" />
          <TacticalProgress value={85} label="Threat Level" variant="danger" />
          <TacticalProgress value={42} label="Signal Strength" variant="success" />
        </div>
        
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <StatusIndicator status="active" label="System Online" pulse />
          <StatusIndicator status="scanning" label="Scanner" pulse />
          <StatusIndicator status="warning" label="Alert" />
        </div>
      </TacticalPanel>
      
      <TacticalPanel title="Device Registry" icon="network-wired">
        <TacticalTable 
          columns={columns} 
          data={sampleData}
          onRowClick={(row) => console.log('Selected:', row)}
        />
      </TacticalPanel>
    </div>
  );
}

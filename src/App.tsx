import { useBluetooth } from './hooks/useBluetooth';
import './App.css';

function App() {
  const { isConnected, device, resistance, isScanning, error, connect, disconnect } = useBluetooth();

  return (
    <div className="app">
      <header className="header">
        <h1>ERT App</h1>
        <p>Electrical Resistance Tomography Monitor</p>
      </header>

      <main className="main">
        <div className="status-card">
          <div className="status-indicator">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span className="status-text">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {device && (
            <div className="device-info">
              <p><strong>Device:</strong> {device.name}</p>
            </div>
          )}
        </div>

        <div className="resistance-card">
          <h2>Live Resistance</h2>
          <div className="resistance-value">
            {resistance.toFixed(2)} <span className="unit">Ω</span>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="actions">
          {!isConnected ? (
            <button
              onClick={connect}
              disabled={isScanning}
              className="btn btn-primary"
            >
              {isScanning ? 'Scanning...' : 'Connect to Device'}
            </button>
          ) : (
            <button
              onClick={disconnect}
              className="btn btn-secondary"
            >
              Disconnect
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

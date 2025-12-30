import { useState, useCallback, useRef } from 'react';

interface BluetoothDevice {
  name?: string;
  id: string;
}

export const useBluetooth = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [resistance, setResistance] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deviceRef = useRef<any>(null);
  const characteristicRef = useRef<any>(null);
  const decoderRef = useRef(new TextDecoder('utf-8'));

  const parseCSVData = useCallback((csvString: string) => {
    try {
      const values = csvString.trim().split(',');
      if (values.length > 0) {
        const resistanceValue = parseFloat(values[0]);
        if (!isNaN(resistanceValue)) {
          setResistance(resistanceValue);
          return {
            resistance: resistanceValue,
            timestamp: Date.now()
          };
        }
      }
    } catch (err) {
      console.error('Error parsing CSV data:', err);
    }
    return null;
  }, []);

  const handleCharacteristicValueChanged = useCallback((event: any) => {
    const value = event.target.value;
    const csvString = decoderRef.current.decode(value);
    parseCSVData(csvString);
  }, [parseCSVData]);

  const connect = useCallback(async () => {
    try {
      setError(null);
      setIsScanning(true);

      if (!(navigator as any).bluetooth) {
        throw new Error('Web Bluetooth API is not available in this browser');
      }

      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['4fafc201-1fb5-459e-8fcc-c5c9c331914b'] }],
        optionalServices: ['4fafc201-1fb5-459e-8fcc-c5c9c331914b']
      });

      deviceRef.current = device;
      setDevice({
        name: device.name || 'Unknown Device',
        id: device.id
      });

      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error('Failed to connect to GATT server');
      }

      const service = await server.getPrimaryService('4fafc201-1fb5-459e-8fcc-c5c9c331914b');
      const characteristic = await service.getCharacteristic('beb5483e-36e1-4688-b7f5-ea07361b26a8');

      characteristicRef.current = characteristic;

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);

      setIsConnected(true);
      setIsScanning(false);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to device');
      setIsScanning(false);
      setIsConnected(false);
    }
  }, [handleCharacteristicValueChanged]);

  const disconnect = useCallback(async () => {
    try {
      if (characteristicRef.current) {
        characteristicRef.current.removeEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
        await characteristicRef.current.stopNotifications();
      }

      if (deviceRef.current?.gatt?.connected) {
        deviceRef.current.gatt.disconnect();
      }

      setIsConnected(false);
      setDevice(null);
      setResistance(0);
      deviceRef.current = null;
      characteristicRef.current = null;
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect');
    }
  }, [handleCharacteristicValueChanged]);

  return {
    isConnected,
    device,
    resistance,
    isScanning,
    error,
    connect,
    disconnect
  };
};

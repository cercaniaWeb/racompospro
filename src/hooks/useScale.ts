import { useState, useEffect, useRef, useCallback } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

// Web Serial API Types
interface SerialPort {
  readable: ReadableStream;
  writable: WritableStream;
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
}

interface NavigatorSerial {
  serial: {
    requestPort(): Promise<SerialPort>;
  };
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'simulated';

export interface ScaleData {
  weight: number;
  unit: 'kg' | 'lb';
  isStable: boolean;
}

interface UseScaleReturn {
  status: ConnectionStatus;
  data: ScaleData;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  error: string | null;
}

/**
 * Hook for reading serial scales via Web Serial API.
 * Implements stream reading, basic parsing, error handling, and simulation mode.
 */
export const useScale = (): UseScaleReturn => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [data, setData] = useState<ScaleData>({ weight: 0, unit: 'kg', isStable: false });
  const [error, setError] = useState<string | null>(null);

  const { scaleSimulationEnabled } = useSettingsStore();

  const portRef = useRef<SerialPort | null>(null);
  const keepReadingRef = useRef<boolean>(false);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Peso estable: buffer de lecturas recientes
  const weightHistoryRef = useRef<Array<{ weight: number; timestamp: number }>>([]);
  const STABILITY_WINDOW_MS = 500;
  const STABILITY_TOLERANCE = 0.001; // kg - tolerancia para considerar peso estable

  /**
   * Verifica si el peso es estable analizando el historial reciente.
   * Un peso es considerado estable si:
   * 1. Tenemos al menos 5 lecturas en los últimos 500ms
   * 2. La variación entre todas las lecturas es <= 0.001kg
   */
  const checkWeightStability = useCallback((newWeight: number): boolean => {
    const now = Date.now();

    // Agregar nueva lectura al historial
    weightHistoryRef.current.push({ weight: newWeight, timestamp: now });

    // Mantener solo lecturas dentro de la ventana de estabilidad
    weightHistoryRef.current = weightHistoryRef.current.filter(
      entry => now - entry.timestamp <= STABILITY_WINDOW_MS
    );

    // Necesitamos al menos 5 lecturas para considerar estabilidad
    if (weightHistoryRef.current.length < 5) {
      return false;
    }

    // Calcular variación en el historial
    const weights = weightHistoryRef.current.map(e => e.weight);
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);
    const variation = maxWeight - minWeight;

    // Estable si la variación es menor a la tolerancia
    return variation <= STABILITY_TOLERANCE;
  }, []);

  /**
   * Parses raw scale data.
   * Example frame: "ST,GS,+  1.500kg"
   */
  const parseScaleData = useCallback((text: string): Partial<ScaleData> | null => {
    const cleanText = text.trim();

    // Find numbers (including decimal point)
    const weightMatch = cleanText.match(/([\d.]+)/);

    if (weightMatch) {
      const weight = parseFloat(weightMatch[1]);
      const unit = cleanText.toLowerCase().includes('lb') ? 'lb' : 'kg';
      // Detect stability (many scales send 'ST' for stable or 'US' for unstable)
      const isStable = !cleanText.includes('US') && !cleanText.includes('?');

      if (!isNaN(weight)) {
        return { weight, unit, isStable };
      }
    }
    return null;
  }, []);

  const readLoop = useCallback(async () => {
    if (!portRef.current || !portRef.current.readable) return;

    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = portRef.current.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();

    let buffer = '';

    try {
      while (keepReadingRef.current) {
        const { value, done } = await reader.read();
        if (done) break;

        if (value) {
          buffer += value;
          // Scales usually send data terminated by newline
          const lines = buffer.split(/\r?\n/);

          buffer = lines.pop() || ''; // Save incomplete fragment

          for (const line of lines) {
            if (line.length > 0) {
              const parsed = parseScaleData(line);
              if (parsed && parsed.weight !== undefined) {
                // Verificar estabilidad combinando flag de báscula + análisis temporal
                const scaleStableFlag = parsed.isStable || false;
                const temporallyStable = checkWeightStability(parsed.weight!);
                const finalStable = scaleStableFlag && temporallyStable;

                setData(prev => ({
                  ...prev,
                  weight: parsed.weight!,
                  unit: parsed.unit || 'kg',
                  isStable: finalStable
                }));
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error reading scale:', err);
      setError('Read error: ' + (err as Error).message);
      setStatus('error');
    } finally {
      reader.releaseLock();
    }
  }, [parseScaleData, checkWeightStability]);

  // Simulation mode - generates random weights
  const startSimulation = () => {
    setStatus('simulated');
    setError(null);

    simulationIntervalRef.current = setInterval(() => {
      const baseWeight = 2.5; // kg
      const variation = (Math.random() - 0.5) * 0.3; // ±0.15 kg variation
      const isStable = Math.random() > 0.3; // 70% chance of being stable

      setData({
        weight: Math.max(0, baseWeight + variation),
        unit: 'kg',
        isStable,
      });
    }, 500); // Update every 500ms
  };

  const stopSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    weightHistoryRef.current = []; // Limpiar historial
    setData({ weight: 0, unit: 'kg', isStable: false });
    setStatus('disconnected');
  };

  const connect = useCallback(async () => {
    // If simulation is enabled, start simulation instead
    if (scaleSimulationEnabled) {
      startSimulation();
      return;
    }

    const nav = navigator as any;
    if (!('serial' in nav)) {
      setError('Browser does not support Web Serial API (Use Chrome or Edge).');
      return;
    }

    try {
      setStatus('connecting');
      setError(null);

      const port = await nav.serial.requestPort();
      await port.open({ baudRate: 9600 });

      portRef.current = port;
      keepReadingRef.current = true;
      setStatus('connected');

      readLoop();

    } catch (err) {
      console.error('Error connecting scale:', err);
      setStatus('error');
      setError('Could not connect: ' + (err as Error).message);
    }
  }, [scaleSimulationEnabled, readLoop]);

  const disconnect = useCallback(async () => {
    // Stop simulation if active
    if (status === 'simulated') {
      stopSimulation();
      return;
    }

    keepReadingRef.current = false;

    if (portRef.current) {
      try {
        await portRef.current.close();
        portRef.current = null;
        setStatus('disconnected');
      } catch (err) {
        console.error('Error closing port:', err);
      }
    }
  }, [status]);

  // Auto-start simulation if enabled on mount
  useEffect(() => {
    if (scaleSimulationEnabled) {
      startSimulation();
    }

    return () => {
      stopSimulation();
      keepReadingRef.current = false;
      if (portRef.current) {
        portRef.current.close().catch(console.error);
      }
    };
  }, [scaleSimulationEnabled]);

  return { status, data, connect, disconnect, error };
};
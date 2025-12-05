'use client';

import { ConnectionStatus, ScaleData } from '@/hooks/useScale';
import { Scale, Plug, Ban } from 'lucide-react';

interface ScaleControlProps {
    status: ConnectionStatus;
    data: ScaleData;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    error: string | null;
}

export default function ScaleControl({ status, data, connect, disconnect, error }: ScaleControlProps) {
    const isConnected = status === 'connected' || status === 'simulated';
    const isSimulated = status === 'simulated';

    return (
        <div className="p-4 border rounded-xl bg-gray-800 text-white shadow-lg min-w-[280px]">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Scale className="w-5 h-5" /> Báscula Digital
                </h3>

                <span className={`px-2 py-1 rounded text-xs font-bold ${isConnected ? 'bg-green-600' :
                    status === 'error' ? 'bg-red-600' : 'bg-gray-600'
                    }`}>
                    {isSimulated ? '🔧 SIMULADO' : status.toUpperCase()}
                </span>
            </div>

            <div className="bg-black p-4 rounded-lg text-right font-mono text-4xl text-green-400 mb-4 border-2 border-gray-700 relative">
                {data.weight.toFixed(3)}
                <span className="text-sm ml-2">{data.unit}</span>

                {!data.isStable && isConnected && (
                    <span className="absolute top-2 left-2 text-xs text-yellow-500 animate-pulse">
                        Inestable
                    </span>
                )}
            </div>

            <div className="flex gap-2">
                {!isConnected ? (
                    <button
                        onClick={connect}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        <Plug className="w-4 h-4" /> Conectar
                    </button>
                ) : (
                    <button
                        onClick={disconnect}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        <Ban className="w-4 h-4" /> Desconectar
                    </button>
                )}
            </div>

            {error && (
                <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
            )}
        </div>
    );
}

'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/atoms/Button';
import { X, CheckCircle, Package, AlertCircle } from 'lucide-react';

interface TransferItem {
    id: string;
    product_id: string;
    quantity: number;
    product?: {
        name: string;
        sku: string;
    };
}

interface Transfer {
    id: string;
    origin_store_id: string;
    destination_store_id: string;
    items: TransferItem[];
}

interface ReceiveTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (receivedItems: { product_id: string; received_quantity: number }[]) => void;
    transfer: Transfer | null;
    loading?: boolean;
}

const ReceiveTransferModal: React.FC<ReceiveTransferModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    transfer,
    loading = false
}) => {
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
    const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({});

    useEffect(() => {
        if (isOpen && transfer) {
            const initialChecked: Record<string, boolean> = {};
            const initialQtys: Record<string, number> = {};

            transfer.items.forEach(item => {
                initialChecked[item.id] = false;
                initialQtys[item.id] = item.quantity;
            });

            setCheckedItems(initialChecked);
            setReceivedQuantities(initialQtys);
        }
    }, [isOpen, transfer]);

    const handleToggleCheck = (id: string) => {
        setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleQtyChange = (id: string, value: string) => {
        const qty = parseInt(value) || 0;
        setReceivedQuantities(prev => ({ ...prev, [id]: qty }));
    };

    const handleConfirm = () => {
        if (!transfer) return;

        const allChecked = transfer.items.every(item => checkedItems[item.id]);
        if (!allChecked) {
            if (!confirm('Hay productos sin marcar como recibidos. ¿Deseas continuar con la recepción parcial?')) {
                return;
            }
        }

        const itemsToConfirm = transfer.items.map(item => ({
            product_id: item.product_id,
            received_quantity: receivedQuantities[item.id] || 0
        }));

        onConfirm(itemsToConfirm);
    };

    if (!isOpen || !transfer) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="glass rounded-2xl w-full max-w-2xl border border-white/10 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Confirmar Recepción de Mercancía</h2>
                        <p className="text-sm text-gray-400">Transferencia #{transfer.id.slice(0, 8)}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-grow space-y-4">
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex gap-3">
                        <AlertCircle className="text-blue-400 shrink-0" size={20} />
                        <p className="text-xs text-blue-100">
                            Por favor, verifica físicamente cada producto y ajusta la cantidad si es necesario.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {transfer.items.map((item) => (
                            <div
                                key={item.id}
                                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${checkedItems[item.id]
                                        ? 'bg-green-500/10 border-green-500/30'
                                        : 'bg-white/5 border-white/10'
                                    }`}
                            >
                                <button
                                    onClick={() => handleToggleCheck(item.id)}
                                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${checkedItems[item.id] ? 'bg-green-500 text-white' : 'bg-gray-700 border border-gray-600'
                                        }`}
                                >
                                    {checkedItems[item.id] && <CheckCircle size={18} />}
                                </button>

                                <div className="flex-grow min-w-0">
                                    <p className="text-foreground font-medium truncate">
                                        {item.product?.name || 'Producto desconocido'}
                                    </p>
                                    <p className="text-xs text-gray-400 font-mono">
                                        SKU: {item.product?.sku || 'N/A'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Recibido:</p>
                                        <input
                                            type="number"
                                            value={receivedQuantities[item.id]}
                                            onChange={(e) => handleQtyChange(item.id, e.target.value)}
                                            className="w-16 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="bg-white/5 px-3 py-1 rounded text-xs text-gray-400">
                                        de {item.quantity}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>
                        Cerrar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleConfirm}
                        className="bg-green-600 hover:bg-green-500"
                        disabled={loading}
                    >
                        {loading ? 'Procesando...' : 'Completar Recepción'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ReceiveTransferModal;

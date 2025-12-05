'use client';
import React, { useState } from 'react';
import { Check, AlertTriangle, X } from 'lucide-react';

// Types matching our DB schema for UI purposes
interface TransferItem {
    product_id: number | string;
    name: string;
    qty_shipped?: number;
}

interface Props {
    transferId: number | string;
    items: TransferItem[];
    onConfirm: (receivedItems: any[]) => void;
    onClose: () => void;
}

export default function TransferReceiveModal({ items, onConfirm, onClose }: Props) {
    // Local state for what the user counts
    const [counts, setCounts] = useState<Record<string, number>>(
        // Pre-fill with shipped quantity for agility, user edits if discrepancy found
        items.reduce((acc, item) => ({ ...acc, [item.product_id]: item.qty_shipped || 0 }), {})
    );

    const handleConfirm = () => {
        // Final discrepancy calculation. This is the key data sent to backend.
        const receivedData = items.map(item => ({
            product_id: item.product_id,
            qty_shipped: item.qty_shipped || 0,
            qty_received: counts[item.product_id] || 0,
            discrepancy: (counts[item.product_id] || 0) - (item.qty_shipped || 0)
        }));

        onConfirm(receivedData);
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 w-full max-w-2xl rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Receive Merchandise</h2>
                    <button onClick={onClose}><X className="text-gray-400" /></button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-6">
                    <table className="w-full text-left text-white">
                        <thead className="text-gray-400 text-sm uppercase bg-gray-900/50">
                            <tr>
                                <th className="p-3 rounded-l-lg">Product</th>
                                <th className="p-3 text-center">Shipped</th>
                                <th className="p-3 text-center">Received (Real)</th>
                                <th className="p-3 rounded-r-lg text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {items.map(item => {
                                const received = counts[item.product_id];
                                const shipped = item.qty_shipped || 0;
                                const diff = received - shipped;

                                return (
                                    <tr key={item.product_id} className="hover:bg-gray-700/30 transition-colors">
                                        <td className="p-4 font-medium">{item.name}</td>
                                        <td className="p-4 text-center text-gray-400">{shipped}</td>
                                        <td className="p-4 text-center">
                                            <input
                                                type="number"
                                                className={`w-20 p-2 rounded text-center font-bold outline-none focus:ring-2 ${diff !== 0 ? 'bg-yellow-900/50 text-yellow-400 ring-yellow-500' : 'bg-gray-900 text-white ring-blue-500'
                                                    }`}
                                                value={received}
                                                onChange={(e) => setCounts(prev => ({
                                                    ...prev,
                                                    [item.product_id]: parseFloat(e.target.value) || 0
                                                }))}
                                            />
                                        </td>
                                        <td className="p-4 text-right">
                                            {diff === 0 ? (
                                                <span className="flex items-center justify-end gap-1 text-green-400 text-sm">
                                                    <Check size={16} /> Complete
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-end gap-1 text-yellow-500 text-sm font-bold">
                                                    <AlertTriangle size={16} /> {diff > 0 ? `Surplus ${diff}` : `Missing ${Math.abs(diff)}`}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 border-t border-gray-700 bg-gray-900 flex justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-3 text-gray-400 hover:text-white font-medium">
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2"
                    >
                        <Check size={20} /> Confirm Entry
                    </button>
                </div>
            </div>
        </div>
    );
}

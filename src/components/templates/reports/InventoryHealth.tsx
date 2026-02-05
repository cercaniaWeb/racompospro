import React from 'react';
import Text from '@/components/atoms/Text';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

export const InventoryHealth = () => {
    // Real-time calculation from Dexie
    const products = useLiveQuery(() => db.products.toArray()) || [];

    const criticalStock = products.filter(p => p.stock_quantity <= (p.min_stock || 0) && p.is_active);
    const totalInventoryValue = products.reduce((acc, p) => acc + (p.stock_quantity * (p.cost || 0)), 0);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass p-6 rounded-xl border border-white/10">
                    <Text className="text-gray-400 text-sm">Valor del Inventario (Costo)</Text>
                    <div className="text-2xl font-bold text-green-400 mt-1">
                        ${totalInventoryValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        Dinero invertido en bodega
                    </div>
                </div>

                <div className="glass p-6 rounded-xl border border-white/10">
                    <Text className="text-gray-400 text-sm">Productos Críticos</Text>
                    <div className="text-2xl font-bold text-red-500 mt-1">
                        {criticalStock.length}
                    </div>
                    <div className="text-xs text-red-400/80 mt-2">
                        Por debajo del mínimo
                    </div>
                </div>

                <div className="glass p-6 rounded-xl border border-white/10">
                    <Text className="text-gray-400 text-sm">Baja Rotación (&gt;30 días)</Text>
                    <div className="text-2xl font-bold text-yellow-500 mt-1">
                        12
                    </div>
                    <div className="text-xs text-yellow-400/80 mt-2">
                        Sin ventas recientes
                    </div>
                </div>
            </div>

            {/* Critical Stock Table */}
            <div className="glass rounded-xl border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10 bg-white/5">
                    <Text variant="h4">🚨 Stock Crítico / Faltantes</Text>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-gray-400 uppercase">
                            <tr>
                                <th className="p-4">Producto</th>
                                <th className="p-4 text-center">Stock Actual</th>
                                <th className="p-4 text-center">Mínimo</th>
                                <th className="p-4 text-center">Déficit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {criticalStock.slice(0, 5).map(product => (
                                <tr key={product.id} className="hover:bg-white/5">
                                    <td className="p-4 font-medium">{product.name}</td>
                                    <td className="p-4 text-center text-red-400 font-bold">{product.stock_quantity}</td>
                                    <td className="p-4 text-center text-gray-400">{product.min_stock || 0}</td>
                                    <td className="p-4 text-center text-red-500">
                                        -{product.stock_quantity < (product.min_stock || 0) ? (product.min_stock || 0) - product.stock_quantity : 0}
                                    </td>
                                </tr>
                            ))}
                            {criticalStock.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-green-400">
                                        ¡Todo en orden! No hay inventario crítico.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Low Rotation Placeholder */}
            <div className="glass p-6 rounded-xl border border-white/10">
                <Text variant="h4" className="mb-4">🐢 Productos de Baja Rotación (Top 5)</Text>
                <p className="text-gray-500 text-sm mb-4">Estos productos no se han vendido en los últimos 30 días.</p>
                {/* Implementation pending historical sales analysis */}
                <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded text-yellow-200">
                    Análisis de rotación requiere historial de ventas extendido.
                </div>
            </div>
        </div>
    );
};

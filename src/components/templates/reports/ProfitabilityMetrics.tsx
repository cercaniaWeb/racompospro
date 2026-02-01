import React from 'react';
import Text from '@/components/atoms/Text';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

export const ProfitabilityMetrics = () => {
    // We need sales data joined with product cost to calculate real margin
    const sales = useLiveQuery(() => db.sales.toArray()) || [];

    // Mocking some data for visualization until we implement the full joining logic
    const topMarginProducts = [
        { name: 'Agua Ciel 1L', price: 12, cost: 4, margin: 66, profit: 8 },
        { name: 'Chicles Trident', price: 15, cost: 6, margin: 60, profit: 9 },
        { name: 'Sabritas Sal', price: 18, cost: 14, margin: 22, profit: 4 },
    ];

    const hookProducts = [
        { name: 'Leche Lala 1L', frequency: 150, margin: 5 }, // High freq, low margin
        { name: 'Huevo (Kg)', frequency: 120, margin: 8 },
        { name: 'Tortillas', frequency: 200, margin: 3 },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Margins */}
                <div className="glass rounded-xl border border-white/10 overflow-hidden h-full">
                    <div className="p-6 border-b border-white/10 bg-gradient-to-r from-green-900/20 to-transparent">
                        <Text variant="h4" className="text-green-400">💎 Joyas de Rentabilidad</Text>
                        <Text className="text-xs text-gray-400 mt-1">Mayor margen de ganancia (%)</Text>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-gray-400">
                            <tr>
                                <th className="p-4">Producto</th>
                                <th className="p-4 text-right">Costo/Venta</th>
                                <th className="p-4 text-right">Margen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {topMarginProducts.map((p, i) => (
                                <tr key={i} className="hover:bg-white/5">
                                    <td className="p-4">{p.name}</td>
                                    <td className="p-4 text-right">
                                        <div className="text-white">${p.price}</div>
                                        <div className="text-xs text-gray-500">${p.cost}</div>
                                    </td>
                                    <td className="p-4 text-right text-green-400 font-bold">
                                        {p.margin}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Hook Products */}
                <div className="glass rounded-xl border border-white/10 overflow-hidden h-full">
                    <div className="p-6 border-b border-white/10 bg-gradient-to-r from-blue-900/20 to-transparent">
                        <Text variant="h4" className="text-blue-400">🪝 Productos Gancho</Text>
                        <Text className="text-xs text-gray-400 mt-1">Los que traen a la gente (Alta rotación, bajo margen)</Text>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-gray-400">
                            <tr>
                                <th className="p-4">Producto</th>
                                <th className="p-4 text-center">Frecuencia</th>
                                <th className="p-4 text-right">Margen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {hookProducts.map((p, i) => (
                                <tr key={i} className="hover:bg-white/5">
                                    <td className="p-4">{p.name}</td>
                                    <td className="p-4 text-center text-blue-300 font-mono">
                                        {p.frequency} trans.
                                    </td>
                                    <td className="p-4 text-right text-yellow-500">
                                        {p.margin}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

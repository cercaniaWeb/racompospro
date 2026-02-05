import React from 'react';

import Text from '@/components/atoms/Text';
import SalesChart from '@/components/organisms/SalesChart';
import { useReportMetrics } from '@/hooks/useReportMetrics';

export const SalesAnalysis = () => {
    // This hook needs to be expanded or we process data locally here
    const { metrics, loading } = useReportMetrics();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass p-6 rounded-xl border border-white/10">
                    <Text className="text-gray-400 text-sm">Venta Neta</Text>
                    <div className="text-2xl font-bold text-white mt-1">
                        ${metrics.totalSales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                    {/* Placeholder for Gross vs Net diff */}
                    <div className="text-xs text-green-400 mt-2 flex items-center gap-1">
                        <span className="bg-green-500/20 px-2 py-0.5 rounded">Bruto: ${(metrics.totalSales * 1.05).toLocaleString('es-MX')}</span>
                        <span className="text-gray-500 ml-2">-5% Dev.</span>
                    </div>
                </div>

                <div className="glass p-6 rounded-xl border border-white/10">
                    <Text className="text-gray-400 text-sm">Transacciones</Text>
                    <div className="text-2xl font-bold text-white mt-1">
                        {metrics.totalOrders}
                    </div>
                    <div className="text-xs text-blue-400 mt-2">
                        Ticket Promedio: ${metrics.avgOrder.toFixed(2)}
                    </div>
                </div>

                <div className="glass p-6 rounded-xl border border-white/10">
                    <Text className="text-gray-400 text-sm">Hora Pico (Hoy)</Text>
                    <div className="text-2xl font-bold text-white mt-1">
                        6:00 PM - 7:00 PM
                    </div>
                    <div className="text-xs text-orange-400 mt-2">
                        Mayores ventas registradas
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass p-6 rounded-xl border border-white/10">
                    <Text variant="h4" className="mb-4">Ventas por Hora (Calor)</Text>
                    <div className="h-64 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
                        {/* Placeholder for Heatmap Chart */}
                        [Gráfica de Calor por Hora - Proximamente]
                    </div>
                </div>

                <div className="glass p-6 rounded-xl border border-white/10">
                    <Text variant="h4" className="mb-4">Ventas por Categoría</Text>
                    <div className="h-64 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
                        {/* Placeholder for Pie/Bar Chart */}
                        [Gráfica de Categorías - Proximamente]
                    </div>
                </div>
            </div>
        </div>
    );
};

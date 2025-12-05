'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, Package, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface ExpiringProduct {
    product_id: string;
    product_name: string;
    sku: string;
    batch_id: string;
    batch_number: string;
    expiry_date: string;
    store_id: string;
    quantity: number;
    days_until_expiry: number;
}

interface ExpiryAlertsProps {
    storeId: string;
    onClose?: () => void;
}

const ExpiryAlerts: React.FC<ExpiryAlertsProps> = ({ storeId, onClose }) => {
    const [expiringProducts, setExpiringProducts] = useState<ExpiringProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchExpiringProducts();
    }, [storeId]);

    const fetchExpiringProducts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('expiring_products')
                .select('*')
                .eq('store_id', storeId)
                .order('days_until_expiry', { ascending: true });

            if (error) throw error;
            setExpiringProducts(data || []);
        } catch (error) {
            console.error('Error fetching expiring products:', error);
        } finally {
            setLoading(false);
        }
    };

    const getUrgencyColor = (days: number) => {
        if (days < 0) return 'bg-red-500/20 border-red-500/50 text-red-400';
        if (days <= 7) return 'bg-orange-500/20 border-orange-500/50 text-orange-400';
        if (days <= 14) return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
        return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
    };

    const getUrgencyLabel = (days: number) => {
        if (days < 0) return 'VENCIDO';
        if (days === 0) return 'VENCE HOY';
        if (days === 1) return 'VENCE MAÑANA';
        return `${days} días`;
    };

    const criticalCount = expiringProducts.filter(p => p.days_until_expiry <= 7).length;
    const expiredCount = expiringProducts.filter(p => p.days_until_expiry < 0).length;

    if (loading) {
        return (
            <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
                <div className="flex items-center gap-3">
                    <Calendar className="text-blue-400 animate-pulse" size={24} />
                    <span className="text-gray-400">Cargando alertas de caducidad...</span>
                </div>
            </div>
        );
    }

    if (expiringProducts.length === 0) {
        return (
            <div className="bg-green-500/10 backdrop-blur-lg border border-green-500/30 rounded-2xl p-6">
                <div className="flex items-center gap-3">
                    <Package className="text-green-400" size={24} />
                    <div>
                        <p className="text-green-400 font-medium">Sin productos próximos a vencer</p>
                        <p className="text-gray-400 text-sm">Todos los lotes están en buen estado</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-orange-500/10 to-red-500/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-500/50">
                            <AlertTriangle className="text-orange-400" size={24} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">Control de Caducidad</h3>
                            <p className="text-gray-400 text-sm">
                                {expiringProducts.length} productos próximos a vencer
                                {expiredCount > 0 && (
                                    <span className="text-red-400 font-medium ml-2">
                                        • {expiredCount} vencidos
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Alerts Summary */}
            {criticalCount > 0 && (
                <div className="p-4 bg-red-500/10 border-b border-red-500/20">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="text-red-400" size={20} />
                        <span className="text-red-400 font-medium">
                            {criticalCount} productos requieren atención inmediata (≤7 días)
                        </span>
                    </div>
                </div>
            )}

            {/* Products List */}
            <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                    <thead className="bg-white/5 border-b border-white/10 sticky top-0">
                        <tr className="text-left text-gray-300 text-sm">
                            <th className="p-4 font-medium">Producto</th>
                            <th className="p-4 font-medium">Lote</th>
                            <th className="p-4 font-medium">Fecha Vencimiento</th>
                            <th className="p-4 font-medium text-center">Cantidad</th>
                            <th className="p-4 font-medium text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {expiringProducts.map((product) => (
                            <tr key={product.batch_id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <div>
                                        <p className="text-white font-medium">{product.product_name}</p>
                                        <p className="text-gray-400 text-sm font-mono">{product.sku}</p>
                                    </div>
                                </td>
                                <td className="p-4 text-gray-300 font-mono text-sm">
                                    {product.batch_number}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="text-gray-400" />
                                        <span className="text-gray-300">
                                            {new Date(product.expiry_date).toLocaleDateString('es-MX')}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <span className="text-white font-bold">{product.quantity}</span>
                                    <span className="text-gray-400 text-sm ml-1">unidades</span>
                                </td>
                                <td className="p-4 text-center">
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-bold border ${getUrgencyColor(
                                            product.days_until_expiry
                                        )}`}
                                    >
                                        {getUrgencyLabel(product.days_until_expiry)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ExpiryAlerts;

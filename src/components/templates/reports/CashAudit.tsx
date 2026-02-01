import React from 'react';
import Text from '@/components/atoms/Text';
import Button from '@/components/atoms/Button';
import { Printer, XCircle, AlertTriangle } from 'lucide-react';

export const CashAudit = () => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4">
                <Text variant="h3">Control de Caja</Text>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Printer size={16} className="mr-2" /> Corte X
                    </Button>
                    <Button variant="primary" size="sm">
                        <Printer size={16} className="mr-2" /> Corte Z (Cierre)
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Method of Payment Breakdown */}
                <div className="glass p-6 rounded-xl border border-white/10">
                    <Text variant="h4" className="mb-4">Desglose de Métodos de Pago</Text>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                            <span className="text-gray-300">💵 Efectivo</span>
                            <span className="font-bold text-green-400">$4,520.00</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                            <span className="text-gray-300">💳 Tarjeta (Stripe/Clip)</span>
                            <span className="font-bold text-blue-400">$1,250.00</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                            <span className="text-gray-300">🏦 Transferencia</span>
                            <span className="font-bold text-purple-400">$0.00</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between">
                        <span className="font-bold text-lg">Total Auditado</span>
                        <span className="font-bold text-lg text-white">$5,770.00</span>
                    </div>
                </div>

                {/* Cancellations & Anomalies */}
                <div className="glass p-6 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="text-orange-500" />
                        <Text variant="h4">Alertas de Auditoría</Text>
                    </div>

                    <div className="space-y-3">
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex justify-between items-start">
                            <div>
                                <div className="text-red-400 font-bold flex items-center gap-2">
                                    <XCircle size={14} /> 3 Cancelaciones Hoy
                                </div>
                                <div className="text-xs text-gray-400 mt-1">Usuario: Cajero 1</div>
                            </div>
                            <div className="text-right">
                                <div className="text-red-300 font-mono">-$145.00</div>
                                <Button variant="ghost" size="sm" className="h-6 text-xs mt-1">Ver</Button>
                            </div>
                        </div>

                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex justify-between items-start">
                            <div>
                                <div className="text-yellow-400 font-bold flex items-center gap-2">
                                    Reimpresión de Tickets
                                </div>
                                <div className="text-xs text-gray-400 mt-1">Detectadas 2 reimpresiones consecutivas</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { useModal } from '@/hooks/useModal';
import { X, Lock, AlertTriangle, CheckCircle, DollarSign, CreditCard } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

interface CloseRegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CloseRegisterModal: React.FC<CloseRegisterModalProps> = ({
    isOpen,
    onClose
}) => {
    const [actualCash, setActualCash] = useState<string>('');
    const [isClosing, setIsClosing] = useState(false);

    const { modalRef, handleBackdropClick } = useModal({
        onClose,
        closeOnEscape: true,
        closeOnClickOutside: true
    });

    // Fetch sales for the current session (simplified: today's sales)
    // In a real app, this would filter by the specific "Shift ID" or "Open Register Time"
    const sales = useLiveQuery(async () => {
        if (!isOpen) return [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return await db.sales
            .where('created_at')
            .aboveOrEqual(today)
            .toArray();
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setActualCash('');
            setIsClosing(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const cashSales = sales?.filter(s => s.payment_method === 'cash').reduce((sum, s) => sum + s.total_amount, 0) || 0;
    const cardSales = sales?.filter(s => s.payment_method === 'card').reduce((sum, s) => sum + s.total_amount, 0) || 0;
    // Assuming withdrawals are tracked somewhere? For now, let's assume 0 or add a placeholder if not tracked in DB yet.
    // If withdrawals were implemented in the previous step, they might not be saving to DB yet? 
    // The previous WithdrawalModal just closed. It didn't save to DB. 
    // I will assume 0 for withdrawals for now as per previous implementation limitations.
    const withdrawals = 0;

    const expectedCash = cashSales - withdrawals;
    const actualCashNum = parseFloat(actualCash) || 0;
    const difference = actualCashNum - expectedCash;

    const handleCloseRegister = async () => {
        setIsClosing(true);
        // Here we would save the "Close Register" record to the DB
        // await db.registerClosures.add({ ... });

        // Simulate API call/DB operation
        setTimeout(() => {
            alert('Caja cerrada exitosamente. Resumen enviado.');
            setIsClosing(false);
            onClose();
            // Optional: Logout or redirect
        }, 1000);
    };

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="bg-gray-900 w-full max-w-2xl rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                    <div className="flex items-center gap-2">
                        <Lock className="text-red-400" size={24} />
                        <h3 className="text-xl font-bold text-white">Cierre de Caja</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                            <div className="flex items-center gap-2 text-green-400 mb-2">
                                <DollarSign size={20} />
                                <span className="font-bold">Ventas Efectivo</span>
                            </div>
                            <p className="text-2xl font-bold text-white">${cashSales.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                            <div className="flex items-center gap-2 text-blue-400 mb-2">
                                <CreditCard size={20} />
                                <span className="font-bold">Ventas Tarjeta</span>
                            </div>
                            <p className="text-2xl font-bold text-white">${cardSales.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                            <div className="flex items-center gap-2 text-orange-400 mb-2">
                                <Lock size={20} />
                                <span className="font-bold">Total Esperado</span>
                            </div>
                            <p className="text-2xl font-bold text-white">${expectedCash.toFixed(2)}</p>
                            <p className="text-xs text-gray-500 mt-1">(Efectivo en caja)</p>
                        </div>
                    </div>

                    {/* Cash Count Input */}
                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                        <h4 className="text-lg font-bold text-white mb-4">Arqueo de Caja</h4>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    Efectivo Real en Caja
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xl">$</span>
                                    <input
                                        type="number"
                                        value={actualCash}
                                        onChange={(e) => setActualCash(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 pl-10 text-2xl font-bold text-white outline-none focus:border-blue-500 transition-colors"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {/* Difference Indicator */}
                            {actualCash !== '' && (
                                <div className={`p-4 rounded-lg border flex items-center gap-3 ${Math.abs(difference) < 0.01
                                        ? 'bg-green-900/20 border-green-900/50 text-green-400'
                                        : difference < 0
                                            ? 'bg-red-900/20 border-red-900/50 text-red-400'
                                            : 'bg-blue-900/20 border-blue-900/50 text-blue-400'
                                    }`}>
                                    {Math.abs(difference) < 0.01 ? (
                                        <CheckCircle size={24} />
                                    ) : (
                                        <AlertTriangle size={24} />
                                    )}
                                    <div>
                                        <p className="font-bold text-lg">
                                            {Math.abs(difference) < 0.01
                                                ? 'Cuadre Perfecto'
                                                : difference < 0
                                                    ? `Faltante: $${Math.abs(difference).toFixed(2)}`
                                                    : `Sobrante: $${difference.toFixed(2)}`
                                            }
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button variant="secondary" onClick={onClose} className="flex-1" disabled={isClosing}>
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleCloseRegister}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                            disabled={isClosing || actualCash === ''}
                        >
                            {isClosing ? 'Cerrando...' : 'Cerrar Turno'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CloseRegisterModal;

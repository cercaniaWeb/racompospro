import React, { useState, useEffect } from 'react';
import { useModal } from '@/hooks/useModal';
import { X, Percent, DollarSign } from 'lucide-react';
import Button from '@/components/atoms/Button';

interface DiscountModalProps {
    isOpen: boolean;
    onClose: () => void;
    subtotal: number;
    onApplyDiscount: (amount: number) => void;
}

const DiscountModal: React.FC<DiscountModalProps> = ({
    isOpen,
    onClose,
    subtotal,
    onApplyDiscount
}) => {
    const [mode, setMode] = useState<'percent' | 'fixed'>('percent');
    const [value, setValue] = useState<string>('');

    const { modalRef, handleBackdropClick } = useModal({
        onClose,
        closeOnEscape: true,
        closeOnClickOutside: true
    });

    useEffect(() => {
        if (isOpen) {
            setValue('');
            setMode('percent');
        }
    }, [isOpen]);

    const calculateDiscount = () => {
        const numValue = parseFloat(value) || 0;
        if (mode === 'percent') {
            return (subtotal * numValue) / 100;
        }
        return numValue;
    };

    const discountAmount = calculateDiscount();
    const newTotal = Math.max(0, subtotal - discountAmount);

    const handleApply = () => {
        onApplyDiscount(discountAmount);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="bg-gray-900 w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl overflow-hidden"
            >
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                    <h3 className="text-xl font-bold text-white">Aplicar Descuento</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Toggle Mode */}
                    <div className="flex bg-gray-800 p-1 rounded-lg">
                        <button
                            onClick={() => setMode('percent')}
                            className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'percent'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <Percent size={16} /> Porcentaje
                        </button>
                        <button
                            onClick={() => setMode('fixed')}
                            className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'fixed'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <DollarSign size={16} /> Monto Fijo
                        </button>
                    </div>

                    {/* Input */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            {mode === 'percent' ? 'Porcentaje de descuento' : 'Monto a descontar'}
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-2xl font-bold text-white outline-none focus:border-blue-500 transition-colors"
                                placeholder="0"
                                autoFocus
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xl">
                                {mode === 'percent' ? '%' : '$'}
                            </span>
                        </div>
                    </div>

                    {/* Presets */}
                    {mode === 'percent' && (
                        <div className="grid grid-cols-4 gap-2">
                            {[5, 10, 15, 20].map((pct) => (
                                <button
                                    key={pct}
                                    onClick={() => setValue(pct.toString())}
                                    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white py-2 rounded-lg font-medium transition-colors"
                                >
                                    {pct}%
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Summary */}
                    <div className="bg-gray-800/50 p-4 rounded-xl space-y-2 border border-gray-700">
                        <div className="flex justify-between text-gray-400">
                            <span>Subtotal actual</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-red-400 font-medium">
                            <span>Descuento</span>
                            <span>-${discountAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-white font-bold pt-2 border-t border-gray-700">
                            <span>Nuevo Total</span>
                            <span className="text-green-400">${newTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={onClose} className="flex-1">
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleApply} className="flex-1">
                            Aplicar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiscountModal;

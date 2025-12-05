import React, { useState, useEffect } from 'react';
import { useModal } from '@/hooks/useModal';
import { X, CreditCard, ArrowRight } from 'lucide-react';
import Button from '@/components/atoms/Button';

interface WithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
    isOpen,
    onClose
}) => {
    const [amount, setAmount] = useState<string>('');

    const { modalRef, handleBackdropClick } = useModal({
        onClose,
        closeOnEscape: true,
        closeOnClickOutside: true
    });

    useEffect(() => {
        if (isOpen) {
            setAmount('');
        }
    }, [isOpen]);

    const withdrawalAmount = parseFloat(amount) || 0;
    const commission = withdrawalAmount * 0.04;
    const totalCharge = withdrawalAmount + commission;

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
                    <div className="flex items-center gap-2">
                        <CreditCard className="text-blue-400" size={24} />
                        <h3 className="text-xl font-bold text-white">Retiro de Efectivo</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-xl text-blue-200 text-sm">
                        <p>Se cobrará una comisión del 4% sobre el monto retirado.</p>
                    </div>

                    {/* Input */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            Monto a retirar (Efectivo a entregar)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xl">$</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 pl-10 text-2xl font-bold text-white outline-none focus:border-blue-500 transition-colors"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Calculation */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                            <span className="text-gray-400">Retiro</span>
                            <span className="text-white font-bold">${withdrawalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-center">
                            <ArrowRight className="text-gray-600 rotate-90" />
                        </div>
                        <div className="bg-gray-800 p-4 rounded-xl space-y-2 border border-gray-700">
                            <div className="flex justify-between text-gray-400">
                                <span>Monto Retiro</span>
                                <span>${withdrawalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-orange-400">
                                <span>Comisión (4%)</span>
                                <span>+${commission.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-white font-bold pt-2 border-t border-gray-700">
                                <span>Total a Cobrar en Tarjeta</span>
                                <span className="text-2xl text-blue-400">${totalCharge.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={onClose} className="flex-1">
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={onClose}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            disabled={withdrawalAmount <= 0}
                        >
                            Confirmar Retiro
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WithdrawalModal;

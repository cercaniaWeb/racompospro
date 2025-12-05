import React, { useState, useEffect } from 'react';
import { useModal } from '@/hooks/useModal';
import { CartItem } from '@/store/posStore';
import { X, CreditCard, Banknote, Delete } from 'lucide-react';
import Button from '@/components/atoms/Button';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    cart: CartItem[];
    total: number;
    onProcessPayment: (method: 'cash' | 'card', amountPaid?: number) => Promise<void>;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen,
    onClose,
    cart,
    total,
    onProcessPayment
}) => {
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
    const [cashAmount, setCashAmount] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);

    const { modalRef, handleBackdropClick } = useModal({
        onClose,
        closeOnEscape: true,
        closeOnClickOutside: true
    });

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setPaymentMethod('cash');
            setCashAmount('');
            setIsProcessing(false);
        }
    }, [isOpen]);

    const cardCommission = total * 0.04;
    const finalTotal = paymentMethod === 'card' ? total + cardCommission : total;
    const change = paymentMethod === 'cash' && cashAmount ? parseFloat(cashAmount) - finalTotal : 0;
    const isValidPayment = paymentMethod === 'card' || (paymentMethod === 'cash' && parseFloat(cashAmount || '0') >= finalTotal);

    const handleNumPadClick = (value: string) => {
        if (value === 'backspace') {
            setCashAmount(prev => prev.slice(0, -1));
        } else if (value === 'clear') {
            setCashAmount('');
        } else if (value === '.') {
            if (!cashAmount.includes('.')) {
                setCashAmount(prev => prev + value);
            }
        } else {
            setCashAmount(prev => prev + value);
        }
    };

    const handleSubmit = async () => {
        if (!isValidPayment || isProcessing) return;

        setIsProcessing(true);
        try {
            await onProcessPayment(paymentMethod, paymentMethod === 'cash' ? parseFloat(cashAmount) : undefined);
            onClose();
        } catch (error) {
            console.error('Payment failed', error);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="bg-gray-900 w-full max-w-5xl h-[80vh] rounded-2xl border border-gray-700 shadow-2xl flex overflow-hidden"
            >
                {/* LEFT: Order Summary */}
                <div className="w-1/3 border-r border-gray-700 flex flex-col bg-gray-800/50">
                    <div className="p-4 border-b border-gray-700">
                        <h3 className="text-xl font-bold text-white">Detalle de Compra</h3>
                        <p className="text-gray-400 text-sm">{cart.length} artículos</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {cart.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start text-sm border-b border-gray-700/50 pb-2 last:border-0">
                                <div className="flex-1">
                                    <p className="text-white font-medium">{item.product.name}</p>
                                    <p className="text-gray-400">
                                        {item.quantity} x ${item.product.price.toFixed(2)}
                                    </p>
                                </div>
                                <span className="text-white font-mono font-bold">
                                    ${item.subtotal.toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 bg-gray-800 border-t border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400">Subtotal</span>
                            <span className="text-white font-mono">${total.toFixed(2)}</span>
                        </div>
                        {paymentMethod === 'card' && (
                            <div className="flex justify-between items-center mb-2 text-orange-400">
                                <span>Comisión (4%)</span>
                                <span className="font-mono">+${cardCommission.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                            <span className="text-xl font-bold text-white">Total a Pagar</span>
                            <span className="text-3xl font-bold text-green-400 font-mono">
                                ${finalTotal.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Payment Controls */}
                <div className="flex-1 flex flex-col bg-gray-900">
                    <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-white">Método de Pago</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 p-6 flex flex-col gap-6">
                        {/* Payment Method Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setPaymentMethod('cash')}
                                className={`p-6 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'cash'
                                    ? 'border-green-500 bg-green-500/10 text-green-400'
                                    : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                                    }`}
                            >
                                <Banknote size={32} />
                                <span className="font-bold text-lg">Efectivo</span>
                            </button>
                            <button
                                onClick={() => setPaymentMethod('card')}
                                className={`p-6 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'card'
                                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                    : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                                    }`}
                            >
                                <CreditCard size={32} />
                                <span className="font-bold text-lg">Tarjeta (+4%)</span>
                            </button>
                        </div>

                        {/* Cash Input Area */}
                        {paymentMethod === 'cash' && (
                            <div className="flex gap-6 flex-1 min-h-0">
                                {/* Input & Change Display */}
                                <div className="flex-1 flex flex-col gap-4">
                                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                        <label className="block text-sm text-gray-400 mb-1">Efectivo Recibido</label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl text-gray-400">$</span>
                                            <input
                                                type="text"
                                                value={cashAmount}
                                                readOnly
                                                className="w-full bg-transparent text-4xl font-bold text-white outline-none font-mono"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setCashAmount(finalTotal.toFixed(2))}
                                        className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/50 py-2 px-4 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Banknote size={16} />
                                        Pago Exacto (${finalTotal.toFixed(2)})
                                    </button>

                                    <div className={`p-4 rounded-xl border ${change >= 0 ? 'bg-green-900/20 border-green-900/50' : 'bg-red-900/20 border-red-900/50'}`}>
                                        <label className="block text-sm text-gray-400 mb-1">Cambio</label>
                                        <div className="text-4xl font-bold font-mono text-white">
                                            ${change >= 0 ? change.toFixed(2) : '0.00'}
                                        </div>
                                        {change < 0 && (
                                            <p className="text-red-400 text-sm mt-1">Faltan ${Math.abs(change).toFixed(2)}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Numeric Keypad */}
                                <div className="w-64 grid grid-cols-3 gap-2">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((num) => (
                                        <button
                                            key={num}
                                            onClick={() => handleNumPadClick(num.toString())}
                                            className="bg-gray-800 hover:bg-gray-700 text-white text-xl font-bold rounded-lg p-4 transition-colors active:bg-gray-600"
                                        >
                                            {num}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => handleNumPadClick('backspace')}
                                        className="bg-gray-800 hover:bg-red-900/50 text-red-400 rounded-lg p-4 flex items-center justify-center transition-colors"
                                    >
                                        <Delete size={24} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Card Info */}
                        {paymentMethod === 'card' && (
                            <div className="flex-1 flex items-center justify-center text-center p-8 bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
                                <div>
                                    <CreditCard size={64} className="mx-auto text-blue-500 mb-4 opacity-50" />
                                    <h3 className="text-xl font-bold text-white mb-2">Pago con Tarjeta</h3>
                                    <p className="text-gray-400">
                                        Se ha aplicado un cargo extra del 4% (${cardCommission.toFixed(2)})
                                    </p>
                                    <p className="text-gray-400 mt-2">
                                        Proceda con la terminal bancaria por el monto de:
                                    </p>
                                    <p className="text-4xl font-bold text-white font-mono mt-2">
                                        ${finalTotal.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-gray-700 bg-gray-800/50 flex gap-4">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            className="flex-1 py-4 text-lg"
                            disabled={isProcessing}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            className="flex-[2] py-4 text-lg bg-green-600 hover:bg-green-700"
                            disabled={!isValidPayment || isProcessing}
                        >
                            {isProcessing ? 'Procesando...' : `Cobrar $${finalTotal.toFixed(2)}`}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;

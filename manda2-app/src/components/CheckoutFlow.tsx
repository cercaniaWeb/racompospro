'use client';
import React, { useState } from 'react';
import { ArrowLeft, Store, MapPin, Banknote, CreditCard, Check, ChevronRight, ShoppingBag } from 'lucide-react';
import { CartItem } from '@/lib/types';

interface CheckoutFlowProps {
    cart: CartItem[];
    total: number;
    deliveryMode: 'delivery' | 'pickup' | null;
    deliveryLocation: string | null;
    onBack: () => void;
    onComplete: (paymentMethod: string, details: any) => void;
}

export const CheckoutFlow: React.FC<CheckoutFlowProps> = ({ cart, total, deliveryMode, deliveryLocation, onBack, onComplete }) => {
    const [step, setStep] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [streetDetails, setStreetDetails] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Common Header
    const Header = ({ title, showBack = true }: { title: string, showBack?: boolean }) => (
        <div className="bg-white/80 backdrop-blur-xl px-4 py-4 sticky top-0 z-20 border-b border-gray-100">
            <div className="flex items-center">
                {showBack && (
                    <button onClick={() => step === 1 ? onBack() : setStep(step - 1)} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors mr-2">
                        <ArrowLeft size={20} />
                    </button>
                )}
                <h2 className="text-xl font-bold text-center flex-1 pr-8">{title}</h2>
            </div>
            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-100">
                <div
                    className="h-full bg-emerald-600 transition-all duration-500 ease-out"
                    style={{ width: `${(step / 3) * 100}%` }}
                />
            </div>
        </div>
    );

    // STEP 1: REVIEW CART
    if (step === 1) {
        return (
            <div className="flex flex-col h-full bg-gray-50/50">
                <Header title="Tu Pedido" />

                <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
                            <ShoppingBag size={48} className="mb-4 opacity-20" />
                            <p>Tu carrito está vacío</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex bg-white p-3 rounded-2xl border border-gray-100 shadow-sm items-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                                    {item.image_url ? (
                                        <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-300">Img</div>
                                    )}
                                </div>
                                <div className="ml-4 flex-1">
                                    <div className="font-bold text-gray-800 text-sm leading-tight mb-1">{item.name}</div>
                                    <div className="text-xs text-gray-400">${item.price} / {item.is_weighted ? 'kg' : 'pz'}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                                        x{item.qty}
                                    </div>
                                    <div className="font-bold text-sm min-w-[3rem] text-right">
                                        ${(item.price * item.qty).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="fixed bottom-0 left-0 w-full max-w-[480px] bg-white border-t border-gray-100 p-6 z-30 rounded-t-3xl shadow-lg">
                    <div className="flex justify-between items-end mb-6">
                        <span className="text-gray-400 font-medium">Total Estimado</span>
                        <span className="text-4xl font-extrabold text-gray-900 tracking-tighter">${total.toFixed(2)}</span>
                    </div>
                    <button
                        onClick={() => setStep(2)}
                        disabled={cart.length === 0}
                        className="w-full bg-emerald-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-900/20 disabled:opacity-50 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                    >
                        Continuar
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        );
    }

    // STEP 2: DELIVERY DETAILS
    if (step === 2) {
        const isPickup = deliveryMode === 'pickup';

        return (
            <div className="flex flex-col h-full bg-gray-50/50">
                <Header title={isPickup ? 'Recolección' : 'Entrega'} />

                <div className="flex-1 p-4 space-y-4">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6 text-emerald-800">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                {isPickup ? <Store size={20} /> : <MapPin size={20} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wide">
                                    {isPickup ? 'Sucursal' : 'Enviar a'}
                                </h3>
                                <p className="font-bold text-lg leading-tight">{deliveryLocation}</p>
                            </div>
                        </div>

                        {!isPickup && (
                            <div className="animate-in fade-in space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 pl-1">Referencias / Detalles</label>
                                    <textarea
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-medium focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none resize-none transition-all"
                                        placeholder="Ej. Casa color blanca, portón negro..."
                                        rows={4}
                                        value={streetDetails}
                                        onChange={(e) => setStreetDetails(e.target.value)}
                                        autoFocus
                                    ></textarea>
                                </div>
                            </div>
                        )}

                        {isPickup && (
                            <div className="p-4 bg-emerald-50 text-emerald-800 text-sm rounded-2xl border border-emerald-100">
                                <p className="font-bold mb-1">ℹ️ Instrucciones</p>
                                Tu pedido estará listo en aproximadamente 20 minutos. Paga y recoge en caja mostrando tu número de orden.
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-auto bg-white p-6 border-t border-gray-100 z-30 shadow-lg">
                    <button
                        onClick={() => setStep(3)}
                        disabled={!isPickup && !streetDetails}
                        className="w-full bg-emerald-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-900/20 disabled:opacity-50 active:scale-[0.98] transition-transform"
                    >
                        Confirmar Datos
                    </button>
                </div>
            </div>
        );
    }

    // STEP 3: PAYMENT
    if (step === 3) {
        const handlePay = () => {
            setIsProcessing(true);
            setTimeout(() => {
                setIsProcessing(false);
                onComplete(paymentMethod, { streetDetails });
            }, 2000);
        };

        if (isProcessing) {
            return (
                <div className="flex flex-col h-full items-center justify-center bg-white p-8">
                    <div className="relative mb-8">
                        <div className="w-20 h-20 border-4 border-gray-100 rounded-full"></div>
                        <div className="w-20 h-20 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Procesando...</h2>
                    <p className="text-gray-400 text-center max-w-xs">Estamos enviando tu pedido a la tienda.</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col h-full bg-gray-50/50">
                <Header title="Método de Pago" />

                <div className="flex-1 p-4 space-y-6">
                    {/* Total Card */}
                    <div className="bg-emerald-900 text-white p-6 rounded-3xl shadow-lg shadow-emerald-900/20 text-center">
                        <p className="text-emerald-200 text-sm font-medium mb-1">Total a Pagar</p>
                        <p className="text-5xl font-black tracking-tighter">${total.toFixed(2)}</p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-gray-400 text-xs font-bold uppercase tracking-wider pl-2">Selecciona una opción</label>

                        <button
                            onClick={() => setPaymentMethod('cash')}
                            className={`w-full p-5 rounded-2xl border flex items-center transition-all duration-300 ${paymentMethod === 'cash' ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600' : 'border-gray-200 bg-white hover:border-emerald-200'}`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 transition-colors ${paymentMethod === 'cash' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                <Banknote size={24} />
                            </div>
                            <div className="text-left flex-1">
                                <span className={`block font-bold text-lg ${paymentMethod === 'cash' ? 'text-emerald-900' : 'text-gray-900'}`}>Efectivo</span>
                                <span className="text-xs text-gray-400">Paga al recibir tu pedido</span>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cash' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300'}`}>
                                {paymentMethod === 'cash' && <Check size={14} />}
                            </div>
                        </button>

                        <button
                            onClick={() => setPaymentMethod('card')}
                            className={`w-full p-5 rounded-2xl border flex items-center transition-all duration-300 ${paymentMethod === 'card' ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600' : 'border-gray-200 bg-white hover:border-emerald-200'}`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 transition-colors ${paymentMethod === 'card' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                <CreditCard size={24} />
                            </div>
                            <div className="text-left flex-1">
                                <span className={`block font-bold text-lg ${paymentMethod === 'card' ? 'text-emerald-900' : 'text-gray-900'}`}>Tarjeta / Vales</span>
                                <span className="text-xs text-gray-400">Terminal móvil al entregar</span>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'card' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300'}`}>
                                {paymentMethod === 'card' && <Check size={14} />}
                            </div>
                        </button>
                    </div>
                </div>

                <div className="mt-auto bg-white p-6 border-t border-gray-100 z-30 shadow-lg mb-0 pb-8">
                    <button
                        onClick={handlePay}
                        disabled={!paymentMethod}
                        className="w-full bg-emerald-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
                    >
                        {paymentMethod === 'cash' ? 'Finalizar Pedido' : 'Confirmar y Pagar'}
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

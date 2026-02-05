import React, { useEffect, useState } from 'react';
import { Store, Printer, Share2, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TicketViewProps {
    sale: any;
    items: any[];
    onNewOrder: () => void;
}

export const TicketView: React.FC<TicketViewProps> = ({ sale, items, onNewOrder }) => {

    useEffect(() => {
        // Celebrate!
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#047857', '#34d399', '#fbbf24']
        });
    }, []);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-emerald-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

            <div className="relative animate-in zoom-in duration-500 w-full max-w-sm">

                {/* Success Header */}
                <div className="absolute -top-12 left-0 right-0 flex justify-center z-10">
                    <div className="bg-emerald-500 text-white rounded-full p-4 shadow-xl border-4 border-emerald-800">
                        <CheckCircle2 size={48} />
                    </div>
                </div>

                {/* Receipt Card */}
                <div className="bg-white pt-16 pb-8 px-6 rounded-3xl shadow-2xl relative overflow-hidden print:shadow-none print:w-full">

                    {/* Jagger Edge Top (CSS Trick) */}
                    <div className="absolute top-0 left-0 w-full h-4 bg-emerald-900" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)' }}></div>

                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-black tracking-tighter text-gray-900 mb-1">manda2</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recibo Digital</p>
                        <p className="text-xs text-gray-400 mt-2 font-mono">{new Date(sale.created_at).toLocaleString()}</p>
                    </div>

                    <div className="mb-8 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-400 uppercase font-bold">Cliente</span>
                            <span className="text-sm font-bold text-gray-800">{sale.customer_name || 'Invitado'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400 uppercase font-bold">Pago</span>
                            <span className="text-sm font-bold text-gray-800 uppercase">{sale.payment_method === 'cash' ? 'Efectivo' : 'Tarjeta'}</span>
                        </div>
                        <div className="flex justify-between items-start mt-1 pt-1 border-t border-gray-100/50">
                            <span className="text-xs text-gray-400 uppercase font-bold">Entrega</span>
                            <span className="text-[10px] font-bold text-gray-700 text-right max-w-[140px] leading-tight">
                                {sale.delivery_type === 'pickup' ? 'Recoger en Tienda' : (sale.delivery_address || 'Estándar')}
                            </span>
                        </div>
                    </div>


                    <div className="mb-6 space-y-3">
                        {items.map((item, index) => (
                            <div key={index} className="flex justify-between items-baseline text-sm">
                                <div className="flex gap-2">
                                    <span className="font-bold text-gray-900 w-6">{item.qty}x</span>
                                    <span className="text-gray-600 line-clamp-1">{item.name}</span>
                                </div>
                                <span className="font-medium text-gray-900">${(item.price * item.qty).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t-2 border-dashed border-gray-200 pt-4 mb-8">
                        <div className="flex justify-between items-end">
                            <span className="text-lg font-bold text-gray-400">Total</span>
                            <span className="text-4xl font-black text-emerald-600 tracking-tighter">${sale.total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 print:hidden">
                        <button
                            onClick={handlePrint}
                            className="w-full bg-gray-100 text-gray-900 py-4 rounded-xl font-bold flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                            <Printer className="w-5 h-5 mr-2" />
                            Guardar Ticket
                        </button>
                        <button
                            onClick={onNewOrder}
                            className="w-full bg-emerald-900 text-white py-4 rounded-xl font-bold hover:bg-emerald-800 transition-colors shadow-lg shadow-emerald-900/20"
                        >
                            Hacer otro pedido
                        </button>
                    </div>
                </div>
            </div>

            <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .bg-white, .bg-white * {
            visibility: visible;
          }
          .bg-white {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none;
            overflow: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
        </div>
    );
};

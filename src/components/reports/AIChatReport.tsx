'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Download, Bot, User } from 'lucide-react';
import { db } from '@/lib/db';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import Button from '@/components/atoms/Button';

interface Message {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    data?: any; // For charts or tables
    timestamp: Date;
}

const AIChatReport = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            sender: 'ai',
            text: 'Hola, soy tu asistente de reportes. Pregúntame sobre ventas, productos o inventario. Ej: "Ventas de hoy", "Producto más vendido".',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const processQuery = async (query: string) => {
        const lowerQuery = query.toLowerCase();
        let responseText = '';
        let responseData = null;

        try {
            if (lowerQuery.includes('ventas') && lowerQuery.includes('hoy')) {
                const start = startOfDay(new Date());
                const end = endOfDay(new Date());
                const sales = await db.sales.where('created_at').between(start, end).toArray();
                const total = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
                responseText = `Las ventas de hoy suman $${total.toFixed(2)} en ${sales.length} transacciones.`;
                responseData = sales;
            } else if (lowerQuery.includes('ventas') && lowerQuery.includes('mes')) {
                const start = startOfMonth(new Date());
                const end = endOfMonth(new Date());
                const sales = await db.sales.where('created_at').between(start, end).toArray();
                const total = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
                responseText = `Las ventas de este mes suman $${total.toFixed(2)} en ${sales.length} transacciones.`;
                responseData = sales;
            } else if (lowerQuery.includes('producto') && (lowerQuery.includes('vendido') || lowerQuery.includes('top'))) {
                // Simplified logic: get all sale items and count
                const items = await db.saleItems.toArray();
                const productCounts: Record<string, number> = {};
                items.forEach(item => {
                    productCounts[item.product_name] = (productCounts[item.product_name] || 0) + item.quantity;
                });
                const sortedProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

                if (sortedProducts.length > 0) {
                    responseText = 'Los productos más vendidos son:\n' + sortedProducts.map(([name, count], i) => `${i + 1}. ${name} (${count} unid.)`).join('\n');
                    responseData = sortedProducts;
                } else {
                    responseText = 'No hay datos de ventas suficientes para determinar los productos más vendidos.';
                }
            } else if (lowerQuery.includes('stock') || lowerQuery.includes('inventario')) {
                const lowStock = await db.products.where('stock_quantity').below(5).toArray();
                if (lowStock.length > 0) {
                    responseText = `Hay ${lowStock.length} productos con stock bajo (menos de 5):\n` + lowStock.map(p => `- ${p.name}: ${p.stock_quantity}`).join('\n');
                    responseData = lowStock;
                } else {
                    responseText = 'El inventario parece saludable. No hay productos con stock crítico (< 5).';
                }
            } else {
                responseText = 'Lo siento, no entendí tu consulta. Intenta con "ventas de hoy", "ventas del mes", "productos más vendidos" o "stock bajo".';
            }
        } catch (error) {
            console.error('Error processing query:', error);
            responseText = 'Ocurrió un error al consultar la base de datos.';
        }

        return { text: responseText, data: responseData };
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: inputValue,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        // Simulate AI delay
        setTimeout(async () => {
            const result = await processQuery(userMsg.text);

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: result.text,
                data: result.data,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
        }, 1000);
    };

    const downloadData = (data: any, filename: string) => {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = `${filename}_${format(new Date(), 'yyyyMMdd_HHmm')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg z-40 transition-all hover:scale-110"
                title="Asistente IA"
            >
                <Bot size={24} />
            </button>

            {/* Chat Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg h-[600px] flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="bg-primary-600 p-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-2">
                                <Bot size={20} />
                                <h3 className="font-bold">Asistente de Reportes IA</h3>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-primary-700 p-1 rounded">
                                ✕
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] p-3 rounded-lg ${msg.sender === 'user'
                                                ? 'bg-primary-600 text-white rounded-br-none'
                                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                                            }`}
                                    >
                                        <p className="whitespace-pre-line text-sm">{msg.text}</p>
                                        {msg.data && (
                                            <div className="mt-2 pt-2 border-t border-gray-100">
                                                <button
                                                    onClick={() => downloadData(msg.data, 'reporte_ia')}
                                                    className="text-xs flex items-center gap-1 text-primary-600 hover:underline"
                                                >
                                                    <Download size={12} /> Descargar Datos (JSON)
                                                </button>
                                            </div>
                                        )}
                                        <span className={`text-[10px] block mt-1 ${msg.sender === 'user' ? 'text-primary-200' : 'text-gray-400'}`}>
                                            {format(msg.timestamp, 'HH:mm')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-gray-200 p-3 rounded-lg rounded-bl-none shadow-sm">
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-200">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Escribe tu consulta..."
                                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!inputValue.trim() || isTyping}
                                    className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIChatReport;

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Download, Sparkles, Trash2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { useChatbot, ChatMessage } from '@/hooks/useChatbot';
import { generateChatbotReportPDF } from '@/lib/pdf/generateChatbotReport';

interface ChatbotModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChatbotModal: React.FC<ChatbotModalProps> = ({ isOpen, onClose }) => {
    const { messages, loading, sendQuery, clearHistory } = useChatbot();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !loading) {
            sendQuery(input);
            setInput('');
        }
    };

    const handleExportPDF = (message: ChatMessage) => {
        if (message.data && message.data.length > 0) {
            generateChatbotReportPDF({
                userQuery: messages.find(m => m.role === 'user' && m.timestamp < message.timestamp)?.content || '',
                sql: message.sql || '',
                data: message.data,
                timestamp: message.timestamp
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-4xl h-[80vh] shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-2 rounded-lg">
                            <Sparkles className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Asistente IA - Reportes</h2>
                            <p className="text-sm text-gray-400">Pregunta sobre tus datos de ventas</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={clearHistory}
                            className="text-gray-400 hover:text-white transition-colors p-3 hover:bg-white/10 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                            title="Limpiar historial"
                            aria-label="Limpiar historial de chat"
                        >
                            <Trash2 size={24} />
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label="Cerrar asistente"
                        >
                            <X size={28} />
                        </button>
                    </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-6 rounded-full mb-4">
                                <Sparkles size={48} className="text-blue-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">¿En qué puedo ayudarte?</h3>
                            <p className="text-gray-400 max-w-md">
                                Pregunta sobre tus ventas, productos más vendidos, estadísticas, etc.
                            </p>
                            <div className="mt-6 text-left space-y-3">
                                <p className="text-sm text-gray-500">Ejemplos:</p>
                                <button
                                    onClick={() => setInput('Muéstrame los 10 productos más vendidos')}
                                    className="block text-sm text-blue-400 hover:text-blue-300 transition-colors py-2 px-1 rounded hover:bg-white/5 w-full text-left"
                                    aria-label="Ejemplo: Muéstrame los 10 productos más vendidos"
                                >
                                    • Muéstrame los 10 productos más vendidos
                                </button>
                                <button
                                    onClick={() => setInput('Ventas totales del último mes')}
                                    className="block text-sm text-blue-400 hover:text-blue-300 transition-colors py-2 px-1 rounded hover:bg-white/5 w-full text-left"
                                    aria-label="Ejemplo: Ventas totales del último mes"
                                >
                                    • Ventas totales del último mes
                                </button>
                            </div>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl p-4 ${message.role === 'user'
                                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                                        : 'bg-gray-800 border border-white/10 text-gray-100'
                                        }`}
                                >
                                    <p className="text-sm mb-2">{message.content}</p>

                                    {/* Display data table if available */}
                                    {message.data && message.data.length > 0 && (
                                        <div className="mt-4 overflow-x-auto">
                                            <table className="w-full text-xs border border-white/20 rounded-lg overflow-hidden">
                                                <thead className="bg-white/10">
                                                    <tr>
                                                        {Object.keys(message.data[0]).map((key) => (
                                                            <th key={key} className="px-3 py-2 text-left font-semibold">
                                                                {key.replace(/_/g, ' ').toUpperCase()}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/10">
                                                    {message.data.slice(0, 10).map((row, idx) => (
                                                        <tr key={idx} className="hover:bg-white/5">
                                                            {Object.values(row).map((value: any, vidx) => (
                                                                <td key={vidx} className="px-3 py-2">
                                                                    {value !== null && value !== undefined ? String(value) : '-'}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {message.data.length > 10 && (
                                                <p className="text-xs text-gray-400 mt-2">
                                                    Mostrando 10 de {message.data.length} resultados
                                                </p>
                                            )}
                                            <button
                                                onClick={() => handleExportPDF(message)}
                                                className="mt-3 flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors py-3 px-1 rounded min-h-[44px]"
                                                aria-label="Exportar este reporte a PDF"
                                            >
                                                <Download size={18} />
                                                Exportar a PDF
                                            </button>
                                        </div>
                                    )}

                                    <p className="text-xs opacity-60 mt-2">
                                        {message.timestamp.toLocaleTimeString('es-MX')}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-800 border border-white/10 rounded-2xl p-4">
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Form */}
                <form onSubmit={handleSubmit} className="p-6 border-t border-white/10 bg-white/5">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Escribe tu pregunta aquí..."
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors min-h-[48px]"
                            disabled={loading}
                            aria-label="Escribe tu pregunta para la IA"
                        />
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading || !input.trim()}
                            className="px-6 min-h-[48px] flex items-center justify-center"
                            aria-label="Enviar pregunta"
                        >
                            <Send size={20} />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatbotModal;

'use client';
import React from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { CheckCircle, XCircle, AlertTriangle, Info, X, History, Check } from 'lucide-react';

/**
 * Panel de historial de notificaciones
 */
export default function NotificationHistory() {
    const [isOpen, setIsOpen] = React.useState(false);
    const { history, markAsRead, clearHistory } = useNotificationStore();
    const unreadCount = useNotificationStore(state => state.unreadCount());

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="text-green-400" size={20} />;
            case 'error': return <XCircle className="text-red-400" size={20} />;
            case 'warning': return <AlertTriangle className="text-yellow-400" size={20} />;
            case 'info': return <Info className="text-blue-400" size={20} />;
        }
    };

    const formatTime = (date: Date) => {
        const d = new Date(date);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins}m`;
        if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)}h`;
        return d.toLocaleDateString('es-ES');
    };

    return (
        <>
            {/* Botón flotante para abrir historial */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-full shadow-2xl border border-gray-700 transition-all z-40"
            >
                <History size={24} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full font-bold">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Panel lateral */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <div className="relative w-full max-w-md bg-gray-800 shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900">
                            <div className="flex items-center gap-2">
                                <History className="text-blue-400" size={24} />
                                <h3 className="text-white font-bold text-lg">Historial de Notificaciones</h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Acciones */}
                        <div className="p-4 border-b border-gray-700 bg-gray-900/50 flex gap-2">
                            <button
                                onClick={() => {
                                    history.forEach(n => markAsRead(n.id));
                                }}
                                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                <Check size={16} className="inline mr-2" />
                                Marcar todo leído
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm('¿Eliminar todo el historial?')) {
                                        clearHistory();
                                    }
                                }}
                                className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Limpiar historial
                            </button>
                        </div>

                        {/* Lista */}
                        <div className="overflow-y-auto h-[calc(100vh-140px)]">
                            {history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                                    <History size={48} className="mb-4 opacity-50" />
                                    <p>No hay notificaciones</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-700">
                                    {history.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 hover:bg-gray-700/50 transition-colors cursor-pointer ${!notification.read ? 'bg-gray-700/30' : ''
                                                }`}
                                            onClick={() => markAsRead(notification.id)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 mt-1">
                                                    {getIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h4 className="text-white font-semibold text-sm">
                                                            {notification.title}
                                                        </h4>
                                                        {!notification.read && (
                                                            <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1"></span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-300 text-xs mt-1 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-gray-500 text-xs mt-2">
                                                        {formatTime(notification.timestamp)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

'use client';
import React from 'react';
import { useNotificationStore, NotificationType } from '@/store/notificationStore';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * Componente de modal de notificaciones
 * Se muestra en el centro de la pantalla con estilos glassmorphism
 */
export default function NotificationModal() {
    const { notifications, removeNotification } = useNotificationStore();

    // Si no hay notificaciones, no renderizar nada
    if (notifications.length === 0) return null;

    // Mostrar solo la última notificación
    const currentNotification = notifications[notifications.length - 1];

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="text-green-400" size={32} />;
            case 'error':
                return <XCircle className="text-red-400" size={32} />;
            case 'warning':
                return <AlertTriangle className="text-yellow-400" size={32} />;
            case 'info':
                return <Info className="text-blue-400" size={32} />;
        }
    };

    const getBorderColor = (type: NotificationType) => {
        switch (type) {
            case 'success':
                return 'border-green-500/50';
            case 'error':
                return 'border-red-500/50';
            case 'warning':
                return 'border-yellow-500/50';
            case 'info':
                return 'border-blue-500/50';
        }
    };

    const getProgressBarColor = (type: NotificationType) => {
        switch (type) {
            case 'success':
                return 'bg-green-500';
            case 'error':
                return 'bg-red-500';
            case 'warning':
                return 'bg-yellow-500';
            case 'info':
                return 'bg-blue-500';
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" />

            {/* Modal de Notificación */}
            <div
                className={`
          relative pointer-events-auto
          bg-gray-800/95 backdrop-blur-lg
          border ${getBorderColor(currentNotification.type)}
          rounded-2xl shadow-2xl
          max-w-md w-full mx-4
          overflow-hidden
          animate-slideInDown
        `}
            >
                {/* Barra de progreso si hay auto-close */}
                {currentNotification.autoClose && (
                    <div
                        className={`
              h-1 ${getProgressBarColor(currentNotification.type)}
              animate-shrink
            `}
                        style={{
                            animationDuration: `${currentNotification.duration}ms`
                        }}
                    />
                )}

                {/* Contenido */}
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        {/* Icono */}
                        <div className="flex-shrink-0">
                            {getIcon(currentNotification.type)}
                        </div>

                        {/* Texto */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-white font-bold text-lg mb-1">
                                {currentNotification.title}
                            </h3>
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {currentNotification.message}
                            </p>
                        </div>

                        {/* Botón cerrar */}
                        <button
                            onClick={() => removeNotification(currentNotification.id)}
                            className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Timestamp */}
                    <div className="mt-4 text-xs text-gray-500">
                        {currentNotification.timestamp.toLocaleTimeString('es-ES')}
                    </div>
                </div>

                {/* Botones de acción (opcional) */}
                <div className="px-6 pb-4 flex justify-end gap-2">
                    {currentNotification.action && (
                        <button
                            onClick={() => {
                                currentNotification.action?.onClick();
                                removeNotification(currentNotification.id);
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            {currentNotification.action.label}
                        </button>
                    )}
                    <button
                        onClick={() => removeNotification(currentNotification.id)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>

            <style jsx>{`
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .animate-slideInDown {
          animation: slideInDown 0.3s ease-out;
        }

        .animate-shrink {
          animation: shrink linear;
        }
      `}</style>
        </div>
    );
}

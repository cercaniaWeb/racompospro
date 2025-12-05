import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: Date;
    autoClose?: boolean;
    duration?: number;
    action?: NotificationAction;
    read?: boolean;
}

export interface NotificationAction {
    label: string;
    onClick: () => void;
}

interface NotificationState {
    notifications: Notification[];
    history: Notification[];
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
    removeNotification: (id: string) => void;
    markAsRead: (id: string) => void;
    clearAll: () => void;
    clearHistory: () => void;
    unreadCount: () => number;
}

/**
 * Store de Zustand para gestión de notificaciones con historial persistente
 */
export const useNotificationStore = create<NotificationState>()(
    persist(
        (set, get) => ({
            notifications: [],
            history: [],

            addNotification: (notification) => {
                const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const newNotification: Notification = {
                    ...notification,
                    id,
                    timestamp: new Date(),
                    autoClose: notification.autoClose ?? true,
                    duration: notification.duration ?? 5000,
                    read: false
                };

                set((state) => ({
                    notifications: [...state.notifications, newNotification],
                    history: [newNotification, ...state.history].slice(0, 50) // Limitar a 50
                }));

                // Auto-close si está habilitado
                if (newNotification.autoClose) {
                    setTimeout(() => {
                        set((state) => ({
                            notifications: state.notifications.filter((n) => n.id !== id)
                        }));
                    }, newNotification.duration);
                }
            },

            removeNotification: (id) =>
                set((state) => ({
                    notifications: state.notifications.filter((n) => n.id !== id)
                })),

            markAsRead: (id) =>
                set((state) => ({
                    history: state.history.map((n) =>
                        n.id === id ? { ...n, read: true } : n
                    )
                })),

            clearAll: () =>
                set({ notifications: [] }),

            clearHistory: () =>
                set({ history: [] }),

            unreadCount: () => {
                const { history } = get();
                return history.filter((n) => !n.read).length;
            }
        }),
        {
            name: 'notification-history',
            partialize: (state) => ({ history: state.history })
        }
    )
);

/**
 * Hook helper para usar notificaciones
 */
export function useNotifications() {
    const { addNotification, removeNotification, clearAll, markAsRead, history, unreadCount } = useNotificationStore();

    const notify = {
        success: (title: string, message: string, options?: { autoClose?: boolean; action?: NotificationAction }) =>
            addNotification({ type: 'success', title, message, ...options }),

        error: (title: string, message: string, options?: { autoClose?: boolean; action?: NotificationAction }) =>
            addNotification({ type: 'error', title, message, autoClose: false, ...options }),

        warning: (title: string, message: string, options?: { autoClose?: boolean; action?: NotificationAction }) =>
            addNotification({ type: 'warning', title, message, ...options }),

        info: (title: string, message: string, options?: { autoClose?: boolean; action?: NotificationAction }) =>
            addNotification({ type: 'info', title, message, ...options })
    };

    return {
        notify,
        remove: removeNotification,
        clearAll,
        markAsRead,
        history,
        unreadCount: unreadCount()
    };
}

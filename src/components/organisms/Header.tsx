import React, { useState } from 'react';
import Image from 'next/image';
import UserAvatar from '@/components/molecules/UserAvatar';
import Button from '@/components/atoms/Button';
import Text from '@/components/atoms/Text';
import { Bell, Calendar, Lock, X, Check, Trash2, History } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { useModal } from '@/hooks/useModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import UserProfileModal from '@/components/organisms/UserProfileModal';
import { useStoreContext } from '@/hooks/useStoreContext';
import { Store } from 'lucide-react';

interface HeaderProps {
  user?: {
    name: string;
    imageUrl?: string;
    status?: 'online' | 'offline' | 'busy';
  };
  onLogout?: () => void;
  onMenuToggle?: () => void;
  title?: string;
  actions?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onMenuToggle,
  title = 'Racom-POS',
  actions
}) => {
  const { unreadCount, history, markAsRead, clearHistory } = useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { storeName } = useStoreContext();
  const unread = unreadCount();

  const { modalRef, handleBackdropClick } = useModal({
    onClose: () => setShowNotifications(false),
    closeOnEscape: true,
    closeOnClickOutside: true
  });

  const formatTime = (date: Date) => {
    try {
      return format(new Date(date), 'dd MMM HH:mm', { locale: es });
    } catch (e) {
      return '';
    }
  };

  return (
    <header className="bg-background border-b border-border h-16 flex items-center">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {onMenuToggle && (
              <Button
                variant="ghost"
                size="md"
                onClick={onMenuToggle}
                className="mr-2 md:hidden"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            )}
            <div className="flex items-center gap-3">
              <div className="relative h-8 w-auto">
                <Image
                  src="/images/logo.png"
                  alt="Logo"
                  width={32}
                  height={32}
                  className="h-8 w-auto object-contain"
                  priority
                />
              </div>
              <Text variant="h4" className="font-bold text-foreground">
                {title}
              </Text>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            {actions && <div>{actions}</div>}

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-white/10 transition-colors group"
              title="Notificaciones"
            >
              <Bell className={`h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors ${unread > 0 ? 'animate-pulse' : ''
                }`} />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-red-500/50">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {user && (
              <div className="flex items-center space-x-2">
                <div
                  className="hidden md:flex flex-col leading-tight cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setShowProfileModal(true)}
                >
                  <Text variant="sm" className="font-medium text-foreground">{user.name}</Text>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 mt-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                    <Store size={10} className="text-blue-400" />
                    <span className="text-[10px] font-bold text-blue-400 whitespace-nowrap uppercase">
                      {storeName || 'Cargando...'}
                    </span>
                  </div>
                </div>
                <div
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setShowProfileModal(true)}
                >
                  <UserAvatar
                    name={user.name}
                    imageUrl={user.imageUrl}
                    status={user.status}
                  />
                </div>
                {onLogout && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLogout}
                  >
                    Cerrar sesión
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Modal */}
      {showNotifications && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end"
          onClick={handleBackdropClick}
        >
          <div
            ref={modalRef}
            className="w-full max-w-md bg-background border-l border-white/10 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300"
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-2">
                <Bell className="text-primary" size={20} />
                <h3 className="font-bold text-foreground">Notificaciones</h3>
                {unread > 0 && (
                  <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full border border-primary/20">
                    {unread} nuevas
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Actions */}
            <div className="p-3 border-b border-white/10 flex gap-2 bg-white/5">
              <button
                onClick={() => history.forEach(n => markAsRead(n.id))}
                className="flex-1 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                disabled={unread === 0}
              >
                <Check size={16} />
                Marcar leídas
              </button>
              <button
                onClick={clearHistory}
                className="flex-1 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                disabled={history.length === 0}
              >
                <Trash2 size={16} />
                Limpiar
              </button>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto p-0">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-8">
                  <History size={48} className="mb-4 opacity-20" />
                  <p>No hay notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {history.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${!notification.read ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </h4>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {formatTime(notification.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
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

      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </header>
  );
};

export default Header;
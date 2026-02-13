'use client';

import React from 'react';
import Header from '@/components/organisms/Header';
import Sidebar from '@/components/organisms/Sidebar';

import { supabase } from '@/lib/supabase/client';
import { useNotifications, useNotificationStore } from '@/store/notificationStore';
import { Bell } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: {
    name: string;
    imageUrl?: string;
    status?: 'online' | 'offline' | 'busy';
  };
  onLogout?: () => void;
  sidebarItems: {
    id: string;
    label: string;
    href?: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    active?: boolean;
  }[];
  title?: string;
  showSidebar?: boolean;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  user,
  onLogout,
  sidebarItems,
  title = 'Panel de Control',
  showSidebar = true
}) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { notify } = useNotifications();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Global Realtime Notifications
  React.useEffect(() => {
    const channel = supabase
      .channel('global_notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transfers'
        },
        async (payload) => {
          console.log('[REALTIME EVENT]', payload);
          const newTransfer = payload.new as any;
          const oldTransfer = payload.old as any;

          const dynamicStoreId = typeof window !== 'undefined' ? localStorage.getItem('current_store_id') : null;
          if (!dynamicStoreId) return;

          const store = useNotificationStore.getState();

          // 1. NUEVA SOLICITUD (INSERT) -> Notificar al Proveedor (Destino)
          if (payload.eventType === 'INSERT' && dynamicStoreId === newTransfer.destination_store_id) {
            console.log('[REALTIME] Detectada nueva solicitud para esta tienda.');
            const { data: origin } = await supabase.from('stores').select('name').eq('id', newTransfer.origin_store_id).single();
            store.addNotification({
              type: 'info',
              title: 'Nueva Solicitud',
              message: `La sucursal ${origin?.name || 'Origen'} solicita productos.`
            });
          }

          // 2. PEDIDO ENVIADO (UPDATE) -> Notificar al Solicitante (Origen)
          if (payload.eventType === 'UPDATE' &&
            newTransfer.status === 'in_transit' &&
            dynamicStoreId === newTransfer.origin_store_id) {

            console.log('[REALTIME] Detectado envío de pedido para esta tienda.');
            const { data: dest } = await supabase.from('stores').select('name').eq('id', newTransfer.destination_store_id).single();
            store.addNotification({
              type: 'success',
              title: 'Mercancía en Camino',
              message: `Tu pedido ha sido enviado por ${dest?.name || 'Proveedor'}.`
            });
          }

          // 3. PEDIDO RECIBIDO (UPDATE) -> Notificar al Proveedor (Destino)
          if (payload.eventType === 'UPDATE' &&
            newTransfer.status === 'completed' &&
            dynamicStoreId === newTransfer.destination_store_id) {

            console.log('[REALTIME] Detectada mercancía recibida en destino.');
            const { data: origin } = await supabase.from('stores').select('name').eq('id', newTransfer.origin_store_id).single();
            store.addNotification({
              type: 'success',
              title: 'Transferencia Completada',
              message: `${origin?.name || 'La sucursal'} ha recibido la mercancía.`
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[REALTIME STATUS]', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Singleton effect

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      {showSidebar && (
        <Sidebar
          items={sidebarItems}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          title={title}
        />
      )}

      {/* Main content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${showSidebar ? 'md:ml-64' : ''}`}>
        {/* Header */}
        <Header
          user={user}
          onLogout={onLogout}
          onMenuToggle={showSidebar ? toggleSidebar : undefined}
          title={title}
        />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-900">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
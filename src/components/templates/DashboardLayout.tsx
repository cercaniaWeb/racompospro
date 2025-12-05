'use client';

import React from 'react';
import Header from '@/components/organisms/Header';
import Sidebar from '@/components/organisms/Sidebar';

import { supabase } from '@/lib/supabase/client';
import { useNotifications } from '@/store/notificationStore';
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
          event: 'INSERT',
          schema: 'public',
          table: 'transfers'
        },
        (payload) => {
          console.log('New transfer received:', payload);
          notify.info('Nueva Transferencia', `Se ha creado una nueva transferencia #${payload.new.id.slice(0, 8)}`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [notify]);

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
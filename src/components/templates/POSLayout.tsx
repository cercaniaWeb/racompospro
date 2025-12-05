'use client';

import React, { useState } from 'react';
import Header from '@/components/organisms/Header';
import Sidebar from '@/components/organisms/Sidebar';

interface POSLayoutProps {
  children: React.ReactNode;
  user?: {
    name: string;
    imageUrl?: string;
    status?: 'online' | 'offline' | 'busy';
  };
  onLogout?: () => void;
  onMenuToggle?: () => void;
  title?: string;
  sidebarItems?: {
    id: string;
    label: string;
    href?: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    active?: boolean;
  }[];
  showSidebar?: boolean;
}

const POSLayout: React.FC<POSLayoutProps> = ({
  children,
  user,
  onLogout,
  onMenuToggle,
  title = 'Punto de Venta',
  sidebarItems = [],
  showSidebar = false
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

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
          onMenuToggle={onMenuToggle || (showSidebar ? toggleSidebar : undefined)}
          title={title}
        />

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-muted/10">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default POSLayout;
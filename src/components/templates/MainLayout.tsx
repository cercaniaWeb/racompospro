'use client';

import React, { useState } from 'react';
import Header from '@/components/organisms/Header';
import Sidebar from '@/components/organisms/Sidebar';

interface MainLayoutProps {
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

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  user,
  onLogout,
  sidebarItems,
  title = 'Racom-POS',
  showSidebar = true
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
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
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Text from '@/components/atoms/Text';
import { ROUTES } from '@/lib/routes';
import Button from '@/components/atoms/Button';

interface SidebarItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}

interface SidebarProps {
  items: SidebarItem[];
  isOpen: boolean;
  onClose: () => void;
  logo?: string;
  title?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  items,
  isOpen,
  onClose,
  logo,
  title = 'Racom-POS'
}) => {
  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link href={ROUTES.DASHBOARD} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="h-8 w-auto object-contain"
              priority
            />
            <Text variant="h5" className="font-bold text-foreground">
              {title}
            </Text>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="md:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {items.map((item) => (
            <div key={item.id}>
              {item.href ? (
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${item.active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground/80 hover:bg-accent hover:text-accent-foreground'
                    }`}
                >
                  {item.icon && <span className="mr-3">{item.icon}</span>}
                  {item.label}
                </Link>
              ) : (
                <button
                  onClick={item.onClick}
                  className={`w-full text-left flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${item.active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground/80 hover:bg-accent hover:text-accent-foreground'
                    }`}
                >
                  {item.icon && <span className="mr-3">{item.icon}</span>}
                  {item.label}
                </button>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <Text variant="caption" className="text-muted-foreground">
            © {new Date().getFullYear()} Racom-POS
          </Text>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
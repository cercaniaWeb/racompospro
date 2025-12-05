import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ReactNode } from 'react';
import RootInitializer from '@/components/templates/RootInitializer';
import NotificationModal from '@/components/notifications/NotificationModal';
import NotificationHistory from '@/components/notifications/NotificationHistory';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Racom-POS',
  description: 'Sistema de Punto de Venta para Abarrotes',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <RootInitializer>
          {children}
          <NotificationModal />
        </RootInitializer>
        <Analytics />
      </body>
    </html >
  );
}
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ReactNode } from 'react';
import RootInitializer from '@/components/templates/RootInitializer';
import NotificationToast from '@/components/notifications/NotificationToast';

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="es">

      <body className={inter.className}>
        <RootInitializer>
          {children}
          <NotificationToast />
        </RootInitializer>
        <Analytics />
      </body>
    </html >
  );
}
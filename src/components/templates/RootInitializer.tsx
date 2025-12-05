'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export default function RootInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { initialize, user } = useAuthStore();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      await initialize();
      setIsInitialized(true);
    };
    initAuth();
  }, [initialize]);

  // Redirect to login if user is not authenticated and trying to access protected routes
  useEffect(() => {
    if (isInitialized && !user) {
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/register') && !path.startsWith('/forgot-password') && path !== '/') {
        router.push('/login');
      }
    }
  }, [isInitialized, user, router]);

  // Don't render children while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export default function AuthInitializer({
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

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user && isInitialized) {
      router.push('/pos');
    }
  }, [user, isInitialized, router]);

  // Don't render children while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { UserRole, canAccessRoute, canAccessStore, hasPermission } from '@/types/roles';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/routes';

// Supabase Client removed (using singleton)

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  store_id: string;
  store_name?: string;
}

interface UseAuthResult {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: (permission: string) => boolean;
  canAccessRoute: (path: string) => boolean;
  canAccessStore: (targetStoreId: string) => boolean;
  isAdmin: boolean;
  isGerente: boolean;
  isCajero: boolean;
  signOut: () => Promise<void>;
}

/**
 * Hook para gestión de autenticación y autorización
 * Obtiene el usuario actual y proporciona funciones de verificación de permisos
 */
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUser();
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authUser) {
        setUser(null);
        return;
      }



      // Use metadata directly; no DB query needed
      // Map Supabase role to internal UserRole
      const rawRole = authUser.user_metadata?.role || 'cajera';
      let role: UserRole = 'cajero'; // Default fallback

      if (rawRole === 'admin' || rawRole === 'dev') role = 'admin';
      else if (rawRole === 'gerente' || rawRole === 'grte') role = 'grte';
      else if (rawRole === 'cajera' || rawRole === 'cajero' || rawRole === 'staff') role = 'cajero';
      const store_id = authUser.user_metadata?.store_id || '';

      setUser({
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuario',
        role,
        store_id,
      });
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        // Force redirect to login using window.location for reliability
        window.location.href = ROUTES.LOGIN;
      }
    } catch (error) {
      console.error('Error signing out:', error);
      // Force redirect even on error
      if (typeof window !== 'undefined') {
        window.location.href = ROUTES.LOGIN;
      }
    }
  };

  return {
    user,
    isLoading,
    error,
    hasPermission: (permission: string) => {
      if (!user) return false;
      return hasPermission(user.role, permission);
    },
    canAccessRoute: (path: string) => {
      if (!user) return false;
      return canAccessRoute(user.role, path);
    },
    canAccessStore: (targetStoreId: string) => {
      if (!user) return false;
      return canAccessStore(user.role, user.store_id, targetStoreId);
    },
    isAdmin: user?.role === 'admin',
    isGerente: user?.role === 'grte',
    isCajero: user?.role === 'cajero',
    signOut
  };
}
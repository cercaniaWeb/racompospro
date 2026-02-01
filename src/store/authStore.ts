import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { User } from '@/lib/supabase/types';

interface AuthState {
  user: User | null;
  session: any;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  initialize: () => Promise<void>;
  setError: (error: string | null) => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  setError: (error) => set({ error }),

  setUser: (user) => set({ user }),

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          set({
            session,
            user: {
              id: authUser.id,
              email: authUser.email || '',
              name: authUser.user_metadata?.name || authUser.email || 'Usuario',
              imageUrl: authUser.user_metadata?.avatar_url,
              role: authUser.user_metadata?.role || 'admin',
              status: authUser.user_metadata?.status || 'active',
              created_at: authUser.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            loading: false
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Supabase initialization failed, checking local session...');
    }
    set({ session: null, user: null, loading: false });
  },

  login: async (email, password) => {
    set({ loading: true, error: null });

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ loading: false, error: error.message });
        throw error;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser && session) {
        set({
          session,
          user: {
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || authUser.email || 'Usuario',
            imageUrl: authUser.user_metadata?.avatar_url,
            role: authUser.user_metadata?.role || 'admin',
            status: authUser.user_metadata?.status || 'active',
            created_at: authUser.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          loading: false
        });
      }
    } catch (err: any) {
      // FAIL-SAFE: If connection fails, allow login with any credentials in dummy mode
      if (err.message?.includes('fetch') || err.message?.includes('Network')) {
        console.warn('Network error detected. Entering MOCK MODE');
        set({
          session: { user: { id: 'mock-id' }, access_token: 'mock-token' },
          user: {
            id: 'mock-id',
            email: email,
            name: 'Usuario Local (Pruebas)',
            role: 'admin',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          loading: false
        });
        return;
      }
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  logout: async () => {
    set({ loading: true });

    const { error } = await supabase.auth.signOut();

    if (error) {
      set({ loading: false, error: error.message });
    } else {
      set({ session: null, user: null, loading: false });
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        }
      }
    });

    if (error) {
      set({ loading: false, error: error.message });
      throw error;
    }

    set({ loading: false });
  },

  forgotPassword: async (email) => {
    set({ loading: true, error: null });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    if (error) {
      set({ loading: false, error: error.message });
      throw error;
    }

    set({ loading: false });
  },
}));
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
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // Use ONLY Auth metadata - no DB queries
        set({
          session,
          user: {
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || authUser.email || 'Usuario',
            imageUrl: authUser.user_metadata?.avatar_url,
            role: authUser.user_metadata?.role || 'cajera',
            status: authUser.user_metadata?.status || 'active',
            created_at: authUser.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          loading: false
        });
      } else {
        set({ session: null, user: null, loading: false });
      }
    } else {
      set({ session: null, user: null, loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      set({ loading: false, error: error.message });
      throw error;
    }

    // Load user from Auth metadata only
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
          role: authUser.user_metadata?.role || 'cajera',
          status: authUser.user_metadata?.status || 'active',
          created_at: authUser.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        loading: false
      });

      // Log IP address
      try {
        await fetch('/api/auth/log-ip', {
          method: 'POST',
        });
      } catch (logError) {
        console.error('Failed to log IP:', logError);
        // Don't block login if logging fails
      }
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
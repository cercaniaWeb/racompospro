import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { User } from '@/lib/supabase/types';

interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  addUser: (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  inviteUser: (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  loading: false,
  error: null,

  setError: (error) => set({ error }),

  fetchUsers: async () => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`/api/users/list?t=${new Date().getTime()}`);
      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      set({ users: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addUser: async (userData) => {
    // This should probably also use an API or be removed if we only use invite
    // For now, let's leave it but warn or redirect to invite logic if needed
    // But the plan says "Update UserFormModal to send invitations instead of direct creation"
    // So addUser might be legacy or used for direct creation without invite?
    // Let's keep it but maybe update it to use API if we want consistent metadata?
    // For now, I'll leave addUser as is (using DB) but it might fail RLS.
    // However, the UI uses inviteUser for "add" mode.
    // So I'll focus on fetchUsers and inviteUser.

    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([userData])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        users: [...state.users, data as User],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  inviteUser: async (userData) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invitation');
      }

      // Refresh users list from API
      const listResponse = await fetch(`/api/users/list?t=${new Date().getTime()}`);
      if (listResponse.ok) {
        const users = await listResponse.json();
        set({ users, loading: false });
      } else {
        // Fallback if list fails
        set({ loading: false });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateUser: async (id, updates) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch('/api/users/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update user');
      }

      // Refresh list to ensure consistency
      const listResponse = await fetch(`/api/users/list?t=${new Date().getTime()}`);
      if (listResponse.ok) {
        const users = await listResponse.json();
        set({ users, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteUser: async (id) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`/api/users/delete?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete user');
      }

      set((state) => ({
        users: state.users.filter((user) => user.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));
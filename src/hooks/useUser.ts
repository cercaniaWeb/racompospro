import { useEffect } from 'react';
import { useUserStore } from '@/store/userStore';
import { User } from '@/lib/supabase/types';

export const useUser = () => {
  const { users, loading, error, fetchUsers, addUser, inviteUser, updateUser, deleteUser, setError } = useUserStore();

  useEffect(() => {
    if (users.length === 0) {
      fetchUsers();
    }
  }, [fetchUsers, users.length]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    addUser: (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => addUser(userData),
    inviteUser: (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => inviteUser(userData),
    updateUser: (id: string, updates: Partial<User>) => updateUser(id, updates),
    deleteUser: (id: string) => deleteUser(id),
    setError
  };
};
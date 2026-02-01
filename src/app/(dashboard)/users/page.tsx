'use client';

import React, { useState } from 'react';
import UserCard from '@/components/organisms/UserCard';
import UserFormModal from '@/components/organisms/UserFormModal';
import Button from '@/components/atoms/Button';
import { useUser } from '@/hooks/useUser';
import { User } from '@/lib/supabase/types';

const UsersPage = () => {
  const { users, loading, error, inviteUser, updateUser, deleteUser } = useUser();

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleAddUser = () => {
    setModalMode('add');
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    setModalMode('edit');
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      await deleteUser(userId);
    }
  };

  const handleActivateUser = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    await updateUser(user.id, { status: newStatus });
  };

  const handleSubmitUser = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
    if (modalMode === 'add') {
      await inviteUser(userData);
    } else if (selectedUser) {
      await updateUser(selectedUser.id, userData);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
        <Button variant="primary" onClick={handleAddUser}>
          Añadir Usuario
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {loading && users.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Cargando usuarios...
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No hay usuarios registrados. Haz clic en &quot;Añadir Usuario&quot; para crear uno.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map(user => (
            <UserCard
              key={user.id}
              user={{
                ...user,
                lastActive: 'Desconocido' // You can enhance this with actual activity tracking
              }}
              onEdit={() => handleEditUser(user)}
              onDelete={() => handleDeleteUser(user.id)}
              onActivate={() => handleActivateUser(user)}
            />
          ))}
        </div>
      )}

      <UserFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmitUser}
        user={selectedUser}
        mode={modalMode}
      />
    </div>
  );
};

export default UsersPage;
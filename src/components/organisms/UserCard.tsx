import React from 'react';
import UserAvatar from '@/components/molecules/UserAvatar';
import Text from '@/components/atoms/Text';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { Store } from 'lucide-react';

interface UserCardProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'active' | 'inactive' | 'pending';
    imageUrl?: string;
    lastActive?: string;
    store_id?: string;
    store_name?: string;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  onActivate?: () => void;
  className?: string;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onDelete,
  onActivate,
  className = ''
}) => {
  const statusVariant = {
    active: 'success',
    inactive: 'secondary',
    pending: 'warning',
  }[user.status] as 'success' | 'secondary' | 'warning';

  return (
    <div className={`glass rounded-xl border border-white/10 shadow p-4 ${className}`}>
      <div className="flex items-center">
        <UserAvatar
          name={user.name}
          imageUrl={user.imageUrl}
          status={user.status === 'active' ? 'online' : 'offline'}
        />

        <div className="ml-4 flex-1">
          <div className="flex items-center">
            <Text variant="h6" className="font-semibold">{user.name}</Text>
            <Badge variant={statusVariant} className="ml-2">{user.status}</Badge>
          </div>
          <Text variant="caption" className="text-muted-foreground">{user.email}</Text>
          <div className="mt-1">
            <Badge variant="secondary">{user.role}</Badge>
          </div>

          {/* Store Information */}
          <div className="flex items-center gap-1 mt-2">
            <Store className="h-3 w-3 text-gray-400" />
            <Text variant="caption" className="text-gray-400">
              {user.store_name || 'Sin asignar'}
            </Text>
          </div>

          {user.lastActive && (
            <Text variant="caption" className="text-muted-foreground mt-1 block">
              Última actividad: {user.lastActive}
            </Text>
          )}
        </div>

        <div className="flex space-x-2">
          {onEdit && (
            <Button variant="secondary" size="sm" onClick={onEdit}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Button>
          )}

          {onDelete && (
            <Button variant="danger" size="sm" onClick={onDelete}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          )}

          {user.status !== 'active' && onActivate && (
            <Button variant="success" size="sm" onClick={onActivate}>
              Activar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserCard;
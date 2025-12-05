import React from 'react';
import Image from '@/components/atoms/Image';
import Text from '@/components/atoms/Text';

interface UserAvatarProps {
  name: string;
  imageUrl?: string;
  status?: 'online' | 'offline' | 'busy';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  imageUrl,
  status,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    busy: 'bg-red-500',
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          width={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
          height={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
          className={`${sizeClasses[size]} rounded-full object-cover border border-border`}
        />
      ) : (
        <div className={`${sizeClasses[size]} rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium`}>
          {name.charAt(0).toUpperCase()}
        </div>
      )}

      {status && (
        <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-background ${statusColors[status]}`} />
      )}
    </div>
  );
};

export default UserAvatar;
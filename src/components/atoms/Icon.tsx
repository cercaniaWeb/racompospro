import React from 'react';

interface IconProps {
  icon: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Icon: React.FC<IconProps> = ({ 
  icon, 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <span className={`${sizeClasses[size]} ${className}`}>
      {icon}
    </span>
  );
};

export default Icon;
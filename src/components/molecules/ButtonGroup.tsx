import React from 'react';

interface ButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({ 
  children, 
  orientation = 'horizontal', 
  className = '' 
}) => {
  const orientationClasses = orientation === 'vertical' 
    ? 'flex-col space-y-2' 
    : 'flex space-x-2';

  return (
    <div className={`inline-flex ${orientationClasses} ${className}`} role="group">
      {children}
    </div>
  );
};

export default ButtonGroup;
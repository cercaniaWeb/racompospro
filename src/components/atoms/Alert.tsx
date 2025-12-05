import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({ 
  children, 
  variant = 'info', 
  onClose, 
  className = '' 
}) => {
  const variantClasses = {
    success: 'bg-green-50 border-green-200 text-green-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  return (
    <div 
      className={`border p-4 rounded-md ${variantClasses[variant]} ${className}`}
      role="alert"
    >
      <div className="flex justify-between">
        <div>{children}</div>
        {onClose && (
          <button 
            type="button" 
            className="ml-4 text-current hover:text-current focus:outline-none"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
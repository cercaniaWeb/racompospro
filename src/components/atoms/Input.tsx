import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const inputClasses = `flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm
    ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium
    placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2
    focus-visible:ring-ring focus-visible:ring-offset-2
    disabled:cursor-not-allowed disabled:opacity-50
    ${error ? 'border-destructive' : ''}
    ${className}`;

  return (
    <div className={`w-full group ${containerClassName}`}>
      <div className="relative">
        <input
          className={`peer w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pt-5 pb-2 text-white placeholder-transparent focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-white/10 transition-all duration-300 ${error ? 'border-destructive/50 focus:border-destructive' : ''} ${className}`}
          placeholder={label || 'Input'}
          {...props}
        />
        {label && (
          <label className="absolute left-4 top-1 text-xs text-white/50 transition-all duration-300 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs peer-focus:text-primary pointer-events-none">
            {label}
          </label>
        )}
        {icon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-white/40 peer-focus:text-primary transition-colors">
            {icon}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-destructive font-medium ml-1">{error}</p>}
    </div>
  );
};

export default Input;
import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const Label: React.FC<LabelProps> = ({
  children,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <label
      className={`block text-sm font-medium text-foreground ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
};

export default Label;
import React from 'react';
import Input from '@/components/atoms/Input';
import Label from '@/components/atoms/Label';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
  containerClassName?: string;
}

const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  error, 
  required, 
  containerClassName = '',
  ...inputProps 
}) => {
  return (
    <div className={`w-full ${containerClassName}`}>
      <Label htmlFor={inputProps.id} required={required}>
        {label}
      </Label>
      <Input 
        {...inputProps} 
        error={error}
        containerClassName="mt-1"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default InputField;
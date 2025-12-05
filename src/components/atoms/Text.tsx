import React from 'react';

interface TextProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle' | 'body' | 'caption' | 'overline' | 'sm' | 'xs';
  className?: string;
}

const Text: React.FC<TextProps> = ({
  variant = 'body',
  className = '',
  children,
  ...props
}) => {
  const variantClasses = {
    h1: 'text-4xl font-bold tracking-tight',
    h2: 'text-3xl font-bold tracking-tight',
    h3: 'text-2xl font-bold tracking-tight',
    h4: 'text-xl font-bold tracking-tight',
    h5: 'text-lg font-bold',
    h6: 'text-base font-bold',
    subtitle: 'text-lg',
    body: 'text-base',
    caption: 'text-sm text-muted-foreground',
    overline: 'text-xs uppercase tracking-wide',
    sm: 'text-sm',
    xs: 'text-xs',
  };

  const headingVariants = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

  if (headingVariants.includes(variant)) {
    const Tag = variant as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    return (
      <Tag
        className={`${variantClasses[variant as keyof typeof variantClasses]} ${className}`}
        {...props}
      >
        {children}
      </Tag>
    );
  }

  return (
    <span
      className={`${variantClasses[variant as keyof typeof variantClasses]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Text;
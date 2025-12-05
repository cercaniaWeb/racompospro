'use client';

import React from 'react';
import AuthLayout from '@/components/templates/AuthLayout';
import AuthInitializer from '@/components/templates/AuthInitializer';

interface AuthLayoutPageProps {
  children: React.ReactNode;
}

const AuthLayoutPage: React.FC<AuthLayoutPageProps> = ({ children }) => {
  return (
    <AuthLayout>
      <AuthInitializer>
        {children}
      </AuthInitializer>
    </AuthLayout>
  );
};

export default AuthLayoutPage;
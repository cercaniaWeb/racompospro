'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import LoginForm from '@/components/organisms/LoginForm';

const LoginPage = () => {
  const router = useRouter();
  const { login, loading, error } = useAuthStore();

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      // Redirect to dashboard after successful login
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Login failed:', err);
      // Error is handled by the store
    }
  };

  return (
    <LoginForm
      onLogin={handleLogin}
      loading={loading}
      error={error || undefined}
    />
  );
};

export default LoginPage;
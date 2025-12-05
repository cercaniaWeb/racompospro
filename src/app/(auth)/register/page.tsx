'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import InputField from '@/components/molecules/InputField';
import Button from '@/components/atoms/Button';
import Text from '@/components/atoms/Text';
import Alert from '@/components/atoms/Alert';

const RegisterPage = () => {
  const router = useRouter();
  const { register, loading, error, setError } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      await register(name, email, password);
      // After successful registration, redirect to login
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Registration failed:', err);
      // Error is handled by the store
    }
  };

  return (
    <div className="max-w-md w-full space-y-8">
      <div>
        <Text variant="h3" className="text-center text-3xl font-extrabold text-gray-900">
          Crear cuenta
        </Text>
        <Text variant="body" className="mt-2 text-center text-sm text-gray-600">
          Ingresa tus datos para crear una nueva cuenta
        </Text>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <div className="space-y-4">
          <InputField
            id="name"
            label="Nombre completo"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Tu nombre completo"
          />

          <InputField
            id="email"
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="tu@ejemplo.com"
          />

          <InputField
            id="password"
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />

          <InputField
            id="confirmPassword"
            label="Confirmar contraseña"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>

        <div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            variant="primary"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
        </div>

        <div className="text-center text-sm text-gray-600">
          ¿Ya tienes una cuenta?{' '}
          <a href="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Inicia sesión aquí
          </a>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;
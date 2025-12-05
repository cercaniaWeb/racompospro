'use client';

import React, { useState } from 'react';
import InputField from '@/components/molecules/InputField';
import Button from '@/components/atoms/Button';
import Text from '@/components/atoms/Text';
import Alert from '@/components/atoms/Alert';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Here we would handle the actual password reset logic
    console.log('Password reset request for:', email);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setError('');
    }, 1000);
  };

  return (
    <div className="max-w-md w-full space-y-8">
      <div>
        <Text variant="h3" className="text-center text-3xl font-extrabold text-gray-900">
          Recuperar contraseña
        </Text>
        <Text variant="body" className="mt-2 text-center text-sm text-gray-600">
          Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña
        </Text>
      </div>
      
      {!submitted ? (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <Alert variant="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          
          <InputField
            id="email"
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="tu@ejemplo.com"
          />

          <div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              variant="primary"
            >
              {loading ? 'Enviando...' : 'Enviar instrucciones'}
            </Button>
          </div>
          
          <div className="text-center text-sm text-gray-600">
            <a href="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Volver al inicio de sesión
            </a>
          </div>
        </form>
      ) : (
        <div className="mt-8 space-y-6">
          <Alert variant="success" onClose={() => setSubmitted(false)}>
            ¡Instrucciones para restablecer tu contraseña han sido enviadas a {email}!
          </Alert>
          <div className="text-center text-sm text-gray-600">
            <a href="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Volver al inicio de sesión
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgotPasswordPage;
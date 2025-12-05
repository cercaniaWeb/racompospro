import React, { useState } from 'react';
import Button from '@/components/atoms/Button';
import { AlertCircle } from 'lucide-react';

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  loading?: boolean;
  error?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, loading = false, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {/* Glass Card Container */}
      <div className="glass rounded-2xl p-8 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-200 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Email Input */}
        <div className="space-y-2 mb-5">
          <label htmlFor="email" className="block text-sm font-medium text-foreground/90">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="tu@ejemplo.com"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 hover:bg-white/10"
          />
        </div>

        {/* Password Input */}
        <div className="space-y-2 mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-foreground/90">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 hover:bg-white/10"
          />
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50 focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-foreground/80 cursor-pointer select-none">
              Recordarme
            </label>
          </div>

          <a href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          fullWidth
          disabled={loading}
          variant="primary"
          size="lg"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Iniciando sesión...
            </>
          ) : (
            'Iniciar sesión'
          )}
        </Button>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            ¿No tienes una cuenta?{' '}
            <a href="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Regístrate aquí
            </a>
          </p>
        </div>
      </div>

      {/* Additional Help Text */}
      <p className="text-center text-xs text-muted-foreground/60">
        Al iniciar sesión, aceptas nuestros términos de servicio y política de privacidad
      </p>
    </form>
  );
};

export default LoginForm;
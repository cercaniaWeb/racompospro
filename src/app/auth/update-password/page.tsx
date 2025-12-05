'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import { useAuthStore } from '@/store/authStore';

export default function UpdatePasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { initialize } = useAuthStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            // Password updated successfully
            // Initialize auth store to get user role
            await initialize();
            const user = useAuthStore.getState().user;

            if (user?.role === 'cajera') {
                router.push('/pos');
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            console.error('Error updating password:', err);
            setError(err.message || 'Error al actualizar la contraseña');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md bg-card p-8 rounded-xl border border-border shadow-lg">
                <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
                    Establecer Contraseña
                </h1>
                <p className="text-muted-foreground text-center mb-6">
                    Por favor, establece una nueva contraseña para tu cuenta.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Nueva Contraseña"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Mínimo 6 caracteres"
                    />

                    <Input
                        label="Confirmar Contraseña"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Repite la contraseña"
                    />

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        isLoading={loading}
                    >
                        Actualizar Contraseña e Ingresar
                    </Button>
                </form>
            </div>
        </div>
    );
}

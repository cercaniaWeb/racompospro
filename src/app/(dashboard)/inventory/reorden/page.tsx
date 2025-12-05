'use client';

import React from 'react';
import SmartReorderList from '@/features/orders/SmartReorderList';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/routes';
import { LogOut, Home } from 'lucide-react';

export default function ReordenInteligentePage() {
    const { logout, user } = useAuthStore();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
            {/* Header con logout */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push(ROUTES.DASHBOARD)}
                            className="bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors text-xs"
                        >
                            ← Dashboard
                        </button>
                        <h1 className="text-3xl font-bold text-gradient">Reorden Inteligente</h1>
                    </div>

                    {user && (
                        <button
                            onClick={handleLogout}
                            className="glass rounded-xl px-4 py-2 border border-white/10 hover:bg-white/10 hover:border-red-500/30 transition-all group flex items-center gap-2"
                        >
                            <LogOut className="h-5 w-5 text-muted-foreground group-hover:text-red-400 transition-colors" />
                            <span className="text-sm font-medium text-foreground group-hover:text-red-400 transition-colors">
                                Cerrar sesión
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Contenido */}
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 glass rounded-2xl p-6 border border-white/10">
                    <p className="text-muted-foreground">
                        El sistema detecta automáticamente productos con stock crítico y sugiere cantidades a reordenar
                        basadas en el nivel mínimo configurado. Todo funciona completamente offline.
                    </p>
                </div>

                <SmartReorderList />
            </div>
        </div>
    );
}

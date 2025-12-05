'use client';
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/roles';
import { useRouter } from 'next/navigation';

interface RoleGuardProps {
    children: React.ReactNode;
    roles: UserRole[];
    fallback?: React.ReactNode;
    redirectTo?: string;
}

/**
 * Componente para proteger secciones según roles de usuario
 * Solo renderiza children si el usuario tiene uno de los roles permitidos
 */
export default function RoleGuard({
    children,
    roles,
    fallback = null,
    redirectTo
}: RoleGuardProps) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    // Mostrar loading mientras se verifica el usuario
    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Si no hay usuario, mostrar fallback o redirigir
    if (!user) {
        if (redirectTo) {
            router.push(redirectTo);
            return null;
        }
        return <>{fallback}</>;
    }

    // Verificar si el usuario tiene uno de los roles permitidos
    const hasAccess = roles.includes(user.role);

    if (!hasAccess) {
        if (redirectTo) {
            router.push(redirectTo);
            return null;
        }

        // Mostrar mensaje de acceso denegado si no hay fallback personalizado
        if (!fallback) {
            return (
                <div className="flex items-center justify-center p-8">
                    <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 max-w-md">
                        <h3 className="text-red-400 font-bold text-lg mb-2">Acceso Denegado</h3>
                        <p className="text-gray-300">
                            No tienes permisos para acceder a esta sección.
                        </p>
                    </div>
                </div>
            );
        }

        return <>{fallback}</>;
    }

    // Usuario tiene acceso, renderizar children
    return <>{children}</>;
}

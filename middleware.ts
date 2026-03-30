import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { PROTECTED_ROUTES, canAccessRoute, UserRole, normalizeRole } from './src/types/roles';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Rutas públicas que no requieren autenticación
    const publicRoutes = ['/login', '/register', '/forgot-password', '/'];

    if (publicRoutes.includes(pathname)) {
        return NextResponse.next();
    }

    try {
        // Actualizar sesión y obtener usuario
        const { supabase, response, user } = await updateSession(request);

        if (!user) {
            // No hay sesión, redirigir a login
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            url.searchParams.set('redirectTo', pathname);
            return NextResponse.redirect(url);
        }

        // Obtener rol del usuario desde metadata o DB
        let userRole: UserRole = 'admin'; // Default
        const rawMetadataRole = user.user_metadata?.role;
        
        if (rawMetadataRole) {
            userRole = normalizeRole(rawMetadataRole);
        } else {
            // Intentar obtener desde la base de datos
            const { data: userData } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            if (userData?.role) {
                userRole = normalizeRole(userData.role);
            }
        }

        // Verificar si el usuario puede acceder a esta ruta
        const hasAccess = canAccessRoute(userRole, pathname);

        if (!hasAccess) {
            // Redirigir a página apropiada según el rol
            const url = request.nextUrl.clone();

            if (userRole === 'cajero') {
                url.pathname = '/pos';
            } else if (userRole === 'grte') {
                url.pathname = '/reports';
            } else {
                url.pathname = '/';
            }

            return NextResponse.redirect(url);
        }

        // Usuario tiene acceso, continuar con la respuesta actualizada (cookies)
        return response;

    } catch (error) {
        console.error('Middleware error:', error);

        // En caso de error, redirigir a login
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }
}

// Configurar qué rutas pasan por el middleware
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|login|register|forgot-password).*)',
    ],
};

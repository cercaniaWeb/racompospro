import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PROTECTED_ROUTES, canAccessRoute, UserRole } from './src/types/roles';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Rutas públicas que no requieren autenticación
    const publicRoutes = ['/login', '/register', '/forgot-password', '/'];

    if (publicRoutes.includes(pathname)) {
        return NextResponse.next();
    }

    // Obtener token de la sesión
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
        // Verificar si hay una sesión activa
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
            // No hay sesión, redirigir a login
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            url.searchParams.set('redirectTo', pathname);
            return NextResponse.redirect(url);
        }

        // Obtener rol del usuario desde metadata o DB
        let userRole: UserRole = 'cajero'; // Default

        if (session.user.user_metadata?.role) {
            userRole = session.user.user_metadata.role as UserRole;
        } else {
            // Intentar obtener desde la base de datos
            const { data: userData } = await supabase
                .from('users')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (userData?.role) {
                userRole = userData.role as UserRole;
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

        // Usuario tiene acceso, continuar
        return NextResponse.next();

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

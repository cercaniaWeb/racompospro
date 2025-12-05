/**
 * Tipos y constantes para el sistema de roles y permisos
 */

export type UserRole = 'admin' | 'grte' | 'cajero';

export interface Permission {
    resource: string;
    action: 'view' | 'create' | 'update' | 'delete' | 'manage';
    scope?: 'all' | 'own_store' | 'own';
}

export const ROLE_LABELS: Record<UserRole, string> = {
    admin: 'Administrador',
    grte: 'Gerente',
    cajero: 'Cajero'
};

/**
 * Definición de permisos por rol
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
    admin: [
        '*', // Acceso total
    ],
    grte: [
        'view:own_store:products',
        'manage:own_store:inventory',
        'view:own_store:sales',
        'view:own_store:reports',
        'manage:own_store:users',
        'view:own_store:transfers',
        'create:own_store:transfers',
        'view:own_store:expenses',
        'create:own_store:agenda',
        'view:own_store:customers',
        'manage:own_store:customers',
    ],
    cajero: [
        'access:pos',
        'create:sales',
        'view:own_store:products',
        'create:own_store:agenda',
        'request:shopping_list',
    ]
};

/**
 * Rutas protegidas y roles que pueden acceder
 */
export const PROTECTED_ROUTES: Record<string, UserRole[]> = {
    '/users': ['admin', 'grte'],
    '/settings': ['admin', 'grte'],
    '/reports': ['admin', 'grte'],
    '/inventory': ['admin', 'grte'],
    '/inventory/transferencias': ['admin', 'grte'],
    '/products': ['admin', 'grte'],
    '/products/nuevo': ['admin', 'grte'],
    '/expenses': ['admin', 'grte'],
    '/customers': ['admin', 'grte'],
    '/pos': ['admin', 'grte', 'cajero'],
    '/debug': ['admin'],
};

/**
 * Verifica si un rol tiene un permiso específico
 */
export function hasPermission(role: UserRole, permission: string): boolean {
    const permissions = ROLE_PERMISSIONS[role];

    // Admin tiene todos los permisos
    if (permissions.includes('*')) {
        return true;
    }

    // Verificar permiso exacto
    if (permissions.includes(permission)) {
        return true;
    }

    // Verificar permiso con wildcard (ej: 'view:own_store:*')
    const parts = permission.split(':');
    for (const perm of permissions) {
        const permParts = perm.split(':');

        if (permParts[permParts.length - 1] === '*') {
            const match = permParts.slice(0, -1).every((part, i) => part === parts[i]);
            if (match) return true;
        }
    }

    return false;
}

/**
 * Verifica si un rol puede acceder a una ruta
 */
export function canAccessRoute(role: UserRole, path: string): boolean {
    // Admin puede acceder a todo
    if (role === 'admin') {
        return true;
    }

    // Buscar coincidencia exacta
    if (PROTECTED_ROUTES[path]) {
        return PROTECTED_ROUTES[path].includes(role);
    }

    // Buscar coincidencia por prefijo
    const matchingRoute = Object.keys(PROTECTED_ROUTES).find(route =>
        path.startsWith(route)
    );

    if (matchingRoute) {
        return PROTECTED_ROUTES[matchingRoute].includes(role);
    }

    // Si no está en rutas protegidas, permitir acceso
    return true;
}

/**
 * Verifica si un usuario puede ver datos de una tienda específica
 */
export function canAccessStore(
    role: UserRole,
    userStoreId: string,
    targetStoreId: string
): boolean {
    // Admin puede ver todas las tiendas
    if (role === 'admin') {
        return true;
    }

    // Gerente y cajero solo pueden ver su tienda
    return userStoreId === targetStoreId;
}

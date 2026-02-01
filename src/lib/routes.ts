/**
 * Centralized Application Routes
 * 
 * This file contains all route constants for the application.
 * Using centralized routes provides:
 * - Type safety
 * - Easy refactoring
 * - Single source of truth
 * - Production readiness
 */

export const ROUTES = {
    // Public Routes
    HOME: '/',
    LOGIN: '/login',

    // Dashboard
    DASHBOARD: '/dashboard',

    // POS
    POS: '/pos',

    // Products
    PRODUCTS: '/products',
    PRODUCTS_NEW: '/products/nuevo',
    PRODUCTS_DETAIL: (id: string) => `/products/${id}`,

    // Inventory
    INVENTORY: '/inventory',
    INVENTORY_TRANSFERS: '/inventory/transferencias',
    INVENTORY_REORDER: '/inventory/reorden',
    INVENTORY_VOICE: '/inventory-voice',

    // Sales
    SALES: '/sales',

    // Customers
    CUSTOMERS: '/customers',

    // Reports
    REPORTS: '/reports',
    REPORTS_SALES: '/reports/ventas',

    // Expenses
    EXPENSES: '/expenses',

    // Users & Admin
    USERS: '/users',
    ADMIN_CATALOG: '/admin/catalog',
    ADMIN_ROLES: '/admin/roles',

    // Settings
    SETTINGS: '/settings',
} as const;

/**
 * API Routes (for edge functions and external APIs)
 */
export const API_ROUTES = {
    CHATBOT_QUERY: '/functions/v1/chatbot-query',
    // Add more API routes here as needed
} as const;

/**
 * External URLs
 */
export const EXTERNAL_URLS = {
    SUPABASE_DOCS: 'https://supabase.com/docs',
    GEMINI_API: 'https://makersuite.google.com/app/apikey',
    DEEPSEEK_API: 'https://platform.deepseek.com/api_keys',
    OPENAI_API: 'https://platform.openai.com/api-keys',
} as const;

/**
 * Helper function to build query string URLs
 */
export const buildQueryUrl = (route: string, params: Record<string, string | number>) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
    });
    return `${route}?${searchParams.toString()}`;
};

/**
 * Type-safe route parameters
 */
export type RouteParams = {
    productId?: string;
    storeId?: string;
    transferId?: string;
};

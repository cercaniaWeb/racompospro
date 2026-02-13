import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

// Supabase Client removed (using singleton)

interface StoreContext {
    storeId: string | null;
    storeName: string | null;
    isLoading: boolean;
    error: string | null;
}

/**
 * Hook para obtener el contexto de la tienda actual
 * Intenta obtener desde:
 * 1. localStorage (selección manual del usuario)
 * 2. user_stores (primera tienda asignada al usuario)
 * 3. Fallback a tienda por defecto
 */
export function useStoreContext(): StoreContext {
    const [context, setContext] = useState<StoreContext>({
        storeId: null,
        storeName: null,
        isLoading: true,
        error: null
    });

    useEffect(() => {
        async function fetchStoreContext() {
            try {
                // 1. Verificar localStorage primero
                const localStoreId = typeof window !== 'undefined' ? localStorage.getItem('current_store_id') : null;
                const localStoreName = typeof window !== 'undefined' ? localStorage.getItem('current_store_name') : null;

                if (localStoreId && localStoreName) {
                    setContext({
                        storeId: localStoreId,
                        storeName: localStoreName,
                        isLoading: false,
                        error: null
                    });
                    return;
                }

                // 2. Obtener usuario autenticado
                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError || !user) {
                    throw new Error('Usuario no autenticado');
                }

                // 3. Buscar tiendas asignadas al usuario
                const { data: userStores, error: userStoresError } = await supabase
                    .from('user_stores')
                    .select(`
                        store_id,
                        stores:store_id (
                            id,
                            name
                        )
                    `)
                    .eq('user_id', user.id)
                    .limit(1)
                    .single();

                if (userStoresError || !userStores) {
                    console.warn('No se encontraron tiendas asignadas, usando tienda por defecto');

                    // 4. Fallback: usar primera tienda activa
                    const { data: defaultStore, error: storeError } = await supabase
                        .from('stores')
                        .select('id, name')
                        .eq('is_active', true)
                        .limit(1)
                        .single();

                    if (storeError || !defaultStore) {
                        throw new Error('No se encontraron tiendas disponibles');
                    }

                    // Guardar en localStorage
                    localStorage.setItem('current_store_id', defaultStore.id);
                    localStorage.setItem('current_store_name', defaultStore.name);

                    setContext({
                        storeId: defaultStore.id,
                        storeName: defaultStore.name,
                        isLoading: false,
                        error: null
                    });
                    return;
                }

                const storeData = (userStores as any).stores;

                // Guardar en localStorage
                localStorage.setItem('current_store_id', storeData.id);
                localStorage.setItem('current_store_name', storeData.name);

                setContext({
                    storeId: storeData.id,
                    storeName: storeData.name,
                    isLoading: false,
                    error: null
                });

            } catch (error: any) {
                console.error('Error obteniendo contexto de tienda:', error);
                setContext(prev => ({
                    ...prev,
                    isLoading: false,
                    error: error.message || 'Error al cargar contexto de tienda'
                }));
            }
        }

        fetchStoreContext();
    }, [supabase.auth]);

    return context;
}

/**
 * Función helper para obtener el store_id de forma síncrona
 * Útil para componentes que necesitan el ID inmediatamente
 */
export function getCurrentStoreId(): string {
    if (typeof window === 'undefined') return 'default-store-id';
    const storedId = localStorage.getItem('current_store_id');
    return storedId || 'default-store-id';
}

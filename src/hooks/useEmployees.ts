import { supabase } from '@/lib/supabase/client';
import { useEffect, useState, useCallback } from 'react';
import { db } from '@/lib/db';
import { UserRole } from '@/types/roles';

// Supabase Client removed (using singleton)

export interface Employee {
    id: string;
    name: string;
    email?: string;
    role: UserRole;
    // store_id removed; use auth metadata if needed
    status: string;
    pin?: string;
}

interface UseEmployeesResult {
    employees: Employee[];
    isLoading: boolean;
    error: string | null;
    refreshEmployees: () => Promise<void>;
}

/**
 * Hook para obtener empleados desde Supabase
 * Guarda cache local en localStorage para uso offline
 */
export function useEmployees(storeId?: string): UseEmployeesResult {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEmployees = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Construir query con join a user_stores
            let query = supabase
                .from('user_profiles')
                .select(`
                    id, 
                    name, 
                    email, 
                    role, 
                    status,
                    user_stores!inner(store_id)
                `)
                .eq('status', 'active');

            // Filtrar por tienda si se proporciona
            if (storeId) {
                query = query.eq('user_stores.store_id', storeId);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) {
                throw fetchError;
            }

            const employeesList = (data || []) as Employee[];
            setEmployees(employeesList);

            // Guardar en localStorage como cache
            localStorage.setItem('employees_cache', JSON.stringify(employeesList));
            localStorage.setItem('employees_cache_time', Date.now().toString());

        } catch (err) {
            console.error('Error obteniendo empleados:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');

            // Intentar cargar desde cache si hay error
            const cachedData = localStorage.getItem('employees_cache');
            if (cachedData) {
                try {
                    setEmployees(JSON.parse(cachedData));
                } catch (parseErr) {
                    console.error('Error parseando cache de empleados:', parseErr);
                }
            }
        } finally {
            setIsLoading(false);
        }
    }, [storeId]);

    useEffect(() => {
        // Intentar cargar desde cache primero para mejor UX
        const cachedData = localStorage.getItem('employees_cache');
        const cacheTime = localStorage.getItem('employees_cache_time');

        if (cachedData && cacheTime) {
            const cacheAge = Date.now() - parseInt(cacheTime);
            // Si el cache tiene menos de 5 minutos, usarlo
            if (cacheAge < 5 * 60 * 1000) {
                try {
                    setEmployees(JSON.parse(cachedData));
                    setIsLoading(false);
                    // Pero aún así refrescar en background
                    fetchEmployees();
                    return;
                } catch (err) {
                    console.error('Error parseando cache:', err);
                }
            }
        }

        // Si no hay cache válido, fetch normal
        fetchEmployees();
    }, [fetchEmployees]);

    return {
        employees,
        isLoading,
        error,
        refreshEmployees: fetchEmployees
    };
}

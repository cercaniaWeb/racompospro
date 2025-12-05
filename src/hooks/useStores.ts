import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

interface Store {
    id: string;
    name: string;
    type: 'central' | 'branch';
    is_active: boolean;
}

export function useStores() {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStores() {
            try {
                const { data, error: fetchError } = await supabase
                    .from('stores')
                    .select('id, name, type, is_active')
                    .eq('is_active', true)
                    .order('name');

                if (fetchError) throw fetchError;

                setStores(data || []);
            } catch (err: any) {
                console.error('Error fetching stores:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchStores();
    }, []);

    return { stores, loading, error };
}

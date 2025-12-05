import { supabase } from '@/lib/supabase/client';
import { useEffect } from 'react';

/**
 * Hook to sync authenticated user from Auth to users table
 * This should be called once after successful login
 */
export const useSyncAuthUser = () => {
    useEffect(() => {
        const syncUser = async () => {

            // Get current session
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                try {
                    // Call the database function to sync the user
                    const { error } = await supabase.rpc('sync_user_from_auth');

                    if (error) {
                        console.error('Failed to sync user:', error);
                    }
                } catch (err) {
                    console.error('Error syncing user:', err);
                }
            }
        };

        syncUser();
    }, []);
};

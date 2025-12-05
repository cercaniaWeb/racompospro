'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';

export default function AuthCallbackPage() {
    const router = useRouter();
    const initialize = useAuthStore((state) => state.initialize);

    useEffect(() => {
        const handleAuthCallback = async () => {

            try {
                // Get hash parameters from URL
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                const type = hashParams.get('type');

                console.log('🔍 Hash params:', { accessToken: accessToken ? 'present' : 'missing', refreshToken: refreshToken ? 'present' : 'missing', type });

                // If we have tokens from the hash, set the session
                if (accessToken && refreshToken) {
                    console.log('✅ Tokens found in hash, setting session');

                    const { data, error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });

                    if (error) {
                        console.error('❌ Error setting session:', error);
                        router.push('/login');
                        return;
                    }

                    if (data.session) {
                        console.log('✅ Session set successfully');

                        // If it's an invite or recovery, redirect to update password
                        if (type === 'invite' || type === 'recovery') {
                            console.log('➡️ Redirecting to password update');
                            router.push('/auth/update-password');
                            return;
                        }

                        console.log('Initializing auth store');
                        await initialize();

                        // Get user role and redirect accordingly
                        const user = useAuthStore.getState().user;
                        console.log('👤 User role:', user?.role);

                        if (user?.role === 'cajera') {
                            console.log('➡️ Redirecting cashier to POS');
                            router.push('/pos');
                        } else {
                            console.log('➡️ Redirecting admin/manager to dashboard');
                            router.push('/dashboard');
                        }
                        return;
                    }
                }

                // Fallback: check for existing session
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Session error:', error);
                    router.push('/login');
                    return;
                }

                if (session) {
                    console.log('✅ Existing session detected, initializing auth store');
                    await initialize();

                    // Get user role and redirect accordingly
                    const user = useAuthStore.getState().user;
                    console.log('👤 User role:', user?.role);

                    if (user?.role === 'cajera') {
                        console.log('➡️ Redirecting cashier to POS');
                        router.push('/pos');
                    } else {
                        console.log('➡️ Redirecting admin/manager to dashboard');
                        router.push('/dashboard');
                    }
                } else {
                    console.log('⚠️ No session, redirecting to login');
                    router.push('/login');
                }
            } catch (err) {
                console.error('❌ Auth callback error:', err);
                router.push('/login');
            }
        };

        handleAuthCallback();
    }, [router, initialize]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            <div className="text-white text-lg">Procesando autenticación...</div>
        </div>
    );
}

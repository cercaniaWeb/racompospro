import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Admin client with Service Role Key
const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        global: {
            fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' })
        }
    });
};

export async function GET() {
    try {
        const supabase = getAdminClient();

        // Fetch profiles with store info in one query
        const { data: profiles, error: profilesError } = await supabase
            .from('user_profiles')
            .select(`
                *,
                user_stores (
                    store_id,
                    stores (
                        id,
                        name
                    )
                )
            `)
            .order('created_at', { ascending: false });

        if (profilesError) {
            console.error('Error listing user profiles:', profilesError);
            return NextResponse.json({ error: profilesError.message }, { status: 500 });
        }

        // Map to expected User interface with store info
        const mappedUsers = (profiles || []).map((profile: any) => {
            // Get the first store assignment if exists
            const userStore = profile.user_stores?.[0];
            const store = userStore?.stores;

            return {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                role: profile.role,
                status: profile.status,
                created_at: profile.created_at,
                updated_at: profile.updated_at,
                store_id: store?.id || null,
                store_name: store?.name || null
            };
        });

        return NextResponse.json(mappedUsers);
    } catch (error: any) {
        console.error('Unexpected error listing users:', error);
        return NextResponse.json(
            { error: error.message || 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

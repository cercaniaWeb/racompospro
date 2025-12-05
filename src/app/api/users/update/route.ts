import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Admin client with Service Role Key
const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};

export async function PUT(request: NextRequest) {
    try {
        const { id, store_id, ...updates } = await request.json();

        if (!id) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        const supabase = getAdminClient();

        console.log('🔄 Updating user:', id, 'with:', { ...updates, store_id });

        // 1. Update Auth Metadata (keep for compatibility)
        const { error: authError } = await supabase.auth.admin.updateUserById(id, {
            user_metadata: updates
        });

        if (authError) {
            console.error('Error updating auth user:', authError);
            return NextResponse.json({ error: authError.message }, { status: 500 });
        }

        // 2. Update user_profiles
        const { error: profileError } = await supabase
            .from('user_profiles')
            .update({
                name: updates.name,
                role: updates.role,
                status: updates.status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (profileError) {
            console.error('Error updating user profile:', profileError);
            return NextResponse.json({ error: 'Error updating profile: ' + profileError.message }, { status: 500 });
        }

        // 3. Update Store Assignment if provided
        if (store_id) {
            // Check if assignment exists
            const { data: existingStore } = await supabase
                .from('user_stores')
                .select('id')
                .eq('user_id', id)
                .single();

            if (existingStore) {
                // Update existing
                await supabase
                    .from('user_stores')
                    .update({ store_id: store_id })
                    .eq('user_id', id);
            } else {
                // Create new
                await supabase
                    .from('user_stores')
                    .insert({
                        user_id: id,
                        store_id: store_id
                    });
            }
        }

        return NextResponse.json({
            success: true,
            message: 'User updated successfully'
        });
    } catch (error: any) {
        console.error('Unexpected error updating user:', error);
        return NextResponse.json(
            { error: error.message || 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

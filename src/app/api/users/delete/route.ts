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

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('id');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!serviceRoleKey) {
            console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
            return NextResponse.json(
                { error: 'Server configuration error: Missing service role key' },
                { status: 500 }
            );
        }

        const supabase = getAdminClient();

        console.log('🗑️ Deleting user:', userId);

        // 1. Delete from user_profiles (and cascade to user_stores if FK set, otherwise manual)
        // We delete from profiles first to ensure app data is clean
        const { error: profileError } = await supabase
            .from('user_profiles')
            .delete()
            .eq('id', userId);

        if (profileError) {
            console.error('Error deleting user profile:', profileError);
            // Continue to auth deletion anyway
        }

        // 2. Delete user from Auth
        const { error } = await supabase.auth.admin.deleteUser(userId);

        if (error) {
            console.error('Error deleting user:', error);
            // If user not found, we can consider it a success for the UI
            if (error.message.includes('User not found') || error.status === 404) {
                console.log('⚠️ User not found in Auth, considering deleted');
                return NextResponse.json({ success: true, message: 'User already deleted' });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'User deleted successfully' });
    } catch (error: any) {
        console.error('Unexpected error deleting user:', error);
        return NextResponse.json(
            { error: error.message || 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

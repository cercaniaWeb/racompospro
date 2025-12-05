import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const { email, name, role, status, store_id } = await request.json();

        // Validate required fields
        if (!email || !name || !role) {
            return NextResponse.json(
                { error: 'Email, name, and role are required' },
                { status: 400 }
            );
        }

        const trimmedEmail = email.trim();
        console.log('📧 Processing invitation for:', trimmedEmail);

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            console.error('❌ Invalid email format:', trimmedEmail);
            return NextResponse.json(
                { error: `Invalid email format: ${trimmedEmail}` },
                { status: 400 }
            );
        }
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        const supabase = getAdminClient();

        // Send invitation using Supabase Auth Admin API
        const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
            data: {
                name,
                role,
                status: status || 'pending',
                store_id: store_id || null
            },
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`
        });

        if (error) {
            console.error('Invitation error:', error);
            return NextResponse.json(
                { error: error.message || 'Failed to send invitation' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Invitation sent to ${email}`,
            user: data.user
        });

    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: error.message || 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

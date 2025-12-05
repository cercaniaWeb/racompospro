import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = createClient();

        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get IP address from headers
        const ip = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';

        const userAgent = request.headers.get('user-agent') || 'unknown';
        const latitude = request.headers.get('x-vercel-ip-latitude');
        const longitude = request.headers.get('x-vercel-ip-longitude');

        // Detect IP version
        let ipVersion = 'unknown';
        if (ip && ip.includes(':')) {
            ipVersion = 'IPv6';
        } else if (ip && ip.includes('.')) {
            ipVersion = 'IPv4';
        }

        // Insert log
        const { error } = await supabase
            .from('user_logs')
            .insert({
                user_id: session.user.id,
                ip_address: ip,
                user_agent: userAgent,
                action: 'login',
                latitude,
                longitude,
                ip_version: ipVersion
            });

        if (error) {
            console.error('Error logging IP:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in log-ip route:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

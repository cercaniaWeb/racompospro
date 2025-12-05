import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { transfer_id, user_id } = await request.json();

        if (!transfer_id || !user_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Get transfer details
        const { data: transfer, error: transferError } = await supabase
            .from('transfers')
            .select('*')
            .eq('id', transfer_id)
            .single();

        if (transferError || !transfer) {
            return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
        }

        if (transfer.status !== 'pending') {
            return NextResponse.json(
                { error: `Transfer cannot be shipped. Current status: ${transfer.status}` },
                { status: 400 }
            );
        }

        // 2. Validate User Authorization (User must belong to origin store)
        const { data: userStore, error: authError } = await supabase
            .from('user_stores')
            .select('id')
            .eq('user_id', user_id)
            .eq('store_id', transfer.origin_store_id)
            .single();

        if (authError || !userStore) {
            return NextResponse.json(
                { error: 'Unauthorized: User does not belong to origin store' },
                { status: 403 }
            );
        }

        // 3. Update Status to 'in_transit'
        const { error: updateError } = await supabase
            .from('transfers')
            .update({
                status: 'in_transit',
                shipped_at: new Date().toISOString(), // Keep shipped_at as it makes sense for 'in_transit'
                updated_at: new Date().toISOString()
            })
            .eq('id', transfer_id);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error shipping transfer:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

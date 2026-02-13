import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Admin client with Service Role Key
const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!serviceRoleKey) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { origin_store_id, destination_store_id, notes, items, created_by } = body;

        if (!origin_store_id || !destination_store_id || !items || items.length === 0 || !created_by) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const supabase = getAdminClient();

        // 1. Validate User Authorization (User must belong to origin store)
        const { data: userStore, error: authError } = await supabase
            .from('user_stores')
            .select('id')
            .eq('user_id', created_by)
            .eq('store_id', origin_store_id)
            .single();

        if (authError || !userStore) {
            return NextResponse.json(
                { error: 'Unauthorized: User does not belong to origin store' },
                { status: 403 }
            );
        }

        // 2. Validate items (Check if they exist in origin, but don't deduct yet)
        // Note: For a "Request" flow, the solicitor (Origin) just lists what they want.
        // We will validate that products exist in the system.
        for (const item of items) {
            const { data: product, error: pError } = await supabase
                .from('products')
                .select('id, name')
                .eq('id', item.product_id)
                .single();

            if (pError || !product) {
                return NextResponse.json(
                    { error: `Product ${item.product_id} not found` },
                    { status: 400 }
                );
            }
        }

        // 3. Create Transfer Header
        const { data: transfer, error: transferError } = await supabase
            .from('transfers')
            .insert({
                origin_store_id,
                destination_store_id,
                notes,
                status: 'pending', // Initial status
                created_by
            })
            .select()
            .single();

        if (transferError) {
            console.error('Error creating transfer header:', transferError);
            return NextResponse.json({ error: transferError.message }, { status: 500 });
        }

        // 4. Create Transfer Items
        const itemsToInsert = items.map((item: any) => ({
            transfer_id: transfer.id,
            product_id: item.product_id,
            quantity: item.quantity
        }));

        const { error: itemsError } = await supabase
            .from('transfer_items')
            .insert(itemsToInsert);

        if (itemsError) {
            console.error('Error creating transfer items:', itemsError);
            return NextResponse.json({ error: itemsError.message }, { status: 500 });
        }

        // 5. Send Notification to Destination Store (Provider)
        try {
            const { data: originStore } = await supabase
                .from('stores')
                .select('name')
                .eq('id', origin_store_id)
                .single();

            const title = 'Nueva Solicitud de Mercancía';
            const body = `La sucursal ${originStore?.name || 'Origen'} solicita productos.`;
            const url = '/inventory/transferencias';

            // We use a separate background process or just wait for it here 
            // since it's an edge function/route
            const { sendTransferNotification } = await import('@/lib/notifications');
            await sendTransferNotification(destination_store_id, title, body, url);
        } catch (notifyError) {
            console.error('Notification error (ignoring to not fail transfer):', notifyError);
        }

        return NextResponse.json(transfer);
    } catch (error: any) {
        console.error('Unexpected error creating transfer:', error);
        return NextResponse.json(
            { error: error.message || 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

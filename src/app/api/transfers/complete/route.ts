import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    console.log('[TRANSFER API] Starting transfer completion...');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const { transfer_id, user_id, received_items } = await request.json();
        console.log('[TRANSFER API] Received:', { transfer_id, user_id, received_items });

        if (!transfer_id || !user_id) {
            console.error('[TRANSFER API] Missing required fields');
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Get transfer details and items
        const { data: transfer, error: transferError } = await supabase
            .from('transfers')
            .select('*, items:transfer_items(*)')
            .eq('id', transfer_id)
            .single();

        console.log('[TRANSFER API] Transfer data:', transfer, 'Error:', transferError);

        if (transferError || !transfer) {
            throw new Error('Transfer not found');
        }

        if (transfer.status === 'completed') {
            console.log('[TRANSFER API] Transfer already completed');
            return NextResponse.json({ error: 'Transfer already completed' }, { status: 400 });
        }

        // Use received items if provided (from the checklist modal), fallback to transfer items
        const itemsToProcess = received_items || transfer.items.map((item: any) => ({
            product_id: item.product_id,
            received_quantity: item.quantity
        }));

        // 1.5 Validate User Authorization (User must belong to ORIGIN store as they are receiving the goods)
        const { data: userStore, error: authError } = await supabase
            .from('user_stores')
            .select('id')
            .eq('user_id', user_id)
            .eq('store_id', transfer.origin_store_id)
            .single();

        if (authError || !userStore) {
            return NextResponse.json(
                { error: 'Unauthorized: User does not belong to solicitor (origin) store' },
                { status: 403 }
            );
        }

        // 2. Update inventory for each item (In Origin Store)
        console.log('[TRANSFER API] Updating inventory for', itemsToProcess.length, 'items in ORIGIN store...');
        for (const item of itemsToProcess) {
            // Check if inventory record exists for origin store
            const { data: inventoryItem } = await supabase
                .from('inventory')
                .select('*')
                .eq('store_id', transfer.origin_store_id)
                .eq('product_id', item.product_id)
                .single();

            if (inventoryItem) {
                // Update existing inventory
                console.log('[TRANSFER API] Updating existing inventory in ORIGIN for product', item.product_id);
                await supabase
                    .from('inventory')
                    .update({
                        stock: inventoryItem.stock + item.received_quantity,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', inventoryItem.id);
            } else {
                // Create new inventory record
                console.log('[TRANSFER API] Creating new inventory record in ORIGIN for product', item.product_id);
                const { data: product } = await supabase
                    .from('products')
                    .select('min_stock')
                    .eq('id', item.product_id)
                    .single();

                await supabase
                    .from('inventory')
                    .insert({
                        store_id: transfer.origin_store_id,
                        product_id: item.product_id,
                        stock: item.received_quantity,
                        min_stock: product?.min_stock || 0,
                        is_active: true
                    });
            }
        }

        // 3. Update transfer status
        console.log('[TRANSFER API] Updating transfer status to completed...');
        const { error: updateError } = await supabase
            .from('transfers')
            .update({
                status: 'completed',
                updated_at: new Date().toISOString()
            })
            .eq('id', transfer_id);

        if (updateError) {
            console.error('[TRANSFER API] Error updating status:', updateError);
            throw updateError;
        }

        // 4. Send Notification to Destination Store (Provider)
        try {
            const { data: originStore } = await supabase
                .from('stores')
                .select('name')
                .eq('id', transfer.origin_store_id)
                .single();

            const title = 'Transferencia Recibida';
            const body = `La sucursal ${originStore?.name || 'Solicitante'} ha confirmado la recepción del pedido.`;
            const url = '/inventory/transferencias';

            const { sendTransferNotification } = await import('@/lib/notifications');
            await sendTransferNotification(transfer.destination_store_id, title, body, url);
        } catch (notifyError) {
            console.error('Notification error (ignoring):', notifyError);
        }

        console.log('[TRANSFER API] Transfer completed successfully!');
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[TRANSFER API] Error completing transfer:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

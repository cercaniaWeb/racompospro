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

        // 1. Get transfer details and items
        const { data: transfer, error: transferError } = await supabase
            .from('transfers')
            .select('*, items:transfer_items(*)')
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

        // 2. Validate User Authorization (User must belong to DESTINATION store as they are providing the goods)
        const { data: userStore, error: authError } = await supabase
            .from('user_stores')
            .select('id')
            .eq('user_id', user_id)
            .eq('store_id', transfer.destination_store_id)
            .single();

        if (authError || !userStore) {
            return NextResponse.json(
                { error: 'Unauthorized: User does not belong to provider (destination) store' },
                { status: 403 }
            );
        }

        // 3. Check Stock & Deduct from Destination Store
        for (const item of transfer.items) {
            const { data: inventory, error: stockError } = await supabase
                .from('inventory')
                .select('id, stock')
                .eq('store_id', transfer.destination_store_id)
                .eq('product_id', item.product_id)
                .single();

            if (stockError || !inventory) {
                return NextResponse.json(
                    { error: `Product ${item.product_id} not found in provider's inventory` },
                    { status: 400 }
                );
            }

            if (inventory.stock < item.quantity) {
                return NextResponse.json(
                    { error: `Insufficient stock in provider's store for product ${item.product_id}. Available: ${inventory.stock}` },
                    { status: 400 }
                );
            }

            // Deduct stock from Provider (Destination)
            const { error: updateError } = await supabase
                .from('inventory')
                .update({ stock: inventory.stock - item.quantity, updated_at: new Date().toISOString() })
                .eq('id', inventory.id);

            if (updateError) {
                throw new Error(`Failed to update stock for ${item.product_id}`);
            }
        }

        // 4. Update Status to 'in_transit'
        const { error: finalUpdateError } = await supabase
            .from('transfers')
            .update({
                status: 'in_transit',
                updated_at: new Date().toISOString()
            })
            .eq('id', transfer_id);

        if (finalUpdateError) {
            throw finalUpdateError;
        }

        // 5. Send Notification to Origin Store (Solicitor)
        try {
            const { data: destStore } = await supabase
                .from('stores')
                .select('name')
                .eq('id', transfer.destination_store_id)
                .single();

            const title = 'Mercancía en Camino';
            const body = `La sucursal ${destStore?.name || 'Proveedor'} ha enviado tu pedido.`;
            const url = '/inventory/transferencias';

            const { sendTransferNotification } = await import('@/lib/notifications');
            await sendTransferNotification(transfer.origin_store_id, title, body, url);
        } catch (notifyError) {
            console.error('Notification error (ignoring):', notifyError);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error shipping transfer:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

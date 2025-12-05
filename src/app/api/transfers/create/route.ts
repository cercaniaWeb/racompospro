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

        // 2. Check Stock & Deduct Inventory (Atomic-ish via loop, ideally RPC but doing in code for now)
        for (const item of items) {
            const { data: inventory, error: stockError } = await supabase
                .from('inventory')
                .select('id, stock')
                .eq('store_id', origin_store_id)
                .eq('product_id', item.product_id)
                .single();

            if (stockError || !inventory) {
                return NextResponse.json(
                    { error: `Product ${item.name || item.product_id} not found in origin inventory` },
                    { status: 400 }
                );
            }

            if (inventory.stock < item.quantity) {
                return NextResponse.json(
                    { error: `Insufficient stock for ${item.name || item.product_id}. Available: ${inventory.stock}` },
                    { status: 400 }
                );
            }

            // Deduct stock
            const { error: updateError } = await supabase
                .from('inventory')
                .update({ stock: inventory.stock - item.quantity, updated_at: new Date().toISOString() })
                .eq('id', inventory.id);

            if (updateError) {
                throw new Error(`Failed to update stock for ${item.product_id}`);
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
            // Note: In a real production app, we should rollback inventory changes here.
            // For now, we assume consistency or manual fix if this rare edge case happens.
            return NextResponse.json({ error: itemsError.message }, { status: 500 });
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

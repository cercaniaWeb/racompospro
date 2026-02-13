import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useNotifications } from '@/store/notificationStore';
import { Transfer, TransferItem } from '@/lib/supabase/types';

export interface CreateTransferData {
    origin_store_id: string;
    destination_store_id: string;
    notes?: string;
    items: {
        product_id: string;
        quantity: number;
    }[];
}

export function useTransfer() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { notify } = useNotifications();

    const fetchTransfers = useCallback(async (storeId?: string) => {
        setLoading(true);
        setError(null);
        try {
            let query = supabase
                .from('transfers')
                .select(`
                    *,
                    origin_store:stores!origin_store_id(name),
                    destination_store:stores!destination_store_id(name),
                    items:transfer_items(
                        *,
                        product:products(name, sku)
                    )
                `)
                .order('created_at', { ascending: false });

            if (storeId) {
                query = query.or(`origin_store_id.eq.${storeId},destination_store_id.eq.${storeId}`);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data;
        } catch (err: any) {
            console.error('Error fetching transfers:', err);
            setError(err.message);
            // notify.error('Error', 'No se pudieron cargar las transferencias'); // Removed to prevent spam
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const createTransfer = useCallback(async (data: CreateTransferData) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuario no autenticado');

            // 2. Call API to create transfer
            const response = await fetch('/api/transfers/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    origin_store_id: data.origin_store_id,
                    destination_store_id: data.destination_store_id,
                    notes: data.notes,
                    items: data.items,
                    created_by: user.id
                }),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to create transfer');
            }

            const transfer = await response.json();

            notify.success('Éxito', 'Transferencia creada correctamente');
            return transfer;
        } catch (err: any) {
            console.error('Error creating transfer:', err);
            setError(err.message);
            notify.error('Error', 'No se pudo crear la transferencia');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [notify]);

    const updateStatus = useCallback(async (id: string, status: Transfer['status']) => {
        console.log('[useTransfer] updateStatus called with:', { id, status });
        setLoading(true);
        setError(null);
        try {
            if (status === 'completed') {
                // Use API for completion to handle inventory updates
                console.log('[useTransfer] Getting user...');
                const { data: { user } } = await supabase.auth.getUser();
                console.log('[useTransfer] User:', user);
                if (!user) throw new Error('Usuario no autenticado');

                console.log('[useTransfer] Making fetch call to /api/transfers/complete...');
                const response = await fetch('/api/transfers/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transfer_id: id, user_id: user.id })
                });

                console.log('[useTransfer] Response status:', response.status, response.statusText);
                if (!response.ok) {
                    const result = await response.json();
                    console.error('[useTransfer] API error:', result);
                    throw new Error(result.error || 'Failed to complete transfer');
                }
                console.log('[useTransfer] API call successful');
            } else {
                // Standard status update
                console.log('[useTransfer] Updating status via Supabase...');
                const { error } = await supabase
                    .from('transfers')
                    .update({ status })
                    .eq('id', id);

                if (error) throw error;
                console.log('[useTransfer] Supabase update successful');
            }

            notify.success('Éxito', `Estado actualizado a ${status}`);
        } catch (err: any) {
            console.error('Error updating transfer status:', err);
            setError(err.message);
            notify.error('Error', 'No se pudo actualizar el estado');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [notify]);

    const shipTransfer = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuario no autenticado');

            const response = await fetch('/api/transfers/ship', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transfer_id: id, user_id: user.id })
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to ship transfer');
            }

            notify.success('Éxito', 'Transferencia enviada correctamente');
        } catch (err: any) {
            console.error('Error shipping transfer:', err);
            setError(err.message);
            notify.error('Error', 'No se pudo enviar la transferencia');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [notify]);

    const completeTransfer = useCallback(async (id: string, receivedItems: { product_id: string; received_quantity: number }[]) => {
        setLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuario no autenticado');

            const response = await fetch('/api/transfers/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transfer_id: id,
                    user_id: user.id,
                    received_items: receivedItems
                })
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to complete transfer');
            }

            notify.success('Éxito', 'Transferencia completada correctamente');
        } catch (err: any) {
            console.error('Error completing transfer:', err);
            setError(err.message);
            notify.error('Error', 'No se pudo completar la transferencia');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [notify]);

    return {
        loading,
        error,
        fetchTransfers,
        createTransfer,
        updateStatus,
        shipTransfer,
        completeTransfer
    };
}

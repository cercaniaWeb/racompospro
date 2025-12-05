import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

// Supabase client (service role) – env vars must be set in the Edge Function
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Expected payload:
 * {
 *   type: 'success' | 'error' | 'warning' | 'info',
 *   title: string,
 *   message: string,
 *   target_store_id?: string
 * }
 */
serve(async (req) => {
    try {
        const { type, title, message, target_store_id } = await req.json();
        const { data, error } = await supabase.from('notifications').insert({
            type,
            title,
            message,
            target_store_id,
        });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
        console.error('publish-event error', e);
        return new Response(JSON.stringify({ error: e.message || 'unknown' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
});

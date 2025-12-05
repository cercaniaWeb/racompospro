import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3?target=deno';
import webpush from 'https://esm.sh/web-push@3.6.7?target=deno';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

if (!supabaseUrl || !supabaseServiceKey || !vapidPublicKey || !vapidPrivateKey) {
    console.error('Missing environment variables');
    throw new Error('Missing environment variables: ' +
        JSON.stringify({
            url: !!supabaseUrl,
            key: !!supabaseServiceKey,
            vapidPublic: !!vapidPublicKey,
            vapidPrivate: !!vapidPrivateKey
        })
    );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

try {
    webpush.setVapidDetails(
        'mailto:admin@example.com',
        vapidPublicKey,
        vapidPrivateKey
    );
} catch (err) {
    console.error('Error setting VAPID details:', err);
    throw err;
}

Deno.serve(async (req) => {
    try {
        // 1. Get visits for tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const startOfDay = new Date(tomorrow.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(tomorrow.setHours(23, 59, 59, 999)).toISOString();

        const { data: visits, error: visitsError } = await supabase
            .from('supplier_visits')
            .select('*, created_by')
            .gte('visit_date', startOfDay)
            .lte('visit_date', endOfDay)
            .eq('status', 'pending');

        if (visitsError) throw visitsError;

        console.log(`Found ${visits.length} visits for tomorrow`);

        const results = [];

        // 2. For each visit, find the user's subscription and send push
        for (const visit of visits) {
            if (!visit.created_by) continue;

            const { data: subscriptions, error: subsError } = await supabase
                .from('push_subscriptions')
                .select('*')
                .eq('user_id', visit.created_by);

            if (subsError) {
                console.error('Error fetching subscriptions:', subsError);
                continue;
            }

            for (const sub of subscriptions) {
                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: atob(sub.p256dh).split('').map(c => c.charCodeAt(0)),
                        auth: atob(sub.auth).split('').map(c => c.charCodeAt(0))
                    }
                };

                // Convert back to string for web-push library if needed, or use as is depending on lib version
                // The esm.sh version of web-push expects keys as strings usually
                const pushSubForLib = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh, // Stored as base64 in DB? No, we stored it as base64 encoded string
                        auth: sub.auth
                    }
                };

                // Wait, in usePushNotifications we did:
                // p256dh: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('p256dh')!))))
                // So it IS base64 string in DB.

                const payload = JSON.stringify({
                    title: 'Recordatorio de Proveedor',
                    body: `Mañana: Visita de ${visit.supplier_name} a las ${new Date(visit.visit_date).toLocaleTimeString()}`
                });

                try {
                    await webpush.sendNotification(pushSubForLib, payload);
                    results.push({ success: true, visitId: visit.id, subId: sub.id });
                } catch (err) {
                    console.error('Error sending push:', err);
                    results.push({ success: false, error: err.message });

                    // If 410 Gone, delete subscription
                    if (err.statusCode === 410) {
                        await supabase.from('push_subscriptions').delete().eq('id', sub.id);
                    }
                }
            }
        }

        return new Response(JSON.stringify({ success: true, results }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});

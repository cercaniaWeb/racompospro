import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Set VAPID keys
webpush.setVapidDetails(
    'mailto:cercaniaweb@gmail.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export async function sendTransferNotification(targetStoreId: string, title: string, body: string, url: string) {
    try {
        // 1. Get all users associated with the target store
        const { data: users, error: usersError } = await supabase
            .from('user_stores')
            .select('user_id')
            .eq('store_id', targetStoreId);

        if (usersError || !users) return;

        const userIds = users.map(u => u.user_id);

        // 2. Get push subscriptions for these users
        const { data: subscriptions, error: subsError } = await supabase
            .from('push_subscriptions')
            .select('*')
            .in('user_id', userIds);

        if (subsError || !subscriptions) return;

        // 3. Send notification to each subscription
        const notificationPayload = JSON.stringify({
            title,
            body,
            url,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png'
        });

        const sendPromises = subscriptions.map(async (sub) => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };

            try {
                await webpush.sendNotification(pushSubscription, notificationPayload);
            } catch (error: any) {
                if (error.statusCode === 404 || error.statusCode === 410) {
                    // Subscription has expired or is no longer valid
                    await supabase.from('push_subscriptions').delete().eq('id', sub.id);
                }
                console.error('Error sending push notification:', error);
            }
        });

        await Promise.all(sendPromises);
    } catch (error) {
        console.error('Error in sendTransferNotification:', error);
    }
}

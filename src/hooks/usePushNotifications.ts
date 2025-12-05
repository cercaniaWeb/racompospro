import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const usePushNotifications = () => {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const { user } = useAuthStore();

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.ready.then(registration => {
                registration.pushManager.getSubscription().then(subscription => {
                    setIsSubscribed(!!subscription);
                });
            });
        }
    }, []);

    const subscribeToPush = async () => {
        if (!user) return;
        setLoading(true);

        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

            if (!publicVapidKey) {
                throw new Error('VAPID Public Key not found');
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });

            // Save to Supabase
            const { error } = await supabase.from('push_subscriptions').upsert({
                user_id: user.id,
                endpoint: subscription.endpoint,
                p256dh: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('p256dh')!)))),
                auth: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('auth')!))))
            }, { onConflict: 'endpoint' });

            if (error) throw error;

            setIsSubscribed(true);
            alert('Notificaciones activadas correctamente!');
        } catch (error) {
            console.error('Error subscribing to push:', error);
            alert('Error al activar notificaciones. Revisa la consola.');
        } finally {
            setLoading(false);
        }
    };

    return { isSubscribed, subscribeToPush, loading };
};

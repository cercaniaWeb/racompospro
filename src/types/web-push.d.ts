declare module 'web-push' {
    export interface PushSubscription {
        endpoint: string;
        keys: {
            p256dh: string;
            auth: string;
        };
    }

    export interface NotificationPayload {
        title?: string;
        body?: string;
        icon?: string;
        badge?: string;
        url?: string;
        [key: string]: any;
    }

    export function setVapidDetails(
        subject: string,
        publicKey: string,
        privateKey: string
    ): void;

    export function sendNotification(
        subscription: PushSubscription,
        payload: string | Buffer | null,
        options?: any
    ): Promise<void>;

    const webpush: {
        setVapidDetails: typeof setVapidDetails;
        sendNotification: typeof sendNotification;
    };

    export default webpush;
}

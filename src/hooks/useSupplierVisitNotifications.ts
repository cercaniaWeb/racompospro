import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useNotifications } from '@/store/notificationStore';

/**
 * Hook to check for scheduled supplier visits and send notifications
 * Runs on mount and checks every hour
 */
export function useSupplierVisitNotifications() {
    const { notify } = useNotifications();

    useEffect(() => {
        const checkVisits = async () => {
            try {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                // Fetch visits for today that haven't been notified yet
                const { data: visits, error } = await supabase
                    .from('supplier_visits')
                    .select('*')
                    .eq('status', 'pending')
                    .eq('notification_sent', false)
                    .gte('visit_date', today.toISOString())
                    .lt('visit_date', tomorrow.toISOString());

                if (error) throw error;

                if (visits && visits.length > 0) {
                    visits.forEach(async (visit) => {
                        const visitDate = new Date(visit.visit_date);
                        const shouldNotify = visitDate <= now;

                        if (shouldNotify) {
                            // Send notification
                            notify.info(
                                'Visita de Proveedor',
                                `${visit.supplier_name} tiene visita programada hoy${visit.amount ? ` - Monto: $${visit.amount}` : ''}${visit.products ? ` - Productos: ${visit.products}` : ''}`
                            );

                            // Mark as notified
                            await supabase
                                .from('supplier_visits')
                                .update({ notification_sent: true })
                                .eq('id', visit.id);
                        }
                    });
                }
            } catch (error) {
                console.error('Error checking supplier visits:', error);
            }
        };

        // Check immediately on mount
        checkVisits();

        // Check every hour
        const interval = setInterval(checkVisits, 60 * 60 * 1000);

        return () => clearInterval(interval);
    }, [notify]);
}

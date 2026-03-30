import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useNotifications } from '@/store/notificationStore';

// Keep track of notified visits in the current session
const notifiedVisits = new Set<string>();

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

                // Fetch visits for today
                // Note: We use a check for the specific query in case the table schema has changed
                const { data: visits, error } = await supabase
                    .from('supplier_visits')
                    .select('*')
                    .gte('visit_date', today.toISOString())
                    .lt('visit_date', tomorrow.toISOString());

                if (error) {
                    if (error.message.includes('column') || error.message.includes('relation')) {
                        // Table or column doesn't exist yet, ignore
                        return;
                    }
                    throw error;
                }

                if (visits && visits.length > 0) {
                    visits.forEach(async (visit: any) => {
                        // Already notified in this session?
                        if (notifiedVisits.has(visit.id)) return;
                        
                        // If schema supports notification_sent flag and it's already sent
                        if (visit.notification_sent === true) {
                            notifiedVisits.add(visit.id);
                            return;
                        }

                        const visitDate = new Date(visit.visit_date);
                        const shouldNotify = visitDate <= now;

                        if (shouldNotify) {
                            // Send notification
                            notify.info(
                                'Visita de Proveedor',
                                `${visit.supplier_name} tiene visita programada hoy${visit.amount ? ` - Monto: $${visit.amount}` : ''}${visit.products ? ` - Productos: ${visit.products}` : ''}`
                            );

                            // Mark as notified locally
                            notifiedVisits.add(visit.id);

                            // Try to mark as notified in DB if column exists
                            try {
                                await supabase
                                    .from('supplier_visits')
                                    .update({ notification_sent: true })
                                    .eq('id', visit.id);
                            } catch (e) {
                                // Column probably missing, ignore
                            }
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

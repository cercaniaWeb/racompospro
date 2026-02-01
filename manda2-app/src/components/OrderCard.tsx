import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Package, ChefHat, CheckCircle2, Truck, Clock, MapPin, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface OrderCardProps {
    order: {
        id: string;
        created_at: string;
        total: number;
        fulfillment_status: 'pending' | 'preparing' | 'ready' | 'completed';
        notes?: string;
    };
}

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
    const isCompleted = order.fulfillment_status === 'completed';
    // const statusColor = isCompleted ? 'bg-emerald-500' : 'bg-amber-500';

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'completed': return { label: 'Entregado', color: 'text-emerald-600 bg-emerald-100', icon: CheckCircle2 };
            case 'ready': return { label: 'Listo', color: 'text-blue-600 bg-blue-100', icon: Package };
            case 'preparing': return { label: 'Preparando', color: 'text-amber-600 bg-amber-100', icon: ChefHat };
            default: return { label: 'Recibido', color: 'text-gray-600 bg-gray-100', icon: Clock };
        }
    }

    const statusInfo = getStatusInfo(order.fulfillment_status);
    const StatusIcon = statusInfo.icon;

    return (
        <Link href={`/orders/${order.id}`}>
            <div className="group bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 relative overflow-hidden mb-4">

                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusInfo.color}`}>
                            <StatusIcon size={18} />
                        </div>
                        <div>
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Orden #{order.id.slice(0, 6)}</div>
                            <div className="font-bold text-gray-900 text-lg">${order.total.toFixed(2)}</div>
                        </div>
                    </div>
                    <div className="text-gray-300">
                        <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>

                {/* Details */}
                <div className="space-y-2 pl-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                        <Clock size={14} className="text-gray-400" />
                        <span>{format(new Date(order.created_at), "d 'de' MMMM, h:mm a", { locale: es })}</span>
                    </div>
                    {order.notes && (
                        <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                            <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="line-clamp-1">{order.notes.split(' - ')[1] || 'Ubicación registrada'}</p>
                        </div>
                    )}
                </div>

                {/* Status Badge Bottom */}
                <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide ${statusInfo.color}`}>
                        {statusInfo.label}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                        Ver detalles
                    </span>
                </div>
            </div>
        </Link>
    );
};

export default OrderCard;

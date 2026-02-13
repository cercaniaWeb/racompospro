'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/atoms/Button';
import TransferModal from '@/components/organisms/TransferModal';
import ReceiveTransferModal from '@/components/organisms/ReceiveTransferModal';
import { ArrowLeftRight, Plus, RefreshCw } from 'lucide-react';
import { useProduct } from '@/hooks/useProduct';
import { useTransfer } from '@/hooks/useTransfer';
import { supabase } from '@/lib/supabase/client';
import { useStoreContext } from '@/hooks/useStoreContext';

const TransferenciasPage = () => {
  const router = useRouter();
  const { storeId } = useStoreContext();
  const { products } = useProduct();
  const { fetchTransfers, createTransfer, updateStatus, shipTransfer, completeTransfer, loading, error } = useTransfer();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any | null>(null);
  const [stores, setStores] = useState<any[]>([]);

  // Fetch stores and transfers on mount
  useEffect(() => {
    const loadData = async () => {
      // Fetch stores
      const { data: storesData } = await supabase.from('stores').select('id, name').eq('is_active', true);
      if (storesData) setStores(storesData);

      // Fetch transfers
      const transfersData = await fetchTransfers();
      if (transfersData) setTransfers(transfersData);
    };

    loadData();
  }, [fetchTransfers]);

  const handleCreateTransfer = async (transferData: any) => {
    try {
      const newTransfer = await createTransfer(transferData);
      if (newTransfer) {
        // Refresh list
        const transfersData = await fetchTransfers();
        if (transfersData) setTransfers(transfersData);
        setShowModal(false);
      }
    } catch (err) {
      // Error handled in hook
    }
  };

  const getStoreName = (storeId: string) => {
    return stores.find(s => s.id === storeId)?.name || 'Cargando...';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      in_transit: 'En Tránsito',
      completed: 'Completada',
      cancelled: 'Cancelada'
    };
    return labels[status] || status;
  };

  const handleAcceptTransfer = (transfer: any) => {
    setSelectedTransfer(transfer);
    setShowReceiveModal(true);
  };

  const handleConfirmReceive = async (receivedItems: any[]) => {
    if (!selectedTransfer) return;

    try {
      await completeTransfer(selectedTransfer.id, receivedItems);

      const transfersData = await fetchTransfers();
      if (transfersData) setTransfers(transfersData);
      setShowReceiveModal(false);
      setSelectedTransfer(null);
    } catch (err) {
      console.error('[TRANSFERS PAGE] Error confirming receipt:', err);
    }
  };

  const handleCancelTransfer = async (transfer: any) => {
    console.log('[TRANSFERS PAGE] handleCancelTransfer called for', transfer.id);
    if (!confirm('¿Estás seguro de cancelar esta transferencia?')) return;
    try {
      console.log('[TRANSFERS PAGE] Calling updateStatus...');
      await updateStatus(transfer.id, 'cancelled');
      console.log('[TRANSFERS PAGE] updateStatus completed, refreshing list...');
      // Manually refresh the list
      const transfersData = await fetchTransfers();
      if (transfersData) setTransfers(transfersData);
    } catch (err) {
      console.error('[TRANSFERS PAGE] Error cancelling transfer:', err);
      alert(`Error al cancelar transferencia: ${err}`);
    }
  };

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('transfers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transfers'
        },
        (payload) => {
          console.log('Transfer change received:', payload);
          fetchTransfers(); // Refresh list on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTransfers]);

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestiona las transferencias entre almacenes</h1>
          <p className="text-sm text-gray-400 mt-1">
            Registra y consulta movimientos de inventario entre sucursales
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 w-full md:w-auto justify-center"
        >
          <Plus size={16} />
          Nueva Transferencia
        </Button>
      </div>

      {/* Transfers Table */}
      <div className="glass rounded-xl border border-white/10 shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr className="text-left">
                <th className="px-6 py-3 text-sm font-medium text-gray-300">ID</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-300">ORIGEN</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-300">DESTINO</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-300">ITEMS</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-300">ESTADO</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-300">FECHA</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-300 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && transfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center">
                      <RefreshCw className="animate-spin h-8 w-8 text-blue-500" />
                    </div>
                    <p className="text-gray-400 mt-2">Cargando transferencias...</p>
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <ArrowLeftRight className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">No hay transferencias registradas.</p>
                    <p className="text-gray-500 text-sm mt-1">
                      Haz clic en &quot;Nueva Transferencia&quot; para crear una
                    </p>
                  </td>
                </tr>
              ) : (
                transfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-300 font-mono">#{transfer.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {transfer.origin_store?.name || getStoreName(transfer.origin_store_id)}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {transfer.destination_store?.name || getStoreName(transfer.destination_store_id)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{transfer.items?.length || 0} productos</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${transfer.status === 'completed'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : transfer.status === 'in_transit'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : transfer.status === 'pending'
                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                        {getStatusLabel(transfer.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {new Date(transfer.created_at).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        {transfer.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                              onClick={() => handleCancelTransfer(transfer)}
                            >
                              Cancelar
                            </Button>
                            {/* Provedor (Destino) es quien envía */}
                            {storeId === transfer.destination_store_id && (
                              <Button
                                variant="primary"
                                className="bg-blue-600 hover:bg-blue-500"
                                onClick={async () => {
                                  if (!confirm('¿Confirmar envío de mercancía?')) return;
                                  try {
                                    await shipTransfer(transfer.id);
                                    const data = await fetchTransfers();
                                    if (data) setTransfers(data);
                                  } catch (e) {
                                    alert('Error al enviar');
                                  }
                                }}
                              >
                                Enviar
                              </Button>
                            )}
                          </>
                        )}

                        {/* Solicitante (Origen) es quien recibe */}
                        {transfer.status === 'in_transit' && storeId === transfer.origin_store_id && (
                          <Button
                            variant="primary"
                            className="bg-green-600 hover:bg-green-500"
                            onClick={() => handleAcceptTransfer(transfer)}
                          >
                            Recibir
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Modal */}
      <TransferModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateTransfer}
        stores={stores}
        products={products.map(p => ({ id: p.id, name: p.name, sku: p.sku }))}
        currentStoreId={storeId}
      />
      <ReceiveTransferModal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        onConfirm={handleConfirmReceive}
        transfer={selectedTransfer}
        loading={loading}
      />
    </div>
  );
};

export default TransferenciasPage;
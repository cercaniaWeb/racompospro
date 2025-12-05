'use client';
import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Transfer } from '@/lib/db';
import { ArrowRightLeft, Send, Plus, Trash2, Truck, PackageCheck } from 'lucide-react';
import TransferReceiveModal from './TransferReceiveModal';
import { useStoreContext } from '@/hooks/useStoreContext';
import { useTransfer } from '@/hooks/useTransfer';

export default function TransferManager() {
  const [destStore, setDestStore] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty] = useState(1);
  const [transferItems, setTransferItems] = useState<any[]>([]);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedTransferId, setSelectedTransferId] = useState<number | string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Fix: Force UI refresh

  // Obtener contexto de tienda
  const { storeId, storeName, isLoading: storeLoading } = useStoreContext();

  // Load local products
  const products = useLiveQuery(() => db.products.toArray());

  // Load active transfers
  const transfers = useLiveQuery(() => db.transfers.orderBy('created_at').reverse().toArray());

  const handleAddItem = () => {
    const prod = products?.find(p => p.id === selectedProduct || p.id === Number(selectedProduct));
    if (!prod) return;

    setTransferItems(prev => [...prev, {
      product_id: prod.id,
      name: prod.name,
      qty_requested: qty,
      current_stock: prod.stock_quantity // Visual reference
    }]);
    setQty(1);
  };

  const { createTransfer, shipTransfer, updateStatus } = useTransfer();

  const handleCreateTransfer = async () => {
    if (!destStore || transferItems.length === 0) return;
    if (!storeId) {
      alert('Error: No se pudo obtener el ID de la tienda actual');
      return;
    }

    try {
      await createTransfer({
        origin_store_id: storeId,
        destination_store_id: destStore,
        items: transferItems.map(i => ({
          product_id: i.product_id,
          quantity: i.qty_requested
        })),
        notes: 'Transferencia creada desde POS'
      });

      alert('Transferencia creada exitosamente');
      setTransferItems([]);
      // Trigger sync or refresh here if needed
    } catch (error) {
      console.error('Error creating transfer:', error);
      alert('Error al crear transferencia');
    }
  };

  const handleShipTransfer = async (transfer: Transfer) => {
    if (!transfer.id) return;
    try {
      await shipTransfer(transfer.id.toString());
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error shipping transfer:', error);
    }
  };

  const handleReceiveConfirm = async (receivedItems: any[]) => {
    if (!selectedTransferId) return;

    try {
      // The API handles inventory updates, so we just need to call updateStatus with 'completed'
      // But wait, updateStatus in useTransfer calls /api/transfers/complete which expects transfer_id and user_id
      // and it handles the inventory update.
      // However, TransferReceiveModal returns receivedItems. The API currently assumes all items are received as requested
      // or doesn't support partial reception in the 'complete' endpoint yet (it iterates transfer.items).
      // For now, we assume full reception as per the API implementation.

      await updateStatus(selectedTransferId.toString(), 'completed');

      setShowReceiveModal(false);
      setSelectedTransferId(null);
      setRefreshKey(prev => prev + 1);
      alert('Transferencia recibida y stock actualizado');
    } catch (error) {
      console.error('Error receiving transfer:', error);
      alert('Error al recibir transferencia');
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl text-white shadow-xl max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ArrowRightLeft className="text-blue-400" /> Inventory Transfers
      </h2>

      {/* New Transfer Form */}
      <div className="mb-8 border-b border-gray-700 pb-8">
        <h3 className="text-xl font-semibold mb-4">New Request</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-400 mb-1">Destination Store</label>
            <select
              className="w-full bg-gray-700 p-3 rounded-lg text-white"
              value={destStore}
              onChange={e => setDestStore(e.target.value)}
            >
              <option value="">Select destination...</option>
              <option value="bodega_central">Central Warehouse</option>
              <option value="tienda_2">Store 2 (South)</option>
            </select>
          </div>
        </div>

        <div className="bg-gray-700 p-4 rounded-lg mb-4 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-gray-400 mb-1">Product</label>
            <select
              className="w-full bg-gray-600 p-3 rounded-lg text-white"
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
            >
              <option value="">Search product...</option>
              {products?.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock: {p.stock_quantity})
                </option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="block text-gray-400 mb-1">Quantity</label>
            <input
              type="number"
              className="w-full bg-gray-600 p-3 rounded-lg text-white"
              value={qty}
              onChange={e => setQty(Number(e.target.value))}
            />
          </div>
          <button
            onClick={handleAddItem}
            className="bg-blue-600 hover:bg-blue-500 p-3 rounded-lg font-bold flex items-center gap-2"
          >
            <Plus size={20} /> Add
          </button>
        </div>

        {/* Items List */}
        {transferItems.length > 0 && (
          <div className="bg-gray-900 rounded-lg overflow-hidden mb-4">
            <table className="w-full text-left">
              <thead className="bg-gray-700 text-gray-300">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {transferItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-800">
                    <td className="p-3">{item.name}</td>
                    <td className="p-3 font-mono">{item.qty_requested}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => {
                        setTransferItems(prev => prev.filter((_, i) => i !== idx))
                      }} className="text-red-400 hover:text-red-300">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleCreateTransfer}
            className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-green-900/20"
          >
            <Send size={20} /> Create Request
          </button>
        </div>
      </div>

      {/* Transfer History / Status */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Transfer History</h3>
        <div className="space-y-4">
          {transfers?.map(t => (
            <div key={t.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
              <div>
                <div className="font-bold text-lg">Transfer #{t.id}</div>
                <div className="text-gray-400 text-sm">
                  {t.origin_store_id} ➔ {t.dest_store_id}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {t.items.length} items • {new Date(t.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${t.status === 'completed' ? 'bg-green-900 text-green-300' :
                  t.status === 'in_transit' ? 'bg-blue-900 text-blue-300' :
                    'bg-yellow-900 text-yellow-300'
                  }`}>
                  {t.status === 'in_transit' ? 'En Tránsito' : t.status === 'pending' ? 'Pendiente' : t.status}
                </span>

                {/* Actions based on status and store */}
                {t.status === 'pending' && storeId === t.origin_store_id && (
                  <button
                    onClick={() => handleShipTransfer(t)}
                    className="text-sm bg-blue-600 px-3 py-1 rounded hover:bg-blue-500 flex items-center gap-1"
                  >
                    <Truck size={14} /> Enviar
                  </button>
                )}

                {t.status === 'in_transit' && storeId === t.dest_store_id && (
                  <button
                    onClick={() => {
                      setSelectedTransferId(t.id!);
                      setShowReceiveModal(true);
                    }}
                    className="text-sm bg-green-600 px-3 py-1 rounded hover:bg-green-500 flex items-center gap-1"
                  >
                    <PackageCheck size={14} /> Recibir
                  </button>
                )}
              </div>
            </div>
          ))}
          {transfers?.length === 0 && (
            <div className="text-center text-gray-500 py-8">No transfers found</div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showReceiveModal && selectedTransferId && (
        <TransferReceiveModal
          transferId={selectedTransferId}
          items={transfers?.find(t => t.id === selectedTransferId)?.items || []}
          onClose={() => setShowReceiveModal(false)}
          onConfirm={handleReceiveConfirm}
        />
      )}
    </div>
  );
}
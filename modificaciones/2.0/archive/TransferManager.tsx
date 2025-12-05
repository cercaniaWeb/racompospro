'use client';
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { ArrowRightLeft, Send, Plus, Trash2 } from 'lucide-react';

export default function TransferManager() {
  const [destStore, setDestStore] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty] = useState(1);
  const [transferItems, setTransferItems] = useState<any[]>([]);

  // Cargar productos locales para el select
  const products = useLiveQuery(() => db.products.toArray());

  const handleAddItem = () => {
    const prod = products?.find(p => p.id === selectedProduct);
    if (!prod) return;

    setTransferItems(prev => [...prev, {
      product_id: prod.id,
      name: prod.name,
      quantity: qty,
      current_stock: prod.stock_current // Para referencia visual
    }]);
    setQty(1);
  };

  const handleCreateTransfer = async () => {
    if (!destStore || transferItems.length === 0) return;

    // 1. Guardar LOCALMENTE (Operación Instantánea)
    await db.transfers.add({
      origin_store_id: 'mi_tienda_actual_id', // Esto vendría de tu config
      dest_store_id: destStore,
      items: transferItems,
      status: 'pending_upload',
      created_at: new Date()
    });

    // 2. Feedback Optimista
    alert('Solicitud de traslado guardada (En cola de sincronización)');
    setTransferItems([]);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl text-white shadow-xl max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ArrowRightLeft className="text-blue-400" /> Nuevo Traslado de Inventario
      </h2>

      {/* Cabecera del Traslado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-gray-400 mb-1">Tienda Destino</label>
          <select 
            className="w-full bg-gray-700 p-3 rounded-lg text-white"
            value={destStore}
            onChange={e => setDestStore(e.target.value)}
          >
            <option value="">Seleccionar destino...</option>
            <option value="bodega_central">Bodega Central</option>
            <option value="tienda_2">Tienda 2 (Sur)</option>
          </select>
        </div>
      </div>

      {/* Agregar Productos */}
      <div className="bg-gray-700 p-4 rounded-lg mb-6 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-gray-400 mb-1">Producto</label>
          <select 
            className="w-full bg-gray-600 p-3 rounded-lg text-white"
            value={selectedProduct}
            onChange={e => setSelectedProduct(e.target.value)}
          >
            <option value="">Buscar producto...</option>
            {products?.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} (Stock: {p.stock_current})
              </option>
            ))}
          </select>
        </div>
        <div className="w-32">
          <label className="block text-gray-400 mb-1">Cantidad</label>
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
          <Plus size={20} /> Agregar
        </button>
      </div>

      {/* Lista de Items a Enviar */}
      <div className="bg-gray-900 rounded-lg overflow-hidden mb-6">
        <table className="w-full text-left">
          <thead className="bg-gray-700 text-gray-300">
            <tr>
              <th className="p-3">Producto</th>
              <th className="p-3">Cantidad</th>
              <th className="p-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {transferItems.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-800">
                <td className="p-3">{item.name}</td>
                <td className="p-3 font-mono">{item.quantity}</td>
                <td className="p-3 text-right">
                  <button onClick={() => {
                    setTransferItems(prev => prev.filter((_, i) => i !== idx))
                  }} className="text-red-400 hover:text-red-300">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {transferItems.length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-gray-500">
                  No hay items en el traslado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={handleCreateTransfer}
          className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-green-900/20"
        >
          <Send size={20} /> Crear Solicitud
        </button>
      </div>
    </div>
  );
}

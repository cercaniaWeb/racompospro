'use client';
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { AlertTriangle, ShoppingBag } from 'lucide-react';

export default function SmartReorderList() {
  // Consulta mágica: Filtra productos donde stock < min_stock
  // Dexie hace esto rapidísimo en el cliente
  const lowStockProducts = useLiveQuery(() => 
    db.products
      .filter(p => p.stock_current <= p.min_stock)
      .toArray()
  );

  if (!lowStockProducts) return <div>Calculando reabastecimiento...</div>;

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700">
      <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
        <h3 className="font-bold text-white flex items-center gap-2">
          <AlertTriangle className="text-yellow-500" /> Sugerencia de Compra
        </h3>
        <span className="bg-yellow-900 text-yellow-200 text-xs px-2 py-1 rounded-full">
          {lowStockProducts.length} productos críticos
        </span>
      </div>

      <div className="max-h-96 overflow-y-auto">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-800 text-gray-500 sticky top-0">
            <tr>
              <th className="p-3">Producto</th>
              <th className="p-3">Stock Actual</th>
              <th className="p-3">Mínimo</th>
              <th className="p-3">Sugerido</th>
            </tr>
          </thead>
          <tbody>
            {lowStockProducts.map(p => (
              <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                <td className="p-3 font-medium text-white">{p.name}</td>
                <td className="p-3 text-red-400 font-bold">{p.stock_current}</td>
                <td className="p-3">{p.min_stock}</td>
                <td className="p-3 text-green-400 font-bold">
                  +{p.min_stock * 2 - p.stock_current} {/* Lógica simple de reabastecimiento */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-gray-900 border-t border-gray-700 text-right">
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ml-auto">
          <ShoppingBag size={16} /> Generar Orden de Compra (PDF)
        </button>
      </div>
    </div>
  );
}

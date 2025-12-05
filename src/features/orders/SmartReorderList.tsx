'use client';
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { AlertTriangle, ShoppingBag, Sparkles, TrendingUp, Clock } from 'lucide-react';
import { useSmartReorder } from '@/hooks/useSmartReorder';

export default function SmartReorderList() {
  // AI Suggestions
  const { suggestions: aiSuggestions, loading: aiLoading } = useSmartReorder();

  // Local Offline Suggestions
  const lowStockProducts = useLiveQuery(() =>
    db.products
      .filter(p => p.stock_quantity <= (p.min_stock_level || 0))
      .toArray()
  );

  // Determine which source to use
  const hasAiSuggestions = aiSuggestions && aiSuggestions.length > 0;
  const displaySource = hasAiSuggestions ? 'AI' : 'LOCAL';

  if (!lowStockProducts && !aiSuggestions) return <div>Calculating reorder needs...</div>;

  const handleGeneratePDF = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      const date = new Date().toLocaleDateString();

      // Header
      doc.setFontSize(20);
      doc.text('Orden de Compra Sugerida', 14, 22);

      doc.setFontSize(10);
      doc.text(`Fecha: ${date}`, 14, 30);
      doc.text(`Fuente: ${displaySource === 'AI' ? 'Análisis IA' : 'Reglas Locales'}`, 14, 35);

      // Prepare data
      const tableColumn = ["Producto", "Stock Actual", "Sugerido", "Prioridad / Razón"];
      const tableRows: (string | number)[][] = [];

      if (displaySource === 'AI') {
        aiSuggestions.forEach(sug => {
          const priorityMap: Record<string, string> = {
            'urgent': 'URGENTE',
            'high': 'ALTA',
            'normal': 'NORMAL'
          };
          const productData = [
            sug.product?.name || 'Desconocido',
            sug.current_stock,
            sug.suggested_quantity,
            `${priorityMap[sug.priority] || sug.priority.toUpperCase()}\n${sug.ai_reasoning || ''}`
          ];
          tableRows.push(productData);
        });
      } else {
        lowStockProducts?.forEach(p => {
          const productData = [
            p.name,
            p.stock_quantity,
            (p.min_stock_level || 0) * 2 - p.stock_quantity,
            `BAJO MÍNIMO (${p.min_stock_level})`
          ];
          tableRows.push(productData);
        });
      }

      // Generate table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 40 },
          3: { cellWidth: 'auto' }
        }
      });

      // Save
      doc.save(`orden_compra_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF. Por favor intenta de nuevo.');
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700">
      <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
        <h3 className="font-bold text-white flex items-center gap-2">
          {displaySource === 'AI' ? (
            <><Sparkles className="text-blue-400" /> Sugerencias de Reorden IA</>
          ) : (
            <><AlertTriangle className="text-yellow-500" /> Sugerencias Locales</>
          )}
        </h3>
        <span className={`text-xs px-2 py-1 rounded-full ${displaySource === 'AI' ? 'bg-blue-900 text-blue-200' : 'bg-yellow-900 text-yellow-200'}`}>
          {displaySource === 'AI' ? aiSuggestions.length : lowStockProducts?.length || 0} ítems
        </span>
      </div>

      <div className="max-h-96 overflow-y-auto">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-800 text-gray-500 sticky top-0">
            <tr>
              <th className="p-3">Producto</th>
              <th className="p-3">Stock Actual</th>
              <th className="p-3">Sugerido</th>
              <th className="p-3">Razón / Prioridad</th>
            </tr>
          </thead>
          <tbody>
            {displaySource === 'AI' ? (
              aiSuggestions.map(sug => (
                <tr key={sug.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="p-3 font-medium text-white">
                    {sug.product?.name || 'Producto Desconocido'}
                    <div className="text-xs text-gray-500">Confianza: {(sug.confidence_score * 100).toFixed(0)}%</div>
                  </td>
                  <td className="p-3 text-red-400 font-bold">{sug.current_stock}</td>
                  <td className="p-3 text-green-400 font-bold">+{sug.suggested_quantity}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      {sug.priority === 'urgent' && <span className="text-red-400 flex items-center gap-1 text-xs uppercase font-bold"><AlertTriangle size={12} /> Urgente</span>}
                      {sug.priority === 'high' && <span className="text-orange-400 flex items-center gap-1 text-xs uppercase font-bold"><TrendingUp size={12} /> Alta</span>}
                      {sug.priority === 'normal' && <span className="text-blue-400 flex items-center gap-1 text-xs uppercase font-bold"><Clock size={12} /> Normal</span>}
                    </div>
                    <div className="text-xs text-gray-400 line-clamp-2" title={sug.ai_reasoning}>
                      {sug.ai_reasoning}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              lowStockProducts?.map(p => (
                <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="p-3 font-medium text-white">{p.name}</td>
                  <td className="p-3 text-red-400 font-bold">{p.stock_quantity}</td>
                  <td className="p-3 text-green-400 font-bold">
                    +{(p.min_stock_level || 0) * 2 - p.stock_quantity}
                  </td>
                  <td className="p-3 text-xs text-gray-500">
                    Bajo mínimo ({p.min_stock_level})
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-gray-900 border-t border-gray-700 text-right">
        <button
          onClick={handleGeneratePDF}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ml-auto"
        >
          <ShoppingBag size={16} /> Generar Orden de Compra (PDF)
        </button>
      </div>
    </div>
  );
}
'use client';

import React from 'react';
import Text from '@/components/atoms/Text';

const SalesReportsPage = () => {
  // Mock user data
  const user = {
    name: 'Gerente',
    status: 'online' as const,
  };

  // Mock sales data
  const salesData = [
    { id: '1', date: '2023-04-01', customer: 'Cliente 1', total: 125.50, status: 'completed' },
    { id: '2', date: '2023-04-01', customer: 'Cliente 2', total: 89.99, status: 'completed' },
    { id: '3', date: '2023-04-02', customer: 'Cliente 3', total: 210.75, status: 'completed' },
    { id: '4', date: '2023-04-02', customer: 'Cliente 4', total: 45.25, status: 'completed' },
    { id: '5', date: '2023-04-03', customer: 'Cliente 5', total: 325.00, status: 'completed' },
  ];

  const tableColumns = [
    { key: 'id', title: 'ID' },
    { key: 'date', title: 'Fecha' },
    { key: 'customer', title: 'Cliente' },
    { key: 'total', title: 'Total' },
    { key: 'status', title: 'Estado' },
    { 
      key: 'actions', 
      title: 'Acciones',
      render: (value: any, item: any) => (
        <button className="bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700">Ver</button>
      )
    }
  ];

  return (
    <div>
        <div className="mb-6">
          <Text variant="h3" className="font-bold text-gray-900">Reportes de Ventas</Text>
          <Text variant="body" className="text-gray-600">Registro detallado de todas las ventas</Text>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <Text variant="h4" className="font-semibold">Ventas Recientes</Text>
            <div className="flex space-x-2">
              <select className="border border-gray-300 rounded px-3 py-2">
                <option>Últimos 7 días</option>
                <option>Últimos 30 días</option>
                <option>Últimos 90 días</option>
              </select>
              <button className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700">
                Exportar
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {tableColumns.map(column => (
                    <th 
                      key={column.key} 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesData.map(sale => (
                  <tr key={sale.id}>
                    {tableColumns.map(column => (
                      <td key={`${sale.id}-${column.key}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {column.render
                          ? column.render((sale as any)[column.key], sale)
                          : (sale as any)[column.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
};

export default SalesReportsPage;
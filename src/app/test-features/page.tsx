'use client';

import React, { useState } from 'react';
import TransferManager from '@/features/transfers/TransferManager';
import EmployeeConsumptionModal from '@/features/consumption/EmployeeConsumptionModal';
import SmartReorderList from '@/features/orders/SmartReorderList';

const FeatureTestPage = () => {
  const [activeTab, setActiveTab] = useState<'transfers' | 'consumption' | 'reorder'>('transfers');
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Módulos de POS - Prueba de Funcionalidad</h1>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'transfers'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('transfers')}
          >
            Traslados de Inventario
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'consumption'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('consumption')}
          >
            Consumo de Empleados
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'reorder'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('reorder')}
          >
            Reorden Inteligente
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === 'transfers' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Gestión de Traslados</h2>
              <TransferManager />
            </div>
          )}

          {activeTab === 'consumption' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Consumo de Empleados</h2>
              <p className="mb-4 text-gray-600">
                Este módulo permite registrar el consumo de productos por parte de empleados con autorización.
              </p>
              <button
                onClick={() => setShowConsumptionModal(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg font-medium"
              >
                Abrir Modal de Consumo
              </button>
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h3 className="font-medium mb-2">Instrucciones:</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li>Los consumos se registran con autorización de supervisor</li>
                  <li>El stock se reduce inmediatamente en la base de datos local</li>
                  <li>Los registros se sincronizan con Supabase en segundo plano</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'reorder' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Reorden Inteligente</h2>
              <SmartReorderList />
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h3 className="font-medium mb-2">Instrucciones:</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li>Este módulo identifica productos con bajo stock automáticamente</li>
                  <li>Sugiere cantidades a reordenar basadas en el nivel mínimo</li>
                  <li>Funciona completamente offline con base de datos local</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Consumption Modal */}
        <EmployeeConsumptionModal 
          isOpen={showConsumptionModal} 
          onClose={() => setShowConsumptionModal(false)} 
        />

        {/* Info Section */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">Sistema Local-First</h3>
          <p className="text-blue-700 text-sm">
            Todos estos módulos funcionan completamente offline. Los datos se sincronizan con Supabase 
            cuando hay conexión disponible. El sistema utiliza Dexie.js para la base de datos local 
            (IndexedDB) y mantiene la consistencia de datos incluso sin conexión.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeatureTestPage;
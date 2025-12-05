'use client';

import React, { useState } from 'react';
import ReportCard from '@/components/organisms/ReportCard';
import Text from '@/components/atoms/Text';
import ChatbotModal from '@/components/organisms/ChatbotModal';
import { Sparkles } from 'lucide-react';

const ReportsPage = () => {
  const [showChatbot, setShowChatbot] = useState(false);

  // Mock user data
  const user = {
    name: 'Gerente',
    status: 'online' as const,
  };

  // Mock report data
  const reportData = [
    {
      id: 'sales',
      title: 'Ventas Totales',
      value: '$12,450.00',
      change: 12.5,
      trend: 'up' as const,
      description: 'Comparado con el mes anterior',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'orders',
      title: 'Pedidos',
      value: '56',
      change: -2.3,
      trend: 'down' as const,
      description: 'Comparado con el mes anterior',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      id: 'products-sold',
      title: 'Productos Vendidos',
      value: '245',
      change: 8.2,
      trend: 'up' as const,
      description: 'Comparado con el mes anterior',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      )
    },
    {
      id: 'avg-order',
      title: 'Pedido Promedio',
      value: '$222.32',
      change: 1.7,
      trend: 'up' as const,
      description: 'Comparado con el mes anterior',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  return (
    <div className="relative">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Text variant="h3" className="font-bold text-foreground">Reportes</Text>
          <Text variant="body" className="text-muted-foreground">Análisis de desempeño del negocio</Text>
        </div>

        {/* AI Chatbot Button */}
        <button
          onClick={() => setShowChatbot(true)}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <Sparkles size={20} />
          <span className="font-semibold">Asistente IA</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {reportData.map((report) => (
          <ReportCard
            key={report.id}
            title={report.title}
            value={report.value}
            change={report.change}
            trend={report.trend}
            description={report.description}
            icon={report.icon}
            onAction={() => console.log(`View details for ${report.title}`)}
          />
        ))}
      </div>

      <div className="glass rounded-xl border border-white/10 shadow p-6">
        <Text variant="h4" className="font-semibold mb-4">Gráficos de Ventas</Text>
        <div className="text-muted-foreground text-center py-12">
          Aquí se mostrarían gráficos de ventas, productos más vendidos y tendencias.
        </div>
      </div>

      {/* Chatbot Modal */}
      <ChatbotModal isOpen={showChatbot} onClose={() => setShowChatbot(false)} />
    </div>
  );
};

export default ReportsPage;
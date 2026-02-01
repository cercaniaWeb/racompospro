'use client';

import React, { useState } from 'react';
import Text from '@/components/atoms/Text';
import { Sparkles, TrendingUp, Package, DollarSign, ShieldCheck } from 'lucide-react';
import ChatbotModal from '@/components/organisms/ChatbotModal';

// Tabs Components
import { SalesAnalysis } from '@/components/templates/reports/SalesAnalysis';
import { InventoryHealth } from '@/components/templates/reports/InventoryHealth';
import { ProfitabilityMetrics } from '@/components/templates/reports/ProfitabilityMetrics';
import { CashAudit } from '@/components/templates/reports/CashAudit';

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'profit' | 'audit'>('sales');
  const [showChatbot, setShowChatbot] = useState(false);

  const tabs = [
    { id: 'sales', label: 'Ventas', icon: TrendingUp },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'profit', label: 'Rentabilidad', icon: DollarSign },
    { id: 'audit', label: 'Auditoría', icon: ShieldCheck },
  ] as const;

  return (
    <div className="min-h-screen pb-12">
      {/* Header Area */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Text variant="h2" className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Inteligencia de Negocio
          </Text>
          <Text variant="body" className="text-gray-400 mt-1">
            La verdad sobre tu negocio, en tiempo real.
          </Text>
        </div>

        <button
          onClick={() => setShowChatbot(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <Sparkles size={18} />
          <span className="font-medium">Preguntar a la IA</span>
        </button>
      </div>

      {/* Modern Tabs */}
      <div className="mb-8">
        <div className="flex p-1 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/5 inline-flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${activeTab === tab.id
                  ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-900/50'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'sales' && <SalesAnalysis />}
        {activeTab === 'inventory' && <InventoryHealth />}
        {activeTab === 'profit' && <ProfitabilityMetrics />}
        {activeTab === 'audit' && <CashAudit />}
      </div>

      <ChatbotModal isOpen={showChatbot} onClose={() => setShowChatbot(false)} />
    </div>
  );
};

export default ReportsPage;
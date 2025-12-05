'use client';

import React, { useState, useEffect } from 'react';
import Terminal from '@/components/pos/Terminal';
import EmployeeConsumptionModal from '@/features/consumption/EmployeeConsumptionModal';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/routes';

const POSPage = () => {
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);

  // Check if we have products in the database
  useEffect(() => {
    const checkProducts = async () => {
      try {
        const { db } = await import('@/lib/db');
        const productCount = await db.products.count();
        if (productCount === 0) {
          // console.log('No products found in database. Visit /seeder to add sample products.');
        }
      } catch (error) {
        console.error('Error checking products:', error);
      }
    };

    checkProducts();
  }, []);

  const { user } = useAuthStore();
  const router = useRouter();

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-yellow-100 border-b border-yellow-300 p-2 flex justify-between items-center text-sm px-4">
        <p>
          Note: If no products appear, you need to add products first.
          Visit <a href="/seeder" className="text-blue-600 underline">/seeder</a> to add sample products.
          &nbsp;|&nbsp;
          <button
            onClick={() => setShowConsumptionModal(true)}
            className="text-orange-600 underline"
          >
            Employee Consumption
          </button>
        </p>
        {user?.role === 'admin' && (
          <button
            onClick={() => router.push(ROUTES.DASHBOARD)}
            className="absolute top-4 right-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <span>← Back to Dashboard</span>
          </button>
        )}
      </div>
      <div className="flex-1">
        <Terminal />
      </div>
      <EmployeeConsumptionModal
        isOpen={showConsumptionModal}
        onClose={() => setShowConsumptionModal(false)}
      />
    </div>
  );
};

export default POSPage;
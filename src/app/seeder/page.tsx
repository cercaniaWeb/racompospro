'use client';

import React, { useState } from 'react';
import { db } from '@/lib/db';

const SampleDataSeeder = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const seedSampleProducts = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // Clear existing products (optional)
      await db.products.clear();
      
      // Add sample products for testing
      const sampleProducts = [
        {
          sku: 'PROD001',
          name: 'Coca Cola 600ml',
          description: 'Bebida gaseosa sabor cola',
          price: 2500,
          cost: 1800,
          category_id: 1,
          supplier_id: 1,
          stock_quantity: 50,
          min_stock_level: 5,
          barcode: '1234567890123',
          weight: 0.6,
          dimensions: '6cm x 6cm x 15cm',
          is_active: true,
          is_taxable: true,
          created_at: new Date(),
          updated_at: new Date(),
          last_modified: new Date(),
          sync_status: 'synced' as const
        },
        {
          sku: 'PROD002',
          name: 'Galletas Oreo',
          description: 'Paquete de galletas sabor chocolate',
          price: 1800,
          cost: 1200,
          category_id: 2,
          supplier_id: 2,
          stock_quantity: 30,
          min_stock_level: 3,
          barcode: '1234567890124',
          weight: 0.135,
          dimensions: '10cm x 6cm x 2cm',
          is_active: true,
          is_taxable: true,
          created_at: new Date(),
          updated_at: new Date(),
          last_modified: new Date(),
          sync_status: 'synced' as const
        },
        {
          sku: 'PROD003',
          name: 'Arroz Doria 500g',
          description: 'Arroz blanco largo grano',
          price: 1200,
          cost: 800,
          category_id: 3,
          supplier_id: 3,
          stock_quantity: 100,
          min_stock_level: 10,
          barcode: '1234567890125',
          weight: 0.5,
          dimensions: '12cm x 5cm x 18cm',
          is_active: true,
          is_taxable: true,
          created_at: new Date(),
          updated_at: new Date(),
          last_modified: new Date(),
          sync_status: 'synced' as const
        },
        {
          sku: 'PROD004',
          name: 'Aceite Primor 1L',
          description: 'Aceite de oliva virgen extra',
          price: 8500,
          cost: 6000,
          category_id: 4,
          supplier_id: 4,
          stock_quantity: 20,
          min_stock_level: 2,
          barcode: '1234567890126',
          weight: 1,
          dimensions: '8cm x 8cm x 25cm',
          is_active: true,
          is_taxable: true,
          created_at: new Date(),
          updated_at: new Date(),
          last_modified: new Date(),
          sync_status: 'synced' as const
        },
        {
          sku: 'PROD005',
          name: 'Pan Bimbo Integral',
          description: 'Pan integral en rebanadas',
          price: 3200,
          cost: 2200,
          category_id: 5,
          supplier_id: 5,
          stock_quantity: 25,
          min_stock_level: 5,
          barcode: '1234567890127',
          weight: 0.4,
          dimensions: '15cm x 10cm x 8cm',
          is_active: true,
          is_taxable: true,
          created_at: new Date(),
          updated_at: new Date(),
          last_modified: new Date(),
          sync_status: 'synced' as const
        }
      ];

      // Add products to the database
      for (const product of sampleProducts) {
        await db.products.add(product);
      }

      setMessage(`${sampleProducts.length} sample products added successfully!`);
    } catch (error) {
      console.error('Error seeding sample products:', error);
      setMessage('Error adding sample products: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Sample Data Seeder</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="mb-4">This page adds sample products to the local database for testing purposes.</p>
        <p className="mb-6">These products will appear in the POS terminal after seeding.</p>
        
        <button
          onClick={seedSampleProducts}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded disabled:opacity-50"
        >
          {loading ? 'Adding Products...' : 'Add Sample Products'}
        </button>
        
        {message && (
          <div className={`mt-4 p-4 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}
        
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">How this works:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Products are added directly to the local IndexedDB database using Dexie</li>
            <li>After adding, they will be available in the POS terminal</li>
            <li>The POS terminal shows only active products (is_active: true)</li>
            <li>This simulates what would happen after a sync with Supabase</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SampleDataSeeder;
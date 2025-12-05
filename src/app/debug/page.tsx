'use client';

import React, { useEffect, useState } from 'react';
import { db, Product } from '@/lib/db';

const ProductDebug = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState('');

  useEffect(() => {
    const checkProducts = async () => {
      try {
        // Check if database is accessible
        setDbStatus('Database name: ' + db.name);
        
        // Get all products from database
        const allProducts = await db.products.toArray();
        console.log('Total products in DB:', allProducts.length);
        setProducts(allProducts);
        
        // Log first few products for debugging
        console.log('First 3 products:', allProducts.slice(0, 3));
        
        // Check for any products where is_active is true
        const activeProducts = allProducts.filter(p => p.is_active);
        console.log('Active products count:', activeProducts.length);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading products:', error);
        setDbStatus('Error: ' + (error as Error).message);
        setLoading(false);
      }
    };

    checkProducts();
  }, []);

  if (loading) {
    return <div className="p-4">Loading products...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Product Debug Page</h1>
      <div className="mb-4">Status: {dbStatus}</div>
      <div className="mb-4">Total products in database: {products.length}</div>
      <div className="mb-4">
        Active products (is_active = true): {products.filter(p => p.is_active).length}
      </div>
      
      <h2 className="text-lg font-semibold mb-2">First 10 Products:</h2>
      <div className="max-h-96 overflow-y-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">ID</th>
              <th className="border border-gray-300 px-4 py-2">Name</th>
              <th className="border border-gray-300 px-4 py-2">SKU</th>
              <th className="border border-gray-300 px-4 py-2">Price</th>
              <th className="border border-gray-300 px-4 py-2">Active</th>
            </tr>
          </thead>
          <tbody>
            {products.slice(0, 10).map((product, index) => (
              <tr key={product.id || index} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">{product.id}</td>
                <td className="border border-gray-300 px-4 py-2">{product.name}</td>
                <td className="border border-gray-300 px-4 py-2">{product.sku}</td>
                <td className="border border-gray-300 px-4 py-2">${product.price?.toFixed(2)}</td>
                <td className="border border-gray-300 px-4 py-2">{product.is_active ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductDebug;
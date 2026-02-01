'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Search, Check, Store, MapPin, ChevronRight, Menu, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { Product, CartItem } from '@/lib/types';
import { LocationGate } from '@/components/LocationGate';
import { ProductCard } from '@/components/ProductCard';
import { CheckoutFlow } from '@/components/CheckoutFlow';
import { UserMenu } from '@/components/UserMenu';
import { TicketView } from '@/components/TicketView';
import Link from 'next/link';

// --- MOCK CATEGORIES ---
const CATEGORIES = [
  { id: 'todos', name: 'Todo', icon: '🌟' },
  { id: 'frutas', name: 'Frutas', icon: '🍌' },
  { id: 'verduras', name: 'Verduras', icon: '🥦' },
  { id: 'carniceria', name: 'Carnes', icon: '🥩' },
  { id: 'panaderia', name: 'Pan', icon: '🥖' },
  { id: 'bebidas', name: 'Bebidas', icon: '🥤' },
  { id: 'limpieza', name: 'Limpieza', icon: '🧼' },
];

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-900/90 text-white backdrop-blur-md border-emerald-800';
  const Icon = type === 'error' ? XCircle : Check;

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-sm z-[100] flex items-center p-4 shadow-2xl rounded-2xl border ${bgColor} transition-all duration-500 animate-in slide-in-from-top-4 fade-in`}>
      <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${type === 'success' ? 'text-emerald-400' : ''}`} />
      <span className="font-bold text-sm">{message}</span>
    </div>
  );
};

// Helper for type error
const XCircle = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>;


export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'location-gate' | 'home' | 'checkout' | 'success'>('location-gate');

  // Flow States
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup' | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  // Use a derived state for filtering, but keep 'todos' as default
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [lastSale, setLastSale] = useState<any>(null);

  const supabase = createClient();

  // Check User Session
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, []);

  // Fetch Products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .gt('stock', 0);

        if (error) throw error;
        if (data) setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleLocationComplete = (mode: 'delivery' | 'pickup', location: string) => {
    setDeliveryMode(mode);
    setDeliveryLocation(location);
    setView('home');
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      setToast({ message: `Lo sentimos, ${product.name} se ha agotado.`, type: 'error' });
      return;
    }
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    if (navigator.vibrate) navigator.vibrate(50);
    setToast({ message: `Agregado: ${product.name}`, type: 'success' });
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.qty, 0);
  }, [cart]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      // Mock category logic since DB might not have category_id set perfectly yet
      // If we had categories in DB we would match p.category_id === selectedCategory
      // For now, if "todos" show all, else simple search or future filter
      const matchesCategory = selectedCategory === 'todos' || true; // Placeholder for real category filter
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleCheckoutComplete = async (paymentMethod: string, details: any) => {
    try {
      // 1. Save Address if User is Logged In
      if (user && deliveryMode === 'delivery' && deliveryLocation) {
        await supabase.from('user_addresses').insert({
          user_id: user.id,
          address: deliveryLocation,
        });
      }

      // 2. Create Sale in Supabase
      const saleData = {
        total: cartTotal,
        payment_method: paymentMethod,
        notes: `Order from Manda2 (${deliveryMode}) - ${deliveryLocation}. Details: ${JSON.stringify(details)}`,
        source: 'Manda2',
        user_id: user?.id,
        customer_name: user?.user_metadata.full_name || user?.email,
        created_at: new Date().toISOString(),
        fulfillment_status: 'pending'
      };

      const { data, error } = await supabase
        .from('sales')
        .insert(saleData)
        .select()
        .single();

      if (error) throw error;

      setLastSale(data);
      setView('success');
    } catch (error) {
      console.error('Error creating order:', error);
      setToast({ message: 'Error procesando la orden', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  // --- VIEWS ---

  if (view === 'location-gate') {
    return <LocationGate onComplete={handleLocationComplete} />;
  }

  if (view === 'success' && lastSale) {
    return (
      <TicketView
        sale={lastSale}
        items={cart}
        onNewOrder={() => {
          setCart([]);
          setLastSale(null);
          setView('home');
          setSearchQuery('');
        }}
      />
    );
  }

  if (view === 'checkout') {
    return (
      <div className="fixed inset-0 bg-white z-50">
        <CheckoutFlow
          cart={cart}
          total={cartTotal}
          deliveryMode={deliveryMode}
          deliveryLocation={deliveryLocation}
          onBack={() => setView('home')}
          onComplete={handleCheckoutComplete}
        />
      </div>
    );
  }

  // --- HOME VIEW ---
  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">

        {/* Top Bar */}
        <div className="px-4 py-3 flex justify-between items-center">
          <div
            onClick={() => setView('location-gate')}
            className="flex flex-col cursor-pointer group"
          >
            <span className="text-[10px] uppercase font-bold text-gray-400 group-hover:text-emerald-600 transition-colors">
              {deliveryMode === 'pickup' ? 'Recoger en' : 'Enviar a'}
            </span>
            <div className="flex items-center text-emerald-950 text-sm font-bold">
              <span className="truncate max-w-[180px]">{deliveryLocation || 'Seleccionar ubicación'}</span>
              <ChevronRight size={14} className="ml-0.5 text-emerald-500" />
            </div>
          </div>
          <UserMenu user={user} />
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative group">
            <input
              type="text"
              placeholder="¿Qué se te antoja hoy?"
              className="w-full pl-11 pr-4 py-3 bg-gray-100/50 border-none rounded-2xl text-base font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
          </div>
        </div>

        {/* Categories Carousel */}
        <div className="flex overflow-x-auto pb-3 px-4 space-x-2 no-scrollbar mask-gradient-right">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center px-4 py-2.5 rounded-2xl whitespace-nowrap transition-all duration-300 border
                ${selectedCategory === cat.id
                  ? 'bg-emerald-900 text-white border-emerald-900 shadow-lg shadow-emerald-900/20'
                  : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
            >
              <span className="mr-2 text-lg">{cat.icon}</span>
              <span className="font-bold text-sm tracking-wide">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCT GRID */}
      {/* Add padding bottom to account for the floating cart button */}
      <div className="flex-1 overflow-y-auto p-3 pb-32">
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={addToCart}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
            <div className="text-6xl">🥬</div>
            <p className="text-lg font-bold text-gray-400">No encontramos productos</p>
          </div>
        )}
      </div>

      {/* FLOATING CART BUTTON (FAB) */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-6 w-full max-w-[480px] px-6 z-50 pointer-events-none">
          <button
            onClick={() => setView('checkout')}
            className="pointer-events-auto w-full bg-emerald-900 text-white rounded-2xl shadow-[0_20px_40px_-12px_rgba(6,78,59,0.5)] p-4 flex items-center justify-between hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 relative overflow-hidden group"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-800 to-emerald-900 z-0"></div>

            <div className="z-10 flex items-center gap-3">
              <div className="bg-white/20 px-3 py-1.5 rounded-lg text-sm font-bold backdrop-blur-sm">
                {cartItemCount}
              </div>
              <span className="font-bold text-lg tracking-wide">Ver Carrito</span>
            </div>

            <div className="z-10 flex items-center gap-2">
              <span className="font-bold text-lg">${cartTotal.toFixed(2)}</span>
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      )}

      {/* Global CSS for hiding scrollbar */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .mask-gradient-right {
            mask-image: linear-gradient(to right, black 85%, transparent 100%);
        }
      `}</style>
    </div>
  );
}

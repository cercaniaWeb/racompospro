'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  Search,
  Check,
  Store,
  MapPin,
  ChevronRight,
  Menu,
  Loader2,
  Star,
  Apple,
  Carrot,
  Beef,
  Croissant,
  Coffee,
  Wind,
  Package,
  XCircle
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { Product, CartItem } from '@/lib/types';
import { LocationGate } from '@/components/LocationGate';
import { ProductCard } from '@/components/ProductCard';
import { CheckoutFlow } from '@/components/CheckoutFlow';
import { UserMenu } from '@/components/UserMenu';
import { TicketView } from '@/components/TicketView';
import Link from 'next/link';

// --- PREMIUM CATEGORIES ---
const CATEGORIES = [
  { id: 'todos', name: 'Todo', icon: Star },
  { id: 'frutas', name: 'Frutas', icon: Apple },
  { id: 'verduras', name: 'Verduras', icon: Carrot },
  { id: 'carniceria', name: 'Carnes', icon: Beef },
  { id: 'panaderia', name: 'Panadería', icon: Croissant },
  { id: 'bebidas', name: 'Bebidas', icon: Coffee },
  { id: 'limpieza', name: 'Limpieza', icon: Wind },
];


const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isError = type === 'error';
  const Icon = isError ? XCircle : Check;

  return (
    <div className={`fixed top-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm z-[100] flex items-center p-5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2rem] border transition-all duration-700 animate-in slide-in-from-top-8 fade-in 
      ${isError
        ? 'bg-red-500/90 text-white border-red-400/50'
        : 'bg-emerald-900/40 backdrop-blur-3xl text-white border-white/20'}`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center mr-4 
        ${isError ? 'bg-white/20' : 'bg-emerald-500 shadow-lg shadow-emerald-500/40'}`}>
        <Icon size={20} strokeWidth={3} className="text-white" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-0.5">{isError ? 'Atención' : 'Excelente'}</p>
        <p className="font-bold text-sm leading-tight">{message}</p>
      </div>
      <button onClick={onClose} className="ml-4 p-2 hover:bg-white/10 rounded-xl transition-colors">
        <Package size={14} className="opacity-40" />
      </button>
    </div>
  );
};



// Helper for type error


import { ProfileView } from '@/components/ProfileView';
import { signout } from '@/app/auth/actions';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'location-gate' | 'home' | 'checkout' | 'success' | 'profile'>('location-gate');


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

  const handleReorder = (items: any[]) => {
    // Transform items to CartItems
    const newItems = items.map(item => ({
      ...item.products,
      qty: item.quantity
    }));
    setCart(newItems);
    setView('checkout');
    setToast({ message: 'Pedido anterior cargado al carrito', type: 'success' });
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
      if (!user) {
        setToast({ message: 'Debes iniciar sesión para ordenar', type: 'error' });
        return;
      }

      setLoading(true);

      // 1. Get Store ID
      const { data: stores } = await supabase.from('stores').select('id').eq('is_active', true).limit(1);
      const storeId = stores?.[0]?.id;

      if (!storeId) {
        throw new Error('No se encontró una tienda activa para procesar el pedido');
      }

      // 2. Prepare Items for RPC
      const rpcItems = cart.map(item => ({
        product_id: item.id,
        quantity: item.qty,
        unit_price: item.price,
        total_price: item.price * item.qty
      }));

      // 3. Call Atomic Checkout RPC
      const customerName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Cliente Web';

      // --- DIRECT INSERT STRATEGY (Bypass RPC Cache) ---

      // 1. Insert header into 'sales'
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          store_id: storeId,
          customer_name: customerName,
          total: cartTotal,
          payment_method: paymentMethod,
          source: 'Manda2',
          fulfillment_status: 'pending',
          delivery_type: deliveryMode,
          delivery_address: deliveryLocation,
          notes: details?.streetDetails || null,
          payment_status: paymentMethod === 'card' ? 'paid' : 'pending'
        })
        .select()
        .single();

      if (saleError) throw new Error(`Error creando venta: ${saleError.message}`);
      if (!saleData) throw new Error('No se recibieron datos de la venta creada');

      const newSaleId = saleData.id;

      // 2. Prepare and Insert Items
      const validSaleItems = cart.map(item => ({
        sale_id: newSaleId,
        product_id: item.id,
        quantity: item.qty,
        price: item.price,
        subtotal: item.price * item.qty
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(validSaleItems);

      if (itemsError) throw new Error(`Error agregando productos: ${itemsError.message}`);

      // 3. Result Object Construction
      const result = { success: true, sale_id: newSaleId };

      // 4. Finalize UI
      setLastSale({
        id: result.sale_id,
        items: [...cart], // Keep a separate copy for the ticket
        total: cartTotal,
        location: deliveryLocation,
        mode: deliveryMode,
        payment: paymentMethod,
        created_at: new Date().toISOString(),
        customer_name: user.user_metadata?.full_name || user.email?.split('@')[0]
      });

      setCart([]);
      setView('success');
      setToast({ message: '¡Pedido realizado con éxito!', type: 'success' });

    } catch (error: any) {
      console.error('❌ Checkout Error Final:', error);
      setToast({
        message: error.message || 'Error al procesar el pedido. Verifica tu conexión.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };





  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Hydration mismatch prevention: Render a simplified version or nothing on server
  if (!mounted) return null;

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#020617] relative overflow-hidden" suppressHydrationWarning>
        {/* Background Effects */}
        <div className="absolute top-[-20%] left-[-20%] w-[150%] h-[70%] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-[3px] border-white/5 rounded-full"></div>
            <div className="w-20 h-20 border-[3px] border-emerald-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0 shadow-[0_0_20px_rgba(16,185,129,0.3)]"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Package size={24} className="text-emerald-500/50 animate-pulse" />
            </div>
          </div>
          <h2 className="text-white text-xl font-black tracking-tighter mb-2">Preparando lo mejor</h2>
          <p className="text-emerald-400/60 text-sm font-bold uppercase tracking-[0.2em] animate-pulse">Manda2</p>
        </div>
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
        items={lastSale.items}
        onNewOrder={() => {
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

  if (view === 'profile') {
    return (
      <ProfileView
        user={user}
        onBack={() => setView('home')}
        onSignOut={() => signout()}
        onReorder={handleReorder}
      />
    );
  }



  // --- HOME VIEW ---
  return (
    <div className="h-full flex flex-col bg-[hsl(var(--background))]">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-white/20 shadow-sm">

        {/* Top Bar */}
        <div className="px-6 py-4 flex justify-between items-center">
          <div
            onClick={() => setView('location-gate')}
            className="flex flex-col cursor-pointer group"
          >
            <span className="text-[10px] uppercase font-black text-emerald-600/60 tracking-widest group-hover:text-emerald-600 transition-colors">
              {deliveryMode === 'pickup' ? 'Recoger en' : 'Enviar a'}
            </span>
            <div className="flex items-center text-slate-900 text-sm font-black">
              <span className="truncate max-w-[200px]">{deliveryLocation || 'Seleccionar ubicación'}</span>
              <ChevronRight size={14} className="ml-1 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
          <UserMenu
            user={user}
            onProfile={() => setView('profile')}
            onSignOut={() => signout()}
          />
        </div>


        {/* Search Bar */}
        <div className="px-6 pb-4">
          <div className="relative group">
            <input
              type="text"
              placeholder="¿Qué necesitas hoy?"
              className="w-full pl-12 pr-4 py-4 bg-slate-100/50 border border-transparent rounded-[1.25rem] text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:bg-white focus:border-emerald-500/20 transition-all placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
          </div>
        </div>

        {/* Categories Carousel */}
        <div className="flex overflow-x-auto pb-5 px-6 space-x-3 no-scrollbar mask-gradient-right">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center px-5 py-3 rounded-2xl whitespace-nowrap transition-all duration-500 border
                ${selectedCategory === cat.id
                  ? 'bg-emerald-900 text-white border-emerald-800 shadow-xl shadow-emerald-900/20 scale-[1.02]'
                  : 'bg-white/50 text-slate-600 border-white/40 hover:border-emerald-200/50 hover:bg-white shadow-sm'}`}
            >
              <cat.icon className={`mr-2 ${selectedCategory === cat.id ? 'text-emerald-300' : 'text-emerald-600/70'}`} size={18} />
              <span className="font-black text-xs uppercase tracking-wider">{cat.name}</span>
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

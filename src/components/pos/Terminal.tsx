'use client';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, CartItem, ProductLocal } from '@/lib/db';
import { useScale } from '@/hooks/useScale';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Search, Scale, Trash2, CreditCard, Banknote, Coffee, Wifi, WifiOff, LogOut, Camera, RefreshCw, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import ScaleControl from './ScaleControl';
import EmployeeConsumptionModal from '@/features/consumption/EmployeeConsumptionModal';
import AgendarModal from '@/components/organisms/AgendarModal';
import BarcodeScanner from '@/components/molecules/BarcodeScanner';
import { usePosStore } from '@/store/posStore';
import { format } from 'date-fns';
import PaymentModal from './PaymentModal';
import DiscountModal from './DiscountModal';
import WithdrawalModal from './WithdrawalModal';
import CloseRegisterModal from './CloseRegisterModal';
import SalesHistoryModal from './SalesHistoryModal';
import { Tag, Calendar, Lock, Store, History } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { printTicket } from '@/utils/printTicket';
import TicketPreviewModal from './TicketPreviewModal';
import { useProductSync } from '@/hooks/useProductSync';
import { useStoreContext } from '@/hooks/useStoreContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Bell, BellOff, Bike } from 'lucide-react';
import KitchenMonitor from './KitchenMonitor';

export default function POSTerminal() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showBulkOnly, setShowBulkOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // Adjusted for grid size

  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  const [showAgendarModal, setShowAgendarModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showCloseRegisterModal, setShowCloseRegisterModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showTicketPreviewModal, setShowTicketPreviewModal] = useState(false);
  const [showKitchenMonitor, setShowKitchenMonitor] = useState(false);
  const [lastSale, setLastSale] = useState<{ sale: any, items: any[] } | null>(null);
  const [offline, setOffline] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Use global store
  const { cart, addToCart, removeFromCart, clearCart, checkout, getTotals, setDiscount, setSaleNotes, saleNotes } = usePosStore();
  const { total, subtotal, taxAmount, discountAmount } = getTotals();
  const { ticketConfig } = useSettingsStore();
  const { user } = useAuthStore();
  const { logout } = useAuthStore();
  const router = useRouter();

  // Store Context & Sync
  const { storeId, storeName } = useStoreContext();
  const { syncProducts, syncing } = useProductSync(storeId || undefined);
  const hasSyncedRef = useRef(false);

  // Scale Hook
  const { status: scaleStatus, data: scaleData, connect: connectScale, disconnect: disconnectScale, error: scaleError } = useScale();

  // Push Notifications
  const { isSubscribed, subscribeToPush, loading: pushLoading } = usePushNotifications();

  // Reset sync flag when store changes
  useEffect(() => {
    hasSyncedRef.current = false;
  }, [storeId]);

  // Sync ONLY on mount or when storeId changes
  useEffect(() => {
    if (storeId && !hasSyncedRef.current) {
      syncProducts();
      hasSyncedRef.current = true;
    }
  }, [storeId]); // Removed syncProducts from deps to prevent infinite loop

  // Referencia para el input de búsqueda (siempre mantener foco aquí)
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Check for offline status
  useEffect(() => {
    const handleOffline = () => setOffline(true);
    const handleOnline = () => setOffline(false);

    if (typeof window !== 'undefined') {
      setOffline(!navigator.onLine);
      window.addEventListener('offline', handleOffline);
      window.addEventListener('online', handleOnline);
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Fetch Categories
  const categories = useLiveQuery(async () => {
    const allCategories = await db.categories.toArray();
    return allCategories.filter(c => c.is_active);
  }) || [];

  // Búsqueda en tiempo real sobre Dexie (Local DB) con filtros y paginación
  const searchResults = useLiveQuery(async () => {
    let collection = db.products.toCollection();

    if (query) {
      collection = db.products
        .where('name').startsWithIgnoreCase(query)
        .or('sku').equals(query);
    } else if (selectedCategory) {
      collection = db.products.where('category_id').equals(selectedCategory);
    }

    let products = await collection.toArray();

    // Apply additional filters in memory (Dexie has limited complex filtering)
    if (showBulkOnly) {
      products = products.filter(p => p.is_weighted);
    }

    // If query is present, we might have duplicates from the OR clause, but Dexie handles unique keys.
    // However, if we didn't use OR, we are fine.
    // The OR clause above returns a Collection, but we can't chain .filter() on it easily for boolean fields mixed with index queries in a simple way without compound indices.
    // So filtering in memory for 'showBulkOnly' is acceptable for reasonable dataset sizes.

    // Pagination
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return products.slice(start, end);
  }, [query, selectedCategory, showBulkOnly, currentPage]);

  // Count total items for pagination
  const totalItems = useLiveQuery(async () => {
    let collection = db.products.toCollection();

    if (query) {
      collection = db.products
        .where('name').startsWithIgnoreCase(query)
        .or('sku').equals(query);
    } else if (selectedCategory) {
      collection = db.products.where('category_id').equals(selectedCategory);
    }

    let products = await collection.toArray();
    if (showBulkOnly) {
      products = products.filter(p => p.is_weighted);
    }
    return products.length;
  }, [query, selectedCategory, showBulkOnly]) || 0;

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        // Allow ESC even in inputs to blur/clear
        if (e.key === 'Escape') {
          searchInputRef.current?.blur();
          setQuery('');
        }
        return;
      }

      // Functional Keys
      if (e.key === 'F2') {
        e.preventDefault();
        setShowDiscountModal(true);
      } else if (e.key === 'F4') {
        e.preventDefault();
        setShowHistoryModal(true);
      } else if (e.key === 'F8') {
        e.preventDefault();
        setShowKitchenMonitor(true);
      } else if (e.key === 'F9') {
        e.preventDefault();
        setShowWithdrawalModal(true);
      } else if (e.key === 'F10') {
        e.preventDefault();
        if (cart.length > 0) setShowPaymentModal(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        // Close modals if possible, or clear search
        setShowScanner(false);
        setQuery('');
      }

      // Alt + Keys
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'c':
            e.preventDefault();
            setShowConsumptionModal(true);
            break;
          case 'a':
            e.preventDefault();
            setShowAgendarModal(true);
            break;
          case 'q':
            e.preventDefault();
            setShowCloseRegisterModal(true);
            break;
          case 'n':
            e.preventDefault();
            const notes = prompt('Agregar nota a la venta:', saleNotes);
            if (notes !== null) setSaleNotes(notes);
            break;
          case 's':
            e.preventDefault();
            syncProducts();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, saleNotes, syncProducts]);

  // ... (rest of handlers)

  const handleAddToCart = (product: any) => {
    // If product is weighted, use the scale weight if available and > 0
    if (product.is_weighted) {
      const weight = scaleData.weight > 0 ? scaleData.weight : 1;
      // Pass weight as the 3rd argument to trigger isWeightBased logic in store
      addToCart(product, 1, weight);
    } else {
      addToCart(product);
    }
    setQuery('');
    searchInputRef.current?.focus();
  };

  const handlePayment = async (method: string, amountPaid?: number, commission?: number) => {
    const result = await checkout(method, amountPaid, commission);
    if (result) {
      setLastSale(result);
      setShowPaymentModal(false);
      setShowTicketPreviewModal(true);
    } else {
      alert('Error al registrar venta');
    }
  };

  const handleScan = async (decodedText: string) => {
    setShowScanner(false);

    // Search for product by barcode or SKU
    const product = await db.products
      .where('barcode').equals(decodedText)
      .or('sku').equals(decodedText)
      .first();

    if (product) {
      handleAddToCart(product);
      // Optional: Play beep sound
      const audio = new Audio('/beep.mp3'); // Assuming you might add a beep sound later
      audio.play().catch(() => { }); // Ignore error if file doesn't exist
    } else {
      alert(`Producto no encontrado: ${decodedText}`);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-gray-900 text-white">
      {/* Header */}
      {/* Header */}
      <header className="bg-gray-800 p-2 shadow-md flex justify-between items-center border-b border-gray-700 sticky top-0 z-10">
        <div className="flex items-center gap-2 md:gap-4">
          <h1 className="text-lg md:text-xl font-bold text-blue-400">Racom-POS</h1>
          <div className="h-6 w-px bg-gray-700 hidden md:block"></div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full border border-gray-700">
            <Store size={14} className="text-blue-400" />
            <span className="text-sm text-gray-300">
              {storeName || 'Cargando tienda...'}
            </span>
          </div>
          {offline ? <WifiOff className="text-red-400 w-5 h-5" /> : <Wifi className="text-green-400 w-5 h-5" />}

          <button
            onClick={syncProducts}
            disabled={syncing}
            className={`p-2 rounded-full hover:bg-gray-700 transition-colors ${syncing ? 'animate-spin text-blue-400' : 'text-gray-400'}`}
            title="Sincronizar productos"
          >
            <RefreshCw size={16} />
          </button>

          <button
            onClick={subscribeToPush}
            disabled={isSubscribed || pushLoading}
            className={`p-2 rounded-full transition-colors ${isSubscribed ? 'text-green-400' : 'text-gray-400 hover:bg-gray-700'}`}
            title={isSubscribed ? 'Notificaciones activadas' : 'Activar notificaciones'}
          >
            {isSubscribed ? <Bell size={16} /> : <BellOff size={16} />}
          </button>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-1 md:gap-2">
            <button
              className="bg-gray-700 hover:bg-gray-600 text-white p-2 md:px-3 md:py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-bold"
              onClick={() => setShowAgendarModal(true)}
              title="Agendar"
            >
              <Calendar size={16} />
              <span className="hidden md:inline">Agendar <span className="text-[10px] opacity-40 ml-1">Alt+A</span></span>
            </button>
            <button
              className="bg-gray-700 hover:bg-gray-600 text-white p-2 md:px-3 md:py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-bold"
              onClick={() => setShowHistoryModal(true)}
              title="Ver Ventas"
            >
              <History size={16} />
              <span className="hidden md:inline">Ver Ventas <span className="text-[10px] opacity-40 ml-1">F4</span></span>
            </button>
            <button
              className="bg-orange-600 hover:bg-orange-500 text-white p-2 md:px-3 md:py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-bold"
              onClick={() => setShowKitchenMonitor(true)}
              title="Delivery"
            >
              <Bike size={16} />
              <span className="hidden md:inline">Delivery <span className="text-[10px] opacity-40 ml-1">F8</span></span>
            </button>
            <button
              className="bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 p-2 md:px-3 md:py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-bold"
              onClick={() => setShowCloseRegisterModal(true)}
              title="Cerrar Caja"
            >
              <Lock size={16} />
              <span className="hidden md:inline">Cerrar Caja <span className="text-[10px] opacity-40 ml-1">Alt+Q</span></span>
            </button>
          </div>
          <div className="text-sm text-gray-400 hidden md:block">
            {format(new Date(), 'PPP HH:mm')}
          </div>
          <button
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
            className="bg-red-900/30 hover:bg-red-900/50 text-red-400 p-2 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden p-4 gap-4">
        {/* IZQUIERDA: Catálogo y Buscador */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Barra Superior de Acción */}
          <div className="bg-gray-800 p-4 rounded-xl flex gap-4 items-center shadow-lg shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400" />
              <input
                ref={searchInputRef}
                autoFocus
                className="w-full bg-gray-700 text-white p-3 pl-10 pr-12 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Buscar por nombre o escanear código de barras..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <button
                className="absolute right-2 top-2 p-1.5 hover:bg-gray-600 rounded-lg transition-colors text-gray-400 hover:text-blue-400"
                title="Escanear con cámara"
                onClick={() => setShowScanner(true)}
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            {/* Scale Control Component */}
            <div className="w-auto">
              <ScaleControl
                status={scaleStatus}
                data={scaleData}
                connect={connectScale}
                disconnect={disconnectScale}
                error={scaleError}
              />
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setShowBulkOnly(false);
                setQuery('');
              }}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors border ${!selectedCategory && !showBulkOnly && !query
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
                }`}
            >
              Todos
            </button>

            <button
              onClick={() => setShowBulkOnly(!showBulkOnly)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors border flex items-center gap-2 ${showBulkOnly
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
                }`}
            >
              <Scale size={16} />
              Granel
            </button>

            <div className="w-px bg-gray-700 mx-2 h-8 self-center" />

            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id === selectedCategory ? null : cat.id!);
                  setQuery('');
                }}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors border ${selectedCategory === cat.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Grid de Productos */}
          <div className="h-[40vh] lg:h-auto lg:flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 content-start pr-2">
            {searchResults?.map(product => (
              <button
                key={product.id}
                onClick={() => handleAddToCart(product)}
                className="bg-gray-800 hover:bg-gray-700 p-4 rounded-xl flex flex-col gap-2 transition-all border border-gray-700 hover:border-blue-500 group text-left h-48"
              >
                <div className="relative h-20 w-full bg-gray-900 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 text-xs">NO IMG</span>
                  )}
                </div>
                <h3 className="font-bold truncate w-full text-sm">{product.name}</h3>
                <div className="flex justify-between items-center w-full mt-auto">
                  <span className="text-green-400 font-mono font-bold">${product.price.toFixed(2)}</span>
                  <span className="text-[10px] text-gray-400 bg-gray-900 px-2 py-1 rounded uppercase">
                    {product.is_weighted ? 'KG' : 'PZA'}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 py-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors"
              >
                Anterior
              </button>
              <span className="text-gray-400 text-sm">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

        {/* DERECHA: Carrito y Totales */}
        <div className="w-full lg:w-96 bg-gray-800 rounded-xl flex flex-col shadow-2xl border border-gray-700 shrink-0">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/50 rounded-t-xl">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="text-blue-400" /> Carrito
            </h2>
            <button
              onClick={clearCart}
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 rounded-lg transition-colors"
              title="Vaciar Carrito"
            >
              <Trash2 size={20} />
            </button>
          </div>

          {/* Lista de Items */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                <ShoppingCart size={48} className="mb-2" />
                <p>El carrito está vacío</p>
              </div>
            )}
            {cart.map((item, idx) => (
              <div key={idx} className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center animate-in slide-in-from-right-5 border border-gray-700 hover:border-gray-600">
                <div className="flex-1 min-w-0 mr-2">
                  <p className="font-bold truncate text-sm">{item.product.name}</p>
                  <p className="text-xs text-gray-400">
                    {item.quantity.toFixed(item.product.is_weighted ? 3 : 0)} x ${item.product.price}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold font-mono text-lg">${item.subtotal.toFixed(2)}</span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Zona de Pago */}
          <div className="p-6 bg-gray-900/80 border-t border-gray-700 rounded-b-xl backdrop-blur-sm">
            <div className="space-y-2 mb-6 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Impuestos</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Descuento</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-end pt-2 border-t border-gray-700">
                <span className="text-gray-300 font-bold">Total</span>
                <span className="text-4xl font-bold text-green-400 font-mono">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowPaymentModal(true)}
                disabled={cart.length === 0}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-green-900/20 w-full"
              >
                <Banknote size={28} />
                <span className="flex items-center gap-2">Pagar <span className="text-xs bg-black/20 px-1.5 py-0.5 rounded opacity-60">F10</span></span>
              </button>

              <button
                onClick={() => setShowConsumptionModal(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-orange-900/20 flex-1"
              >
                <Coffee size={18} />
                <span className="flex items-center gap-1.5 text-xs">Consumo <span className="opacity-40 font-mono">Alt+C</span></span>
              </button>

              <button
                onClick={() => setShowWithdrawalModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-blue-900/20 flex-1"
              >
                <CreditCard size={18} />
                <span className="flex items-center gap-1.5 text-xs">Retiro <span className="opacity-40 font-mono">F9</span></span>
              </button>

              <button
                onClick={() => setShowDiscountModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-purple-900/20 flex-1"
              >
                <Tag size={18} />
                <span className="flex items-center gap-1.5 text-xs">Descuento <span className="opacity-40 font-mono">F2</span></span>
              </button>

              <button
                onClick={() => {
                  const notes = prompt('Agregar nota a la venta:', saleNotes);
                  if (notes !== null) setSaleNotes(notes);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-indigo-900/20 flex-1"
              >
                <MessageSquare size={18} />
                <span className="flex items-center gap-1.5 text-xs">Nota <span className="opacity-40 font-mono">Alt+N</span></span>
              </button>
            </div>
          </div>
        </div>

        {/* Modals */}
        <EmployeeConsumptionModal
          isOpen={showConsumptionModal}
          onClose={() => setShowConsumptionModal(false)}
        />
        <AgendarModal
          isOpen={showAgendarModal}
          onClose={() => setShowAgendarModal(false)}
        />
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          cart={cart}
          total={total}
          onProcessPayment={handlePayment}
        />
        <DiscountModal
          isOpen={showDiscountModal}
          onClose={() => setShowDiscountModal(false)}
          subtotal={subtotal}
          onApplyDiscount={setDiscount}
        />
        <WithdrawalModal
          isOpen={showWithdrawalModal}
          onClose={() => setShowWithdrawalModal(false)}
        />
        <SalesHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
        />
        <CloseRegisterModal
          isOpen={showCloseRegisterModal}
          onClose={() => setShowCloseRegisterModal(false)}
        />
        <TicketPreviewModal
          isOpen={showTicketPreviewModal}
          onClose={() => setShowTicketPreviewModal(false)}
          sale={lastSale?.sale}
          items={lastSale?.items || []}
          config={ticketConfig}
          user={user || undefined}
        />
        <KitchenMonitor
          isOpen={showKitchenMonitor}
          onClose={() => setShowKitchenMonitor(false)}
        />

        {showScanner && (
          <BarcodeScanner
            onScanSuccess={handleScan}
            onClose={() => setShowScanner(false)}
          />
        )}
      </div>
    </div>
  );
}
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, CartItem, ProductLocal } from '@/lib/db';
import { useScale } from '@/hooks/useScale';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Search, Scale, Trash2, CreditCard, Banknote, Coffee, Wifi, WifiOff, LogOut, Camera, RefreshCw, MessageSquare } from 'lucide-react';
import ScaleControl from './ScaleControl';
import EmployeeConsumptionModal from '@/features/consumption/EmployeeConsumptionModal';
import AgendarModal from '@/components/organisms/AgendarModal';
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
import { Bell, BellOff } from 'lucide-react';

export default function POSTerminal() {
  const [query, setQuery] = useState('');
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  const [showAgendarModal, setShowAgendarModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showCloseRegisterModal, setShowCloseRegisterModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showTicketPreviewModal, setShowTicketPreviewModal] = useState(false);
  const [lastSale, setLastSale] = useState<{ sale: any, items: any[] } | null>(null);
  const [offline, setOffline] = useState(false);

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

  // Búsqueda en tiempo real sobre Dexie (Local DB)
  const searchResults = useLiveQuery(
    () => db.products
      .where('name').startsWithIgnoreCase(query)
      .or('sku').equals(query)
      .limit(10)
      .toArray(),
    [query]
  );

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

  const handlePayment = async (method: string) => {
    const result = await checkout(method);
    if (result) {
      setLastSale(result);
      setShowPaymentModal(false);
      setShowTicketPreviewModal(true);
    } else {
      alert('Error al registrar venta');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      {/* Header */}
      <header className="bg-gray-800 p-2 shadow-md flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-blue-400">Racom-POS</h1>
          <div className="h-6 w-px bg-gray-700"></div>
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full border border-gray-700">
            <Store size={14} className="text-blue-400" />
            <span className="text-sm text-gray-300">
              {storeName || 'Cargando tienda...'}
            </span>
          </div>
          {offline ? <WifiOff className="text-red-400" /> : <Wifi className="text-green-400" />}

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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-bold"
              onClick={() => setShowAgendarModal(true)}
            >
              <Calendar size={16} />
              Agendar
            </button>
            <button
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-bold"
              onClick={() => setShowHistoryModal(true)}
            >
              <History size={16} />
              Ver Ventas
            </button>
            <button
              className="bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-bold"
              onClick={() => setShowCloseRegisterModal(true)}
            >
              <Lock size={16} />
              Cerrar Caja
            </button>
          </div>
          <div className="text-sm text-gray-400">
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

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 gap-4">
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
                onClick={() => {
                  // TODO: Implementar escaneo con cámara
                  alert('Función de escáner con cámara - En desarrollo');
                }}
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

          {/* Grid de Productos */}
          <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 content-start pr-2">
            {searchResults?.map(product => (
              <button
                key={product.id}
                onClick={() => handleAddToCart(product)}
                className="bg-gray-800 hover:bg-gray-700 p-4 rounded-xl flex flex-col gap-2 transition-all border border-gray-700 hover:border-blue-500 group text-left h-48"
              >
                <div className="h-20 w-full bg-gray-900 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
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
                <span>Pagar</span>
              </button>

              <button
                onClick={() => setShowConsumptionModal(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-orange-900/20 flex-1"
              >
                <Coffee size={18} />
                <span>Consumo</span>
              </button>

              <button
                onClick={() => setShowWithdrawalModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-blue-900/20 flex-1"
              >
                <CreditCard size={18} />
                <span>Retiro</span>
              </button>

              <button
                onClick={() => setShowDiscountModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-purple-900/20 flex-1"
              >
                <Tag size={18} />
                <span>Descuento</span>
              </button>

              <button
                onClick={() => {
                  const notes = prompt('Agregar nota a la venta:', saleNotes);
                  if (notes !== null) setSaleNotes(notes);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-indigo-900/20 flex-1"
              >
                <MessageSquare size={18} />
                <span>Nota</span>
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
      </div>
    </div>
  );
}
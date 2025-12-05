import { usePosStore } from '@/store/posStore';
import { Product } from '@/lib/db';

export const usePOS = () => {
  const {
    cart,
    currentStoreId,
    currentUserId,
    discount,
    taxRate,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setStore,
    setUser,
    setDiscount,
    getTotals,
    checkout
  } = usePosStore();

  const { subtotal, taxAmount, total } = getTotals();

  return {
    cart,
    currentStoreId,
    currentUserId,
    discount,
    taxRate,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setStore,
    setUser,
    setDiscount,
    subtotal,
    taxAmount,
    total,
    checkout
  };
};
import { create } from 'zustand';
import { db, Product, Sale, SaleItem } from '@/lib/db';

export interface CartItem {
  id: string; // Unique ID for the cart item (e.g., product.id + timestamp)
  product: Product;
  quantity: number;
  weight?: number; // For weight-based products
  subtotal: number;
}

interface PosState {
  cart: CartItem[];
  currentStoreId: string | null;
  currentUserId: string | null;
  discount: number;
  taxRate: number; // Tax rate as a decimal (e.g., 0.19)
  saleNotes: string; // Notas adicionales para la venta actual

  // Actions
  addToCart: (product: Product, quantity?: number, weight?: number) => void;
  removeFromCart: (cartItemId: string | number) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  setStore: (storeId: string) => void;
  setUser: (userId: string) => void;
  setDiscount: (discount: number) => void;
  setSaleNotes: (notes: string) => void;

  // Selectors/Computations
  getTotals: () => { subtotal: number; taxAmount: number; discountAmount: number; total: number };

  // Async Actions
  checkout: (paymentMethod?: string) => Promise<{ sale: any; items: any[] } | null>;
}

export const usePosStore = create<PosState>((set, get) => ({
  cart: [],
  currentStoreId: null,
  currentUserId: null,
  discount: 0,
  taxRate: 0, // Default to 0 as per documentation/requirements (was 0.19 in some places, but docs say "Eliminación del Impuesto")
  saleNotes: '',

  addToCart: (product, quantity = 1, weight) => {
    const { cart } = get();

    // Check if product is weight-based
    const isWeightBased = weight !== undefined && weight > 0;
    const effectiveQuantity = isWeightBased ? weight : quantity;

    // For weight-based items, we might want to treat them as unique entries or merge if exactly same weight?
    // Usually POS systems merge non-weighted items, but keep weighted items separate or merge if identical.
    // For simplicity and standard behavior: merge if same product ID.

    const existingItemIndex = cart.findIndex(item => item.product.id === product.id);

    if (existingItemIndex !== -1 && !isWeightBased) {
      // Update existing item
      const updatedCart = [...cart];
      const item = updatedCart[existingItemIndex];
      const newQuantity = item.quantity + effectiveQuantity;

      updatedCart[existingItemIndex] = {
        ...item,
        quantity: newQuantity,
        subtotal: product.price * newQuantity
      };

      set({ cart: updatedCart });
    } else {
      // Add new item (always new entry if weight based to avoid confusion, or simple merge logic above)
      // Let's stick to the logic: if it's already there, update quantity. 
      // If it's weight based, we usually replace the weight or add to it? 
      // Let's assume "addToCart" with weight means "this is the weight reading".

      if (existingItemIndex !== -1 && isWeightBased) {
        // Update weight for existing item
        const updatedCart = [...cart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: effectiveQuantity, // Quantity is weight for weighted items
          weight: effectiveQuantity,
          subtotal: product.price * effectiveQuantity
        };
        set({ cart: updatedCart });
      } else {
        const newItem: CartItem = {
          id: `${product.id}-${Date.now()}`,
          product,
          quantity: effectiveQuantity,
          weight: isWeightBased ? weight : undefined,
          subtotal: product.price * effectiveQuantity
        };
        set({ cart: [...cart, newItem] });
      }
    }
  },

  removeFromCart: (cartItemId) => {
    const { cart } = get();
    // Support both cartItem.id (string) and product.id (number)
    const updatedCart = typeof cartItemId === 'number'
      ? cart.filter(item => item.product.id !== cartItemId)
      : cart.filter(item => item.id !== cartItemId);
    set({ cart: updatedCart });
  },

  updateQuantity: (cartItemId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(cartItemId);
      return;
    }

    set((state) => ({
      cart: state.cart.map(item =>
        item.id === cartItemId
          ? { ...item, quantity, subtotal: item.product.price * quantity }
          : item
      )
    }));
  },

  clearCart: () => set({ cart: [], discount: 0 }),

  setStore: (storeId) => set({ currentStoreId: storeId }),

  setUser: (userId) => set({ currentUserId: userId }),

  setDiscount: (discount) => set({ discount }),

  setSaleNotes: (notes) => set({ saleNotes: notes }),

  getTotals: () => {
    const { cart, discount, taxRate } = get();
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount - discount;

    return {
      subtotal,
      taxAmount,
      discountAmount: discount,
      total
    };
  },

  checkout: async (paymentMethod = 'cash') => {
    const { cart, getTotals, saleNotes } = get();
    if (cart.length === 0) return null;

    const { subtotal, taxAmount, discountAmount, total } = getTotals();

    try {
      // Create sale record
      const sale: Omit<Sale, 'id'> = {
        transaction_id: `TXN-${Date.now()}`,
        total_amount: total,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        net_amount: subtotal,
        payment_method: paymentMethod,
        status: 'completed',
        notes: saleNotes || undefined,
        created_at: new Date(),
        sync_status: 'pending',
      };

      // Add sale to database
      const saleId = await db.sales.add(sale);
      const createdSale = { ...sale, id: saleId };

      // Create sale items
      const saleItems: Omit<SaleItem, 'id'>[] = cart.map(item => ({
        sale_id: saleId,
        product_id: item.product.id!,
        product_sku: item.product.sku,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.subtotal,
        tax_amount: 0,
        discount_amount: 0,
        created_at: new Date(),
        sync_status: 'pending',
      }));

      // Add sale items to database
      await db.saleItems.bulkAdd(saleItems);

      // Update local product stock quantities
      for (const cartItem of cart) {
        if (cartItem.product.id) {
          const currentProduct = await db.products.get(cartItem.product.id);
          if (currentProduct) {
            await db.products.update(cartItem.product.id, {
              stock_quantity: Math.max(0, currentProduct.stock_quantity - cartItem.quantity),
              last_modified: new Date(),
              sync_status: 'pending',
            });
          }
        }
      }

      // Clear cart and notes
      set({ cart: [], discount: 0, saleNotes: '' });

      // Return sale data for printing
      return { sale: createdSale, items: saleItems };
    } catch (error) {
      console.error('Checkout failed:', error);
      return null;
    }
  }
}));
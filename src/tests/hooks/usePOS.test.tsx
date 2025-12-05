import { renderHook, act } from '@testing-library/react';
import { usePOS } from '@/hooks/usePOS';

// Mock the store to avoid persistence issues in tests if needed, 
// but for now we rely on the default store behavior.
// We might need to mock Dexie if the store interacts with it directly upon initialization,
// but usePosStore uses Dexie in async actions (checkout), not init.

describe('usePOS Hook', () => {
  test('should initialize with empty cart', () => {
    const { result } = renderHook(() => usePOS());

    expect(result.current.cart).toEqual([]);
    expect(result.current.subtotal).toBe(0);
    expect(result.current.total).toBe(0);
  });

  test('should add product to cart', () => {
    const { result } = renderHook(() => usePOS());

    const mockProduct = {
      id: 1, // Changed to number to match DB interface
      name: 'Test Product',
      price: 100,
      description: 'Test Description',
      cost: 50,
      sku: 'TEST001',
      barcode: '1234567890123',
      category_id: 1,
      stock_quantity: 10,
      min_stock_level: 1,
      is_active: true,
      is_taxable: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    act(() => {
      result.current.addToCart(mockProduct, 2);
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].product.name).toBe('Test Product');
    expect(result.current.cart[0].quantity).toBe(2);
    expect(result.current.cart[0].subtotal).toBe(200); // 100 * 2
  });

  test('should update quantity in cart', () => {
    const { result } = renderHook(() => usePOS());

    const mockProduct = {
      id: 1,
      name: 'Test Product',
      price: 100,
      sku: 'TEST001',
      stock_quantity: 10,
      is_active: true,
      is_taxable: true,
    };

    // Add product to cart
    act(() => {
      result.current.addToCart(mockProduct as any, 2);
    });

    // Update quantity
    const cartItemId = result.current.cart[0].id;
    act(() => {
      result.current.updateQuantity(cartItemId, 5);
    });

    expect(result.current.cart[0].quantity).toBe(5);
    expect(result.current.cart[0].subtotal).toBe(500); // 100 * 5
  });

  test('should remove product from cart', () => {
    const { result } = renderHook(() => usePOS());

    const mockProduct = {
      id: 1,
      name: 'Test Product',
      price: 100,
      sku: 'TEST001',
      stock_quantity: 10,
      is_active: true,
      is_taxable: true,
    };

    // Add product to cart
    act(() => {
      result.current.addToCart(mockProduct as any, 2);
    });

    expect(result.current.cart).toHaveLength(1);

    // Remove product from cart
    const cartItemId = result.current.cart[0].id;
    act(() => {
      result.current.removeFromCart(cartItemId);
    });

    expect(result.current.cart).toHaveLength(0);
  });

  test('should calculate correct totals', () => {
    const { result } = renderHook(() => usePOS());

    const mockProduct1 = {
      id: 1,
      name: 'Test Product 1',
      price: 100,
      sku: 'TEST001',
      stock_quantity: 10,
      is_active: true,
      is_taxable: true,
    };

    const mockProduct2 = {
      id: 2,
      name: 'Test Product 2',
      price: 50,
      sku: 'TEST002',
      stock_quantity: 5,
      is_active: true,
      is_taxable: true,
    };

    // Add products to cart
    act(() => {
      result.current.addToCart(mockProduct1 as any, 2); // Subtotal: 200
      result.current.addToCart(mockProduct2 as any, 3); // Subtotal: 150
    });

    // Force re-render or state update if needed, but hook should reflect state
    // Note: getTotals() is called inside the hook and returns values

    expect(result.current.subtotal).toBe(350); // 200 + 150
    expect(result.current.total).toBe(350); // Subtotal + tax - discount
  });
});
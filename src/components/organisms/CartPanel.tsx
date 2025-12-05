import React from 'react';
import CartItem from '@/components/molecules/CartItem';
import Text from '@/components/atoms/Text';
import Button from '@/components/atoms/Button';

interface CartItemData {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartPanelProps {
  items: CartItemData[];
  subtotal: number;
  total: number;
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onCheckout?: () => void;
  onClearCart?: () => void;
}

const CartPanel: React.FC<CartPanelProps> = ({
  items,
  subtotal,
  total,
  onRemoveItem,
  onUpdateQuantity,
  onCheckout,
  onClearCart
}) => {
  const formattedSubtotal = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(subtotal);

  const formattedTotal = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(total);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
        <Text variant="h4" className="font-semibold text-foreground">
          Carrito de Compras
        </Text>
        {onClearCart && (
          <Button variant="ghost" size="sm" onClick={onClearCart}>
            Vaciar
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <div className="bg-muted rounded-full p-4 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <Text variant="body" className="text-center text-muted-foreground">
            El carrito está vacío
          </Text>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto max-h-[320px] mb-6">
            <div className="space-y-3">
              {items.map(item => (
                <CartItem
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  price={item.price}
                  quantity={item.quantity}
                  image={item.image}
                  onRemove={() => onRemoveItem(item.id)}
                  onUpdateQuantity={(quantity) => onUpdateQuantity(item.id, quantity)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between py-2">
              <Text className="font-medium text-muted-foreground">Subtotal:</Text>
              <Text className="font-medium">{formattedSubtotal}</Text>
            </div>
            <div className="flex justify-between py-2 border-t border-border">
              <Text className="text-lg font-semibold">Total:</Text>
              <Text className="text-lg font-semibold">{formattedTotal}</Text>
            </div>

            {onCheckout && (
              <Button
                variant="primary"
                size="lg"
                className="w-full py-6 text-base"
                onClick={onCheckout}
              >
                Procesar Pago
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CartPanel;
import React, { useState } from 'react';
import Image from '@/components/atoms/Image';
import Text from '@/components/atoms/Text';
import Button from '@/components/atoms/Button';

interface CartItemProps {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  onRemove: () => void;
  onUpdateQuantity: (quantity: number) => void;
}

const CartItem: React.FC<CartItemProps> = ({
  id,
  name,
  price,
  quantity,
  image,
  onRemove,
  onUpdateQuantity
}) => {
  const [localQuantity, setLocalQuantity] = useState(quantity);
  const itemTotal = price * localQuantity;

  const formattedPrice = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(price);

  const formattedTotal = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(itemTotal);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    setLocalQuantity(newQuantity);
    onUpdateQuantity(newQuantity);
  };

  return (
    <div className="flex items-center justify-between p-3 bg-accent/30 rounded-lg border border-border">
      <div className="flex items-center space-x-3">
        {image ? (
          <Image
            src={image}
            alt={name}
            width={56}
            height={56}
            className="w-14 h-14 object-cover rounded-md border border-border"
          />
        ) : (
          <div className="bg-muted border border-border rounded-md w-14 h-14 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Text variant="body" className="font-medium truncate">{name}</Text>
          <Text variant="sm" className="text-muted-foreground">{formattedPrice}</Text>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="flex items-center bg-background border border-border rounded-md">
          <Button
            variant="ghost"
            size="sm"
            className="px-2 rounded-r-none border-r border-border"
            onClick={() => handleQuantityChange(localQuantity - 1)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </Button>
          <span className="px-3 py-1 min-w-[3rem] text-center">{localQuantity}</span>
          <Button
            variant="ghost"
            size="sm"
            className="px-2 rounded-l-none border-l border-border"
            onClick={() => handleQuantityChange(localQuantity + 1)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Button>
        </div>

        <Text variant="body" className="font-medium w-20 text-right text-foreground">
          {formattedTotal}
        </Text>

        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="ml-2 text-muted-foreground hover:text-destructive"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </Button>
      </div>
    </div>
  );
};

export default CartItem;
'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Minus, Trash2, ShoppingCart } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCart } from '@/hooks/useCart'

export default function CartList() {
  const { cart } = useCart()

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <p className="text-muted-foreground mb-2">Your cart is empty</p>
        <p className="text-sm text-muted-foreground">Add products to get started</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full pr-2">
      <div className="space-y-2 pb-2">
        {cart.map(item => (
          <CartItemRow
            key={item.product.id}
            productId={item.product.id}
            name={item.product.name}
            price={item.product.price}
            quantity={item.quantity}
            maxQuantity={item.product.stock_quantity}
          />
        ))}
      </div>
    </ScrollArea>
  )
}

interface CartItemRowProps {
  productId: string
  name: string
  price: number
  quantity: number
  maxQuantity: number
}

function CartItemRow({
  productId,
  name,
  price,
  quantity,
  maxQuantity
}: CartItemRowProps) {
  const { updateItemQuantity, removeItem } = useCart()
  const itemTotal = price * quantity

  const handleIncrement = () => {
    if (quantity < maxQuantity) {
      updateItemQuantity(productId, quantity + 1)
    }
  }

  const handleDecrement = () => {
    if (quantity > 1) {
      updateItemQuantity(productId, quantity - 1)
    }
  }

  const handleRemove = () => {
    removeItem(productId)
  }

  // Handle swipe gestures for mobile
  const handleSwipeStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const target = e.currentTarget as HTMLDivElement;
    target.dataset.startX = touch.clientX.toString();
  }

  const handleSwipeMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const target = e.currentTarget as HTMLDivElement;
    const startX = parseInt(target.dataset.startX || '0');
    const currentX = touch.clientX;
    const diff = currentX - startX;

    // Only allow swiping left (negative diff)
    if (diff < 0) {
      target.style.transform = `translateX(${diff}px)`;
    }
  }

  const handleSwipeEnd = (e: React.TouchEvent) => {
    const target = e.currentTarget as HTMLDivElement;
    const startX = parseInt(target.dataset.startX || '0');
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;

    // If swiped left more than 100px, remove the item
    if (diff < -80) {
      handleRemove();
    } else {
      // Reset position
      target.style.transform = 'translateX(0)';
    }
  }

  return (
    <div
      className="bg-white border rounded-lg p-2 shadow-sm transition-transform duration-200"
      style={{ minHeight: "70px" }}
      onTouchStart={handleSwipeStart}
      onTouchMove={handleSwipeMove}
      onTouchEnd={handleSwipeEnd}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="text-xs font-medium line-clamp-2">{name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Rp. {price.toLocaleString('id-ID')} each</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold">Rp. {itemTotal.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 rounded-md"
            onClick={handleDecrement}
            disabled={quantity <= 1}
            style={{ minWidth: "24px", padding: 0 }}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="mx-1.5 w-5 text-center text-xs font-medium">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 rounded-md"
            onClick={handleIncrement}
            disabled={quantity >= maxQuantity}
            style={{ minWidth: "24px", padding: 0 }}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:bg-destructive/10"
          onClick={handleRemove}
          style={{ minWidth: "24px", padding: 0 }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Swipe hint for mobile */}
      <div className="text-xs text-muted-foreground mt-1 text-right italic md:hidden">
        Swipe left to remove
      </div>
    </div>
  )
}

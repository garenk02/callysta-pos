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
      <div className="space-y-3">
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

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm" style={{ minHeight: "110px" }}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="text-base font-medium line-clamp-2">{name}</h4>
          <p className="text-xs text-muted-foreground mt-1">Rp. {price.toLocaleString('id-ID')} each</p>
        </div>
        <div className="text-right">
          <p className="text-base font-semibold">Rp. {itemTotal.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-md"
            onClick={handleDecrement}
            disabled={quantity <= 1}
            style={{ minWidth: "30px", padding: 0 }}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="mx-3 w-8 text-center text-base font-medium">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-md"
            onClick={handleIncrement}
            disabled={quantity >= maxQuantity}
            style={{ minWidth: "30px", padding: 0 }}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:bg-destructive/10"
          onClick={handleRemove}
          style={{ minWidth: "30px", padding: 0 }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

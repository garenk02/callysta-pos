'use client'

import React from 'react'
import { useCart } from '@/hooks/useCart'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Trash2 } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

export default function CartSummary() {
  const { cart, summary, removeItem, clearCart } = useCart()
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 relative">
          <ShoppingCart className="h-4 w-4 mr-2" />
          <span>Cart</span>
          {summary.itemCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
            >
              {summary.itemCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Shopping Cart</h4>
            {summary.itemCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-destructive"
                onClick={clearCart}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
        
        {summary.itemCount === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Your cart is empty</p>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[300px]">
              <div className="p-4 space-y-2">
                {cart.map(item => (
                  <div key={item.product.id} className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                      <div className="flex text-xs text-muted-foreground">
                        <span>{item.quantity} × ${item.product.price.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        ${(item.quantity * item.product.price).toFixed(2)}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-destructive"
                        onClick={() => removeItem(item.product.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t">
              <div className="flex justify-between py-1 text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${summary.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>${summary.tax.toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between py-1 font-medium">
                <span>Total</span>
                <span>${summary.total.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
